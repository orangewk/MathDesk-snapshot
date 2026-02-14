/**
 * クライアントログDB操作サービス
 * フロントエンドから送信されたログをDBに保存・管理
 *
 * Firestore 版: client-log-repository.ts に委譲
 */

import {
  insertClientLogs as repoInsertClientLogs,
  cleanupOldLogs as repoCleanupOldLogs,
  getLogStats as repoGetLogStats,
} from '../data/firestore/client-log-repository.js';

// 型定義
interface ClientLogEntry {
  level: string;
  category: string;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

/**
 * クライアントログを一括挿入
 */
export async function insertClientLogs(
  logs: ClientLogEntry[],
  userId: string | null,
  sessionId: string,
  userAgent: string
): Promise<number> {
  return repoInsertClientLogs(logs, userId, sessionId, userAgent);
}

/**
 * 古いログを削除（ローテーション）
 * @param daysToKeep 保持する日数（デフォルト30日）
 * @returns 削除したログの件数
 */
export async function cleanupOldLogs(daysToKeep = 30): Promise<number> {
  return repoCleanupOldLogs(daysToKeep);
}

/**
 * ログ統計を取得（管理用）
 */
export async function getLogStats(): Promise<{
  totalLogs: number;
  byLevel: Record<string, number>;
  byCategory: Record<string, number>;
  last24Hours: number;
}> {
  return repoGetLogStats();
}
