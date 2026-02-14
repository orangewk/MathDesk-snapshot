// FILE: prototype/src/api/auth-routes.ts
// ---------------------------------------------------------
/**
 * 認証APIルーター
 * Phase 2A - ユーザー認証・データ保存基盤
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  validateToken,
  logoutUser,
  cleanupExpiredSessions,
  loginWithGoogle,
  loginWithBypass,
} from '../services/user-service.js';

const router = Router();

// --------------------------------
// 型定義
// --------------------------------

/** 認証済みユーザー情報 */
interface AuthenticatedUser {
  id: string;
  nickname: string;
  accessCode: string;
}

/** 認証済みリクエスト */
interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

// --------------------------------
// ミドルウェア
// --------------------------------

/**
 * 認証ミドルウェア - Bearerトークンを検証
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '認証が必要です' });
    return;
  }

  const token = authHeader.substring(7); // 'Bearer 'を除去
  const result = await validateToken(token);

  if ('error' in result) {
    res.status(401).json({ error: result.error });
    return;
  }

  // リクエストにユーザー情報を付加
  (req as AuthenticatedRequest).user = result.user;
  next();
}

// --------------------------------
// ルート
// --------------------------------



/**
 * POST /api/auth/google-login - Googleログイン
 * Body: { idToken: string }
 */
router.post('/google-login', async (req: Request, res: Response) => {
  const { idToken } = req.body;

  if (!idToken) {
    res.status(400).json({ error: 'IDトークンは必須です' });
    return;
  }

  const result = await loginWithGoogle(idToken);

  if ('error' in result) {
    res.status(401).json({ error: result.error });
    return;
  }

  res.json({
    success: true,
    user: {
      id: result.user!.id,
      nickname: result.user!.nickname,
    },
    token: result.token,
  });
});

/**
 * POST /api/auth/bypass-login - バイパスログイン
 * body.persona: ペルソナID（省略時は既存の DevUser）
 */
router.post('/bypass-login', async (req: Request, res: Response) => {
  const persona = req.body?.persona as string | undefined;
  const result = await loginWithBypass(persona);

  if ('error' in result) {
    res.status(401).json({ error: result.error });
    return;
  }

  res.json({
    success: true,
    user: {
      id: result.user!.id,
      nickname: result.user!.nickname,
    },
    token: result.token,
  });
});

/**
 * POST /api/auth/reset-test-user - テストユーザーのデータをリセット（開発用）
 * body.persona: リセットするペルソナID（必須）
 */
router.post('/reset-test-user', async (req: Request, res: Response) => {
  if (process.env.ENABLE_AUTH_BYPASS !== 'true') {
    res.status(403).json({ error: 'バイパスログインが無効です' });
    return;
  }

  const persona = req.body?.persona as string | undefined;
  if (!persona) {
    res.status(400).json({ error: 'persona パラメータが必要です' });
    return;
  }

  try {
    const { resetTestUserData } = await import('../services/user-service.js');
    const result = await resetTestUserData(persona);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/logout - ログアウト
 */
router.post('/logout', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    await logoutUser(token);
  }

  res.json({ success: true });
});

/**
 * GET /api/auth/me - 現在のユーザー情報を取得
 */
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;

  res.json({
    success: true,
    user: {
      id: user.id,
      nickname: user.nickname,
    },
  });
});

/**
 * GET /api/auth/validate - トークンの有効性を確認
 */
router.get('/validate', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.json({ valid: false });
    return;
  }

  const token = authHeader.substring(7);
  const result = await validateToken(token);

  res.json({
    valid: result.success,
    user: result.success ? { id: result.user.id, nickname: result.user.nickname } : null,
  });
});

// --------------------------------
// 管理用エンドポイント（開発用）
// --------------------------------

/**
 * POST /api/auth/cleanup - 期限切れセッションをクリーンアップ
 * 認証必須（管理者権限が必要）
 */
router.post('/cleanup', authMiddleware, async (req: Request, res: Response) => {
  const count = await cleanupExpiredSessions();
  res.json({ success: true, deletedSessions: count });
});

export default router;