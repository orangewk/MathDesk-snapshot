/**
 * 会話スレッド関連の型定義
 */

export type ConversationType = 'general' | 'skill_learning' | 'skill_assessment';
export type ConversationStatus = 'active' | 'archived' | 'completed';

export interface Conversation {
  id: string;
  userId: string;
  title: string | null;
  type: ConversationType;
  skillId: string | null;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
}

export interface ConversationWithPreview extends Conversation {
  messageCount: number;
  preview: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  contentType: 'text' | 'mixed';
  metadata: {
    hasImages?: boolean;
    imageCount?: number;
  } | null;
  createdAt: string;
}

// API レスポンス型
export interface ListConversationsResponse {
  success: boolean;
  data?: {
    conversations: ConversationWithPreview[];
    total: number;
    hasMore: boolean;
  };
  error?: string;
}

export interface CreateConversationResponse {
  success: boolean;
  data?: {
    conversation: Conversation;
  };
  error?: string;
}

export interface GetConversationResponse {
  success: boolean;
  data?: {
    conversation: Conversation;
    messages: Message[];
    hasMoreMessages: boolean;
  };
  error?: string;
}

export interface UpdateConversationResponse {
  success: boolean;
  data?: {
    conversation: Conversation;
  };
  error?: string;
}

export interface DeleteConversationResponse {
  success: boolean;
  data?: {
    deleted: boolean;
  };
  error?: string;
}

export interface GetOrCreateSkillConversationResponse {
  success: boolean;
  data?: {
    conversation: Conversation;
    isNew: boolean;
  };
  error?: string;
}

export interface GetMessagesResponse {
  success: boolean;
  data?: {
    messages: Message[];
    hasMore: boolean;
  };
  error?: string;
}

// API リクエスト型
export interface CreateConversationRequest {
  title?: string;
  type?: ConversationType;
  skillId?: string;
}

export interface UpdateConversationRequest {
  title?: string | null;
  status?: ConversationStatus;
}

export interface GetOrCreateSkillConversationRequest {
  skillId: string;
  skillName?: string;
}

// 一覧取得オプション
export interface ListConversationsOptions {
  limit?: number;
  offset?: number;
  status?: ConversationStatus;
  skillId?: string;
}

// メッセージ取得オプション
export interface GetMessagesOptions {
  limit?: number;
  before?: string; // ISO8601 timestamp
}
