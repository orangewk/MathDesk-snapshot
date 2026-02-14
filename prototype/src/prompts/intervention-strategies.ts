// FILE: prototype/src/prompts/intervention-strategies.ts
// ==========================================

/**
 * 自立度レベル別介入戦略
 * 学習者の自立度（IndependenceLevel 1-5）に応じて、
 * AIの介入スタイルを動的に切り替える。
 */

import type { IndependenceLevel } from '../types/student-model.js';

/**
 * 自立度レベルに応じた介入戦略を取得
 */
export function getInterventionStrategy(level: IndependenceLevel): string {
  const strategies: Record<IndependenceLevel, string> = {
    1: LEVEL_1_STRATEGY,
    2: LEVEL_2_STRATEGY,
    3: LEVEL_3_STRATEGY,
    4: LEVEL_4_STRATEGY,
    5: LEVEL_5_STRATEGY,
  };
  return strategies[level];
}

/**
 * 自立度レベルの説明を取得
 */
export function getIndependenceLevelDescription(level: IndependenceLevel): string {
  const descriptions: Record<IndependenceLevel, string> = {
    1: 'AI依存（手取り足取り）',
    2: '発達中（ガイド役）',
    3: '成長中（コーチ）',
    4: 'ほぼ自立（アドバイザー）',
    5: '自立達成（壁打ち相手）'
  };
  return descriptions[level];
}

// ==========================================
// 各レベルの介入戦略
// ==========================================

// Content omitted from public snapshot
// 各レベルの詳細な介入スタイル、使用するフレーズ例、コーチング指針を定義。
// 概要のみ以下に記載:

// Lv1: 手取り足取り — チェックリスト提示、積極的エラー指摘、ステップバイステップ
const LEVEL_1_STRATEGY = `## 現在の介入レベル: Lv1（手取り足取り）
<!-- Detailed strategy omitted from public snapshot -->`;

// Lv2: ガイド役 — 確認を促す、段階的ヒント、正解パターンの強化
const LEVEL_2_STRATEGY = `## 現在の介入レベル: Lv2（ガイド役）
<!-- Detailed strategy omitted from public snapshot -->`;

// Lv3: コーチ — 質問で促す、自己説明要求、待つ姿勢、メタ認知促進
const LEVEL_3_STRATEGY = `## 現在の介入レベル: Lv3（コーチ）
<!-- Detailed strategy omitted from public snapshot -->`;

// Lv4: アドバイザー — 見守り基本、リクエストベース、ピンポイント支援
const LEVEL_4_STRATEGY = `## 現在の介入レベル: Lv4（アドバイザー）
<!-- Detailed strategy omitted from public snapshot -->`;

// Lv5: 壁打ち相手 — 対等な議論、発展的問いかけ、別解の探求
const LEVEL_5_STRATEGY = `## 現在の介入レベル: Lv5（壁打ち相手）
<!-- Detailed strategy omitted from public snapshot -->`;
