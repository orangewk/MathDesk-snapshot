/**
 * 会話スレッドサービス
 * マルチデバイス対応のための会話永続化
 */

import crypto from 'crypto';
import {
  createConversation as dbCreateConversation,
  findConversationById,
  findConversationsByUserId,
  updateConversation as dbUpdateConversation,
  deleteConversation as dbDeleteConversation,
  findActiveConversationBySkillId,
  createMessage as dbCreateMessage,
  findMessagesByConversationId,
  getConversationMessageCount,
  getLastMessage,
  Conversation,
  Message,
  ConversationType,
  ConversationStatus,
  ListConversationsOptions,
  ListMessagesOptions,
} from '../data/firestore/conversation-repository.js';

/**
 * ユニークIDを生成
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * 会話タイトルを自動生成（最初のメッセージから）
 */
export function generateConversationTitle(content: string): string {
  // 画像プレースホルダを除去
  const text = content.replace(/\[画像を送信しました\]/g, '').trim();

  if (!text) {
    return '新しい会話';
  }

  // 30文字で切り詰め
  if (text.length > 30) {
    return text.substring(0, 27) + '...';
  }

  return text;
}

/**
 * プレビュー用にMarkdown/LaTeX記法をストリップ
 */
export function stripMarkdownAndLatex(text: string): string {
  return text
    // LaTeX display math: $$...$$ → 内容を残す
    .replace(/\$\$([^$]*)\$\$/g, '$1')
    // LaTeX inline math: $...$ → 内容を残す
    .replace(/\$([^$\n]+)\$/g, '$1')
    // Markdown bold+italic: ***text*** or ___text___
    .replace(/(\*{3}|_{3})(.+?)\1/g, '$2')
    // Markdown bold: **text** or __text__
    .replace(/(\*{2}|_{2})(.+?)\1/g, '$2')
    // Markdown italic: *text* or _text_
    .replace(/(\*|_)(.+?)\1/g, '$2')
    // Inline code: `code`
    .replace(/`([^`]+)`/g, '$1')
    // Headers: # text
    .replace(/^#{1,6}\s+/gm, '')
    // List markers: - item, * item, 1. item
    .replace(/^(\s*[-*]|\s*\d+\.)\s+/gm, '')
    // Multiple spaces to single
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ==========================================
// 会話スレッド操作
// ==========================================

export interface CreateConversationOptions {
  title?: string;
  type?: ConversationType;
  skillId?: string;
}

export interface ConversationWithPreview extends Conversation {
  messageCount: number;
  preview: string | null;
}

/**
 * 会話スレッドを作成
 */
export async function createConversation(
  userId: string,
  options: CreateConversationOptions = {}
): Promise<Conversation> {
  const id = generateId();

  return dbCreateConversation({
    id,
    userId,
    title: options.title ?? null,
    type: options.type ?? 'general',
    skillId: options.skillId ?? null,
  });
}

/**
 * 会話スレッドを取得（所有者検証付き）
 */
export async function getConversation(
  conversationId: string,
  userId: string
): Promise<Conversation | null> {
  const conversation = await findConversationById(conversationId);

  if (!conversation) return null;

  // 所有者検証
  if (conversation.userId !== userId) {
    return null;
  }

  return conversation;
}

/**
 * 会話スレッド一覧を取得（プレビュー付き）
 */
export async function listConversations(
  userId: string,
  options: ListConversationsOptions = {}
): Promise<{
  conversations: ConversationWithPreview[];
  total: number;
  hasMore: boolean;
}> {
  const { offset = 0 } = options;
  const result = await findConversationsByUserId(userId, options);

  const conversationsWithPreview = await Promise.all(
    result.conversations.map(async (conv) => {
      const [messageCount, lastMessage] = await Promise.all([
        getConversationMessageCount(conv.id),
        getLastMessage(conv.id),
      ]);

      let preview: string | null = null;
      if (lastMessage) {
        const text = stripMarkdownAndLatex(
          lastMessage.content
            .replace(/\[\[OFF_TOPIC\]\]\s*/g, '')
            .replace(/\[画像を送信しました\]/g, '')
            .trim()
        );
        preview = text.length > 100 ? text.substring(0, 97) + '...' : text;
      }

      return {
        ...conv,
        messageCount,
        preview,
      };
    })
  );

  // メッセージ0件の空会話を除外 (#195)
  const filtered = conversationsWithPreview.filter((c) => c.messageCount > 0);
  const filteredCount = conversationsWithPreview.length - filtered.length;

  return {
    conversations: filtered,
    total: result.total - filteredCount,
    hasMore: offset + result.conversations.length < result.total,
  };
}

export interface UpdateConversationOptions {
  title?: string | null;
  status?: ConversationStatus;
}

/**
 * 会話スレッドを更新（所有者検証付き）
 */
export async function updateConversation(
  conversationId: string,
  userId: string,
  options: UpdateConversationOptions
): Promise<Conversation | null> {
  // 所有者検証
  const conversation = await getConversation(conversationId, userId);
  if (!conversation) return null;

  return dbUpdateConversation(conversationId, options);
}

/**
 * 会話スレッドを削除（所有者検証付き）
 */
export async function deleteConversation(
  conversationId: string,
  userId: string
): Promise<boolean> {
  // 所有者検証
  const conversation = await getConversation(conversationId, userId);
  if (!conversation) return false;

  return dbDeleteConversation(conversationId);
}

/**
 * スキルIDでアクティブな会話スレッドを取得または作成
 */
export async function getOrCreateSkillConversation(
  userId: string,
  skillId: string,
  skillName?: string
): Promise<{ conversation: Conversation; isNew: boolean }> {
  // 既存のアクティブな会話を検索
  const existing = await findActiveConversationBySkillId(userId, skillId);

  if (existing) {
    return { conversation: existing, isNew: false };
  }

  // 新規作成
  const title = skillName ? `${skillName}の学習` : null;
  const conversation = await createConversation(userId, {
    title,
    type: 'skill_learning',
    skillId,
  });

  return { conversation, isNew: true };
}

// ==========================================
// メッセージ操作
// ==========================================

export interface AddMessageOptions {
  contentType?: 'text' | 'mixed';
  metadata?: Record<string, unknown>;
}

/**
 * メッセージを追加（会話所有者検証付き）
 */
export async function addMessage(
  conversationId: string,
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  options: AddMessageOptions = {}
): Promise<Message | null> {
  // 所有者検証
  const conversation = await getConversation(conversationId, userId);
  if (!conversation) return null;

  const id = generateId();

  // 最初のユーザーメッセージでタイトルが未設定なら自動設定
  if (role === 'user' && !conversation.title) {
    const messageCount = await getConversationMessageCount(conversationId);
    if (messageCount === 0) {
      const title = generateConversationTitle(content);
      await dbUpdateConversation(conversationId, { title });
    }
  }

  return dbCreateMessage({
    id,
    conversationId,
    role,
    content,
    contentType: options.contentType ?? 'text',
    metadata: options.metadata ?? null,
  });
}

/**
 * 会話スレッドのメッセージ一覧を取得（所有者検証付き）
 */
export async function getMessages(
  conversationId: string,
  userId: string,
  options: ListMessagesOptions = {}
): Promise<{ messages: Message[]; hasMore: boolean } | null> {
  // 所有者検証
  const conversation = await getConversation(conversationId, userId);
  if (!conversation) return null;

  return findMessagesByConversationId(conversationId, options);
}

/**
 * 会話スレッドとメッセージを一括取得（所有者検証付き）
 */
export async function getConversationWithMessages(
  conversationId: string,
  userId: string,
  messageOptions: ListMessagesOptions = {}
): Promise<{
  conversation: Conversation;
  messages: Message[];
  hasMoreMessages: boolean;
} | null> {
  const conversation = await getConversation(conversationId, userId);
  if (!conversation) return null;

  const messagesResult = await findMessagesByConversationId(conversationId, messageOptions);

  return {
    conversation,
    messages: messagesResult.messages,
    hasMoreMessages: messagesResult.hasMore,
  };
}
