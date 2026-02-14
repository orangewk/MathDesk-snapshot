/**
 * ユーザーサービス
 * Phase 2A - ユーザー認証・データ保存基盤
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {
  createUser,
  findUserByAccessCode,
  findUserById,
  findSessionByToken,
  deleteExpiredSessions,
  deleteUserSessions,
  createSession,
  User,
  Session,
  findUserByFirebaseUid,
} from '../data/firestore/user-repository.js';
import {
  findConversationsByUserId,
  deleteConversation,
} from '../data/firestore/conversation-repository.js';
import { usersCollection } from '../data/firestore/client.js';
import { adminAuth } from '../lib/firebase-admin.js';

// JWT設定（本番環境では JWT_SECRET 必須、開発環境はフォールバック値を使用）
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}
const JWT_SECRET = process.env.JWT_SECRET || 'mathdesk-development-secret-key';
const JWT_EXPIRES_IN = '7d'; // 7日間有効
const SESSION_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7日間

/**
 * アクセスコードを生成 (8文字のランダム英数字)
 */
function generateAccessCode(): string {
  // 読み間違いを防ぐため、0,O,I,1,l を除外
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * ユニークIDを生成
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * JWTトークンを生成
 */
function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * JWTトークンを検証
 */
function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}

// ------------------------------------
// 公開API
// ------------------------------------

export interface LoginResult {
  success: true;
  user: {
    id: string;
    nickname: string;
    accessCode: string;
  };
  token: string;
}

export interface LoginError {
  success: false;
  error: string;
}



export interface ValidateResult {
  success: true;
  user: {
    id: string;
    nickname: string;
    accessCode: string;
  };
}

export interface ValidateError {
  success: false;
  error: string;
}

/**
 * トークンを検証してユーザー情報を取得
 */
export async function validateToken(token: string): Promise<ValidateResult | ValidateError> {
  if (!token) {
    return { success: false, error: 'トークンが必要です' };
  }

  // JWTを検証
  const decoded = verifyToken(token);
  if (!decoded) {
    return { success: false, error: 'トークンが無効または期限切れです' };
  }

  // DBのセッションを確認
  const session = await findSessionByToken(token);
  if (!session) {
    return { success: false, error: 'セッションが見つかりません' };
  }

  // セッションの有効期限を確認
  if (new Date() > session.expiresAt) {
    return { success: false, error: 'セッションが期限切れです' };
  }

  // ユーザー情報を取得
  const user = await findUserById(decoded.userId);
  if (!user) {
    return { success: false, error: 'ユーザーが見つかりません' };
  }

  return {
    success: true,
    user: {
      id: user.id,
      nickname: user.nickname,
      accessCode: user.accessCode,
    },
  };
}

/**
 * ログアウト
 */
export async function logoutUser(token: string): Promise<{ success: boolean }> {
  const session = await findSessionByToken(token);
  if (session) {
    await deleteUserSessions(session.userId);
  }
  return { success: true };
}

/**
 * 期限切れセッションをクリーンアップ
 */
export async function cleanupExpiredSessions(): Promise<number> {
  return deleteExpiredSessions();
}

/**
 * Googleログイン
 */
export async function loginWithGoogle(idToken: string): Promise<LoginResult | LoginError> {
  try {
    // IDトークンを検証
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid, email } = decodedToken;

    // ユーザーを検索
    let user = await findUserByFirebaseUid(uid);

    if (!user) {
      // 新規ユーザー作成
      // メールアドレスの@より前をニックネームの初期値にする
      const nickname = email ? email.split('@')[0].slice(0, 20) : 'Guest';

      // アクセスコード生成
      let accessCode: string;
      let retries = 0;
      do {
        accessCode = generateAccessCode();
        if (!(await findUserByAccessCode(accessCode))) break;
        retries++;
      } while (retries < 10);

      if (retries >= 10) throw new Error('Failed to generate access code');

      const userId = generateId();
      user = await createUser({
        id: userId,
        nickname,
        accessCode,
        firebaseUid: uid,
        email: email,
      });
    }

    // セッション作成
    const token = generateToken(user.id);
    const sessionId = generateId();
    const expiresAt = new Date(Date.now() + SESSION_EXPIRES_MS);

    await createSession({
      id: sessionId,
      userId: user.id,
      token,
      expiresAt,
    });

    return {
      success: true,
      user: {
        id: user.id,
        nickname: user.nickname,
        accessCode: user.accessCode,
      },
      token,
    };
  } catch (error: any) {
    console.error('Google login error:', error);
    return { success: false, error: '認証に失敗しました: ' + error.message };
  }
}

/**
 * バイパスログイン (開発用)
 * @param persona - ペルソナID（省略時は既存の DevUser）
 */
export async function loginWithBypass(persona?: string): Promise<LoginResult | LoginError> {
  // ENABLE_AUTH_BYPASS=true が明示されていない限り拒否
  if (process.env.ENABLE_AUTH_BYPASS !== 'true') {
    return { success: false, error: 'バイパスログインは無効です' };
  }

  const suffix = persona ? `_${persona}` : '';
  const BYPASS_UID = `dev_bypass_user${suffix}`;
  const nickname = persona ? `TestUser_${persona}` : 'DevUser';
  const accessCode = persona ? `TEST_${persona.toUpperCase()}` : 'DEV12345';

  let user = await findUserByFirebaseUid(BYPASS_UID);

  if (!user) {
    const existing = await findUserByAccessCode(accessCode);
    if (existing) {
      user = existing;
    } else {
      user = await createUser({
        id: generateId(),
        nickname,
        accessCode,
        firebaseUid: BYPASS_UID,
        email: persona ? `test-${persona}@example.com` : 'dev@example.com',
      });
    }
  }

  const token = generateToken(user.id);
  const sessionId = generateId();
  const expiresAt = new Date(Date.now() + SESSION_EXPIRES_MS);

  await createSession({
    id: sessionId,
    userId: user.id,
    token,
    expiresAt,
  });

  return {
    success: true,
    user: {
      id: user.id,
      nickname: user.nickname,
      accessCode: user.accessCode,
    },
    token,
  };
}

/**
 * テストユーザーのデータをリセット（開発用）
 * ユーザー自体は残し、学習データ（会話、スキルカード、学習モデル、解答履歴）を削除する。
 * 次回ログイン時に初回体験を再現できる。
 */
export async function resetTestUserData(
  persona: string
): Promise<{ deleted: Record<string, number> }> {
  const BYPASS_UID = `dev_bypass_user_${persona}`;
  const user = await findUserByFirebaseUid(BYPASS_UID);

  if (!user) {
    throw new Error(`ペルソナ "${persona}" のテストユーザーが見つかりません`);
  }

  const deleted: Record<string, number> = {};
  const userDocRef = usersCollection.doc(user.id);

  // 1. 会話 + メッセージ
  const { conversations } = await findConversationsByUserId(user.id, { limit: 1000 });
  for (const conv of conversations) {
    await deleteConversation(conv.id);
  }
  deleted.conversations = conversations.length;

  // 2. セッション
  deleted.sessions = await deleteUserSessions(user.id);

  // 3. スキルカード（サブコレクション）
  const skillCardsSnap = await userDocRef.collection('skillCards').get();
  for (const doc of skillCardsSnap.docs) {
    await doc.ref.delete();
  }
  deleted.skillCards = skillCardsSnap.size;

  // 4. 解答履歴（サブコレクション）
  const attemptsSnap = await userDocRef.collection('problemAttempts').get();
  for (const doc of attemptsSnap.docs) {
    await doc.ref.delete();
  }
  deleted.problemAttempts = attemptsSnap.size;

  // 5. 学習モデル（サブコレクション）
  const modelDoc = userDocRef.collection('studentModel').doc('current');
  const modelSnap = await modelDoc.get();
  if (modelSnap.exists) {
    await modelDoc.delete();
    deleted.studentModel = 1;
  } else {
    deleted.studentModel = 0;
  }

  return { deleted };
}