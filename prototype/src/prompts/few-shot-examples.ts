// FILE: prototype/src/prompts/few-shot-examples.ts
// ==========================================

/**
 * Few-Shot会話例
 * スキル合格判定時のタグ出力パターンをAIに学習させる
 *
 * 前提: ユーザーは問題集を持っており、問題を解いて解法を説明する
 * 問題集がない場合は学習のみ（合格判定なし、タグ出力なし）
 */

/**
 * 評価基準（問題集ありフロー）
 *
 * 【スコア判定基準】
 * - 70点（合格）: 核となる概念を自分の言葉で説明できる
 * - 85点: + 「なぜ？」の質問に論理的に答えられる
 * - 95点（完全習得）: + 応用・関連概念も即答できる
 * - 不合格: 「なんとなく」「暗記しただけ」→ 試問を続ける
 */
export const SCORING_CRITERIA = `
## スキル評価基準

スコアは以下の観点で判定してください：

| スコア | 条件 |
|--------|------|
| 70点 | 核となる概念を自分の言葉で説明できる |
| 85点 | + 「なぜその方法を使うか」に論理的に答えられる |
| 95点 | + 応用質問・関連概念にも即答できる |
| 不合格 | 「なんとなく」「公式を当てはめただけ」→ 試問を続ける |

**重要**: 正答でも説明できなければ合格させないでください。
`;

// Content omitted from public snapshot
// 以下を含む:
// - PASS_EXAMPLES: 合格パターンの会話例（70点/85点/95点の3段階）
// - FAIL_EXAMPLES: 不合格パターンの会話例（曖昧な説明、暗記のみ）
// - LEARNING_ONLY_EXAMPLES: 問題集なしパターン（タグ出力なし、学習促進）

export const PASS_EXAMPLES = `<!-- Pass examples omitted from public snapshot -->`;
export const FAIL_EXAMPLES = `<!-- Fail examples omitted from public snapshot -->`;
export const LEARNING_ONLY_EXAMPLES = `<!-- Learning-only examples omitted from public snapshot -->`;

/**
 * 全ての会話例を結合（システムプロンプト組み込み用）
 */
export const ALL_FEW_SHOT_EXAMPLES = `
# 会話例

以下は試問時の会話パターンです。

**問題集ありの場合のみ**、合格時は必ず [[MASTERY_SCORE:XX]] を出力してください。
問題集なしで学習のみの場合、タグは出力しないでください。

${SCORING_CRITERIA}

## 合格パターン（タグを出力する）
${PASS_EXAMPLES}

## 不合格パターン（タグを出力しない、試問を続ける）
${FAIL_EXAMPLES}

## 学習のみパターン（タグを出力しない）
${LEARNING_ONLY_EXAMPLES}
`;
