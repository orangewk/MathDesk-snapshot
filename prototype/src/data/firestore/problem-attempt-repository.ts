/**
 * Firestore 問題回答記録 リポジトリ
 *
 * SQLite database.ts の ProblemAttempt 操作と同じシグネチャ（async 化）。
 * Firestore パス: users/{userId}/problemAttempts/{attemptId}
 */

import { Timestamp } from 'firebase-admin/firestore';
import { usersCollection } from './client.js';

// ==========================================
// 型定義（database.ts と同一）
// ==========================================

export type ProblemSource = 'reference_book' | 'ai_generated' | 'other';

export interface ProblemAttempt {
  id: string;
  userId: string;
  skillId: string;
  isCorrect: boolean;
  problemSource: ProblemSource;
  problemIdentifier: string | null;
  conversationId: string | null;
  createdAt: Date;
}

export interface CreateProblemAttemptInput {
  id: string;
  userId: string;
  skillId: string;
  isCorrect: boolean;
  problemSource?: ProblemSource;
  problemIdentifier?: string | null;
  conversationId?: string | null;
}

interface ProblemAttemptDoc {
  skillId: string;
  isCorrect: boolean;
  problemSource: string;
  problemIdentifier: string | null;
  conversationId: string | null;
  createdAt: Timestamp;
}

function docToProblemAttempt(
  id: string,
  userId: string,
  data: ProblemAttemptDoc,
): ProblemAttempt {
  return {
    id,
    userId,
    skillId: data.skillId,
    isCorrect: data.isCorrect,
    problemSource: data.problemSource as ProblemSource,
    problemIdentifier: data.problemIdentifier,
    conversationId: data.conversationId,
    createdAt: data.createdAt.toDate(),
  };
}

function getAttemptsCollection(userId: string) {
  return usersCollection.doc(userId).collection('problemAttempts');
}

// ==========================================
// CRUD
// ==========================================

/**
 * 問題回答記録を作成
 */
export async function createProblemAttempt(
  input: CreateProblemAttemptInput,
): Promise<ProblemAttempt> {
  const now = Timestamp.now();
  const docData: ProblemAttemptDoc = {
    skillId: input.skillId,
    isCorrect: input.isCorrect,
    problemSource: input.problemSource ?? 'reference_book',
    problemIdentifier: input.problemIdentifier ?? null,
    conversationId: input.conversationId ?? null,
    createdAt: now,
  };

  await getAttemptsCollection(input.userId).doc(input.id).set(docData);

  return {
    id: input.id,
    userId: input.userId,
    skillId: input.skillId,
    isCorrect: input.isCorrect,
    problemSource: docData.problemSource as ProblemSource,
    problemIdentifier: docData.problemIdentifier,
    conversationId: docData.conversationId,
    createdAt: now.toDate(),
  };
}

/**
 * ユーザーが特定スキルで出題済みの問題プール ID を取得する
 * 出題戦略（未出題優先・再出題）で使用
 */
export async function getAttemptedProblemIds(
  userId: string,
  skillId: string,
  _level: number,
  options?: { correctOnly?: boolean; wrongOnly?: boolean },
): Promise<Set<string>> {
  let query = getAttemptsCollection(userId)
    .where('skillId', '==', skillId);

  if (options?.correctOnly) {
    query = query.where('isCorrect', '==', true);
  } else if (options?.wrongOnly) {
    query = query.where('isCorrect', '==', false);
  }

  const snapshot = await query.get();

  const ids = new Set<string>();
  for (const doc of snapshot.docs) {
    const data = doc.data() as ProblemAttemptDoc;
    if (data.problemIdentifier) {
      ids.add(data.problemIdentifier);
    }
  }

  return ids;
}

/**
 * ユーザーの特定スキルに対する問題回答統計を取得
 */
export async function getProblemAttemptStats(
  userId: string,
  skillId: string,
): Promise<{ total: number; correct: number; accuracy: number }> {
  const snapshot = await getAttemptsCollection(userId)
    .where('skillId', '==', skillId)
    .get();

  let total = 0;
  let correct = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data() as ProblemAttemptDoc;
    total++;
    if (data.isCorrect) correct++;
  }

  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { total, correct, accuracy };
}

/**
 * ユーザーの特定スキルに対する直近N件の問題回答を取得
 */
export async function getRecentProblemAttempts(
  userId: string,
  skillId: string,
  limit: number = 10,
): Promise<ProblemAttempt[]> {
  const snapshot = await getAttemptsCollection(userId)
    .where('skillId', '==', skillId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) =>
    docToProblemAttempt(doc.id, userId, doc.data() as ProblemAttemptDoc),
  );
}

/**
 * スキル獲得判定（参考書問題の正答率ベース）
 * 判定基準:
 * - 同一スキルで連続3問正解 → 習得
 * - 5問以上かつ正答率80%以上 → 習得
 */
export async function checkSkillMasteryByAttempts(
  userId: string,
  skillId: string,
): Promise<{
  shouldMaster: boolean;
  reason: string;
  stats: { total: number; correct: number; accuracy: number };
}> {
  const stats = await getProblemAttemptStats(userId, skillId);
  const recentAttempts = await getRecentProblemAttempts(userId, skillId, 10);

  // 判定1: 連続3問正解
  if (recentAttempts.length >= 3) {
    const lastThree = recentAttempts.slice(0, 3);
    if (lastThree.every((a) => a.isCorrect)) {
      return {
        shouldMaster: true,
        reason: '連続3問正解',
        stats,
      };
    }
  }

  // 判定2: 5問以上かつ正答率80%以上
  if (stats.total >= 5 && stats.accuracy >= 80) {
    return {
      shouldMaster: true,
      reason: `正答率${stats.accuracy}%（${stats.correct}/${stats.total}問）`,
      stats,
    };
  }

  return {
    shouldMaster: false,
    reason:
      stats.total < 5
        ? `あと${5 - stats.total}問で判定可能`
        : `正答率${stats.accuracy}%（80%以上で習得）`,
    stats,
  };
}
