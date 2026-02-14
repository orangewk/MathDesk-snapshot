// FILE: prototype/src/prompts/skill-section-builder.ts
// ==========================================

/**
 * スキル推薦セクションビルダー
 * Phase 2A - システムプロンプト設計・実装
 * * 設計書: plans/task2-system-prompt-design.md
 */

import type { StudentContext } from './types.js';

/**
 * スキル推薦セクションを生成
 */
export function buildSkillRecommendationSection(context: StudentContext): string {
  let section = `

## 🗺️ 学習ナビゲーション

`;

  // 現在学習中のスキル
  if (context.currentSkillName) {
    section += `### 現在の学習スキル
「${context.currentSkillName}」を学習中です。
このスキルに関する質問や練習問題に集中しましょう。
`;
  }

  // 次に学ぶべきスキル
  if (context.nextRecommendedSkills.length > 0) {
    section += `### 次に学ぶべきスキル
この学習者が次に取り組むべきスキルは以下です：
${context.nextRecommendedSkills.map((s, i) => 
  `- ${i + 1}. **${s.skillName}** - ${s.reason}`
).join('\n')}

学習者が「次に何をすればいい？」と聞いたら、これらを提案してください。
現在の学習が一区切りついたら、自然に次のスキルへ誘導しましょう。
`;
  }

  // 遡り推薦
  if (context.recentBacktrack) {
    section += `
### ⚠️ 遡り学習の推薦
最近のつまずきから、以下の遡り学習を推薦しています：

> ${context.recentBacktrack.message}

**遡り先スキル**: 
${context.recentBacktrack.targetSkills.map(s => `- ${s.skillName}`).join('\n')}

学習者がつまずいているようなら、これらの基礎に戻ることを提案してください。
「戻る」ことをネガティブに捉えさせず、「土台を確認する」という表現を使いましょう。

例: 「ここで基礎を確認しましょう。そうすると今の問題も見えてきます」
`;
  }

  return section;
}

/**
 * スキル推薦がある場合のみセクションを生成（空なら空文字列）
 */
export function buildSkillSectionIfNeeded(context: StudentContext): string {
  const hasCurrentSkill = !!context.currentSkillName;
  const hasRecommendedSkills = context.nextRecommendedSkills.length > 0;
  const hasBacktrack = !!context.recentBacktrack;

  if (!hasCurrentSkill && !hasRecommendedSkills && !hasBacktrack) {
    return '';
  }

  return buildSkillRecommendationSection(context);
}