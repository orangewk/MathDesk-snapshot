/**
 * 問題プールサービス
 * プール優先 → AI フォールバックの統合ロジック
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { getPoolProblems, addToPool, getPoolCount } from '../data/firestore/problem-pool-repository.js';
import { getAttemptedProblemIds } from '../data/firestore/problem-attempt-repository.js';
import { generateProblem } from './problem-generation-service.js';
import type { GeneratedProblem, ProblemLevel } from '../types/practice.js';

/** プールの最低在庫数（これ以下ならバックグラウンド補充を推奨） */
const MIN_POOL_SIZE = 3;

/** 問題の取得元を示す */
export type ProblemSource = 'pool' | 'retry' | 'ai_generated';

export interface ProblemWithSource {
  problem: GeneratedProblem;
  source: ProblemSource;
  poolRemaining: number;
  /** プール問題の ID（problemAttempts との紐付け用） */
  problemPoolId: string | null;
}

/**
 * ユーザー別にプール優先で問題を取得する
 *
 * 優先順位:
 *   1. ユーザーが未回答のプール問題（即時）
 *   2. 過去に間違えた問題の再出題（source: 'retry'）
 *   3. プール使い切り → AI でリアルタイム新問生成
 */
export async function getProblemFromPoolOrGenerate(
  skillId: string,
  level: ProblemLevel,
  userId: string,
  options?: { model?: string },
): Promise<ProblemWithSource> {
  // 1. プールの全問題を取得
  const poolProblems = await getPoolProblems(skillId, level);

  if (poolProblems.length > 0) {
    // 2. ユーザーの出題済み問題 ID を取得
    const attemptedIds = await getAttemptedProblemIds(userId, skillId, level);

    // 3. 未出題の問題をフィルタ
    const unseen = poolProblems.filter(p => !attemptedIds.has(p.id));

    if (unseen.length > 0) {
      const entry = unseen[0];
      const remaining = unseen.length - 1;
      logger.info(
        `[Pool] Unseen hit: skill=${skillId}, level=${level}, user=${userId}, unseen=${unseen.length}`,
      );
      return {
        problem: entry.problem,
        source: 'pool',
        poolRemaining: remaining,
        problemPoolId: entry.id,
      };
    }

    // 4. 全て出題済み → 間違えた問題の再出題
    const wrongIds = await getAttemptedProblemIds(userId, skillId, level, { correctOnly: false, wrongOnly: true });
    const retryCandidate = poolProblems.find(p => wrongIds.has(p.id));

    if (retryCandidate) {
      logger.info(
        `[Pool] Retry: skill=${skillId}, level=${level}, user=${userId}, problemId=${retryCandidate.id}`,
      );
      return {
        problem: retryCandidate.problem,
        source: 'retry',
        poolRemaining: 0,
        problemPoolId: retryCandidate.id,
      };
    }

    // 5. 全問正解済み → AI 生成へフォールスルー
    logger.info(
      `[Pool] All correct: skill=${skillId}, level=${level}, user=${userId}, generating new problem`,
    );
  } else {
    logger.info(`[Pool] Empty: skill=${skillId}, level=${level}, falling back to AI generation`);
  }

  // 6. AI 生成にフォールバック
  const problem = await generateProblem(skillId, level, options);

  // 生成した問題をプールにも保存（次回以降に備える）
  let newPoolId: string | null = null;
  try {
    newPoolId = uuidv4();
    await addToPool(newPoolId, skillId, level, problem);
    logger.info(`[Pool] Saved AI-generated problem to pool: skill=${skillId}, level=${level}`);
  } catch (err) {
    logger.warn('[Pool] Failed to save generated problem to pool:', err);
    newPoolId = null;
  }

  return {
    problem,
    source: 'ai_generated',
    poolRemaining: await getPoolCount(skillId, level),
    problemPoolId: newPoolId,
  };
}

/**
 * プールの在庫が不足しているか判定
 */
export async function isPoolLow(skillId: string, level: ProblemLevel): Promise<boolean> {
  return (await getPoolCount(skillId, level)) < MIN_POOL_SIZE;
}
