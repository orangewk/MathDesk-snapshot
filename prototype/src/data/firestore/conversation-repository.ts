/**
 * Firestore 会話 + メッセージ リポジトリ
 *
 * 既存の database.ts と同じ型・関数名をエクスポートし、
 * サービス層の変更を最小化する。
 * messages は conversations のサブコレクションとして実装。
 */

import { Timestamp } from 'firebase-admin/firestore';
import { db, conversationsCollection } from './client.js';

// ==========================================
// 型定義
// ==========================================

export type ConversationType = 'general' | 'skill_learning' | 'skill_assessment';
export type ConversationStatus = 'active' | 'archived' | 'completed';

export interface Conversation {
  id: string;
  userId: string;
  title: string | null;
  type: ConversationType;
  skillId: string | null;
  status: ConversationStatus;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date | null;
}

interface ConversationDoc {
  userId: string;
  title: string | null;
  type: string;
  skillId: string | null;
  status: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessageAt: Timestamp | null;
  /** ソート用: lastMessageAt ?? updatedAt（Firestore は COALESCE 不可） */
  lastActivityAt: Timestamp;
}

function docToConversation(id: string, data: ConversationDoc): Conversation {
  return {
    id,
    userId: data.userId,
    title: data.title,
    type: data.type as ConversationType,
    skillId: data.skillId,
    status: data.status as ConversationStatus,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    lastMessageAt: data.lastMessageAt ? data.lastMessageAt.toDate() : null,
  };
}

export type MessageRole = 'user' | 'assistant';
export type MessageContentType = 'text' | 'mixed';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  contentType: MessageContentType;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

interface MessageDoc {
  role: string;
  content: string;
  contentType: string;
  metadata: Record<string, unknown> | null;
  createdAt: Timestamp;
}

function docToMessage(
  id: string,
  conversationId: string,
  data: MessageDoc
): Message {
  return {
    id,
    conversationId,
    role: data.role as MessageRole,
    content: data.content,
    contentType: data.contentType as MessageContentType,
    metadata: data.metadata ?? null,
    createdAt: data.createdAt.toDate(),
  };
}

// ==========================================
// Conversation CRUD
// ==========================================

export interface CreateConversationInput {
  id: string;
  userId: string;
  title?: string | null;
  type?: ConversationType;
  skillId?: string | null;
}

export async function createConversation(
  input: CreateConversationInput
): Promise<Conversation> {
  const now = Timestamp.now();
  const title = input.title ?? null;
  const type = input.type ?? 'general';
  const skillId = input.skillId ?? null;

  const docData: ConversationDoc = {
    userId: input.userId,
    title,
    type,
    skillId,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    lastMessageAt: null,
    lastActivityAt: now,
  };

  await conversationsCollection.doc(input.id).set(docData);

  return {
    id: input.id,
    userId: input.userId,
    title,
    type,
    skillId,
    status: 'active',
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
    lastMessageAt: null,
  };
}

export async function findConversationById(
  id: string
): Promise<Conversation | null> {
  const doc = await conversationsCollection.doc(id).get();
  if (!doc.exists) return null;
  return docToConversation(doc.id, doc.data() as ConversationDoc);
}

export interface ListConversationsOptions {
  limit?: number;
  offset?: number;
  status?: ConversationStatus;
  skillId?: string;
}

export async function findConversationsByUserId(
  userId: string,
  options: ListConversationsOptions = {}
): Promise<{ conversations: Conversation[]; total: number }> {
  const { limit = 20, offset = 0, status, skillId } = options;

  // ベースクエリ
  let query: FirebaseFirestore.Query = conversationsCollection.where(
    'userId',
    '==',
    userId
  );

  if (status) {
    query = query.where('status', '==', status);
  }
  if (skillId) {
    query = query.where('skillId', '==', skillId);
  }

  // total カウント（Firestore には COUNT がないので全件取得して数える）
  // ※ 将来的に count() アグリゲーションを使う余地あり
  const countSnapshot = await query.select().get();
  const total = countSnapshot.size;

  // データ取得: lastActivityAt DESC でソート + offset/limit
  // Firestore は offset をネイティブサポートする
  const dataSnapshot = await query
    .orderBy('lastActivityAt', 'desc')
    .offset(offset)
    .limit(limit)
    .get();

  const conversations = dataSnapshot.docs.map((doc) =>
    docToConversation(doc.id, doc.data() as ConversationDoc)
  );

  return { conversations, total };
}

export interface UpdateConversationInput {
  title?: string | null;
  status?: ConversationStatus;
}

export async function updateConversation(
  id: string,
  input: UpdateConversationInput
): Promise<Conversation | null> {
  const now = Timestamp.now();

  const updates: Record<string, unknown> = {
    updatedAt: now,
  };

  if (input.title !== undefined) {
    updates.title = input.title;
  }
  if (input.status !== undefined) {
    updates.status = input.status;
  }

  const docRef = conversationsCollection.doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return null;

  await docRef.update(updates);

  return findConversationById(id);
}

export async function updateConversationLastMessageAt(
  id: string,
  timestamp: Date
): Promise<void> {
  const now = Timestamp.now();
  const ts = Timestamp.fromDate(timestamp);

  await conversationsCollection.doc(id).update({
    lastMessageAt: ts,
    lastActivityAt: ts,
    updatedAt: now,
  });
}

export async function deleteConversation(id: string): Promise<boolean> {
  const docRef = conversationsCollection.doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return false;

  // サブコレクション（messages）も削除
  const messagesSnapshot = await docRef.collection('messages').get();
  if (!messagesSnapshot.empty) {
    const batch = db.batch();
    messagesSnapshot.docs.forEach((msgDoc) => batch.delete(msgDoc.ref));
    await batch.commit();
  }

  await docRef.delete();
  return true;
}

export async function findActiveConversationBySkillId(
  userId: string,
  skillId: string
): Promise<Conversation | null> {
  const snapshot = await conversationsCollection
    .where('userId', '==', userId)
    .where('skillId', '==', skillId)
    .where('status', '==', 'active')
    .orderBy('updatedAt', 'desc')
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return docToConversation(doc.id, doc.data() as ConversationDoc);
}

// ==========================================
// Message CRUD（サブコレクション）
// ==========================================

export interface CreateMessageInput {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  contentType?: MessageContentType;
  metadata?: Record<string, unknown> | null;
}

export async function createMessage(
  input: CreateMessageInput
): Promise<Message> {
  const now = Timestamp.now();
  const contentType = input.contentType ?? 'text';
  const metadata = input.metadata ?? null;

  const docData: MessageDoc = {
    role: input.role,
    content: input.content,
    contentType,
    metadata,
    createdAt: now,
  };

  // メッセージ作成 + 会話の lastMessageAt を同時更新（バッチ）
  const convRef = conversationsCollection.doc(input.conversationId);
  const msgRef = convRef.collection('messages').doc(input.id);

  const batch = db.batch();
  batch.set(msgRef, docData);
  batch.update(convRef, {
    lastMessageAt: now,
    lastActivityAt: now,
    updatedAt: now,
  });
  await batch.commit();

  return {
    id: input.id,
    conversationId: input.conversationId,
    role: input.role,
    content: input.content,
    contentType,
    metadata,
    createdAt: now.toDate(),
  };
}

export interface ListMessagesOptions {
  limit?: number;
  before?: Date;
}

export async function findMessagesByConversationId(
  conversationId: string,
  options: ListMessagesOptions = {}
): Promise<{ messages: Message[]; hasMore: boolean }> {
  const { limit = 50, before } = options;

  const messagesRef = conversationsCollection
    .doc(conversationId)
    .collection('messages');

  let query: FirebaseFirestore.Query = messagesRef;

  if (before) {
    query = query.where('createdAt', '<', Timestamp.fromDate(before));
  }

  // limit + 1 で hasMore を判定
  const snapshot = await query
    .orderBy('createdAt', 'desc')
    .limit(limit + 1)
    .get();

  const hasMore = snapshot.docs.length > limit;
  const docs = snapshot.docs.slice(0, limit);

  const messages = docs.map((doc) =>
    docToMessage(doc.id, conversationId, doc.data() as MessageDoc)
  );

  // 古い順に並び替え
  messages.reverse();

  return { messages, hasMore };
}

export async function getConversationMessageCount(
  conversationId: string
): Promise<number> {
  const snapshot = await conversationsCollection
    .doc(conversationId)
    .collection('messages')
    .select()
    .get();

  return snapshot.size;
}

export async function getLastMessage(
  conversationId: string
): Promise<Message | null> {
  const snapshot = await conversationsCollection
    .doc(conversationId)
    .collection('messages')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return docToMessage(doc.id, conversationId, doc.data() as MessageDoc);
}
