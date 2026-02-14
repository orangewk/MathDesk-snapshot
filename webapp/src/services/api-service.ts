// ==========================================
// FILE: webapp/src/services/api-service.ts
// ==========================================
/**
 * バックエンドAPIとの通信サービス
 */

import type { ChatMessage } from '../types/chat-types';
import { getToken } from './auth-service';

const API_BASE_URL = '/api';

/**
 * 学習者コンテキスト（システムプロンプト生成用）
 */
export interface StudentContextOptions {
  userId: string;
  currentSkillId?: string;
  recentErrorType?: 'L1' | 'L2' | 'L3';
}

/**
 * 判定モードの種類
 */
export type AssessmentMode = 'ai_generated' | 'textbook_required';

/**
 * チャットオプション
 */
export interface ChatOptions {
  model?: string;
  maxTokens?: number;
  studentContext?: StudentContextOptions;
  conversationId?: string;
  saveMessages?: boolean;
  assessmentMode?: AssessmentMode;
}

/**
 * 拡張チャットレスポンス
 */
export interface ExtendedChatResponse {
  content: string;
  model: string;
  usage?: { input_tokens: number; output_tokens: number };
  conversationId?: string;
  userMessageId?: string;
  assistantMessageId?: string;
  conversationStatus?: 'active' | 'archived' | 'completed';
  skillUpdate?: {
    skillId: string;
    skillName?: string;
    score: number;
    oldStatus: string;
    newStatus: string;
    mastered: boolean;
    skillUpdated: boolean;
    newRank?: number;
  };
  offTopic?: boolean;
}

/**
 * ヘルスチェック
 */
export async function checkHealth(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }
  return response.json();
}

/**
 * SSE イベントをパースする
 */
function parseSSEEvents(text: string): Array<{ event: string; data: string }> {
  const events: Array<{ event: string; data: string }> = [];
  // SSE フォーマット: "event: <type>\ndata: <json>\n\n"
  const blocks = text.split('\n\n');

  for (const block of blocks) {
    if (!block.trim()) continue;

    let event = '';
    let data = '';
    for (const line of block.split('\n')) {
      if (line.startsWith('event: ')) {
        event = line.slice(7);
      } else if (line.startsWith('data: ')) {
        data = line.slice(6);
      }
    }
    if (event && data) {
      events.push({ event, data });
    }
  }

  return events;
}

/**
 * チャットメッセージを送信（SSE ストリーミング）
 *
 * @param onChunk テキストチャンクを受信するたびに呼ばれるコールバック
 * @returns ストリーム完了後のメタデータ（done イベント）
 */
export async function sendChatMessageStream(
  messages: ChatMessage[],
  options?: ChatOptions,
  onChunk?: (text: string) => void,
): Promise<ExtendedChatResponse> {
  const cleanMessages = messages.map(({ role, content }) => ({
    role,
    content
  }));

  const request = {
    messages: cleanMessages,
    model: options?.model,
    maxTokens: options?.maxTokens,
    studentContext: options?.studentContext,
    conversationId: options?.conversationId,
    saveMessages: options?.saveMessages,
    assessmentMode: options?.assessmentMode,
  };

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API request failed: ${response.statusText}`);
  }

  // SSE ストリームを読む
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let metadata: ExtendedChatResponse | null = null;
  let accumulatedContent = '';
  let partialBuffer = ''; // SSE パースのための不完全データバッファ

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    partialBuffer += decoder.decode(value, { stream: true });

    // 完全な SSE ブロック（\n\n で終わる）のみ処理
    const lastDoubleNewline = partialBuffer.lastIndexOf('\n\n');
    if (lastDoubleNewline === -1) continue;

    const completeData = partialBuffer.slice(0, lastDoubleNewline + 2);
    partialBuffer = partialBuffer.slice(lastDoubleNewline + 2);

    for (const sseEvent of parseSSEEvents(completeData)) {
      try {
        const parsed = JSON.parse(sseEvent.data);

        if (sseEvent.event === 'chunk' && parsed.text) {
          accumulatedContent += parsed.text;
          onChunk?.(parsed.text);
        } else if (sseEvent.event === 'done') {
          metadata = {
            content: accumulatedContent,
            model: parsed.model || '',
            usage: parsed.usage,
            conversationId: parsed.conversationId,
            userMessageId: parsed.userMessageId,
            assistantMessageId: parsed.assistantMessageId,
            conversationStatus: parsed.conversationStatus,
            skillUpdate: parsed.skillUpdate,
            offTopic: parsed.offTopic,
          };
        } else if (sseEvent.event === 'error') {
          throw new Error(parsed.error || 'Stream error');
        }
      } catch (e) {
        if (e instanceof SyntaxError) {
          console.warn('SSE parse error, skipping chunk:', sseEvent.data);
        } else {
          throw e;
        }
      }
    }
  }

  // 残りのバッファを処理
  if (partialBuffer.trim()) {
    for (const sseEvent of parseSSEEvents(partialBuffer)) {
      try {
        const parsed = JSON.parse(sseEvent.data);
        if (sseEvent.event === 'done') {
          metadata = {
            content: accumulatedContent,
            model: parsed.model || '',
            usage: parsed.usage,
            conversationId: parsed.conversationId,
            userMessageId: parsed.userMessageId,
            assistantMessageId: parsed.assistantMessageId,
            conversationStatus: parsed.conversationStatus,
            skillUpdate: parsed.skillUpdate,
            offTopic: parsed.offTopic,
          };
        }
      } catch {
        // ignore
      }
    }
  }

  if (!metadata) {
    // done イベントが来なかった場合のフォールバック
    return {
      content: accumulatedContent,
      model: '',
    };
  }

  return metadata;
}

/**
 * Claude APIへメッセージを送信（レガシー非ストリーミング版 — テスト用に残す）
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  options?: ChatOptions
): Promise<ExtendedChatResponse> {
  // ストリーミング版に委譲（onChunk なしで呼ぶと単にメタデータだけ返る）
  return sendChatMessageStream(messages, options);
}

/**
 * Claude API接続テスト
 */
export async function testClaudeConnection(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/test-claude`);
  if (!response.ok) {
    throw new Error(`Claude connection test failed: ${response.statusText}`);
  }
  return response.json();
}