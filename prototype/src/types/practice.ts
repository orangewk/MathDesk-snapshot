// FILE: prototype/src/types/practice.ts
// ==========================================

/**
 * 練習問題・マスタリー判定の型定義
 *
 * 設計書: docs/planning/mastery-assessment-implementation-plan.md
 */

import type { ImageContent } from './chat.js';

// ==========================================
// 問題レベル
// ==========================================

/** 問題の難易度レベル (1-4) */
export type ProblemLevel = 1 | 2 | 3 | 4;

/** レベルの説明 */
export const LEVEL_DESCRIPTIONS: Record<ProblemLevel, string> = {
  1: '基本（教科書の例題レベル）',
  2: '標準（教科書の章末問題レベル）',
  3: '応用（参考書の応用問題レベル）',
  4: '発展（入試レベル・複合問題）',
};

// ==========================================
// AI 生成問題
// ==========================================

/**
 * カード自動作成用の情報
 * AI が問題生成時に同時生成する（案A）
 */
export interface ProblemCardInfo {
  cardName: string;   // カード名（例: 「因数分解の基本」）
  trigger: string;    // いつ使うか
  method: string;     // 解法の要約
}

/**
 * AI が生成した練習問題
 */
export interface GeneratedProblem {
  skillId: string;
  level: ProblemLevel;
  questionText: string;       // LaTeX 含む問題文
  correctAnswer: string;
  solutionSteps: string[];
  checkPoints: string[];
  targetPattern: string;
  cardInfo: ProblemCardInfo;
  figure?: {
    type: 'jsxgraph' | 'svg' | 'none';
    code: string;
    description: string;      // alt text / 図の説明
    boundingBox?: [number, number, number, number]; // [xMin, yMax, xMax, yMin]
  };
}

// ==========================================
// 回答評価
// ==========================================

/** AI の判定確信度 */
export type EvaluationConfidence = 'high' | 'medium' | 'low';

/**
 * AI による回答評価結果
 */
export interface EvaluationResult {
  isCorrect: boolean;
  confidence: EvaluationConfidence;
  feedback: string;                    // 学習者向けフィードバック
  matchedCheckPoints: string[];        // クリアした思考ステップ
  missedCheckPoints: string[];         // 見落とした思考ステップ
  indeterminateReason?: string;        // confidence=low 時の判定不能理由
}

// ==========================================
// API リクエスト / レスポンス
// ==========================================

/** 問題生成リクエスト */
export interface GenerateProblemRequest {
  skillId: string;
  level?: ProblemLevel;  // 未指定なら rank から自動決定
}

/** 回答評価リクエスト */
export interface EvaluateAnswerRequest {
  skillId: string;
  level: ProblemLevel;
  problem: GeneratedProblem;
  userAnswer: string | ImageContent;
}

// ==========================================
// 難易度モード
// ==========================================

/** ユーザーが選択する難易度モード */
export type DifficultyMode = 'basic' | 'challenge';

/**
 * 基礎問のレベルを算出する
 * 現在の rank に関わらず Level 1-2 に制限（ランクアップ対象外）
 */
export function getBasicLevel(rank: number): ProblemLevel {
  const required = getRequiredLevelForRank(rank);
  return Math.min(2, required) as ProblemLevel;
}

// ==========================================
// Level 制約
// ==========================================

/**
 * カードの rank から次に挑戦すべき Level を決定する
 * Level 制約: rankUp は対応する Level の問題に正解した場合のみ発生
 */
export function getRequiredLevelForRank(rank: number): ProblemLevel {
  if (rank <= 0) return 1;
  if (rank === 1) return 2;
  if (rank === 2) return 3;
  return 4;  // rank 3+ (mastered) → Level 4 チャレンジ
}

/**
 * 正解時に rankUp が許可されるか判定する
 * Level 制約: 現在の rank に対応する Level の問題に正解した場合のみ
 */
export function canRankUp(currentRank: number, solvedLevel: ProblemLevel): boolean {
  const requiredLevel = getRequiredLevelForRank(currentRank);
  return solvedLevel === requiredLevel;
}
