// FILE: prototype/src/data/backtrack-rules.ts
// ==========================================

/**
 * 遡りルール (Backtrack Rules)
 *
 * 学習者がスキルでつまずいた際に、エラータイプに応じて
 * 戻るべき前提スキルを特定するルールセット。
 */

// ==========================================
// 型定義
// ==========================================

/**
 * エラータイプ
 * L1: 手続き的エラー（計算ミス、符号ミス）
 * L2: 概念的エラー（定義の誤解、グラフと式の対応ミス）
 * L3: 論理的エラー（命題の誤り、因果関係の混同）
 */
export type ErrorType = "L1" | "L2" | "L3";

/**
 * 遡りルール
 */
export interface BacktrackRule {
  id: string;              // ルールID
  skillId: string;         // つまずいたスキルID
  errorType: ErrorType;    // エラータイプ
  backtrackTo: string[];   // 遡り先スキルID (順序付き)
  detectionHint: string;   // 検出のヒント (AIプロンプト用)
  message: string;         // 学習者へのメッセージ
}

// ==========================================
// 遡りルールデータ（サンプル）
// ==========================================

// Content omitted from public snapshot
// 実際には 30+ ルールを定義。以下はサンプル 3 本。

export const BACKTRACK_RULES: BacktrackRule[] = [
  // 二次関数: 計算ミス → 式変形の基礎へ
  {
    id: "BT-I-QF-01-L1",
    skillId: "I-QF-01",
    errorType: "L1",
    backtrackTo: ["F-POLY-01", "I-EXP-01"],
    detectionHint: "平方完成の計算ミス、展開時の符号ミス",
    message: "式変形でつまずいていますね。展開・因数分解の基礎を確認しましょう。"
  },
  // 二次関数: 概念の誤解 → 一次関数グラフへ
  {
    id: "BT-I-QF-01-L2",
    skillId: "I-QF-01",
    errorType: "L2",
    backtrackTo: ["F-FUNC-01"],
    detectionHint: "グラフの形や頂点の位置が想像できていない",
    message: "まずは一次関数のグラフをしっかり理解してから、放物線に進みましょう。"
  },
  // 確率: 論理的エラー → 集合の基礎へ
  {
    id: "BT-A-PR-02-L3",
    skillId: "A-PR-02",
    errorType: "L3",
    backtrackTo: ["A-PR-01", "I-SET-01"],
    detectionHint: "条件付き確率と通常の確率の混同、時間軸の誤認",
    message: "条件付き確率は「分母が縮小する」と考えましょう。集合の考え方が重要です。"
  },
  // ... remaining 27+ rules omitted from public snapshot
];

// ==========================================
// ヘルパー関数
// ==========================================

/**
 * スキルIDとエラータイプから遡りルールを取得
 */
export function getBacktrackRule(
  skillId: string,
  errorType: ErrorType
): BacktrackRule | null {
  return BACKTRACK_RULES.find(rule =>
    rule.skillId === skillId && rule.errorType === errorType
  ) || null;
}

/**
 * スキルIDに関連するすべての遡りルールを取得
 */
export function getBacktrackRulesForSkill(skillId: string): BacktrackRule[] {
  return BACKTRACK_RULES.filter(rule => rule.skillId === skillId);
}

/**
 * エラータイプに関連するすべての遡りルールを取得
 */
export function getBacktrackRulesByErrorType(errorType: ErrorType): BacktrackRule[] {
  return BACKTRACK_RULES.filter(rule => rule.errorType === errorType);
}

/**
 * 遡り先として最も多く登場するスキル（弱点の根源）を取得
 */
export function getCommonWeaknessRoots(): { skillId: string; count: number }[] {
  const countMap: Record<string, number> = {};
  for (const rule of BACKTRACK_RULES) {
    for (const targetId of rule.backtrackTo) {
      countMap[targetId] = (countMap[targetId] || 0) + 1;
    }
  }
  return Object.entries(countMap)
    .map(([skillId, count]) => ({ skillId, count }))
    .sort((a, b) => b.count - a.count);
}
