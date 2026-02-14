/**
 * クライアントログAPIルーター
 * フロントエンドからのログをバッチ受信
 */

import { Router, Request, Response } from 'express';
import { validateToken } from '../services/user-service.js';
import { insertClientLogs } from '../services/client-log-db-service.js';
import { logger } from '../utils/logger.js';

const router = Router();

// 型定義
interface ClientLogEntry {
  level: 'error' | 'warn' | 'info';
  category: string;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

interface LogBatchRequest {
  logs: ClientLogEntry[];
  sessionId: string;
  userAgent: string;
}

// バリデーション定数
const VALID_LEVELS = ['error', 'warn', 'info'];
const VALID_CATEGORIES = [
  'api_error', 'network_error', 'uncaught_error',
  'learning_start', 'skill_complete', 'session_start', 'session_end'
];
const MAX_LOGS_PER_BATCH = 100;
const MAX_MESSAGE_LENGTH = 500;

function validateLogEntry(entry: unknown): entry is ClientLogEntry {
  if (!entry || typeof entry !== 'object') return false;

  const log = entry as Record<string, unknown>;

  return (
    typeof log.level === 'string' &&
    VALID_LEVELS.includes(log.level) &&
    typeof log.category === 'string' &&
    VALID_CATEGORIES.includes(log.category) &&
    typeof log.message === 'string' &&
    log.message.length <= MAX_MESSAGE_LENGTH &&
    typeof log.timestamp === 'string'
  );
}

/**
 * POST /api/logs/batch
 * クライアントログをバッチ受信
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { logs, sessionId, userAgent } = req.body as LogBatchRequest;

    // バリデーション
    if (!Array.isArray(logs) || logs.length === 0) {
      res.status(400).json({
        success: false,
        accepted: 0,
        error: 'logs is required and must be a non-empty array'
      });
      return;
    }

    if (logs.length > MAX_LOGS_PER_BATCH) {
      res.status(400).json({
        success: false,
        accepted: 0,
        error: `Maximum ${MAX_LOGS_PER_BATCH} logs per batch`
      });
      return;
    }

    if (!sessionId || typeof sessionId !== 'string') {
      res.status(400).json({
        success: false,
        accepted: 0,
        error: 'sessionId is required'
      });
      return;
    }

    // 認証チェック（オプション）
    let userId: string | null = null;
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const result = await validateToken(token);
      if (result.success) {
        userId = result.user.id;
      }
    }

    // 有効なログのみフィルタリング
    const validLogs = logs.filter(validateLogEntry);

    if (validLogs.length === 0) {
      res.status(400).json({
        success: false,
        accepted: 0,
        error: 'No valid log entries'
      });
      return;
    }

    // DB保存
    const accepted = insertClientLogs(
      validLogs,
      userId,
      sessionId,
      (userAgent || '').slice(0, 200)
    );

    res.json({
      success: true,
      accepted,
    });

  } catch (error) {
    logger.error('Error processing client logs:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    res.status(500).json({
      success: false,
      accepted: 0,
      error: 'Failed to process logs',
    });
  }
});

export default router;
