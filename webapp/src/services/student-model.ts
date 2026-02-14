// ==========================================
// FILE: webapp/src/types/student-model.ts
// ==========================================
/**
 * Student Model 型定義
 * Phase 2A - 学習者モデル
 * * 設計書: plans/task1-student-model-design.md
 * * 注: prototype/src/types/student-model.ts と同一内容
 * 将来的にはモノレポ構成で共有することを検討
 */

// ==========================================
// メイン型定義
// ==========================================

/**
 * 学習者モデル (Student Model)
 * 学習者の状態を包括的に管理するデータ構造
 */
export interface StudentModel {
  id: string;                       // ユーザーID (users.idと同一)
  version: number;                  // スキーマバージョン (将来の互換性用)
  createdAt: string;                // ISO8601形式
  updatedAt: string;                // ISO8601形式

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
// オンボーディング
// ==========================================

/**
 * オンボーディング状態
 */
export interface OnboardingStatus {
  completed: boolean;               // 導入完了したか
  selfAssessment: SelfAssessment;   // 自己申告レベル (いつでも変更可能)
  startedAt: string | null;         // 導入開始日時
  completedAt: string | null;       // 導入完了日時
}

/**
 * 自己申告レベル
 */
export type SelfAssessment = 
  | "struggling"    // 何がわからないかもわからない
  | "basic-ok"      // 計算はできるけど応用が苦手
  | "want-more"     // そこそこできるけど、もっと取りたい
  | null;           // 未回答

// ==========================================
// スキル習熟度
// ==========================================

/**
 * スキル習熟度ステータス
 */
export interface SkillMasteryStatus {
  skillId: string;                  // スキルID (例: "I-QF-01")
  status: SkillStatus;
  masteryLevel: number;             // 0-100 (下げることも可能)
  attempts: number;                 // 診断を受けた回数
  lastAttempt: string | null;       // 最後に診断を受けた日時 (ISO8601)
  lastPracticed: string | null;     // 最後に練習した日時 (ISO8601) - 忘却検知用
  bestScore: number | null;         // 最高スコア (0-100)
  unlockedAt: string | null;        // 解放日時 (ISO8601)
  masteredAt: string | null;        // 習得日時 (ISO8601)
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
  skillId: string;                  // 対象スキル
  startedAt: string;                // ISO8601
  endedAt: string | null;
  durationMinutes: number;
  questionsAttempted: number;
  questionsCorrect: number;
  mistakeTypes: MistakeType[];      // セッション中に発生したミスタイプ
  notes: string;                    // AIからのフィードバックなど
}

// ==========================================
// ミスパターン記録 (4分類)
// ==========================================

/**
 * ミスパターン記録
 * 調査#02 「つまずきパターン」 + cognitive-science-integration.mdから
 */
export interface MistakePatternRecord {
  transcription: MistakeTypeStats;  // L1: 入力ミス (書き写し間違い)
  alignment: MistakeTypeStats;      // L1: 空間的ミス (桁ずれ等)
  strategy: MistakeTypeStats;       // L2: スキーマ選択ミス (解法選択)
  calculation: MistakeTypeStats;    // L3: 処理ミス (純粋な計算間違い)
}

/**
 * ミスタイプ統計
 */
export interface MistakeTypeStats {
  totalCount: number;               // 累計発生回数
  recentCount: number;              // 直近10問での発生回数
  lastOccurred: string | null;      // 最後に発生した日時 (ISO8601)
  examples: MistakeExample[];       // 最新5件の具体例
  trend: MistakeTrend;              // 傾向
}

/**
 * ミス傾向
 */
export type MistakeTrend = "improving" | "stable" | "worsening";

/**
 * ミスの具体例
 */
export interface MistakeExample {
  timestamp: string;                // ISO8601
  questionId: string;
  skillId: string;
  description: string;              // 何を間違えたか
  userWork: string;                 // 学習者の解答 (LaTeX or 画像URL)
  correction: string;               // 正しい解答
}

/**
 * ミスタイプ (4分類 + 詳細分類)
 */
export type MistakeType = 
  // L1: 入力・空間ミス
  | "transcription"      // 書き写しミス
  | "alignment"          // 桁ずれ・配置ミス

  // L2: スキーマ選択ミス
  | "strategy"           // 解法選択ミス
  | "formula-selection"  // 公式選択ミス
  | "condition-check"    // 条件確認漏れ

  // L3: 処理ミス
  | "calculation"        // 計算ミス
  | "sign-error"         // 符号ミス
  | "distributive-law"   // 分配法則の誤適用
  | "fraction-operation" // 分数計算ミス
  | "order-of-operations"; // 演算順序ミス

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
 * Lv1: AI依存 (0-20%)
 * Lv2: 発達中 (21-40%)
 * Lv3: 成長中 (41-60%)
 * Lv4: ほぼ自立 (61-80%)
 * Lv5: 自立達成 (81-100%)
 */
export type IndependenceLevel = 1 | 2 | 3 | 4 | 5;

// ==========================================
// APIレスポンス型
// ==========================================

/**
 * Student Model取得レスポンス
 */
export interface StudentModelResponse {
  success: true;
  studentModel: StudentModel;
}

/**
 * スキル習熟度更新レスポンス
 */
export interface SkillMasteryUpdateResponse {
  success: true;
  skillMastery: SkillMasteryStatus;
}

/**
 * ミス記録レスポンス
 */
export interface MistakeRecordResponse {
  success: true;
  mistakePatterns: MistakePatternRecord;
}

/**
 * エラーレスポンス
 */
export interface StudentModelErrorResponse {
  success: false;
  error: string;
}

/**
 * 学習サマリー（ダッシュボード用）
 */
export interface LearningSummary {
  totalSkills: number;
  masteredSkills: number;
  learningSkills: number;
  unlockedSkills: number;
  totalSessions: number;
  totalMinutes: number;
  recentMistakeTypes: MistakeType[];
  independenceLevel: IndependenceLevel;
  lastActivity: string | null;
}