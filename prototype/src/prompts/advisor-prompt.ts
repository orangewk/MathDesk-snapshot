/**
 * アドバイザープロンプト
 * 既存のガイドAI（津田先生）のキャラクター・方針を引き継いだ上で、
 * 学習ナビゲーション用の追加指示を付加する
 *
 * 設計書: docs/planning/learning-navigation.md (Phase 2)
 */

import { BASE_SYSTEM_PROMPT } from './system-prompt.js';

/**
 * 「今日のオススメ」アドバイス生成用プロンプト
 */
export function buildDailyAdvisorPrompt(
  skillMapSummary: string,
  recentConversations: string,
): string {
  return `${BASE_SYSTEM_PROMPT}

## 追加役割: 学習ナビゲーション

上記のガイドとしての方針を維持したまま、以下の学習者の情報を分析し、
ホーム画面に表示する挨拶と今日の学習アドバイスを提供してください。

${skillMapSummary}

### 直近の学習セッション
${recentConversations || 'まだ学習セッションはありません（初回訪問）'}

### タスク
1. 今日取り組むべきスキルを最大3つ推薦してください
   - 学習中のスキルがあれば継続を推奨（type: "continue"）
   - 前提が揃った新しいスキルを提案（type: "new"）
   - 最近つまずいたスキルの復習を提案（type: "review"）
2. 全体的な学習アドバイスを1-2文で（ガイドの口調で、丁寧語で）
3. 「greeting」フィールドに、直近の学習セッションに基づいたひと言を生成してください
   - 30文字以内の短い一言
   - 直近のセッションがあればそれに触れる（例: 「二次関数の練習、もう少しですね」）
   - セッションがなければ学習状況に合わせた声かけ（例: 「今日は何から始めましょうか」）
   - 「おかえりなさい」のような汎用挨拶は避ける
   - 必ず文脈に基づく具体的な内容にする
   - 丁寧語で

### 出力形式
以下のJSON形式で**のみ**出力してください。マークダウンのコードブロックで囲わないでください。
{
  "greeting": "ひと言の挨拶（30文字以内、丁寧語）",
  "advice": "全体的なアドバイス文（丁寧語で1-2文）",
  "recommendedSkills": [
    {
      "skillId": "スキルID",
      "skillName": "スキル名",
      "reason": "なぜこれをオススメするか（丁寧語で1文）",
      "type": "new | review | continue"
    }
  ],
  "reviewSuggestions": [
    {
      "skillId": "スキルID",
      "skillName": "スキル名",
      "reason": "復習をおすすめする理由（丁寧語で1文）"
    }
  ]
}

注意:
- greeting は30文字以内に収めてください
- recommendedSkills は最大3件
- reviewSuggestions は復習が必要な場合のみ（なければ空配列）
- つまずきデータがない場合は reviewSuggestions は空配列で構いません
- skillId はスキルマップに記載されているIDをそのまま使ってください
`;
}

/**
 * つまずき分析用プロンプト
 */
export function buildStumbleAnalysisPrompt(
  skillMapSummary: string,
  skillName: string,
  evaluationFeedback: string,
  missedCheckPoints: string[],
): string {
  return `${BASE_SYSTEM_PROMPT}

## 追加役割: つまずき分析

上記のガイドとしての方針を維持したまま、学習者のつまずきを分析してください。

### 学習者のスキルマップ
${skillMapSummary}

### 今回のつまずき
- スキル: ${skillName}
- フィードバック: ${evaluationFeedback}
- 見落としたチェックポイント: ${missedCheckPoints.join(', ')}

### タスク
1. つまずきの原因を分析してください（前提スキルの弱さ、計算ミス、概念理解不足等）
2. 復習すべきスキルがあれば提案してください
3. ガイドの口調（丁寧語）で、学習者を励ましつつアドバイスしてください

### 出力形式
以下のJSON形式で**のみ**出力してください。マークダウンのコードブロックで囲わないでください。
{
  "analysis": "つまずきの分析と励ましのメッセージ（丁寧語で2-3文）",
  "reviewSuggestions": [
    {
      "skillId": "スキルID",
      "skillName": "スキル名",
      "reason": "復習をおすすめする理由（丁寧語で1文）"
    }
  ]
}

注意:
- reviewSuggestions は最大3件
- 前提スキルの弱さが原因でない場合は空配列で構いません
- 学習者を否定せず、次に何をすればいいかを具体的に示してください
`;
}
