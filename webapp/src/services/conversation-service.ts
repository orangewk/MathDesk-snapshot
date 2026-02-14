/**
 * 会話スレッド管理サービス
 */

import { getToken } from './auth-service';
import type {
  Conversation,
  ConversationWithPreview,
  Message,
  ListConversationsResponse,
  CreateConversationResponse,
  GetConversationResponse,
  UpdateConversationResponse,
  DeleteConversationResponse,
  GetOrCreateSkillConversationResponse,
  GetMessagesResponse,
  CreateConversationRequest,
  UpdateConversationRequest,
  GetOrCreateSkillConversationRequest,
  ListConversationsOptions,
  GetMessagesOptions,
} from '../types/conversation-types';

const API_BASE_URL = '/api/conversations';

/**
 * 認証ヘッダーを取得
 */
function getAuthHeaders(): HeadersInit {
  const token = getToken();
  if (!token) {
    throw new Error('認証が必要です');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/**
 * 会話スレッド一覧を取得
 */
export async function listConversations(
  options: ListConversationsOptions = {}
): Promise<{
  conversations: ConversationWithPreview[];
  total: number;
  hasMore: boolean;
}> {
  const params = new URLSearchParams();

  if (options.limit !== undefined) {
    params.set('limit', options.limit.toString());
  }
  if (options.offset !== undefined) {
    params.set('offset', options.offset.toString());
  }
  if (options.status) {
    params.set('status', options.status);
  }
  if (options.skillId) {
    params.set('skillId', options.skillId);
  }

  const url = params.toString()
    ? `${API_BASE_URL}?${params.toString()}`
    : API_BASE_URL;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data: ListConversationsResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || '会話一覧の取得に失敗しました');
  }

  return data.data!;
}

/**
 * 会話スレッドを作成
 */
export async function createConversation(
  request: CreateConversationRequest = {}
): Promise<Conversation> {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  const data: CreateConversationResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || '会話の作成に失敗しました');
  }

  return data.data!.conversation;
}

/**
 * 会話スレッドを取得（メッセージ付き）
 */
export async function getConversation(
  id: string,
  messageOptions: GetMessagesOptions = {}
): Promise<{
  conversation: Conversation;
  messages: Message[];
  hasMoreMessages: boolean;
}> {
  const params = new URLSearchParams();

  if (messageOptions.limit !== undefined) {
    params.set('messagesLimit', messageOptions.limit.toString());
  }
  if (messageOptions.before) {
    params.set('messagesBefore', messageOptions.before);
  }

  const url = params.toString()
    ? `${API_BASE_URL}/${id}?${params.toString()}`
    : `${API_BASE_URL}/${id}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data: GetConversationResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || '会話の取得に失敗しました');
  }

  return data.data!;
}

/**
 * 会話スレッドを更新
 */
export async function updateConversation(
  id: string,
  request: UpdateConversationRequest
): Promise<Conversation> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  const data: UpdateConversationResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || '会話の更新に失敗しました');
  }

  return data.data!.conversation;
}

/**
 * 会話スレッドを削除
 */
export async function deleteConversation(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const data: DeleteConversationResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || '会話の削除に失敗しました');
  }
}

/**
 * スキル学習用会話を取得または作成
 */
export async function getOrCreateSkillConversation(
  request: GetOrCreateSkillConversationRequest
): Promise<{ conversation: Conversation; isNew: boolean }> {
  const response = await fetch(`${API_BASE_URL}/skill`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  const data: GetOrCreateSkillConversationResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'スキル学習用会話の取得/作成に失敗しました');
  }

  return data.data!;
}

/**
 * メッセージ一覧を取得（ページネーション用）
 */
export async function getMessages(
  conversationId: string,
  options: GetMessagesOptions = {}
): Promise<{ messages: Message[]; hasMore: boolean }> {
  const params = new URLSearchParams();

  if (options.limit !== undefined) {
    params.set('limit', options.limit.toString());
  }
  if (options.before) {
    params.set('before', options.before);
  }

  const url = params.toString()
    ? `${API_BASE_URL}/${conversationId}/messages?${params.toString()}`
    : `${API_BASE_URL}/${conversationId}/messages`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data: GetMessagesResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'メッセージの取得に失敗しました');
  }

  return data.data!;
}
