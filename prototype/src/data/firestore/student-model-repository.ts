/**
 * Firestore 学習者モデル リポジトリ
 *
 * SQLite database.ts の StudentModel 操作と同じシグネチャ（async 化）。
 * Firestore パス: users/{userId}/studentModel/current
 */

import { Timestamp } from 'firebase-admin/firestore';
import { usersCollection } from './client.js';

// ==========================================
// 型定義（database.ts と同一）
// ==========================================

export interface StudentModelData {
  userId: string;
  data: string; // JSON文字列
  createdAt: Date;
  updatedAt: Date;
}

interface StudentModelDoc {
  data: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** サブコレクション内の固定ドキュメント ID */
const STUDENT_MODEL_DOC_ID = 'current';

function getStudentModelRef(userId: string) {
  return usersCollection.doc(userId).collection('studentModel').doc(STUDENT_MODEL_DOC_ID);
}

// ==========================================
// CRUD
// ==========================================

/**
 * 学習者モデルを保存 (UPSERT)
 */
export async function saveStudentModel(
  userId: string,
  data: string,
): Promise<StudentModelData> {
  const ref = getStudentModelRef(userId);
  const now = Timestamp.now();

  const existing = await ref.get();

  if (existing.exists) {
    // UPDATE: createdAt は保持
    await ref.update({
      data,
      updatedAt: now,
    });

    const doc = existing.data() as StudentModelDoc;
    return {
      userId,
      data,
      createdAt: doc.createdAt.toDate(),
      updatedAt: now.toDate(),
    };
  }

  // INSERT
  const docData: StudentModelDoc = {
    data,
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(docData);

  return {
    userId,
    data,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };
}

/**
 * 学習者モデルを取得
 */
export async function getStudentModel(
  userId: string,
): Promise<StudentModelData | null> {
  const doc = await getStudentModelRef(userId).get();

  if (!doc.exists) return null;

  const docData = doc.data() as StudentModelDoc;
  return {
    userId,
    data: docData.data,
    createdAt: docData.createdAt.toDate(),
    updatedAt: docData.updatedAt.toDate(),
  };
}
