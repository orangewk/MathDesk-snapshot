import {
  SKILL_DEFINITIONS,
  SkillDefinition,
  getSkillById,
  getRootSkills,
} from '../data/skill-definitions.js';
import {
  BACKTRACK_RULES,
  BacktrackRule,
  ErrorType,
  getBacktrackRule,
} from '../data/backtrack-rules.js';
import type {
  StudentModel as StudentModelType,
  SkillMasteryStatus as SkillMasteryStatusType,
  SkillStatus as SkillStatusType,
  StudiedSubject,
} from '../types/student-model.js';
import { createInitialSkillMastery as createInitialSkillMasteryFunc } from '../types/student-model.js';

// ------------------------------------
// 推薦結果型
// ------------------------------------

export interface SkillRecommendation {
  skill: SkillDefinition;
  reason: string;
  priority: number; // 1が最優先
}

export interface BacktrackRecommendation {
  rule: BacktrackRule;
  targetSkills: SkillDefinition[];
}

// ------------------------------------
// 推薦サービス
// ------------------------------------

/**
 * 次に学ぶべきスキルを推薦する
 *
 * 優先順位:
 * 1. 前提がすべて習得済みのスキル (unlocked状態)
 * 2. importance が core > standard > advanced
 * 3. 基礎スキル優先 (カテゴリ順)
 */
export function getNextRecommendedSkills(
  studentModel: StudentModelType,
  count: number = 3
): SkillRecommendation[] {
  const mastery = studentModel.skillMastery;

  // 1. 各スキルの状態を評価
  const availableSkills: { skill: SkillDefinition; score: number; reason: string }[] = [];

  for (const skill of SKILL_DEFINITIONS) {
    const status = mastery[skill.id];

    // すでに習得済みはスキップ
    if (status?.status === "mastered" || status?.status === "perfect") {
      continue;
    }

    // 現在学習中のものは推薦リストに含める (継続推奨)
    if (status?.status === "learning") {
      availableSkills.push({
        skill,
        score: 1000, // 最優先
        reason: "現在学習中です。継続しましょう！"
      });
      continue;
    }

    // 前提スキルがすべて習得済みかチェック
    const allPrereqsMastered = skill.prerequisites.every(prereqId => {
      const prereqStatus = mastery[prereqId];
      return prereqStatus?.status === "mastered" || prereqStatus?.status === "perfect";
    });

    // 前提がない、または前提すべて習得済みなら推薦候補
    if (skill.prerequisites.length === 0 || allPrereqsMastered) {
      // スコア計算
      let score = 0;

      // 重要度によるスコア
      switch (skill.importance) {
        case "core":
          score += 100;
          break;
        case "standard":
          score += 50;
          break;
        case "advanced":
          score += 10;
          break;
      }

      // カテゴリによるスコア (基礎優先)
      switch (skill.category) {
        case "基礎":
          score += 50;
          break;
        case "数学I":
          score += 40;
          break;
        case "数学A":
          score += 35;
          break;
        case "数学II":
          score += 30;
          break;
        case "数学B":
          score += 25;
          break;
        case "数学C":
          score += 20;
          break;
      }

      // 理由の生成
      let reason = "";
      if (skill.prerequisites.length === 0) {
        reason = "前提知識なしで始められます。";
      } else {
        reason = "前提スキルを習得済みです。次のステップに進みましょう！";
      }

      if (skill.importance === "core") {
        reason += " 共通テストで重要なスキルです。";
      }

      availableSkills.push({ skill, score, reason });
    }
  }

  // 2. スコア順にソート
  availableSkills.sort((a, b) => b.score - a.score);

  // 3. 上位N件を返す
  return availableSkills.slice(0, count).map((item, index) => ({
    skill: item.skill,
    reason: item.reason,
    priority: index + 1
  }));
}

/**
 * つまずきから遡り先を取得する
 */
export function getBacktrackRecommendation(
  skillId: string,
  errorType: ErrorType
): BacktrackRecommendation | null {
  const rule = getBacktrackRule(skillId, errorType);

  if (!rule) {
    return null;
  }

  const targetSkills = rule.backtrackTo
    .map(id => getSkillById(id))
    .filter((skill): skill is SkillDefinition => skill !== undefined);

  return {
    rule,
    targetSkills
  };
}

/**
 * スキルの解放状態を更新する
 * 前提スキルがすべて習得済みなら unlocked に変更
 */
export function updateSkillUnlockStatus(
  studentModel: StudentModelType
): StudentModelType {
  const updatedMastery: Record<string, SkillMasteryStatusType> = { ...studentModel.skillMastery };
  const now = new Date().toISOString();

  for (const skill of SKILL_DEFINITIONS) {
    const currentStatus = updatedMastery[skill.id];

    // 前提スキルがすべて習得済みかチェック
    const allPrereqsMastered = skill.prerequisites.every(prereqId => {
      const prereqStatus = updatedMastery[prereqId];
      return prereqStatus?.status === "mastered" || prereqStatus?.status === "perfect";
    });

    // 前提がない、または前提すべて習得済みの場合
    if (skill.prerequisites.length === 0 || allPrereqsMastered) {
      const shouldUnlock = !currentStatus ||
        // 新規：unlocked状態ではない追加
        (currentStatus.status !== "unlocked" &&
          currentStatus.status !== "learning" &&
          currentStatus.status !== "mastered" &&
          currentStatus.status !== "perfect");

      // locked -> unlocked に変更
      if (shouldUnlock) {
        if (!currentStatus) {
          updatedMastery[skill.id] = createInitialSkillMasteryFunc(skill.id, "unlocked");
        } else if (currentStatus.status === "locked") {
          updatedMastery[skill.id] = {
            ...currentStatus,
            status: "unlocked",
            unlockedAt: now,
          };
        }
      }
    } else {
      // 前提が揃っていない場合は locked
      if (!currentStatus) {
        updatedMastery[skill.id] = createInitialSkillMasteryFunc(skill.id, "locked");
      }
      // すでに学習中のものがロックされることは原則ないが、降格処理が必要ならここに記述
    }
  }

  return {
    ...studentModel,
    skillMastery: updatedMastery,
    updatedAt: now
  };
}

/**
 * 初期スキル解放状態を設定する
 * 新規ユーザー用：前提なしスキルをすべてunlockedに
 */
export function initializeSkillMastery(): Record<string, SkillMasteryStatusType> {
  const mastery: Record<string, SkillMasteryStatusType> = {};

  for (const skill of SKILL_DEFINITIONS) {
    if (skill.prerequisites.length === 0) {
      mastery[skill.id] = createInitialSkillMasteryFunc(skill.id, "unlocked");
    } else {
      mastery[skill.id] = createInitialSkillMasteryFunc(skill.id, "locked");
    }
  }

  return mastery;
}

/**
 * 履修科目ベースのスキル解放状態を設定する
 * オンボーディングで選択された科目のスキルを一括 unlocked にする
 */
export function initializeSkillMasteryWithSubjects(
  studiedSubjects: StudiedSubject[]
): Record<string, SkillMasteryStatusType> {
  const mastery: Record<string, SkillMasteryStatusType> = {};

  for (const skill of SKILL_DEFINITIONS) {
    const shouldUnlock =
      skill.prerequisites.length === 0 ||
      studiedSubjects.includes(skill.category as StudiedSubject);

    mastery[skill.id] = createInitialSkillMasteryFunc(
      skill.id,
      shouldUnlock ? "unlocked" : "locked"
    );
  }

  return mastery;
}

/**
 * スキル習熟度を更新する (推薦サービス版)
 *
 * @param currentStatus 現在の状態
 * @param score 今回のスコア (0-100)
 * @returns 更新後の状態
 */
export function updateSkillMasteryFromScore(
  currentStatus: SkillMasteryStatusType,
  score: number
): SkillMasteryStatusType {
  const now = new Date().toISOString();

  // 新しいmasteryLevelを計算 (指数移動平均)
  const alpha = 0.3; // 新しいスコアの重み
  let newMasteryLevel = Math.round(
    currentStatus.masteryLevel * (1 - alpha) + score * alpha
  );

  // 習得判定モード: スコア70以上の場合は即座に習得とする
  // (EMAで低くならないよう、masteryLevelもスコアで上書き)
  if (score >= 70) {
    newMasteryLevel = Math.max(newMasteryLevel, score);
  }

  // ステータスの決定
  let newStatus: SkillStatusType = currentStatus.status;

  if (currentStatus.status === "unlocked" || currentStatus.status === "locked") {
    // 初めて学習を開始
    newStatus = "learning";
  }

  // スコアベースで習得判定（EMAを経由した値ではなく、直接スコアも考慮）
  if (score >= 95 || newMasteryLevel >= 95) {
    newStatus = "perfect";
  } else if (score >= 70 || newMasteryLevel >= 70) {
    newStatus = "mastered";
  } else if (newStatus !== "mastered" && newStatus !== "perfect") {
    newStatus = "learning";
  }

  return {
    ...currentStatus,
    status: newStatus,
    masteryLevel: newMasteryLevel,
    attempts: currentStatus.attempts + 1,
    lastAttempt: now,
    lastPracticed: now,
    bestScore: Math.max(currentStatus.bestScore || 0, score),
    masteredAt: (newStatus === "mastered" || newStatus === "perfect") && !currentStatus.masteredAt
      ? now
      : currentStatus.masteredAt
  };
}

/**
 * 学習パスを生成する (目標スキルに到達するまでの推奨順序)
 */
export function generateLearningPath(
  targetSkillId: string,
  studentModel: StudentModelType
): SkillDefinition[] {
  const path: SkillDefinition[] = [];
  const visited = new Set<string>();
  const mastery = studentModel.skillMastery;

  function visit(skillId: string): void {
    if (visited.has(skillId)) return;
    visited.add(skillId);

    const skill = getSkillById(skillId);
    if (!skill) return;

    // すでに習得済みならスキップ
    const status = mastery[skillId];
    if (status?.status === "mastered" || status?.status === "perfect") {
      return;
    }

    // 前提スキルを先に訪問 (再帰)
    for (const prereqId of skill.prerequisites) {
      visit(prereqId);
    }

    // このスキルを追加
    path.push(skill);
  }

  visit(targetSkillId);

  return path;
}

/**
 * 学習進捗のサマリーを取得
 */
export function getLearningProgressSummary(
  studentModel: StudentModelType
): {
  totalSkills: number;
  masteredSkills: number;
  learningSkills: number;
  unlockedSkills: number;
  lockedSkills: number;
  progressPercent: number;
  byCategory: Record<string, { total: number; mastered: number }>;
} {
  const mastery = studentModel.skillMastery;

  let masteredSkills = 0;
  let learningSkills = 0;
  let unlockedSkills = 0;
  let lockedSkills = 0;

  const byCategory: Record<string, { total: number; mastered: number }> = {};

  for (const skill of SKILL_DEFINITIONS) {
    const status = mastery[skill.id];

    // カテゴリ別集計の初期化
    if (!byCategory[skill.category]) {
      byCategory[skill.category] = { total: 0, mastered: 0 };
    }
    byCategory[skill.category].total++;

    if (status?.status === "mastered" || status?.status === "perfect") {
      masteredSkills++;
      byCategory[skill.category].mastered++;
    } else if (status?.status === "learning") {
      learningSkills++;
    } else if (status?.status === "unlocked") {
      unlockedSkills++;
    } else {
      lockedSkills++;
    }
  }

  const totalSkills = SKILL_DEFINITIONS.length;
  const progressPercent = Math.round((masteredSkills / totalSkills) * 100);

  return {
    totalSkills,
    masteredSkills,
    learningSkills,
    unlockedSkills,
    lockedSkills,
    progressPercent,
    byCategory
  };
}

/**
 * スキル習熟度を更新し、連鎖解放処理を行う一括処理関数
 * サーバー側で呼び出しやすいように、モデル更新と解放ロジックをまとめたもの
 */
export function processSkillUpdate(
  studentModel: StudentModelType,
  skillId: string,
  score: number
): {
  updatedModel: StudentModelType;
  skillUpdated: boolean;
  mastered: boolean;
  newStatus: SkillMasteryStatusType
} {
  // 現在のステータスを取得（なければ初期化）
  const currentSkillStatus = studentModel.skillMastery[skillId] || createInitialSkillMasteryFunc(skillId, "locked");

  // 新しいステータスを計算
  const newSkillStatus = updateSkillMasteryFromScore(currentSkillStatus, score);

  // 変更検知
  const skillUpdated = JSON.stringify(currentSkillStatus) !== JSON.stringify(newSkillStatus);

  // 新たに習得したか判定
  const mastered = (newSkillStatus.status === "mastered" || newSkillStatus.status === "perfect") &&
    (currentSkillStatus.status !== "mastered" && currentSkillStatus.status !== "perfect");

  // スキルマスタリーを更新したモデルを作成
  let updatedModel = {
    ...studentModel,
    skillMastery: {
      ...studentModel.skillMastery,
      [skillId]: newSkillStatus
    },
    updatedAt: new Date().toISOString()
  };

  // 習得した場合、連鎖的に他のスキルを解放する
  if (mastered) {
    updatedModel = updateSkillUnlockStatus(updatedModel);
  }

  return { updatedModel, skillUpdated, mastered, newStatus: newSkillStatus };
}

/**
 * スキルのランクを1つ上げる（旧 acquireCard に代わる進捗更新関数）
 * rank >= 3 で mastered + unlock chain を発動
 */
export function rankUpSkill(
  studentModel: StudentModelType,
  skillId: string
): {
  updatedModel: StudentModelType;
  newRank: number;
  mastered: boolean;
} {
  const now = new Date().toISOString();

  // 既存の mastery を取得（なければ初期化）
  const current = studentModel.skillMastery[skillId]
    || createInitialSkillMasteryFunc(skillId, "unlocked");

  // rank +1
  const newRank = (current.rank ?? 0) + 1;

  // rank に応じて masteryLevel を更新（rank 3 以上は processSkillUpdate が設定）
  const rankBasedMasteryLevel = Math.min(newRank, 2) * 33; // rank 1=33, rank 2=66
  const newMasteryLevel = Math.max(current.masteryLevel ?? 0, rankBasedMasteryLevel);

  const updatedMastery: SkillMasteryStatusType = {
    ...current,
    rank: newRank,
    masteryLevel: newMasteryLevel,
    status: current.status === "locked" || current.status === "unlocked" ? "learning" : current.status,
    lastPracticed: now,
  };

  let updatedModel: StudentModelType = {
    ...studentModel,
    skillMastery: {
      ...studentModel.skillMastery,
      [skillId]: updatedMastery,
    },
    updatedAt: now,
  };

  let mastered = false;

  // rank >= 3 で mastered + unlock chain
  if (newRank >= 3) {
    const result = processSkillUpdate(updatedModel, skillId, 90);
    updatedModel = result.updatedModel;
    mastered = result.mastered;
    // rank 保持ガード: processSkillUpdate が rank を上書きしないよう再代入
    updatedModel.skillMastery[skillId].rank = newRank;
  }

  return { updatedModel, newRank, mastered };
}