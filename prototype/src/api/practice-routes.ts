/**
 * 練習問題 API エンドポイント
 * AI 問題生成・回答評価・Level 制約付き rankUp
 *
 * 設計書: docs/planning/mastery-assessment-implementation-plan.md
 */

import express, { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { validateToken } from '../services/user-service.js';
import {
  generateFigure,
  evaluateAnswer,
  findSkillDefinition,
  needsFigure,
} from '../services/problem-generation-service.js';
import { getProblemFromPoolOrGenerate } from '../services/problem-pool-service.js';
// Note: skill-card-service.ts の acquireCard / getSkillMasteryInfo は旧方式で廃止済み
// 画像抽出関連の関数は Phase 3 で technique-service.ts にリネーム予定
import { createProblemAttempt } from '../data/firestore/problem-attempt-repository.js';
import {
  findTechniqueByPattern,
  findTechniquesByParentSkill,
  createTechnique,
} from '../data/firestore/technique-repository.js';
import type { ProblemLevel, GeneratedProblem, EvaluateAnswerRequest, DifficultyMode } from '../types/practice.js';
import { getRequiredLevelForRank, getBasicLevel, canRankUp } from '../types/practice.js';
import type { ImageContent } from '../types/chat.js';
import { getStudentModel, updateStudentModel } from '../services/student-model-service.js';
import { processSkillUpdate, rankUpSkill } from '../services/skill-recommendation-service.js';
import { getSkillById } from '../data/skill-definitions.js';
import {
  generateSkipChallenge,
  evaluateSkipChallenge,
  type SkipTargetSkill,
} from '../services/skip-challenge-service.js';

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
// POST /api/practice/generate
// 問題を生成する
// ================================

interface GenerateRequestBody {
  skillId: string;
  level?: ProblemLevel;
}

router.post(
  '/generate',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { skillId, level: requestedLevel } = req.body as GenerateRequestBody;

      if (!skillId) {
        res.status(400).json({
          success: false,
          error: 'skillId が必要です',
        });
        return;
      }

      // スキル定義の存在確認
      const skillDef = findSkillDefinition(skillId);
      if (!skillDef) {
        res.status(404).json({
          success: false,
          error: `スキルが見つかりません: ${skillId}`,
        });
        return;
      }

      // Level を決定: 指定があればそれを使い、なければ rank から自動決定
      let level: ProblemLevel;
      if (requestedLevel) {
        level = requestedLevel;
      } else {
        const studentModel = await getStudentModel(userId);
        const maxRank = studentModel?.skillMastery[skillId]?.rank ?? 0;
        level = getRequiredLevelForRank(maxRank);
      }

      logger.info(`Generating problem: skill=${skillId}, level=${level}, user=${userId}`);

      const result = await getProblemFromPoolOrGenerate(skillId, level, userId);

      res.json({
        success: true,
        data: {
          problem: result.problem,
          recommendedLevel: level,
          needsFigure: needsFigure(skillId),
          source: result.source,
          problemPoolId: result.problemPoolId,
        },
      });
    } catch (error) {
      logger.error('Error generating problem:', error);
      const message = error instanceof Error ? error.message : '問題の生成に失敗しました';
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  },
);

// ================================
// POST /api/practice/generate-figure
// 問題に対する図を Flash で生成する
// ================================

interface GenerateFigureRequestBody {
  problem: GeneratedProblem;
}

router.post(
  '/generate-figure',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { problem } = req.body as GenerateFigureRequestBody;

      if (!problem?.skillId || !problem?.questionText) {
        res.status(400).json({
          success: false,
          error: 'problem が必要です',
        });
        return;
      }

      logger.info(`Generating figure for skill=${problem.skillId}`);

      const figure = await generateFigure(problem);

      res.json({
        success: true,
        data: { figure: figure ?? null },
      });
    } catch (error) {
      logger.error('Error generating figure:', error);
      const message = error instanceof Error ? error.message : '図の生成に失敗しました';
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  },
);

// ================================
// POST /api/practice/evaluate
// 回答を評価し、条件を満たせば rankUp する
// ================================

interface EvaluateRequestBody {
  skillId: string;
  level: ProblemLevel;
  problem: GeneratedProblem;
  userAnswer: string | ImageContent;
  difficulty?: DifficultyMode;
  problemPoolId?: string;
}

router.post(
  '/evaluate',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { skillId, level, problem, userAnswer, difficulty, problemPoolId } = req.body as EvaluateRequestBody;

      if (!skillId || !level || !problem || userAnswer === undefined) {
        res.status(400).json({
          success: false,
          error: 'skillId, level, problem, userAnswer が必要です',
        });
        return;
      }

      const isBasicMode = difficulty === 'basic';
      logger.info(`Evaluating answer: skill=${skillId}, level=${level}, difficulty=${difficulty ?? 'challenge'}, user=${userId}`);

      // 1. AI で回答を評価
      const evaluation = await evaluateAnswer(problem, userAnswer);

      // 2. 問題回答記録を作成（problemPoolId との紐付け）
      try {
        await createProblemAttempt({
          id: uuidv4(),
          userId,
          skillId,
          isCorrect: evaluation.isCorrect,
          problemSource: 'ai_generated',
          problemIdentifier: problemPoolId ?? null,
        });
      } catch (err) {
        logger.warn('Failed to record problem attempt:', err);
      }

      // 3. confidence=low なら rankUp せずに結果のみ返す
      if (evaluation.confidence === 'low') {
        res.json({
          success: true,
          data: {
            evaluation,
            cardUpdate: null,
            skillMastery: null,
          },
        });
        return;
      }

      // 3. 正解 + Level 制約を満たす場合のみ rankUp
      let cardUpdate = null;
      let skillMastery = null;
      let existingCard = null as Awaited<ReturnType<typeof findTechniqueByPattern>>;
      let skillMastered: { skillId: string; skillName: string } | null = null;

      if (evaluation.isCorrect) {
        // rank を StudentModel から読む
        const studentModel = await getStudentModel(userId);
        const currentRank = studentModel?.skillMastery[skillId]?.rank ?? 0;
        const shouldRankUp = !isBasicMode && canRankUp(currentRank, level);

        // テクニック（パターン）の既存チェック — techniqueInfo と rankUp 両方で使う
        existingCard = await findTechniqueByPattern(userId, skillId, problem.targetPattern);

        if (shouldRankUp && studentModel) {
          const result = rankUpSkill(studentModel, skillId);
          await updateStudentModel(result.updatedModel);

          cardUpdate = {
            card: null,
            isNewAcquisition: result.newRank === 1,
            isRankUp: true,
          };

          if (result.mastered) {
            logger.info(`Skill mastered via practice: ${skillId}`);
            skillMastered = {
              skillId,
              skillName: getSkillById(skillId)?.name || skillId,
            };
          }

          logger.info(`Skill ${skillId} rank up → rank ${result.newRank}`);

          // メタデータ保存: AI 生成 cardInfo を SkillCard として永続化
          if (!existingCard) {
            await createTechnique({
              id: uuidv4(),
              userId,
              parentSkillId: skillId,
              pattern: problem.targetPattern,
              techniques: [],
              difficulty: level,
              rarity: 'common',
              cardName: problem.cardInfo.cardName,
              trigger: problem.cardInfo.trigger,
              method: problem.cardInfo.method,
              tip: null,
              status: 'identified',
            });
          }
        }
      }

      res.json({
        success: true,
        data: {
          evaluation,
          cardUpdate,
          skillMastery,
          skillMastered,
          techniqueInfo: evaluation.isCorrect ? {
            name: problem.cardInfo.cardName,
            trigger: problem.cardInfo.trigger,
            method: problem.cardInfo.method,
            pattern: problem.targetPattern,
            isNewPattern: !existingCard,
          } : null,
        },
      });
    } catch (error) {
      logger.error('Error evaluating answer:', error);
      const message = error instanceof Error ? error.message : '回答の評価に失敗しました';
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  },
);

// ================================
// POST /api/practice/generate-stream
// SSE で問題 + 図を1コネクションで配信
// ================================

interface GenerateStreamRequestBody {
  skillId: string;
  level?: ProblemLevel;
  difficulty?: DifficultyMode;
}

router.post(
  '/generate-stream',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const { skillId, level: requestedLevel, difficulty } = req.body as GenerateStreamRequestBody;

    if (!skillId) {
      res.status(400).json({
        success: false,
        error: 'skillId が必要です',
      });
      return;
    }

    const skillDef = findSkillDefinition(skillId);
    if (!skillDef) {
      res.status(404).json({
        success: false,
        error: `スキルが見つかりません: ${skillId}`,
      });
      return;
    }

    // SSE ヘッダー設定
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // タイムアウト 60 秒
    req.setTimeout(60_000);

    // クライアント切断を検知
    // NOTE: req.on('close') ではなく res.on('close') を使う。
    // express.json() がリクエストボディを消費すると req (IncomingMessage) の
    // 'close' が即座に発火し、クライアント接続中でも clientDisconnected=true になるため。
    let clientDisconnected = false;
    res.on('close', () => {
      clientDisconnected = true;
    });

    const sendEvent = (event: string, data: unknown): void => {
      if (clientDisconnected) return;
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      // Level + Model 決定
      const studentModel = await getStudentModel(userId);
      const maxRank = studentModel?.skillMastery[skillId]?.rank ?? 0;

      let level: ProblemLevel;
      let model: 'pro' | 'flash' | undefined;

      if (requestedLevel) {
        level = requestedLevel;
      } else if (difficulty === 'basic') {
        level = getBasicLevel(maxRank);
        model = 'flash';
      } else {
        // challenge（デフォルト）: 既存動作 = Pro モデル
        level = getRequiredLevelForRank(maxRank);
      }

      logger.info(`[SSE] Generating problem: skill=${skillId}, level=${level}, difficulty=${difficulty ?? 'challenge'}, model=${model ?? 'pro'}, user=${userId}`);

      // 1. 問題生成（プール優先 + ユーザー別未出題優先）
      const result = await getProblemFromPoolOrGenerate(
        skillId,
        level,
        userId,
        model ? { model } : undefined,
      );
      if (clientDisconnected) return;

      const figureNeeded = needsFigure(skillId);

      sendEvent('problem', {
        problem: result.problem,
        recommendedLevel: level,
        difficulty: difficulty ?? 'challenge',
        needsFigure: figureNeeded,
        source: result.source,
        problemPoolId: result.problemPoolId,
      });

      // 2. 図生成（必要な場合のみ）
      if (figureNeeded) {
        const figure = await generateFigure(result.problem);
        if (clientDisconnected) return;

        sendEvent('figure', { figure: figure ?? null });
      }
    } catch (error) {
      logger.error('[SSE] Error in generate-stream:', error);
      const message = error instanceof Error ? error.message : '問題の生成に失敗しました';
      sendEvent('error', { message });
    } finally {
      if (!clientDisconnected) {
        res.end();
      }
    }
  },
);

// ================================
// POST /api/practice/skip-challenge
// スキップ宣言: 単元の試問を生成
// ================================

interface SkipChallengeRequestBody {
  unitCategory: string;
  unitSubcategory: string;
}

router.post(
  '/skip-challenge',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { unitCategory, unitSubcategory } = req.body as SkipChallengeRequestBody;

      if (!unitCategory || !unitSubcategory) {
        res.status(400).json({
          success: false,
          error: 'unitCategory と unitSubcategory が必要です',
        });
        return;
      }

      logger.info(`[Skip] Generating challenge: ${unitCategory} > ${unitSubcategory}, user=${userId}`);

      const result = await generateSkipChallenge(userId, unitCategory, unitSubcategory);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('[Skip] Error generating skip challenge:', error);
      const message = error instanceof Error ? error.message : 'スキップ試問の生成に失敗しました';
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  },
);

// ================================
// POST /api/practice/skip-evaluate
// スキップ宣言: 試問の採点 + mastered 一括更新
// ================================

interface SkipEvaluateRequestBody {
  targetSkills: SkipTargetSkill[];
  problem: GeneratedProblem;
  userAnswer: string | ImageContent;
}

router.post(
  '/skip-evaluate',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { targetSkills, problem, userAnswer } = req.body as SkipEvaluateRequestBody;

      if (!targetSkills || !problem || userAnswer === undefined) {
        res.status(400).json({
          success: false,
          error: 'targetSkills, problem, userAnswer が必要です',
        });
        return;
      }

      logger.info(`[Skip] Evaluating skip challenge: ${targetSkills.length} skills, user=${userId}`);

      const result = await evaluateSkipChallenge(userId, targetSkills, problem, userAnswer);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('[Skip] Error evaluating skip challenge:', error);
      const message = error instanceof Error ? error.message : 'スキップ試問の採点に失敗しました';
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  },
);

// ================================
// GET /api/practice/techniques/:skillId
// スキルに紐づくテクニック一覧を取得
// ================================

router.get(
  '/techniques/:skillId',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const { skillId } = req.params;

    if (!skillId) {
      res.status(400).json({ success: false, error: 'skillId is required' });
      return;
    }

    try {
      const techniques = await findTechniquesByParentSkill(userId, skillId);
      res.json({
        success: true,
        data: {
          techniques: techniques.map(t => ({
            name: t.cardName,
            pattern: t.pattern,
            trigger: t.trigger,
            method: t.method,
            tip: t.tip,
          })),
        },
      });
    } catch (error) {
      logger.error('Error fetching techniques:', error);
      res.status(500).json({ success: false, error: 'テクニック一覧の取得に失敗しました' });
    }
  },
);

export default router;
