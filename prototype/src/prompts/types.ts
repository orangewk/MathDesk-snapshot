// FILE: prototype/src/prompts/types.ts
// ==========================================

/**
 * システムプロンプト生成用の型定義
 * Phase 2A - システムプロンプト設計・実装
 * * 設計書: plans/task2-system-prompt-design.md
 */

import type { MistakeType, MistakeTrend, IndependenceLevel, SelfAssessment, GradeLevel, StudyGoal } from '../types/student-model.js';

// ==========================================
// StudentContext
// ==========================================

/**
 * システムプロンプト生成に必要な学習者コンテキスト
 * StudentModelから抽出・加工されたプロンプト用の情報
 */
export interface StudentContext {
  // ミスパターン傾向（上位3つ）
  topMistakePatterns: MistakePatternSummary[];

  // 自立度レベル (1-5)
  independenceLevel: IndependenceLevel;

  // 直近のセッション数
  recentSessionCount: number;

  // 現在学習中のスキル
  currentSkillId?: string;
  currentSkillName?: string;

  // 次に学ぶべきスキル（推薦順）
  nextRecommendedSkills: SkillRecommendationSummary[];

  // 遡り推薦（つまずき検出時）
  recentBacktrack?: BacktrackSummary;

  // オンボーディング状態
  onboardingCompleted: boolean;
  selfAssessment: SelfAssessment;

  // 問診票データ
  gradeLevel: GradeLevel | null;
  studyGoal: StudyGoal | null;
}

/**
 * ミスパターンのサマリー
 */
export interface MistakePatternSummary {
  type: MistakePatternType;
  count: number;
  trend: MistakeTrend;
}

/**
 * ミスパターンタイプ（4分類）
 */
export type MistakePatternType = 'transcription' | 'alignment' | 'strategy' | 'calculation';

/**
 * スキル推薦のサマリー
 */
export interface SkillRecommendationSummary {
  skillId: string;
  skillName: string;
  reason: string;
}

/**
 * 遡り推薦のサマリー
 */
export interface BacktrackSummary {
  message: string;
  targetSkills: Array<{
    skillId: string;
    skillName: string;
  }>;
}

// ==========================================
// プロンプトセクション
// ==========================================

/**
 * プロンプトセクションの種類
 */
export type PromptSectionType =
  | 'base'          // ベースプロンプト
  | 'intervention'  // 自立度別介入戦略
  | 'onboarding'    // オンボーディング
  | 'mistakes'      // ミスパターン
  | 'skills';       // スキル推薦

/**
 * プロンプトビルドオプション
 */
export interface PromptBuildOptions {
  // 含めるセクション（指定しない場合は全て）
  includeSections?: PromptSectionType[];

  // デバッグモード（セクション区切りを明示）
  debugMode?: boolean;

  // 習得判定モード
  assessmentMode?: AssessmentMode;

  // 画像アップロード検出時に参考書対応プロトコルを注入
  includeImageProtocol?: boolean;
}

/**
 * 習得判定モード
 * - ai_generated: AIが問題を出題
 * - textbook_required: 参考書の問題を使用
 */
export type AssessmentMode = 'ai_generated' | 'textbook_required';