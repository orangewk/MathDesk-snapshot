// FILE: prototype/src/types/student-model.ts
// ---------------------------------------------------------
/**
 * Student Model 型定義
 * Phase 2A - 学習者モデル
 * * 設計書: plans/task1-student-model-design.md
 */

// ==========================================
// メイン型定義
// ==========================================

/**
 * 学習者モデル (Student Model)
 * 学習者の状態を包括的に管理するデータ構造
 */
export interface StudentModel {
  id: string;                         // ユーザーID (users.idと同一)
  version: number;                    // スキーマバージョン (将来の互換性用)
  createdAt: string;                  // ISO8601形式
  updatedAt: string;                  // ISO8601形式

  // ユーザーマイルストーン（重要な到達点）
  milestones: UserMilestones;

  // オンボーディング状態
  onboarding: OnboardingStatus;

  // 学習履歴
  learningHistory: LearningSession[];

  // ミスパターン記録
  mistakePatterns: MistakePatternRecord;

  // 自立度追跡
  independenceMetrics: IndependenceMetrics;

  // スキル習熟度マップ
  skillMastery: Record<string, SkillMasteryStatus>;
}

// ==========================================
// ユーザーマイルストーン
// ==========================================

/**
 * ユーザーマイルストーン
 * ユーザーライフサイクルにおける重要な到達点を記録
 */
export interface UserMilestones {
  // 基本
  firstVisitAt: string | null;              // 初回訪問日時

  // オンボーディング完了（OnboardingStatus.completedAtと同期）
  onboardingCompletedAt: string | null;

  // 学習開始
  firstSkillStartedAt: string | null;       // 最初にスキル学習を開始した日時
  firstSkillStartedId: string | null;       // 最初に学習開始したスキルID

  // 学習達成
  firstSkillMasteredAt: string | null;      // 最初にスキルを習得した日時
  firstSkillMasteredId: string | null;      // 最初に習得したスキルID

  // 参考書登録（将来用）
  firstTextbookRegisteredAt: string | null;
}

// ==========================================
// オンボーディング
// ==========================================

/**
 * オンボーディング状態
 */
export interface OnboardingStatus {
  completed: boolean;                 // 導入完了したか
  selfAssessment: SelfAssessment;     // 自己申告レベル (いつでも変更可能)
  gradeLevel: GradeLevel | null;      // 学年
  studiedSubjects: StudiedSubject[];  // 履修済み科目
  studyGoal: StudyGoal | null;        // 学習目標
  startedAt: string | null;           // 導入開始日時
  completedAt: string | null;         // 導入完了日時
}

/**
 * 自己申告レベル
 */
export type SelfAssessment =
  | "struggling"    // 何がわからないかもわからない
  | "basic-ok"      // 計算はできるけど応用が苦手
  | "want-more"     // そこそこできるけど、もっと取りたい
  | null;           // 未回答

/**
 * 学年
 */
export type GradeLevel = '中1' | '中2' | '中3' | '高1' | '高2' | '高3' | '既卒';

/**
 * 履修済み科目（スキル一括解禁に使用）
 */
export type StudiedSubject = '基礎' | '数学I' | '数学A' | '数学II' | '数学B' | '数学C';

/**
 * 学習目標
 */
export type StudyGoal = 'regular-exam' | 'common-test' | 'university-exam' | 'relearning';

// ==========================================
// スキル習熟度
// ==========================================

/**
 * スキル習熟度ステータス
 */
export interface SkillMasteryStatus {
  skillId: string;                    // スキルID (例: "I-QF-01")
  status: SkillStatus;
  masteryLevel: number;               // 0-100 (下げることも可能)
  rank: number;                       // 0=未着手, 1-2=学習中, 3=習得 (旧SkillCard.rank を統合)
  attempts: number;                   // 診断を受けた回数
  lastAttempt: string | null;         // 最後に診断を受けた日時 (ISO8601)
  lastPracticed: string | null;       // 最後に練習した日時 (ISO8601) - 忘却検知用
  bestScore: number | null;           // 最高スコア (0-100)
  unlockedAt: string | null;          // 解放日時 (ISO8601)
  masteredAt: string | null;          // 習得日時 (ISO8601)
}

/**
 * スキルステータス
 * 注: 降格可能 (mastered -> learning に戻せる)
 */
export type SkillStatus = 
  | "locked"      // 🔒 前提スキル未習得
  | "unlocked"    // ☆☆☆ 学習可能
  | "learning"    // ★☆☆ 学習中
  | "mastered"    // ★★★ 習得済み
  | "perfect";    // 🏆 完全習得

// ==========================================
// 学習履歴
// ==========================================

/**
 * 学習セッション
 */
export interface LearningSession {
  id: string;
  skillId: string;                    // 対象スキル
  startedAt: string;                  // ISO8601
  endedAt: string | null;
  durationMinutes: number;
  questionsAttempted: number;
  questionsCorrect: number;
  mistakeTypes: MistakeType[];        // セッション中に発生したミスタイプ
  notes: string;                      // AIからのフィードバックなど
}

// ==========================================
// ミスパターン記録 (分類)
// ==========================================

/**
 * ミスパターン記録
 * 調査#02「つまずきパターン」+ cognitive-science-integration.mdから
 */
export interface MistakePatternRecord {
  transcription: MistakeTypeStats;    // L1: 入力ミス (書き写し間違い)
  alignment: MistakeTypeStats;        // L1: 空間的ミス (桁ずれ等)
  strategy: MistakeTypeStats;         // L2: スキーマ選択ミス (解法選択)
  calculation: MistakeTypeStats;      // L3: 処理ミス (純粋な計算間違い)
}

/**
 * ミスタイプ統計
 */
export interface MistakeTypeStats {
  totalCount: number;                 // 累計発生回数
  recentCount: number;                // 直近10問での発生回数
  lastOccurred: string | null;        // 最後に発生した日時 (ISO8601)
  examples: MistakeExample[];         // 最新5件の具体例
  trend: MistakeTrend;                // 傾向
}

/**
 * ミス傾向
 */
export type MistakeTrend = "improving" | "stable" | "worsening";

/**
 * ミスの具体例
 */
export interface MistakeExample {
  timestamp: string;                  // ISO8601
  questionId: string;
  skillId: string;
  description: string;                // 何を間違えたか
  userWork: string;                   // 学習者の解答 (LaTeX or 画像URL)
  correction: string;                 // 正しい解答
}

/**
 * ミスタイプ (4分類 + 詳細分類)
 */
export type MistakeType = 
  // L1: 入力・空間ミス
  | "transcription"       // 書き写しミス
  | "alignment"           // 桁ずれ・配置ミス

  // L2: スキーマ選択ミス
  | "strategy"            // 解法選択ミス
  | "formula-selection"   // 公式選択ミス
  | "condition-check"     // 条件確認漏れ

  // L3: 処理ミス
  | "calculation"         // 計算ミス
  | "sign-error"          // 符号ミス
  | "distributive-law"    // 分配法則の誤適用
  | "fraction-operation"  // 分数計算ミス
  | "order-of-operations"; // 演算順序ミス

/**
 * ミスタイプのカテゴリ分類
 */
export const MISTAKE_TYPE_CATEGORIES: Record<MistakeType, "L1" | "L2" | "L3"> = {
  "transcription": "L1",
  "alignment": "L1",
  "strategy": "L2",
  "formula-selection": "L2",
  "condition-check": "L2",
  "calculation": "L3",
  "sign-error": "L3",
  "distributive-law": "L3",
  "fraction-operation": "L3",
  "order-of-operations": "L3",
};

// ==========================================
// 自立度追跡
// ==========================================

/**
 * 自立度メトリクス
 * cognitive-science-integration.mdの「自立支援の設計」から
 */
export interface IndependenceMetrics {
  // 自力で検出したエラー数
  selfDetectedErrors: number;

  // AI指摘後に気づいたエラー数
  aiAssistedErrors: number;

  // 自己発問リスト使用回数
  selfQuestioningUsage: number;

  // 自己説明成功回数
  selfExplanationSuccess: number;

  // 自立度スコア (0-100)
  independenceScore: number;

  // 自立度レベル (1-5)
  independenceLevel: IndependenceLevel;

  // 最終更新日時
  lastUpdated: string;
}

/**
 * 自立度レベル
 * Lvl1: AI依存 (0-20%)
 * Lvl2: 発達中 (21-40%)
 * Lvl3: 成長中 (41-60%)
 * Lvl4: ほぼ自立 (61-80%)
 * Lvl5: 自立達成 (81-100%)
 */
export type IndependenceLevel = 1 | 2 | 3 | 4 | 5;

// ==========================================
// ファクトリ関数
// ==========================================

/**
 * 空のMistakeTypeStatsを生成
 */
export function createEmptyMistakeTypeStats(): MistakeTypeStats {
  return {
    totalCount: 0,
    recentCount: 0,
    lastOccurred: null,
    examples: [],
    trend: "stable",
  };
}

/**
 * 新規StudentModelの初期値を生成
 */
/**
 * 空のUserMilestonesを生成
 */
export function createEmptyMilestones(): UserMilestones {
  return {
    firstVisitAt: null,
    onboardingCompletedAt: null,
    firstSkillStartedAt: null,
    firstSkillStartedId: null,
    firstSkillMasteredAt: null,
    firstSkillMasteredId: null,
    firstTextbookRegisteredAt: null,
  };
}

/**
 * 新規StudentModelの初期値を生成
 */
export function createInitialStudentModel(userId: string): StudentModel {
  const now = new Date().toISOString();

  return {
    id: userId,
    version: 1,
    createdAt: now,
    updatedAt: now,
    milestones: {
      ...createEmptyMilestones(),
      firstVisitAt: now,  // 初回作成時に記録
    },
    onboarding: {
      completed: false,
      selfAssessment: null,
      gradeLevel: null,
      studiedSubjects: [],
      studyGoal: null,
      startedAt: null,
      completedAt: null,
    },
    learningHistory: [],
    mistakePatterns: {
      transcription: createEmptyMistakeTypeStats(),
      alignment: createEmptyMistakeTypeStats(),
      strategy: createEmptyMistakeTypeStats(),
      calculation: createEmptyMistakeTypeStats(),
    },
    independenceMetrics: {
      selfDetectedErrors: 0,
      aiAssistedErrors: 0,
      selfQuestioningUsage: 0,
      selfExplanationSuccess: 0,
      independenceScore: 0,
      independenceLevel: 1,
      lastUpdated: now,
    },
    skillMastery: {},
  };
}

/**
 * 新規SkillMasteryStatusの初期値を生成
 */
export function createInitialSkillMastery(
  skillId: string,
  status: SkillStatus = "locked"
): SkillMasteryStatus {
  const now = new Date().toISOString();

  return {
    skillId,
    status,
    masteryLevel: 0,
    rank: 0,
    attempts: 0,
    lastAttempt: null,
    lastPracticed: null,
    bestScore: null,
    unlockedAt: status === "unlocked" ? now : null,
    masteredAt: null,
  };
}

/**
 * 自立度スコアから自立度レベルを計算
 */
export function calculateIndependenceLevel(score: number): IndependenceLevel {
  if (score <= 20) return 1;
  if (score <= 40) return 2;
  if (score <= 60) return 3;
  if (score <= 80) return 4;
  return 5;
}

/**
 * 自立度スコアを計算
 * 自立度スコア = (自力検知エラー数 / 総エラー数) * 100
 */
export function calculateIndependenceScore(
  selfDetectedErrors: number,
  aiAssistedErrors: number
): number {
  const totalErrors = selfDetectedErrors + aiAssistedErrors;
  if (totalErrors === 0) return 0;
  return Math.round((selfDetectedErrors / totalErrors) * 100);
}