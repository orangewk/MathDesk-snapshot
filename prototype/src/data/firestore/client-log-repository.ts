/**
 * Firestore クライアントログ リポジトリ
 *
 * SQLite client-log-db-service.ts のDB操作を Firestore に移行。
 * Firestore パス: clientLogs/{logId}
 *
 * Firestore TTL ポリシー（createdAt フィールド、30日）で自動削除を設定推奨。
 */

import { Timestamp } from 'firebase-admin/firestore';
import { db, clientLogsCollection } from './client.js';
import { logger } from '../../utils/logger.js';

// ==========================================
// 型定義
// ==========================================

interface ClientLogEntry {
  level: string;
  category: string;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

interface ClientLogDoc {
  userId: string | null;
  sessionId: string;
  level: string;
  category: string;
  message: string;
  context: string | null;
  userAgent: string;
  clientTimestamp: string;
  createdAt: Timestamp;
}

// ==========================================
// 操作
// ==========================================

/**
 * クライアントログを一括挿入
 * Firestore batch write は最大500件/バッチ
 */
export async function insertClientLogs(
  logs: ClientLogEntry[],
  userId: string | null,
  sessionId: string,
  userAgent: string,
): Promise<number> {
  if (logs.length === 0) return 0;

  const now = Timestamp.now();
  let count = 0;

  // 500件ずつバッチ処理
  const BATCH_LIMIT = 500;
  for (let i = 0; i < logs.length; i += BATCH_LIMIT) {
    const chunk = logs.slice(i, i + BATCH_LIMIT);
    const batch = db.batch();

    for (const entry of chunk) {
      try {
        const ref = clientLogsCollection.doc();
        const docData: ClientLogDoc = {
          userId,
          sessionId,
          level: entry.level,
          category: entry.category,
          message: entry.message,
          context: entry.context ? JSON.stringify(entry.context) : null,
          userAgent,
          clientTimestamp: entry.timestamp,
          createdAt: now,
        };
        batch.set(ref, docData);
        count++;
      } catch (err) {
        logger.warn(
          'Failed to prepare log entry:',
          err instanceof Error ? err.message : 'Unknown error',
        );
      }
    }

    await batch.commit();
  }

  return count;
}

/**
 * 古いログを削除（ローテーション）
 * Firestore TTL ポリシーで自動化が推奨だが、手動削除も提供。
 * @param daysToKeep 保持する日数（デフォルト30日）
 * @returns 削除したログの件数
 */
export async function cleanupOldLogs(daysToKeep = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

  let totalDeleted = 0;

  // Firestore は一度に大量削除できないのでページング
  const BATCH_LIMIT = 500;
  let hasMore = true;

  while (hasMore) {
    const snapshot = await clientLogsCollection
      .where('createdAt', '<', cutoffTimestamp)
      .limit(BATCH_LIMIT)
      .get();

    if (snapshot.empty) {
      hasMore = false;
      break;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    totalDeleted += snapshot.size;

    if (snapshot.size < BATCH_LIMIT) {
      hasMore = false;
    }
  }

  logger.info(`Cleaned up ${totalDeleted} old client logs`);
  return totalDeleted;
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
  const snapshot = await clientLogsCollection.get();

  const byLevel: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  let last24Hours = 0;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  for (const doc of snapshot.docs) {
    const data = doc.data() as ClientLogDoc;

    byLevel[data.level] = (byLevel[data.level] ?? 0) + 1;
    byCategory[data.category] = (byCategory[data.category] ?? 0) + 1;

    if (data.createdAt.toDate() > yesterday) {
      last24Hours++;
    }
  }

  return {
    totalLogs: snapshot.size,
    byLevel,
    byCategory,
    last24Hours,
  };
}
