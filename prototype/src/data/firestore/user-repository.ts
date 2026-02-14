/**
 * Firestore ユーザー + セッション リポジトリ
 *
 * 既存の database.ts と同じ型・関数名をエクスポートし、
 * サービス層の変更を最小化する。
 * Firestore は非同期 API なので、全関数を async に変更。
 */

import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { db, usersCollection, sessionsCollection } from './client.js';

// ==========================================
// User
// ==========================================

export interface User {
  id: string;
  nickname: string;
  accessCode: string;
  createdAt: Date;
  updatedAt: Date;
  firebaseUid?: string;
  email?: string;
}

interface UserDoc {
  nickname: string;
  accessCode: string;
  firebaseUid?: string;
  email?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function docToUser(id: string, data: UserDoc): User {
  return {
    id,
    nickname: data.nickname,
    accessCode: data.accessCode,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    firebaseUid: data.firebaseUid,
    email: data.email,
  };
}

export async function createUser(
  user: Omit<User, 'createdAt' | 'updatedAt'>
): Promise<User> {
  const now = Timestamp.now();
  const docData: UserDoc = {
    nickname: user.nickname,
    accessCode: user.accessCode,
    createdAt: now,
    updatedAt: now,
    ...(user.firebaseUid && { firebaseUid: user.firebaseUid }),
    ...(user.email && { email: user.email }),
  };

  await usersCollection.doc(user.id).set(docData);

  return {
    ...user,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };
}

export async function findUserByAccessCode(
  accessCode: string
): Promise<User | null> {
  const snapshot = await usersCollection
    .where('accessCode', '==', accessCode)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return docToUser(doc.id, doc.data() as UserDoc);
}

export async function findUserByFirebaseUid(
  firebaseUid: string
): Promise<User | null> {
  const snapshot = await usersCollection
    .where('firebaseUid', '==', firebaseUid)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return docToUser(doc.id, doc.data() as UserDoc);
}

export async function findUserById(id: string): Promise<User | null> {
  const doc = await usersCollection.doc(id).get();

  if (!doc.exists) return null;

  return docToUser(doc.id, doc.data() as UserDoc);
}

export async function updateUserNickname(id: string, nickname: string): Promise<void> {
  await usersCollection.doc(id).update({
    nickname,
    updatedAt: Timestamp.now(),
  });
}

// ==========================================
// Session
// ==========================================

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

interface SessionDoc {
  userId: string;
  expiresAt: Timestamp;
  createdAt: Timestamp;
}

/**
 * セッションを作成
 * doc ID = token（findSessionByToken が O(1)）
 */
export async function createSession(
  session: Omit<Session, 'createdAt'>
): Promise<Session> {
  const now = Timestamp.now();
  const docData: SessionDoc = {
    userId: session.userId,
    expiresAt: Timestamp.fromDate(session.expiresAt),
    createdAt: now,
  };

  // token を doc ID として使用
  await sessionsCollection.doc(session.token).set(docData);

  return {
    ...session,
    createdAt: now.toDate(),
  };
}

/**
 * トークンでセッションを検索（O(1) — doc ID が token）
 */
export async function findSessionByToken(
  token: string
): Promise<Session | null> {
  const doc = await sessionsCollection.doc(token).get();

  if (!doc.exists) return null;

  const data = doc.data() as SessionDoc;
  return {
    id: doc.id, // token と同一
    userId: data.userId,
    token: doc.id,
    expiresAt: data.expiresAt.toDate(),
    createdAt: data.createdAt.toDate(),
  };
}

/**
 * 期限切れセッションを削除
 */
export async function deleteExpiredSessions(): Promise<number> {
  const now = Timestamp.now();
  const snapshot = await sessionsCollection
    .where('expiresAt', '<', now)
    .get();

  if (snapshot.empty) return 0;

  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  return snapshot.size;
}

/**
 * ユーザーのセッションを全て削除
 */
export async function deleteUserSessions(userId: string): Promise<number> {
  const snapshot = await sessionsCollection
    .where('userId', '==', userId)
    .get();

  if (snapshot.empty) return 0;

  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  return snapshot.size;
}
