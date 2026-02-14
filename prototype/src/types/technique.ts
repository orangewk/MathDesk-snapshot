// FILE: prototype/src/types/technique.ts
// ---------------------------------------------------------
/**
 * テクニック型定義
 * 問題をクリアすることで発見される「解法テクニック」
 *
 * 旧名: SkillCard → Technique (#143)
 * Firestore コレクション名 "skillCards" は変更しない（データ移行を避けるため）
 */

// ==========================================
// テクニックステータス
// ==========================================

/**
 * テクニックの発見状態
 */
export type TechniqueStatus =
  | 'identified'  // AIが特定した（未獲得）
  | 'acquired'    // 問題クリアで獲得
  | 'mastered'    // マスター済み（複数回成功）
  | 'discarded';  // ユーザーが不要と判断

// 後方互換: 旧名からの re-export
export type CardStatus = TechniqueStatus;

/**
 * テクニックのレアリティ（スキル貢献値を決定）
 */
export type TechniqueRarity =
  | 'common'    // コモン: +5pt（チャットで自然に獲得）
  | 'uncommon'  // アンコモン: +10pt（教科書レベル）
  | 'rare'      // レア: +15pt（参考書・応用）
  | 'epic';     // エピック: +20pt（難問・テスト）

// 後方互換
export type CardRarity = TechniqueRarity;

/**
 * レアリティごとの貢献ポイント
 */
export const RARITY_POINTS: Record<TechniqueRarity, number> = {
  common: 5,
  uncommon: 10,
  rare: 15,
  epic: 20,
};

// ==========================================
// テクニック
// ==========================================

/**
 * テクニック（解法パターン）
 * 内部層（著作権セーフ・分析用）と表示層（ユーザー向け）を統合
 */
export interface Technique {
  id: string;

  // ========================================
  // 所有者
  // ========================================
  userId: string;

  // ========================================
  // 内部層: 著作権セーフ・分析用
  // ========================================

  /** 親スキルID（既存のスキル定義） */
  parentSkillId: string;  // "I-QUAD-02" など

  /** 問題パターン（機械的分類） */
  pattern: string | null;  // "completing_square"

  /** 必要テクニック */
  techniques: string[];  // ["factoring", "substitution"]

  /** 難易度 (1-5) */
  difficulty: number | null;

  /** レアリティ（スキル貢献値を決定） */
  rarity: TechniqueRarity;

  // ========================================
  // 表示層: ユーザーが見る・編集する
  // ========================================

  /** テクニック名（高校数学の用語ベース） */
  cardName: string;  // "平方完成" "置換法" "共通因数のくくり出し"

  /** 使いどき: いつこのテクニックを使う？ */
  trigger: string;  // "ax² + bx + c を頂点形式に変形したいとき"

  /** 手順: どうやる？ */
  method: string;  // "x² + bx の部分を (x + b/2)² - (b/2)² に書き換える"

  /** ポイント・コツ */
  tip: string | null;  // "『半分にして二乗』と覚えよう"

  // ========================================
  // 獲得状態: ユーザーの進捗
  // ========================================

  /** 獲得状態 */
  status: TechniqueStatus;

  /** ランク（同じテクニックを重ねて強化） */
  rank: number;  // 0=未獲得, 1=獲得, 2+=強化

  /** 獲得日時 */
  acquiredAt: Date | null;

  /** 使用回数（このテクニックで正解した回数） */
  useCount: number;

  // ========================================
  // メタデータ
  // ========================================
  createdAt: Date;
  updatedAt: Date;
}

// 後方互換
export type SkillCard = Technique;

// ==========================================
// カード使用履歴（デッド — Phase 3 で削除予定）
// ==========================================

export interface CardClearLog {
  id: number;
  cardId: string;
  conversationId: string | null;
  wasSuccessful: boolean;
  clearedAt: Date;
}

// ==========================================
// 入力型（作成・更新用）
// ==========================================

/**
 * テクニック作成時の入力
 */
export interface CreateTechniqueInput {
  id: string;
  userId: string;
  parentSkillId: string;
  pattern?: string | null;
  techniques?: string[];
  difficulty?: number | null;
  rarity?: TechniqueRarity;  // デフォルト: 'common'
  cardName: string;
  trigger: string;
  method: string;
  tip?: string | null;
  status?: TechniqueStatus;
}

// 後方互換
export type CreateSkillCardInput = CreateTechniqueInput;

/**
 * テクニック更新時の入力
 */
export interface UpdateTechniqueInput {
  cardName?: string;
  trigger?: string;
  method?: string;
  tip?: string | null;
  status?: TechniqueStatus;
  rarity?: TechniqueRarity;
  rank?: number;
  useCount?: number;
}

// 後方互換
export type UpdateSkillCardInput = UpdateTechniqueInput;

/**
 * カード使用履歴作成時の入力（デッド — Phase 3 で削除予定）
 */
export interface CreateCardClearLogInput {
  cardId: string;
  conversationId?: string | null;
  wasSuccessful: boolean;
}

// ==========================================
// Gemini抽出結果の型
// ==========================================

/**
 * Geminiによるテクニック抽出結果
 * 画像から抽出された情報
 */
export interface ExtractedTechniqueInfo {
  parentSkillId: string;
  pattern: string;
  techniques: string[];
  difficulty: number;
  rarity: TechniqueRarity;
  cardName: string;
  trigger: string;
  method: string;
  tip: string;
}

// 後方互換
export type ExtractedSkillCardInfo = ExtractedTechniqueInfo;

// ==========================================
// 検索オプション
// ==========================================

/**
 * テクニック検索オプション
 */
export interface ListTechniquesOptions {
  parentSkillId?: string;
  status?: TechniqueStatus;
  limit?: number;
  offset?: number;
}

// 後方互換
export type ListSkillCardsOptions = ListTechniquesOptions;
