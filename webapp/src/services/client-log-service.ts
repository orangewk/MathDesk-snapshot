/**
 * クライアントログサービス
 * - ログのバッファリング
 * - バッチ送信（5秒ごと or 10件溜まったら）
 * - ページ離脱時の送信
 */

import { getToken } from './auth-service';
import type {
  ClientLogEntry,
  ClientLogLevel,
  ClientLogCategory,
  ClientLogBatchRequest
} from '../types/client-log-types';

// 設定
const API_BASE_URL = '/api/logs';
const BATCH_INTERVAL_MS = 5000;  // 5秒
const BATCH_SIZE_THRESHOLD = 10; // 10件
const MAX_MESSAGE_LENGTH = 500;
const MAX_CONTEXT_SIZE = 1000;   // JSON文字列の最大長

// 状態
let logBuffer: ClientLogEntry[] = [];
let sessionId: string | null = null;
let batchTimer: number | null = null;
let isInitialized = false;

/**
 * セッションIDを生成・取得
 */
function getSessionId(): string {
  if (!sessionId) {
    // sessionStorageから取得、なければ生成
    sessionId = sessionStorage.getItem('mathdesk_log_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('mathdesk_log_session_id', sessionId);
    }
  }
  return sessionId;
}

/**
 * コンテキストをサニタイズ
 */
function sanitizeContext(
  context?: ClientLogEntry['context']
): ClientLogEntry['context'] | undefined {
  if (!context) return undefined;

  const sanitized: ClientLogEntry['context'] = {};

  if (context.skillId) sanitized.skillId = context.skillId;
  if (context.conversationId) sanitized.conversationId = context.conversationId;
  if (context.url) sanitized.url = context.url.slice(0, 200);
  if (context.statusCode) sanitized.statusCode = context.statusCode;
  if (context.errorName) sanitized.errorName = context.errorName.slice(0, 100);

  // JSONサイズチェック
  const json = JSON.stringify(sanitized);
  if (json.length > MAX_CONTEXT_SIZE) {
    return { errorName: 'context_too_large' };
  }

  return sanitized;
}

/**
 * ログを追加
 */
export function addLog(
  level: ClientLogLevel,
  category: ClientLogCategory,
  message: string,
  context?: ClientLogEntry['context']
): void {
  const entry: ClientLogEntry = {
    level,
    category,
    message: message.slice(0, MAX_MESSAGE_LENGTH),
    timestamp: new Date().toISOString(),
    context: sanitizeContext(context),
  };

  logBuffer.push(entry);

  // バッファが閾値に達したら即時送信
  if (logBuffer.length >= BATCH_SIZE_THRESHOLD) {
    flushLogs();
  }
}

/**
 * ログをサーバーに送信
 */
async function flushLogs(): Promise<void> {
  if (logBuffer.length === 0) return;

  const logsToSend = [...logBuffer];
  logBuffer = [];

  try {
    const request: ClientLogBatchRequest = {
      logs: logsToSend,
      sessionId: getSessionId(),
      userAgent: navigator.userAgent.slice(0, 200),
    };

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/batch`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      // 送信失敗時はバッファに戻す（最大100件まで）
      logBuffer = [...logsToSend, ...logBuffer].slice(0, 100);
    }
  } catch {
    // ネットワークエラー時もバッファに戻す
    logBuffer = [...logsToSend, ...logBuffer].slice(0, 100);
  }
}

/**
 * ログサービスを初期化
 */
export function initializeLogService(): void {
  if (isInitialized) return;
  isInitialized = true;

  // 定期バッチ送信タイマー
  batchTimer = window.setInterval(flushLogs, BATCH_INTERVAL_MS);

  // ページ離脱時に送信
  window.addEventListener('beforeunload', () => {
    if (logBuffer.length > 0) {
      // sendBeaconを使用（ページ離脱時でも確実に送信）
      const request: ClientLogBatchRequest = {
        logs: logBuffer,
        sessionId: getSessionId(),
        userAgent: navigator.userAgent.slice(0, 200),
      };

      const blob = new Blob([JSON.stringify(request)], {
        type: 'application/json'
      });

      // 認証トークンはsendBeaconではヘッダーに含められないため、
      // ログ本体にsessionIdを含めて識別
      navigator.sendBeacon(`${API_BASE_URL}/batch`, blob);
    }
  });

  // セッション開始ログ
  addLog('info', 'session_start', 'Session started');
}

/**
 * ログサービスを停止
 */
export function stopLogService(): void {
  if (batchTimer !== null) {
    clearInterval(batchTimer);
    batchTimer = null;
  }
  flushLogs(); // 残りを送信
  isInitialized = false;
}

// ================================
// ヘルパー関数（外部から呼び出し用）
// ================================

/**
 * APIエラーを記録
 */
export function logApiError(
  message: string,
  url: string,
  statusCode?: number
): void {
  addLog('error', 'api_error', message, { url, statusCode });
}

/**
 * ネットワークエラーを記録
 */
export function logNetworkError(message: string, url?: string): void {
  addLog('error', 'network_error', message, { url });
}

/**
 * 未捕捉エラーを記録
 */
export function logUncaughtError(
  message: string,
  errorName?: string
): void {
  addLog('error', 'uncaught_error', message, { errorName });
}

/**
 * 学習開始を記録
 */
export function logLearningStart(skillId: string): void {
  addLog('info', 'learning_start', `Started learning skill: ${skillId}`, {
    skillId
  });
}

/**
 * スキル完了を記録
 */
export function logSkillComplete(skillId: string): void {
  addLog('info', 'skill_complete', `Completed skill: ${skillId}`, {
    skillId
  });
}
