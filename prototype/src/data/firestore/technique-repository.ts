/**
 * Firestore テクニックリポジトリ
 *
 * Firestore コレクション: users/{userId}/skillCards（旧名のまま維持）
 * 旧名: skill-card-repository.ts → technique-repository.ts (#143)
 */

import { Timestamp } from 'firebase-admin/firestore';
import { db, usersCollection, cardClearLogCollection } from './client.js';
import type {
  Technique,
  CardClearLog,
  TechniqueStatus,
  TechniqueRarity,
  CreateTechniqueInput,
  UpdateTechniqueInput,
  CreateCardClearLogInput,
  ListTechniquesOptions,
} from '../../types/technique.js';

// ==========================================
// Firestore ドキュメント型
// ==========================================

interface TechniqueDoc {
  parentSkillId: string;
  pattern: string | null;
  techniques: string[];
  difficulty: number | null;
  rarity: string;
  cardName: string;
  triggerText: string;
  method: string;
  tip: string | null;
  status: string;
  rank: number;
  acquiredAt: Timestamp | null;
  useCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface CardClearLogDoc {
  cardId: string;
  conversationId: string | null;
  wasSuccessful: boolean;
  clearedAt: Timestamp;
}

// ==========================================
// ヘルパー
// ==========================================

/** Firestore コレクション名は "skillCards" のまま（データ移行を避けるため） */
function techniquesRef(userId: string) {
  return usersCollection.doc(userId).collection('skillCards');
}

function docToTechnique(
  id: string,
  userId: string,
  data: TechniqueDoc
): Technique {
  return {
    id,
    userId,
    parentSkillId: data.parentSkillId,
    pattern: data.pattern,
    techniques: data.techniques ?? [],
    difficulty: data.difficulty,
    rarity: (data.rarity || 'common') as TechniqueRarity,
    cardName: data.cardName,
    trigger: data.triggerText,
    method: data.method,
    tip: data.tip,
    status: data.status as TechniqueStatus,
    rank: data.rank,
    acquiredAt: data.acquiredAt ? data.acquiredAt.toDate() : null,
    useCount: data.useCount,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
}

function docToCardClearLog(id: string, data: CardClearLogDoc): CardClearLog {
  return {
    id: parseInt(id, 10) || 0,
    cardId: data.cardId,
    conversationId: data.conversationId,
    wasSuccessful: data.wasSuccessful,
    clearedAt: data.clearedAt.toDate(),
  };
}

// ==========================================
// Technique CRUD
// ==========================================

export async function createTechnique(
  input: CreateTechniqueInput
): Promise<Technique> {
  const now = Timestamp.now();
  const status = input.status ?? 'identified';
  const rarity = input.rarity ?? 'common';

  const docData: TechniqueDoc = {
    parentSkillId: input.parentSkillId,
    pattern: input.pattern ?? null,
    techniques: input.techniques ?? [],
    difficulty: input.difficulty ?? null,
    rarity,
    cardName: input.cardName,
    triggerText: input.trigger,
    method: input.method,
    tip: input.tip ?? null,
    status,
    rank: 0,
    acquiredAt: null,
    useCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  await techniquesRef(input.userId).doc(input.id).set(docData);

  return {
    id: input.id,
    userId: input.userId,
    parentSkillId: input.parentSkillId,
    pattern: input.pattern ?? null,
    techniques: input.techniques ?? [],
    difficulty: input.difficulty ?? null,
    rarity,
    cardName: input.cardName,
    trigger: input.trigger,
    method: input.method,
    tip: input.tip ?? null,
    status,
    rank: 0,
    acquiredAt: null,
    useCount: 0,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };
}

export async function findTechniqueById(
  id: string,
  userId?: string
): Promise<Technique | null> {
  if (userId) {
    const doc = await techniquesRef(userId).doc(id).get();
    if (!doc.exists) return null;
    return docToTechnique(doc.id, userId, doc.data() as TechniqueDoc);
  }

  const snapshot = await db
    .collectionGroup('skillCards')
    .where('__name__', '>=', id)
    .where('__name__', '<=', id + '\uf8ff')
    .get();

  for (const doc of snapshot.docs) {
    if (doc.id === id) {
      const parentPath = doc.ref.parent.parent;
      const ownerUserId = parentPath?.id ?? '';
      return docToTechnique(doc.id, ownerUserId, doc.data() as TechniqueDoc);
    }
  }

  return null;
}

export async function findTechniquesByUserId(
  userId: string,
  options: ListTechniquesOptions = {}
): Promise<{ cards: Technique[]; total: number }> {
  const { parentSkillId, status, limit = 50, offset = 0 } = options;

  let ref: FirebaseFirestore.Query = techniquesRef(userId);

  if (parentSkillId) {
    ref = ref.where('parentSkillId', '==', parentSkillId);
  }
  if (status) {
    ref = ref.where('status', '==', status);
  }

  const countSnapshot = await ref.select().get();
  const total = countSnapshot.size;

  const dataSnapshot = await ref
    .orderBy('updatedAt', 'desc')
    .offset(offset)
    .limit(limit)
    .get();

  const cards = dataSnapshot.docs.map((doc) =>
    docToTechnique(doc.id, userId, doc.data() as TechniqueDoc)
  );

  return { cards, total };
}

export async function updateTechnique(
  id: string,
  input: UpdateTechniqueInput,
  userId?: string
): Promise<Technique | null> {
  const current = await findTechniqueById(id, userId);
  if (!current) return null;

  const updates: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
  };

  if (input.cardName !== undefined) updates.cardName = input.cardName;
  if (input.trigger !== undefined) updates.triggerText = input.trigger;
  if (input.method !== undefined) updates.method = input.method;
  if (input.tip !== undefined) updates.tip = input.tip;
  if (input.status !== undefined) updates.status = input.status;
  if (input.rarity !== undefined) updates.rarity = input.rarity;
  if (input.rank !== undefined) updates.rank = input.rank;
  if (input.useCount !== undefined) updates.useCount = input.useCount;

  await techniquesRef(current.userId).doc(id).update(updates);

  return findTechniqueById(id, current.userId);
}

export async function acquireTechnique(
  id: string,
  userId?: string
): Promise<Technique | null> {
  const current = await findTechniqueById(id, userId);
  if (!current) return null;

  if (current.status === 'identified') {
    const now = Timestamp.now();
    await techniquesRef(current.userId).doc(id).update({
      status: 'acquired',
      rank: 1,
      acquiredAt: now,
      updatedAt: now,
    });
    return findTechniqueById(id, current.userId);
  }

  return rankUpTechnique(id, current.userId);
}

export async function rankUpTechnique(
  id: string,
  userId?: string
): Promise<Technique | null> {
  const current = await findTechniqueById(id, userId);
  if (!current) return null;

  if (current.status !== 'acquired' && current.status !== 'mastered') {
    return null;
  }

  const now = Timestamp.now();
  const newRank = current.rank + 1;
  const newUseCount = current.useCount + 1;

  const updates: Record<string, unknown> = {
    rank: newRank,
    useCount: newUseCount,
    updatedAt: now,
  };

  if (newRank >= 3 && current.status === 'acquired') {
    updates.status = 'mastered';
  }

  await techniquesRef(current.userId).doc(id).update(updates);

  return findTechniqueById(id, current.userId);
}

export async function findTechniqueByPattern(
  userId: string,
  parentSkillId: string,
  pattern: string
): Promise<Technique | null> {
  const snapshot = await techniquesRef(userId)
    .where('parentSkillId', '==', parentSkillId)
    .where('pattern', '==', pattern)
    .where('status', '!=', 'discarded')
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return docToTechnique(doc.id, userId, doc.data() as TechniqueDoc);
}

export async function findTechniquesByParentSkill(
  userId: string,
  parentSkillId: string
): Promise<Technique[]> {
  const snapshot = await techniquesRef(userId)
    .where('parentSkillId', '==', parentSkillId)
    .where('status', '!=', 'discarded')
    .orderBy('updatedAt', 'desc')
    .get();

  return snapshot.docs.map((doc) =>
    docToTechnique(doc.id, userId, doc.data() as TechniqueDoc)
  );
}

// ==========================================
// CardClearLog CRUD（デッド — Phase 3 で削除予定）
// ==========================================

export async function createCardClearLog(
  input: CreateCardClearLogInput
): Promise<CardClearLog> {
  const now = Timestamp.now();

  const docData: CardClearLogDoc = {
    cardId: input.cardId,
    conversationId: input.conversationId ?? null,
    wasSuccessful: input.wasSuccessful,
    clearedAt: now,
  };

  await cardClearLogCollection.add(docData);

  return {
    id: 0,
    cardId: input.cardId,
    conversationId: input.conversationId ?? null,
    wasSuccessful: input.wasSuccessful,
    clearedAt: now.toDate(),
  };
}

// ==========================================
// 後方互換エクスポート（Phase 3 で skill-card-service.ts をリネームする際に削除）
// ==========================================

export {
  createTechnique as createSkillCard,
  findTechniqueById as findSkillCardById,
  findTechniquesByUserId as findSkillCardsByUserId,
  updateTechnique as updateSkillCard,
  acquireTechnique as acquireSkillCard,
  rankUpTechnique as rankUpSkillCard,
  findTechniqueByPattern as findSkillCardByPattern,
  findTechniquesByParentSkill as findSkillCardsByParentSkill,
};
