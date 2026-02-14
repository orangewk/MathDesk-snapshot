/**
 * スキップ宣言サービス
 * 単元ごとに一問試問でスキップ（mastered 一括更新）する機能
 *
 * 設計書: docs/planning/learning-navigation.md (Phase 3)
 */

import {
  SKILL_DEFINITIONS,
  type SkillDefinition,
} from '../data/skill-definitions.js';
import { sendMessage } from '../api/google-genai.js';
import { parseProblemResponse } from './problem-generation-service.js';
import { evaluateAnswer } from './problem-generation-service.js';
import { getOrCreateStudentModel, updateStudentModel } from './student-model-service.js';
import { processSkillUpdate, updateSkillUnlockStatus } from './skill-recommendation-service.js';
import { createInitialSkillMastery } from '../types/student-model.js';
import type { GeneratedProblem, ProblemLevel } from '../types/practice.js';
import type { ImageContent } from '../types/chat.js';
import { logger } from '../utils/logger.js';

// ------------------------------------
// 型定義
// ------------------------------------

export interface SkipChallengeResult {
  problem: GeneratedProblem;
  targetSkills: SkipTargetSkill[];
}

export interface SkipTargetSkill {
  skillId: string;
  skillName: string;
}

export interface SkipEvaluateResult {
  passed: boolean;
  evaluation: {
    isCorrect: boolean;
    confidence: string;
    feedback: string;
  };
  skippedSkills: SkipTargetSkill[];
}

// ------------------------------------
// スキップ対象の単元スキルを取得
// ------------------------------------

/**
 * 単元（category + subcategory）に属するスキップ対象スキルを取得
 * - importance: 'advanced' は除外
 * - 既に全て mastered のスキルは除外
 */
export async function getSkipTargetSkills(
  userId: string,
  unitCategory: string,
  unitSubcategory: string,
): Promise<SkipTargetSkill[]> {
  const studentModel = await getOrCreateStudentModel(userId);

  return SKILL_DEFINITIONS
    .filter((s) =>
      s.category === unitCategory &&
      s.subcategory === unitSubcategory &&
      s.importance !== 'advanced',
    )
    .filter((s) => {
      const status = studentModel.skillMastery[s.id]?.status;
      return status !== 'mastered' && status !== 'perfect';
    })
    .map((s) => ({ skillId: s.id, skillName: s.name }));
}

// ------------------------------------
// スキップ試問の生成
// ------------------------------------

/**
 * 単元の総合問題を生成する（Level 3 相当）
 */
export async function generateSkipChallenge(
  userId: string,
  unitCategory: string,
  unitSubcategory: string,
): Promise<SkipChallengeResult> {
  const targetSkills = await getSkipTargetSkills(userId, unitCategory, unitSubcategory);

  if (targetSkills.length === 0) {
    throw new Error('この単元にスキップ対象のスキルがありません（全て習得済み）');
  }

  // 単元のスキル定義を取得
  const skillDefs = targetSkills
    .map((t) => SKILL_DEFINITIONS.find((s) => s.id === t.skillId))
    .filter((s): s is SkillDefinition => s !== undefined);

  const skillNames = skillDefs.map((s) => s.name).join('、');
  const skillKeywords = skillDefs.flatMap((s) => s.keywords).slice(0, 10).join('、');

  const systemPrompt = buildSkipChallengePrompt(
    unitCategory,
    unitSubcategory,
    skillNames,
    skillKeywords,
  );

  const response = await sendMessage({
    messages: [{ role: 'user', content: 'スキップ試問を1問生成してください。' }],
    system: systemPrompt,
    maxTokens: 8192,
  });

  // 代表スキルIDを使ってパース
  const representativeSkillId = targetSkills[0].skillId;
  const problem = parseProblemResponse(response.content, representativeSkillId, 3 as ProblemLevel);

  if (!problem) {
    throw new Error('スキップ試問の生成に失敗しました');
  }

  return { problem, targetSkills };
}

// ------------------------------------
// スキップ試問の採点 + mastered 一括更新
// ------------------------------------

/**
 * スキップ試問の回答を評価し、合格なら対象スキルを一括 mastered にする
 */
export async function evaluateSkipChallenge(
  userId: string,
  targetSkills: SkipTargetSkill[],
  problem: GeneratedProblem,
  userAnswer: string | ImageContent,
): Promise<SkipEvaluateResult> {
  // AI で回答を評価
  const evaluation = await evaluateAnswer(problem, userAnswer);

  // confidence=low は不合格扱い
  if (evaluation.confidence === 'low') {
    return {
      passed: false,
      evaluation: {
        isCorrect: false,
        confidence: evaluation.confidence,
        feedback: evaluation.indeterminateReason ?? '回答の判定ができませんでした。もう一度お試しください。',
      },
      skippedSkills: [],
    };
  }

  if (!evaluation.isCorrect) {
    return {
      passed: false,
      evaluation: {
        isCorrect: false,
        confidence: evaluation.confidence,
        feedback: evaluation.feedback,
      },
      skippedSkills: [],
    };
  }

  // 合格 → 対象スキルを一括 mastered に
  const skippedSkills = await masterSkillsBulk(userId, targetSkills);

  return {
    passed: true,
    evaluation: {
      isCorrect: true,
      confidence: evaluation.confidence,
      feedback: evaluation.feedback,
    },
    skippedSkills,
  };
}

// ------------------------------------
// 一括 mastered 処理
// ------------------------------------

/**
 * 対象スキルを一括で mastered にする
 * 1. StudentModel の skillMastery を rank=3 + mastered に更新
 * 2. 連鎖解放を実行
 */
async function masterSkillsBulk(
  userId: string,
  targetSkills: SkipTargetSkill[],
): Promise<SkipTargetSkill[]> {
  let studentModel = await getOrCreateStudentModel(userId);
  const skipped: SkipTargetSkill[] = [];

  for (const target of targetSkills) {
    // rank を直接 3 にセット
    const current = studentModel.skillMastery[target.skillId]
      || createInitialSkillMastery(target.skillId, "unlocked");
    studentModel.skillMastery[target.skillId] = { ...current, rank: 3 };

    // mastered + unlock chain
    const result = processSkillUpdate(studentModel, target.skillId, 90);
    studentModel = result.updatedModel;
    // rank 保持ガード: processSkillUpdate が上書きしないよう再代入
    studentModel.skillMastery[target.skillId].rank = 3;

    skipped.push(target);
    logger.info(`[Skip] Mastered skill: ${target.skillId} (${target.skillName})`);
  }

  // 連鎖解放
  studentModel = updateSkillUnlockStatus(studentModel);
  await updateStudentModel(studentModel);

  logger.info(`[Skip] Bulk mastered ${skipped.length} skills for user ${userId}`);
  return skipped;
}

// ------------------------------------
// スキップ試問生成プロンプト
// ------------------------------------

function buildSkipChallengePrompt(
  category: string,
  subcategory: string,
  skillNames: string,
  keywords: string,
): string {
  return `あなたは数学の問題作成者です。

## タスク
「${category} > ${subcategory}」の単元をスキップするための総合的な試問を1問作成してください。

この単元には以下のスキルが含まれます:
${skillNames}

関連キーワード: ${keywords}

## 問題の条件
- Level 3（応用問題）相当の難易度
- **単元内の複数のスキルを組み合わせた総合問題**にしてください
- この単元の基礎が分かっていれば解ける問題にしてください
- 逆に、基礎が分かっていなければ解けない問題にしてください
- 計算量は適度に（10分以内で解ける程度）

## 出力形式
以下のJSON形式で**のみ**出力してください:
{
  "questionText": "問題文（LaTeX 対応）",
  "correctAnswer": "正解（値や式）",
  "solutionSteps": ["解法ステップ1", "ステップ2", ...],
  "checkPoints": ["チェックポイント1", "チェックポイント2", ...],
  "targetPattern": "この問題が検証するパターンの説明",
  "cardInfo": {
    "cardName": "${subcategory}の総合力",
    "trigger": "${subcategory}の問題を解くとき",
    "method": "各スキルを組み合わせて解く"
  }
}
`;
}
