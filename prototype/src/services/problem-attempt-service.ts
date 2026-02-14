// FILE: prototype/src/services/problem-attempt-service.ts
// ==========================================
/**
 * 問題回答記録サービス
 * 参考書によるスキル判定機能の中核
 */

import { v4 as uuidv4 } from 'uuid';
import {
  createProblemAttempt,
  checkSkillMasteryByAttempts,
  getProblemAttemptStats,
  type ProblemSource,
} from '../data/firestore/problem-attempt-repository.js';
import { getStudentModel, updateStudentModel } from './student-model-service.js';
import { processSkillUpdate } from './skill-recommendation-service.js';
import { logger } from '../utils/logger.js';

export interface RecordProblemAttemptInput {
  userId: string;
  skillId: string;
  isCorrect: boolean;
  problemSource?: ProblemSource;
  problemIdentifier?: string;
  conversationId?: string;
}

export interface ProblemAttemptResult {
  attemptId: string;
  isCorrect: boolean;
  stats: {
    total: number;
    correct: number;
    accuracy: number;
  };
  skillMastery: {
    shouldMaster: boolean;
    reason: string;
    mastered: boolean;
  };
}

/**
 * 問題回答を記録し、スキル習得判定を行う
 */
export async function recordProblemAttempt(
  input: RecordProblemAttemptInput
): Promise<ProblemAttemptResult> {
  const { userId, skillId, isCorrect, problemSource, problemIdentifier, conversationId } = input;

  // 1. 問題回答を記録
  const attemptId = uuidv4();
  await createProblemAttempt({
    id: attemptId,
    userId,
    skillId,
    isCorrect,
    problemSource: problemSource ?? 'reference_book',
    problemIdentifier: problemIdentifier ?? null,
    conversationId: conversationId ?? null,
  });

  logger.info(`Problem attempt recorded: ${attemptId}, skill: ${skillId}, correct: ${isCorrect}`);

  // 2. スキル習得判定
  const masteryCheck = await checkSkillMasteryByAttempts(userId, skillId);

  let mastered = false;

  // 3. 習得条件を満たした場合、スキルステータスを更新
  if (masteryCheck.shouldMaster) {
    try {
      const studentModel = await getStudentModel(userId);
      if (studentModel) {
        // 高スコア (90) で更新することで mastered に遷移
        const result = processSkillUpdate(studentModel, skillId, 90);
        await updateStudentModel(result.updatedModel);
        mastered = result.mastered;

        if (mastered) {
          logger.info(`Skill mastered via problem attempts: ${skillId}, reason: ${masteryCheck.reason}`);
        }
      }
    } catch (err) {
      logger.error('Failed to update skill mastery:', err);
    }
  }

  return {
    attemptId,
    isCorrect,
    stats: masteryCheck.stats,
    skillMastery: {
      shouldMaster: masteryCheck.shouldMaster,
      reason: masteryCheck.reason,
      mastered,
    },
  };
}

/**
 * ユーザーのスキル別正答率を取得
 */
export async function getSkillAccuracy(
  userId: string,
  skillId: string
): Promise<{ total: number; correct: number; accuracy: number }> {
  return getProblemAttemptStats(userId, skillId);
}

/**
 * AIレスポンスから問題回答結果タグを検出
 * タグ形式: [[PROBLEM_RESULT:correct|incorrect:SKILL_ID]]
 */
export function detectProblemResultTag(
  content: string
): { isCorrect: boolean; skillId: string } | null {
  const match = content.match(/\[\[PROBLEM_RESULT:(correct|incorrect):([A-Z0-9-]+)\]\]/);
  if (!match) return null;

  return {
    isCorrect: match[1] === 'correct',
    skillId: match[2],
  };
}

/**
 * AIレスポンスから問題回答結果タグを除去
 */
export function removeProblemResultTag(content: string): string {
  return content.replace(/\[\[PROBLEM_RESULT:(?:correct|incorrect):[A-Z0-9-]+\]\]\s*/g, '').trim();
}
