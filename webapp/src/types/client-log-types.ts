/**
 * クライアントログ型定義
 */

/** ログレベル */
export type ClientLogLevel = 'error' | 'warn' | 'info';

/** ログカテゴリ */
export type ClientLogCategory =
  | 'api_error'        // API呼び出しエラー
  | 'network_error'    // ネットワークエラー
  | 'uncaught_error'   // 未捕捉例外
  | 'learning_start'   // 学習開始イベント
  | 'skill_complete'   // スキル完了イベント
  | 'session_start'    // セッション開始
  | 'session_end';     // セッション終了

/** クライアントログエントリ */
export interface ClientLogEntry {
  level: ClientLogLevel;
  category: ClientLogCategory;
  message: string;
  timestamp: string;    // ISO 8601形式
  context?: {
    skillId?: string;
    conversationId?: string;
    url?: string;
    statusCode?: number;
    errorName?: string;
  };
}

/** バッチ送信リクエスト */
export interface ClientLogBatchRequest {
  logs: ClientLogEntry[];
  sessionId: string;
  userAgent: string;
}

/** バッチ送信レスポンス */
export interface ClientLogBatchResponse {
  success: boolean;
  accepted: number;
  error?: string;
}
