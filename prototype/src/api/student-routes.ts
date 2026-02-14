// FILE: prototype/src/api/student-routes.ts
// ---------------------------------------------------------
/**
 * Student Model APIエンドポイント
 * Phase 2A - 学習者モデルのREST API
 * * 設計書: plans/task1-student-model-design.md
 */

import express_student, { Router as StudentRouter, Request as StudentRequest, Response as StudentResponse, NextFunction as StudentNextFunction } from 'express';
import { logger } from '../utils/logger.js';
import {
  getOrCreateStudentModel,
  updateSkillMastery,
  recordMistake,
  setSelfAssessment,
  startOnboarding,
  completeOnboarding,
  getLearningSummary,
  recordSelfDetectedError,
  recordAIAssistedError,
  recordPractice,
} from '../services/student-model-service.js';
import { validateToken as validateTokenStudent } from '../services/user-service.js';
import type { MistakeType, SelfAssessment, SkillStatus, GradeLevel, StudiedSubject, StudyGoal } from '../types/student-model.js';
import type { OnboardingData } from '../services/student-model-service.js';

// ================================
// 認証ミドルウェア
// ================================

/**
 * 認証済みリクエストの拡張
 */
interface AuthenticatedRequest extends StudentRequest {
  userId?: string;
  userNickname?: string;
}

/**
 * 認証ミドルウェア
 * Authorization: Bearer {token} ヘッダーを検証
 */
async function authMiddlewareStudent(
  req: AuthenticatedRequest,
  res: StudentResponse,
  next: StudentNextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: '認証が必要です',
    });
    return;
  }

  const token = authHeader.substring(7); // "Bearer " を除去
  const result = await validateTokenStudent(token);

  if ('error' in result) {
    res.status(401).json({
      success: false,
      error: result.error,
    });
    return;
  }

  // リクエストにユーザー情報を付加
  req.userId = result.user.id;
  req.userNickname = result.user.nickname;

  next();
}

// ================================
// ルーター設定
// ================================

const router_student: StudentRouter = express_student.Router();

// 全エンドポイントに認証を適用
router_student.use(authMiddlewareStudent);

// ================================
// Student Model エンドポイント
// ================================

/**
 * GET /api/student
 * Student Modelを取得
 */
router_student.get('/', async (req: AuthenticatedRequest, res: StudentResponse) => {
  try {
    const userId = req.userId!;
    const studentModel = await getOrCreateStudentModel(userId);

    res.json({
      success: true,
      studentModel,
    });
  } catch (error) {
    logger.error('Error getting student model:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      success: false,
      error: '学習者モデルの取得に失敗しました',
    });
  }
});

/**
 * GET /api/student/summary
 * 学習サマリーを取得（ダッシュボード用）
 */
router_student.get('/summary', async (req: AuthenticatedRequest, res: StudentResponse) => {
  try {
    const userId = req.userId!;
    const summary = await getLearningSummary(userId);

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    logger.error('Error getting learning summary:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      success: false,
      error: '学習サマリーの取得に失敗しました',
    });
  }
});

// ================================
// オンボーディング エンドポイント
// ================================

/**
 * POST /api/student/onboarding/start
 * オンボーディングを開始
 */
router_student.post('/onboarding/start', async (req: AuthenticatedRequest, res: StudentResponse) => {
  try {
    const userId = req.userId!;
    const studentModel = await startOnboarding(userId);

    res.json({
      success: true,
      onboarding: studentModel.onboarding,
    });
  } catch (error) {
    logger.error('Error starting onboarding:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      success: false,
      error: 'オンボーディングの開始に失敗しました',
    });
  }
});

/**
 * POST /api/student/onboarding/self-assessment
 * 自己申告レベルを設定
 */
router_student.post('/onboarding/self-assessment', async (req: AuthenticatedRequest, res: StudentResponse) => {
  try {
    const userId = req.userId!;
    const { selfAssessment } = req.body as { selfAssessment: SelfAssessment };

    // バリデーション
    const validValues: SelfAssessment[] = ['struggling', 'basic-ok', 'want-more', null];
    if (!validValues.includes(selfAssessment)) {
      res.status(400).json({
        success: false,
        error: '無効な自己申告レベルです',
      });
      return;
    }

    const studentModel = await setSelfAssessment(userId, selfAssessment);

    res.json({
      success: true,
      onboarding: studentModel.onboarding,
    });
  } catch (error) {
    logger.error('Error setting self-assessment:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      success: false,
      error: '自己申告レベルの設定に失敗しました',
    });
  }
});

/**
 * POST /api/student/onboarding/complete
 * オンボーディングを完了（問診票データ付き）
 */
router_student.post('/onboarding/complete', async (req: AuthenticatedRequest, res: StudentResponse) => {
  try {
    const userId = req.userId!;
    const { nickname, gradeLevel, studiedSubjects, selfAssessment, studyGoal } = req.body as OnboardingData;

    // バリデーション
    const validGradeLevels: GradeLevel[] = ['中1', '中2', '中3', '高1', '高2', '高3', '既卒'];
    if (gradeLevel && !validGradeLevels.includes(gradeLevel)) {
      res.status(400).json({ success: false, error: '無効な学年です' });
      return;
    }

    const validSubjects: StudiedSubject[] = ['基礎', '数学I', '数学A', '数学II', '数学B', '数学C'];
    if (studiedSubjects && !studiedSubjects.every(s => validSubjects.includes(s))) {
      res.status(400).json({ success: false, error: '無効な履修科目です' });
      return;
    }

    const validAssessments: SelfAssessment[] = ['struggling', 'basic-ok', 'want-more', null];
    if (selfAssessment !== undefined && !validAssessments.includes(selfAssessment)) {
      res.status(400).json({ success: false, error: '無効な自己評価です' });
      return;
    }

    const validGoals: StudyGoal[] = ['regular-exam', 'common-test', 'university-exam', 'relearning'];
    if (studyGoal && !validGoals.includes(studyGoal)) {
      res.status(400).json({ success: false, error: '無効な学習目標です' });
      return;
    }

    const studentModel = await completeOnboarding(userId, {
      nickname,
      gradeLevel,
      studiedSubjects,
      selfAssessment,
      studyGoal,
    });

    res.json({
      success: true,
      onboarding: studentModel.onboarding,
    });
  } catch (error) {
    logger.error('Error completing onboarding:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      success: false,
      error: 'オンボーディングの完了に失敗しました',
    });
  }
});

// ================================
// スキル習熟度 エンドポイント
// ================================

/**
 * GET /api/student/skill/:skillId
 * 特定スキルの習熟度を取得
 */
router_student.get('/skill/:skillId', async (req: AuthenticatedRequest, res: StudentResponse) => {
  try {
    const userId = req.userId!;
    const { skillId } = req.params;

    const studentModel = await getOrCreateStudentModel(userId);
    const skillMastery = studentModel.skillMastery[skillId];

    if (!skillMastery) {
      res.status(404).json({
        success: false,
        error: 'スキル情報が見つかりません',
      });
      return;
    }

    res.json({
      success: true,
      skillMastery,
    });
  } catch (error) {
    logger.error('Error getting skill mastery:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      success: false,
      error: 'スキル習熟度の取得に失敗しました',
    });
  }
});

/**
 * PATCH /api/student/skill/:skillId
 * 特定スキルの習熟度を更新
 */
router_student.patch('/skill/:skillId', async (req: AuthenticatedRequest, res: StudentResponse) => {
  try {
    const userId = req.userId!;
    const { skillId } = req.params;
    const update = req.body as {
      status?: SkillStatus;
      masteryLevel?: number;
      attempts?: number;
    };

    // バリデーション
    if (update.status) {
      const validStatuses: SkillStatus[] = ['locked', 'unlocked', 'learning', 'mastered', 'perfect'];
      if (!validStatuses.includes(update.status)) {
        res.status(400).json({
          success: false,
          error: '無効なスキルステータスです',
        });
        return;
      }
    }

    if (update.masteryLevel !== undefined) {
      if (typeof update.masteryLevel !== 'number' || update.masteryLevel < 0 || update.masteryLevel > 100) {
        res.status(400).json({
          success: false,
          error: '習熟度レベルは0-100の数値で指定してください',
        });
        return;
      }
    }

    const studentModel = await updateSkillMastery(userId, skillId, update);

    res.json({
      success: true,
      skillMastery: studentModel.skillMastery[skillId],
    });
  } catch (error) {
    logger.error('Error updating skill mastery:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      success: false,
      error: 'スキル習熟度の更新に失敗しました',
    });
  }
});

/**
 * POST /api/student/skill/:skillId/practice
 * 練習記録（LastPracticed更新）
 */
router_student.post('/skill/:skillId/practice', async (req: AuthenticatedRequest, res: StudentResponse) => {
  try {
    const userId = req.userId!;
    const { skillId } = req.params;

    const studentModel = await recordPractice(userId, skillId);

    res.json({
      success: true,
      skillMastery: studentModel.skillMastery[skillId],
    });
  } catch (error) {
    logger.error('Error recording practice:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      success: false,
      error: '練習の記録に失敗しました',
    });
  }
});

// ================================
// ミスパターン エンドポイント
// ================================

/**
 * POST /api/student/mistake
 * ミスを記録
 */
router_student.post('/mistake', async (req: AuthenticatedRequest, res: StudentResponse) => {
  try {
    const userId = req.userId!;
    const { mistakeType, example } = req.body as {
      mistakeType: MistakeType;
      example: {
        questionId: string;
        skillId: string;
        description: string;
        userWork: string;
        correction: string;
      };
    };

    // バリデーション
    const validMistakeTypes: MistakeType[] = [
      'transcription', 'alignment', 'strategy', 'formula-selection',
      'condition-check', 'calculation', 'sign-error', 'distributive-law',
      'fraction-operation', 'order-of-operations',
    ];

    if (!validMistakeTypes.includes(mistakeType)) {
      res.status(400).json({
        success: false,
        error: '無効なミスタップです',
      });
      return;
    }

    if (!example || !example.questionId || !example.skillId || !example.description) {
      res.status(400).json({
        success: false,
        error: 'ミス例の情報が不足しています',
      });
      return;
    }

    const studentModel = await recordMistake(userId, mistakeType, example);

    res.json({
      success: true,
      mistakePatterns: studentModel.mistakePatterns,
    });
  } catch (error) {
    logger.error('Error recording mistake:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      success: false,
      error: 'ミスの記録に失敗しました',
    });
  }
});

// ================================
// 自立度 エンドポイント
// ================================

/**
 * POST /api/student/independence/self-detected
 * 自力でエラーを検出した場合
 */
router_student.post('/independence/self-detected', async (req: AuthenticatedRequest, res: StudentResponse) => {
  try {
    const userId = req.userId!;
    const studentModel = await recordSelfDetectedError(userId);

    res.json({
      success: true,
      independenceMetrics: studentModel.independenceMetrics,
    });
  } catch (error) {
    logger.error('Error recording self-detected error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      success: false,
      error: '自己検出エラーの記録に失敗しました',
    });
  }
});

/**
 * POST /api/student/independence/ai-assisted
 * AI指摘後にエラーに気づいた場合
 */
router_student.post('/independence/ai-assisted', async (req: AuthenticatedRequest, res: StudentResponse) => {
  try {
    const userId = req.userId!;
    const studentModel = await recordAIAssistedError(userId);

    res.json({
      success: true,
      independenceMetrics: studentModel.independenceMetrics,
    });
  } catch (error) {
    logger.error('Error recording ai-assisted error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      success: false,
      error: 'AI支援エラーの記録に失敗しました',
    });
  }
});

export default router_student;