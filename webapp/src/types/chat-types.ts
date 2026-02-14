// ==========================================
// FILE: webapp/src/types/chat-types.ts
// ==========================================
/**
 * チャット機能の型定義
 */

// 画像ソース (Base64エンコード)
export interface ImageSource {
  type: 'base64';
  media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  data: string;
}

// 画像コンテンツブロック
export interface ImageContent {
  type: 'image';
  source: ImageSource;
}

// テキストコンテンツブロック
export interface TextContent {
  type: 'text';
  text: string;
}

// コンテンツブロック (画像またはテキスト)
export type ContentBlock = ImageContent | TextContent;

// メッセージ (テキストのみ、または画像+テキスト)
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentBlock[];
  timestamp?: number;
  model?: string; // AIの応答時に使用されたモデル名
  offTopic?: boolean; // 非数学トピック検知フラグ
  systemType?: 'mastery' | 'next_step'; // system メッセージの種別
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
}

export interface ChatResponse {
  content: string;
  model: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ConversationHistory {
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

/**
 * 内部タグを除去するヘルパー
 * AIが出力する内部タグ ([[MASTERY_SCORE:XX]], [[OFF_TOPIC]]) をUIに表示しないようにする
 */
function stripInternalTags(text: string): string {
  return text
    .replace(/\[\[MASTERY_SCORE:\d+\]\]\s*/g, '')
    .replace(/\[\[OFF_TOPIC\]\]\s*/g, '')
    .trim();
}

// ヘルパー関数: メッセージの内容をテキストとして取得
export function getMessageText(message: ChatMessage): string {
  let text: string;
  if (typeof message.content === 'string') {
    text = message.content;
  } else {
    const textBlock = message.content.find((block): block is TextContent => block.type === 'text');
    text = textBlock?.text || '';
  }
  return stripInternalTags(text);
}

// ヘルパー関数: メッセージに画像が含まれているか
export function hasImage(message: ChatMessage): boolean {
  if (typeof message.content === 'string') {
    return false;
  }
  return message.content.some(block => block.type === 'image');
}

// ヘルパー関数: メッセージから画像を取得
export function getMessageImages(message: ChatMessage): ImageContent[] {
  if (typeof message.content === 'string') {
    return [];
  }
  return message.content.filter((block): block is ImageContent => block.type === 'image');
}