// FILE: prototype/src/types/chat.ts
// ---------------------------------------------------------

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

// コンテンツブロック（画像またはテキスト）
export type ContentBlock = ImageContent | TextContent;

// メッセージ（テキストのみ、または画像+テキスト）
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string | ContentBlock[];
}

export interface ChatRequest {
    messages: ChatMessage[];
    model?: string;
    maxTokens?: number;
    system?: string; // システムプロンプト
    thinking?: boolean; // false で thinking を明示的に無効化
}

export interface ChatResponse {
    content: string;
    model: string;
    usage?: {
        input_tokens: number;
        output_tokens: number;
    };
}
