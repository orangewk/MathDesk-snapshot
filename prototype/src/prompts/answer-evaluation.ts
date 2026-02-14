// FILE: prototype/src/prompts/answer-evaluation.ts
// ==========================================

/**
 * 回答評価プロンプト
 * ユーザーの回答を AI に評価させるプロンプトを構築する
 *
 * 設計書: docs/planning/mastery-assessment-implementation-plan.md
 */

import type { GeneratedProblem } from '../types/practice.js';

/**
 * 回答評価用のシステムプロンプトを構築する
 */
export function buildAnswerEvaluationPrompt(
  problem: GeneratedProblem,
): string {
  const checkPointsList = problem.checkPoints
    .map((cp, i) => `${i + 1}. ${cp}`)
    .join('\n');

  return `あなたは高校数学の採点者です。生徒の回答を評価してください。

## 出題された問題
${problem.questionText}

## 正解
${problem.correctAnswer}

## 解法ステップ
${problem.solutionSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## 評価チェックポイント
${checkPointsList}

## タスク
生徒の回答を以下の基準で評価してください:

1. **正誤判定**: 最終的な答えが正しいかどうか
   - 表記の揺れは許容する（例: $x = 3$ と $3$ は同じ）
   - 数学的に同値な表現は正解とする（例: $\\frac{1}{2}$ と $0.5$）
   - 途中式のみで最終回答がない場合は不正解

2. **確信度**: 判定の確信度を評価
   - **high**: 明確に正解/不正解と判定できる
   - **medium**: おそらく正解/不正解だが、表記の解釈に若干の曖昧さがある
   - **low**: 回答の読み取りが困難、または判定が難しい（手書き画像が不鮮明、回答が曖昧など）

3. **フィードバック**: 学習者向けの具体的なフィードバック
   - 正解の場合: 良かった点と理解度の確認
   - 不正解の場合: どこで間違えたか、正しいアプローチのヒント
   - 判定不能の場合: なぜ判定できなかったか、再回答の方法を提案

4. **チェックポイント評価**: 各チェックポイントについて達成/未達を判定

## 出力形式
以下のJSON形式で**のみ**出力してください。JSON以外のテキストは不要です。

\`\`\`json
{
  "isCorrect": true または false,
  "confidence": "high" または "medium" または "low",
  "feedback": "学習者向けフィードバック（日本語）",
  "matchedCheckPoints": ["達成したチェックポイント1", "..."],
  "missedCheckPoints": ["未達のチェックポイント1", "..."],
  "indeterminateReason": "confidence が low の場合のみ: 判定不能の理由"
}
\`\`\`

## 重要な注意
- **confidence: low の場合、isCorrect は必ず false にすること**（判定できない回答は正解にしない）
- indeterminateReason は confidence が low の場合のみ含める
- フィードバックは高校生に分かりやすい日本語で
- 数式は KaTeX 対応の LaTeX 記法で（$...$ で囲む）
`;
}
