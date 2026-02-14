/**
 * テクニック API エンドポイント
 * 画像からのテクニック抽出
 *
 * 旧: skill-card-routes.ts の POST /extract を分離・リネーム (#143)
 */

import express, { Router, Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { validateToken } from '../services/user-service.js';
import { extractTechniquesFromImage } from '../services/technique-extraction-service.js';

// ================================
// 認証ミドルウェア
// ================================

interface AuthenticatedRequest extends Request {
  userId?: string;
  userNickname?: string;
}

async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '認証が必要です' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const result = await validateToken(token);

  if ('error' in result) {
    res.status(401).json({ success: false, error: result.error });
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
// 画像からテクニックを抽出
// POST /api/techniques/extract-from-image
// ================================

interface ExtractRequestBody {
  imageData: string;
  mediaType: string;
}

router.post(
  '/extract-from-image',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { imageData, mediaType } = req.body as ExtractRequestBody;

      if (!imageData || !mediaType) {
        res.status(400).json({
          success: false,
          error: '画像データとメディアタイプが必要です',
        });
        return;
      }

      logger.info(`Extracting techniques for user ${userId}`);

      const result = await extractTechniquesFromImage({
        userId,
        imageData,
        mediaType,
      });

      if (result.error) {
        res.status(400).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.json({
        success: true,
        data: {
          techniques: result.techniques,
          problemType: result.problemType,
          overallDifficulty: result.overallDifficulty,
        },
      });
    } catch (error) {
      logger.error('Error extracting techniques:', error);
      res.status(500).json({
        success: false,
        error: 'テクニックの抽出に失敗しました',
      });
    }
  }
);

export default router;
