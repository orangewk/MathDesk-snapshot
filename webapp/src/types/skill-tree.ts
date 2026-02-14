// ==========================================
// FILE: webapp/src/types/skill-tree.ts
// ==========================================
/**
 * スキルツリー用型定義
 * Phase 2B-1 - React Flow対応
 * * 設計書: plans/phase2b-skill-tree-ui-design.md
 */

import { SkillMasteryStatus, SkillStatus } from './student-model';

// ==========================================
// スキル定義 (APIレスポンス)
// ==========================================

/** スキルカテゴリ */
export type SkillCategory = "基礎" | "数学I" | "数学A" | "数学II" | "数学B" | "数学C";

/** スキル重要度 */
export type SkillImportance = "core" | "standard" | "advanced";

/** スキル定義 */
export interface SkillDefinition {
  id: string;
  name: string;
  category: SkillCategory;
  subcategory: string;
  description: string;
  prerequisites: string[];
  importance: SkillImportance;
  keywords: string[];
}

// ==========================================
// React Flow ノードデータ
// ==========================================

/** スキルノードのデータ */
export interface SkillNodeData {
  skillId: string;
  name: string;
  category: SkillCategory;
  status: SkillStatus;
  masteryLevel: number;
  importance: SkillImportance;
}

// ==========================================
// 進捗サマリー
// ==========================================

/** カテゴリ別進捗 */
export interface CategoryProgress {
  total: number;
  mastered: number;
  learning: number;
  unlocked: number;
  locked: number;
}

/** 進捗サマリー */
export interface ProgressSummary {
  totalSkills: number;
  masteredSkills: number;
  learningSkills: number;
  unlockedSkills: number;
  lockedSkills: number;
  progressPercent: number;
  categoryProgress: Record<SkillCategory, CategoryProgress>;
}

// ==========================================
// APIレスポンス
// ==========================================

/** スキル一覧レスポンス */
export interface SkillsResponse {
  success: boolean;
  skills: SkillDefinition[];
  total: number;
}

/** スキル詳細レスポンス */
export interface SkillDetailResponse {
  success: boolean;
  skill: SkillDefinition;
  prerequisites: SkillDefinition[];
  successors: SkillDefinition[];
}

/** 進捗レスポンス */
export interface ProgressResponse {
  success: boolean;
  progress: {
    totalSkills: number;
    masteredSkills: number;
    learningSkills: number;
    unlockedSkills: number;
    lockedSkills: number;
    progressPercent: number;
    byCategory: Record<SkillCategory, {
      total: number;
      mastered: number;
      learning: number;
    }>;
  };
}

// ==========================================
// ヘルパー型
// ==========================================

/** 習熟度付きスキル */
export interface SkillWithMastery {
  skill: SkillDefinition;
  mastery: SkillMasteryStatus | null;
}

/** ステータスアイコンマップ */
export const STATUS_ICONS: Record<SkillStatus, string> = {
  locked: '🔒',
  unlocked: '⭐',
  learning: '🌱',
  mastered: '🌳',
  perfect: '🏆',
};

/** ステータス表示名 */
export const STATUS_LABELS: Record<SkillStatus, string> = {
  locked: '未解放',
  unlocked: '学習可能',
  learning: '学習中',
  mastered: '習得済み',
  perfect: '完全習得',
};