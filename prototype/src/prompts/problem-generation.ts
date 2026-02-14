// FILE: prototype/src/prompts/problem-generation.ts
// ==========================================

/**
 * 練習問題生成プロンプト
 * スキル定義から Level に応じた問題を AI に生成させる
 */

import type { SkillDefinition } from '../data/skill-definitions.js';
import type { ProblemLevel } from '../types/practice.js';
import { LEVEL_DESCRIPTIONS } from '../types/practice.js';
import {
  getFigureRequirement,
  getExamplesForSubcategory,
} from './jsxgraph-examples.js';

/**
 * Level ごとの問題生成指示
 */
const LEVEL_INSTRUCTIONS: Record<ProblemLevel, string> = {
  1: `## Level 1: 基本問題
- 教科書の例題レベル
- 1つのテクニックのみで解ける
- 計算は単純で、数値は小さめ
- ヒントとなる情報を問題文に含めてよい
- 正解は1つの値や式（簡潔）`,

  // Content omitted from public snapshot
  // Levels 2-4 define progressively harder problem constraints:
  // Level 2: 章末問題レベル, Level 3: 応用問題, Level 4: 入試レベル
  2: `## Level 2: 標準問題\n<!-- Details omitted from public snapshot -->`,
  3: `## Level 3: 応用問題\n<!-- Details omitted from public snapshot -->`,
  4: `## Level 4: 発展問題\n<!-- Details omitted from public snapshot -->`,
};

/**
 * 問題生成用のシステムプロンプトを構築する（図の指示なし）
 *
 * 図は別途 Flash モデルで生成するため、問題生成プロンプトには含めない。
 * これにより Pro の応答が高速化される。
 */
export function buildProblemGenerationPrompt(
  skillDef: SkillDefinition,
  level: ProblemLevel,
): string {
  // Content omitted from public snapshot
  // プロンプトは以下を含む:
  // - 対象スキル情報の注入（ID, 名前, カテゴリ, キーワード）
  // - 難易度レベル指示
  // - JSON出力形式（questionText, correctAnswer, solutionSteps, checkPoints, cardInfo）
  // - 数式記法の制約（KaTeX対応LaTeX）
  // - 問題品質の制約
  return `あなたは高校数学の問題を作成する専門家です。

## 対象スキル
- **スキルID**: ${skillDef.id}
- **スキル名**: ${skillDef.name}
- **カテゴリ**: ${skillDef.category} > ${skillDef.subcategory}

## 難易度
${LEVEL_INSTRUCTIONS[level]}
（${LEVEL_DESCRIPTIONS[level]}）

<!-- Full prompt omitted from public snapshot -->
`;
}

/**
 * 図生成用のシステムプロンプトを構築する（Flash モデル用）
 *
 * 問題文と正解を受け取り、ネタバレしない JSXGraph コードを生成する。
 */
export function buildFigureGenerationPrompt(
  skillDef: SkillDefinition,
  questionText: string,
  correctAnswer: string,
): string {
  // Content omitted from public snapshot
  // ネタバレ防止の figurePolicy + JSXGraph コード生成指示
  return `<!-- Figure generation prompt omitted from public snapshot -->`;
}
