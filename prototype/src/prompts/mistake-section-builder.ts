// FILE: prototype/src/prompts/mistake-section-builder.ts
// ==========================================

/**
 * ミスパターンセクションビルダー
 * Phase 2A - システムプロンプト設計・実装
 * * 設計書: plans/task2-system-prompt-design.md
 * 参照: docs/investigation/research-02_つまずきパターン.md
 */

import type { StudentContext, MistakePatternType } from './types.js';
import type { MistakeTrend } from '../types/student-model.js';

/**
 * ミスパターンタイプのラベル
 */
const MISTAKE_TYPE_LABELS: Record<MistakePatternType, string> = {
  transcription: '書き写しミス',
  alignment: '桁ずれ・配置ミス',
  strategy: '解法選択ミス',
  calculation: '計算ミス'
};

/**
 * ミスパターンセクションを生成
 */
export function buildMistakePatternSection(context: StudentContext): string {
  if (context.topMistakePatterns.length === 0) {
    return '';
  }

  let section = `
## ⚠️ 注意すべきミスパターン

この学習者には以下のミスパターンが多く見られます。
回答を生成する際は、これらのミスをしていないか特に注意深く確認してください。
また、学習者が同じミスをしそうになったら、事前に注意を促してください。

`;

  context.topMistakePatterns.forEach(pattern => {
    const label = MISTAKE_TYPE_LABELS[pattern.type];
    const trendIcon = getTrendIcon(pattern.trend);
    
    section += `- **${label}** (発生回数: ${pattern.count}回) ${trendIcon}\n`;
  });

  section += `
### 指導のポイント
学習者がこれらのミスをした場合は、単に指摘するのではなく、
「なぜそのミスが起きたか」を一緒に分析し、再発防止策（チェックリストなど）を提案してください。
`;

  return section;
}

function getTrendIcon(trend: MistakeTrend): string {
  switch (trend) {
    case 'worsening': return '📈 (増加傾向)';
    case 'improving': return '📉 (改善傾向)';
    case 'stable': return '→ (横ばい)';
    default: return '';
  }
}