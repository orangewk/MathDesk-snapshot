/**
 * Firestore 問題プール リポジトリ
 *
 * SQLite problem-pool-db.ts と同じシグネチャ（async 化）。
 * Firestore パス: problemPool/{problemId}
 */

import { Timestamp } from 'firebase-admin/firestore';
import { problemPoolCollection } from './client.js';
import type { GeneratedProblem, ProblemLevel } from '../../types/practice.js';

// ==========================================
// 型定義（problem-pool-db.ts と同一）
// ==========================================

export interface ProblemPoolEntry {
  id: string;
  skillId: string;
  level: ProblemLevel;
  problem: GeneratedProblem;
  usedCount: number;
  createdAt: Date;
}

interface ProblemPoolDoc {
  skillId: string;
  level: number;
  problemJson: string;
  usedCount: number;
  createdAt: Timestamp;
}

function docToEntry(id: string, data: ProblemPoolDoc): ProblemPoolEntry {
  return {
    id,
    skillId: data.skillId,
    level: data.level as ProblemLevel,
    problem: JSON.parse(data.problemJson) as GeneratedProblem,
    usedCount: data.usedCount,
    createdAt: data.createdAt.toDate(),
  };
}

// ==========================================
// CRUD
// ==========================================

/**
 * プールに問題を追加
 */
export async function addToPool(
  id: string,
  skillId: string,
  level: ProblemLevel,
  problem: GeneratedProblem,
): Promise<ProblemPoolEntry> {
  const now = Timestamp.now();
  const docData: ProblemPoolDoc = {
    skillId,
    level,
    problemJson: JSON.stringify(problem),
    usedCount: 0,
    createdAt: now,
  };

  await problemPoolCollection.doc(id).set(docData);

  return {
    id,
    skillId,
    level,
    problem,
    usedCount: 0,
    createdAt: now.toDate(),
  };
}

/**
 * 特定スキル・レベルのプール問題を全件取得する
 * ユーザー別の未出題フィルタはサービス層で行う
 */
export async function getPoolProblems(
  skillId: string,
  level: ProblemLevel,
): Promise<ProblemPoolEntry[]> {
  const snapshot = await problemPoolCollection
    .where('skillId', '==', skillId)
    .where('level', '==', level)
    .orderBy('createdAt', 'asc')
    .get();

  return snapshot.docs.map(doc =>
    docToEntry(doc.id, doc.data() as ProblemPoolDoc),
  );
}

/**
 * 特定スキル・レベルのプール内問題数を取得
 */
export async function getPoolCount(
  skillId: string,
  level: ProblemLevel,
): Promise<number> {
  const snapshot = await problemPoolCollection
    .where('skillId', '==', skillId)
    .where('level', '==', level)
    .count()
    .get();

  return snapshot.data().count;
}

/**
 * プール全体の統計を取得
 */
export async function getPoolStats(): Promise<
  Array<{ skillId: string; level: ProblemLevel; count: number }>
> {
  const snapshot = await problemPoolCollection.get();

  // Firestore には GROUP BY がないので、アプリ側で集計
  const counts = new Map<string, number>();

  for (const doc of snapshot.docs) {
    const data = doc.data() as ProblemPoolDoc;
    const key = `${data.skillId}|${data.level}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const result: Array<{ skillId: string; level: ProblemLevel; count: number }> = [];
  for (const [key, count] of counts) {
    const [skillId, levelStr] = key.split('|');
    result.push({ skillId, level: Number(levelStr) as ProblemLevel, count });
  }

  // skillId, level でソート
  result.sort((a, b) => a.skillId.localeCompare(b.skillId) || a.level - b.level);

  return result;
}
