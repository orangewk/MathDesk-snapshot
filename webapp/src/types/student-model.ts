// FILE: webapp/src/types/student-model.ts
// ---------------------------------------------------------
/**
 * Student Model 型定義 (フロントエンド用)
 * バックエンド prototype/src/types/student-model.ts から必要な型を抽出
 */

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
// UI表示用定数
// ==========================================

/**
 * ステータスアイコン
 */
export const STATUS_ICONS: Record<SkillStatus, string> = {
    locked: "🔒",
    unlocked: "☆",
    learning: "★",
    mastered: "★★★",
    perfect: "🏆",
};

/**
 * ステータスラベル
 */
export const STATUS_LABELS: Record<SkillStatus, string> = {
    locked: "ロック中",
    unlocked: "学習可能",
    learning: "学習中",
    mastered: "習得済み",
    perfect: "完全習得",
};

// ==========================================
// Student Model
// ==========================================

/**
 * Student Model 全体
 */
export interface StudentModel {
    userId: string;
    milestones: UserMilestones;
    skillMastery: Record<string, SkillMasteryStatus>;
    mistakePatterns: MistakePatternRecord;
    independenceMetrics: IndependenceMetrics;
    onboarding: OnboardingStatus;
    createdAt: string;
    updatedAt: string;
}

// ==========================================
// ミスパターン
// ==========================================

/**
 * ミスタイプ
 */
export type MistakeType =
    | "計算ミス"
    | "符号ミス"
    | "公式誤用"
    | "読み間違い"
    | "概念誤解"
    | "その他";

/**
 * ミス例
 */
export interface MistakeExample {
    questionId: string;
    skillId: string;
    description: string;
    userWork: string;
    correction: string;
    timestamp: string;
}

/**
 * ミスパターン記録
 */
export type MistakePatternRecord = Record<MistakeType, {
    count: number;
    recentExamples: MistakeExample[];
}>;

// ==========================================
// 自立度
// ==========================================

/**
 * 自立度メトリクス
 */
export interface IndependenceMetrics {
    level: 1 | 2 | 3 | 4 | 5;
    selfDetectedErrors: number;
    aiAssistedErrors: number;
    selfDetectionRate: number;
    lastUpdated: string;
}

// ==========================================
// ユーザーマイルストーン
// ==========================================

/**
 * ユーザーマイルストーン
 * ユーザーライフサイクルにおける重要な到達点を記録
 */
export interface UserMilestones {
    firstVisitAt: string | null;
    onboardingCompletedAt: string | null;
    firstSkillStartedAt: string | null;
    firstSkillStartedId: string | null;
    firstSkillMasteredAt: string | null;
    firstSkillMasteredId: string | null;
    firstTextbookRegisteredAt: string | null;
}

// ==========================================
// オンボーディング
// ==========================================

/**
 * 自己申告レベル
 */
export type SelfAssessment =
    | "struggling"     // 何がわからないかもわからない
    | "basic-ok"       // 計算はできるけど応用が苦手
    | "want-more"      // そこそこできるけど、もっと取りたい
    | null;

/**
 * オンボーディングステータス
 */
export interface OnboardingStatus {
    completed: boolean;
    selfAssessment: SelfAssessment;
    startedAt: string | null;
    completedAt: string | null;
}

// ==========================================
// 学習サマリー
// ==========================================

/**
 * 学習サマリー
 */
export interface LearningSummary {
    totalSkills: number;
    masteredSkills: number;
    learningSkills: number;
    unlockedSkills: number;
    lockedSkills: number;
    overallProgress: number;
    recentActivity: {
        date: string;
        skillId: string;
        action: string;
    }[];
}
