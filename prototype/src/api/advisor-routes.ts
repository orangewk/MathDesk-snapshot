/**
 * アドバイザー API エンドポイント
 * ガイドAI（津田先生）による学習ナビゲーション
 *
 * 設計書: docs/planning/learning-navigation.md (Phase 2)
 */

import express, { Router, Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { validateToken } from '../services/user-service.js';
import {
  getDailyAdvice,
  analyzeStumble,
} from '../services/advisor-service.js';

// ================================
// 認証ミドルウェア（既存パターン踏襲）
// ================================

interface AuthenticatedRequest extends Request {
  userId?: string;
  userNickname?: string;
}

async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: '認証が必要です',
    });
    return;
  }

  const token = authHeader.substring(7);
  const result = await validateToken(token);

  if ('error' in result) {
    res.status(401).json({
      success: false,
      error: result.error,
    });
    return;
  }

  req.userId = result.user.id;
  req.userNickname = result.user.nickname;
  next();
}

// ================================
// ルーター設定
// ================================

const router: Router = express.Router();
router.use(authMiddleware);

// ================================
// GET /api/advisor/daily
// 今日のオススメ学習アドバイス
// ================================

router.get(
  '/daily',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;

      logger.info(`[Advisor] GET /daily for user ${userId}`);

      const advice = await getDailyAdvice(userId);

      res.json({
        success: true,
        data: advice,
      });
    } catch (error) {
      logger.error('[Advisor] Error getting daily advice:', error);
      const message = error instanceof Error ? error.message : 'アドバイスの取得に失敗しました';
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  },
);

// ================================
// POST /api/advisor/analyze-stumble
// つまずき分析
// ================================

interface AnalyzeStumbleRequestBody {
  skillId: string;
  feedback: string;
  missedCheckPoints: string[];
}

router.post(
  '/analyze-stumble',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { skillId, feedback, missedCheckPoints } = req.body as AnalyzeStumbleRequestBody;

      if (!skillId) {
        res.status(400).json({
          success: false,
          error: 'skillId が必要です',
        });
        return;
      }

      logger.info(`[Advisor] POST /analyze-stumble for user ${userId}, skill ${skillId}`);

      const analysis = await analyzeStumble(
        userId,
        skillId,
        feedback ?? '',
        missedCheckPoints ?? [],
      );

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      logger.error('[Advisor] Error analyzing stumble:', error);
      const message = error instanceof Error ? error.message : 'つまずき分析に失敗しました';
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  },
);

export default router;
