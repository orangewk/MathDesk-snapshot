// FILE: prototype/src/api/skill-routes.ts
// ---------------------------------------------------------
/**
 * スキルAPI ルート
 * Phase 2A - スキルマスター
 */
import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import { 
  SKILL_DEFINITIONS,
  getSkillById,
  getSkillsByCategory,
  getRootSkills,
  getSuccessorSkills,
  SkillCategory, 
} from '../data/skill-definitions.js';
import {
  BACKTRACK_RULES,
  ErrorType,
} from '../data/backtrack-rules.js';
import {
  getNextRecommendedSkills,
  getBacktrackRecommendation,
  getLearningProgressSummary,
  generateLearningPath,
  initializeSkillMastery,
} from '../services/skill-recommendation-service.js';
import { getStudentModel } from '../services/student-model-service.js';

const router_skill = Router();

// --------------------------------
// GET /api/skills - 全スキル定義を取得
// --------------------------------
router_skill.get('/', (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    let skills = SKILL_DEFINITIONS;

    // カテゴリでフィルタ
    if (category && typeof category === 'string') {
      skills = getSkillsByCategory(category as SkillCategory);
    }

    res.json({
      success: true,
      skills,
      total: skills.length
    });
  } catch (error) {
    logger.error('Error fetching skills:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      success: false,
      error: 'スキル一覧の取得に失敗しました'
    });
  }
});

// --------------------------------
// GET /api/skills/root - 前提なしスキルを取得
// --------------------------------
router_skill.get('/root', (req: Request, res: Response) => {
  try {
    const rootSkills = getRootSkills();

    res.json({
      success: true,
      skills: rootSkills,
      total: rootSkills.length
    });
  } catch (error) {
    logger.error('Error fetching root skills:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      success: false,
      error: '基礎スキルの取得に失敗しました'
    });
  }
});

// --------------------------------
// GET /api/skills/recommended - 推薦スキルを取得
// --------------------------------
router_skill.get('/recommended', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const count = parseInt(req.query.count as string) || 3;

    if (!userId) {
      // 未認証の場合は基礎スキル（前提なし）を推薦
      const rootSkills = getRootSkills()
        .filter(s => s.importance === 'core')
        .slice(0, count);

      return res.json({
        success: true,
        recommended: rootSkills.map((skill, index) => ({
          skill,
          reason: '前提知識なしで始められます。',
          priority: index + 1
        })),
        authenticated: false
      });
    }

    // 認証済みの場合はStudent Modelから推薦
    const studentModel = await getStudentModel(userId);

    if (!studentModel) {
      return res.status(404).json({
        success: false,
        error: '学習者データが見つかりません'
      });
    }

    const recommendations = getNextRecommendedSkills(studentModel, count);

    res.json({
      success: true,
      recommended: recommendations,
      authenticated: true
    });
  } catch (error) {
    logger.error('Error fetching recommended skills:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      success: false,
      error: '推薦スキルの取得に失敗しました'
    });
  }
});

// --------------------------------
// POST /api/skills/backtrack - 遡り推薦を取得
// --------------------------------
router_skill.post('/backtrack', (req: Request, res: Response) => {
  try {
    const { skillId, errorType } = req.body;

    if (!skillId || !errorType) {
      return res.status(400).json({
        success: false,
        error: 'skillId と errorType は必須です'
      });
    }

    // エラータイプの検証
    if (!['L1', 'L2', 'L3'].includes(errorType)) {
      return res.status(400).json({
        success: false,
        error: 'errorType は L1, L2, L3 のいずれかです'
      });
    }

    const recommendation = getBacktrackRecommendation(skillId, errorType as ErrorType);

    if (!recommendation) {
      return res.json({
        success: true,
        found: false,
        message: '該当する遡りルールが見つかりませんでした'
      });
    }

    res.json({
      success: true,
      found: true,
      backtrack: {
        rule: recommendation.rule,
        targetSkills: recommendation.targetSkills,
        message: recommendation.rule.message
      }
    });
  } catch (error) {
    logger.error('Error fetching backtrack recommendation:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      success: false,
      error: '遡り推薦の取得に失敗しました'
    });
  }
});

// --------------------------------
// GET /api/skills/progress - 学習進捗サマリー
// --------------------------------
router_skill.get('/progress', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '認証が必要です'
      });
    }

    const studentModel = await getStudentModel(userId);

    if (!studentModel) {
      return res.status(404).json({
        success: false,
        error: '学習者データが見つかりません'
      });
    }

    const summary = getLearningProgressSummary(studentModel);

    res.json({
      success: true,
      progress: summary
    });
  } catch (error) {
    logger.error('Error fetching progress:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      success: false,
      error: '進捗の取得に失敗しました'
    });
  }
});

// --------------------------------
// GET /api/skills/path/:targetId - 学習パス生成
// --------------------------------
router_skill.get('/path/:targetId', async (req: Request, res: Response) => {
  try {
    const { targetId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    // スキルの存在チェック
    const targetSkill = getSkillById(targetId);
    if (!targetSkill) {
      return res.status(404).json({
        success: false,
        error: '指定されたスキルが見つかりません'
      });
    }

    if (!userId) {
      // 未認証の場合は全ての前提スキルを含むパスを返す
      const path: typeof SKILL_DEFINITIONS = [];
      const visited = new Set<string>();

      function collectPrereqs(skillId: string): void {
        if (visited.has(skillId)) return;
        visited.add(skillId);

        const skill = getSkillById(skillId);
        if (!skill) return;

        for (const prereqId of skill.prerequisites) {
          collectPrereqs(prereqId);
        }

        path.push(skill);
      }

      collectPrereqs(targetId);

      return res.json({
        success: true,
        targetSkill,
        path,
        authenticated: false
      });
    }

    // 認証済みの場合は習得済みスキルを考慮
    const studentModel = await getStudentModel(userId);

    if (!studentModel) {
      return res.status(404).json({
        success: false,
        error: '学習者データが見つかりません'
      });
    }

    const path = generateLearningPath(targetId, studentModel);

    res.json({
      success: true,
      targetSkill,
      path,
      authenticated: true
    });
  } catch (error) {
    logger.error('Error generating learning path:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      success: false,
      error: '学習パスの生成に失敗しました'
    });
  }
});

// --------------------------------
// GET /api/skills/:id - 特定スキルの詳細
// --------------------------------
router_skill.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const skill = getSkillById(id);

    if (!skill) {
      return res.status(404).json({
        success: false,
        error: '指定されたスキルが見つかりません'
      });
    }

    // 後続スキルも取得
    const successors = getSuccessorSkills(id);

    // 前提スキルの詳細も取得
    const prerequisites = skill.prerequisites
      .map(prereqId => getSkillById(prereqId))
      .filter((s): s is NonNullable<typeof s> => s !== undefined);

    res.json({
      success: true,
      skill,
      prerequisites,
      successors
    });
  } catch (error) {
    logger.error('Error fetching skill:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      success: false,
      error: 'スキルの取得に失敗しました'
    });
  }
});

// --------------------------------
// GET /api/skills/rules/all - 全遡りルールを取得
// --------------------------------
router_skill.get('/rules/all', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      rules: BACKTRACK_RULES,
      total: BACKTRACK_RULES.length
    });
  } catch (error) {
    logger.error('Error fetching backtrack rules:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({
      success: false,
      error: '遡りルールの取得に失敗しました'
    });
  }
});

export default router_skill;