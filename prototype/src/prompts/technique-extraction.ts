/**
 * テクニック抽出プロンプト
 * 参考書画像から「解法テクニック」を抽出
 *
 * 旧名: skill-card-extraction.ts → technique-extraction.ts (#143)
 */

import { SKILL_DEFINITIONS } from '../data/skill-definitions.js';

/**
 * 利用可能なスキルIDとその名前のリストを生成
 */
function getAvailableSkillsSection(): string {
  const skillsByCategory = SKILL_DEFINITIONS.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(`  - ${skill.id}: ${skill.name}`);
    return acc;
  }, {} as Record<string, string[]>);

  const sections = Object.entries(skillsByCategory)
    .map(([category, skills]) => `### ${category}\n${skills.join('\n')}`)
    .join('\n\n');

  return sections;
}

/**
 * テクニック抽出用のシステムプロンプトを生成
 */
export function buildTechniqueExtractionPrompt(): string {
  const availableSkills = getAvailableSkillsSection();

  // Content omitted from public snapshot
  // プロンプトは以下を含む:
  // - タスク定義（問題画像からテクニックをスキルカード形式で抽出）
  // - 著作権保護の制約
  // - JSON出力形式（cards[], problemType, overallDifficulty）
  // - rarity判定基準（common/uncommon/rare/epic → 貢献値 +5/+10/+15/+20）
  // - cardName, trigger, method, tip の書き方ガイド
  // - Few-shot examples（2例）
  // - 利用可能なスキルIDリスト
  return `あなたは高校数学の「スキルカード」を特定する専門家です。
<!-- Full prompt omitted from public snapshot -->

## 利用可能なスキルID
${availableSkills}
`;
}

/**
 * テクニック抽出結果の型
 */
export interface TechniqueExtractionResult {
  cards: ExtractedTechnique[];
  problemType: string | null;
  overallDifficulty: number | null;
  error?: string;
}

/**
 * 抽出されたテクニック（Gemini レスポンスの 1 要素）
 */
export interface ExtractedTechnique {
  parentSkillId: string;
  pattern: string;
  techniques: string[];
  difficulty: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic';
  cardName: string;
  trigger: string;
  method: string;
  tip: string;
}

/**
 * Geminiのレスポンスをパースしてテクニック抽出結果を取得
 */
export function parseExtractionResponse(response: string): TechniqueExtractionResult {
  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[1]); } catch (e) { console.error('Failed to parse JSON block:', e); }
  }

  const codeMatch = response.match(/```\s*([\s\S]*?)\s*```/);
  if (codeMatch) {
    try { return JSON.parse(codeMatch[1]); } catch (e) { console.error('Failed to parse code block:', e); }
  }

  const jsonObjectMatch = response.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    try { return JSON.parse(jsonObjectMatch[0]); } catch (e) { console.error('Failed to parse JSON object:', e); }
  }

  try { return JSON.parse(response.trim()); } catch (e) { console.error('Failed to parse raw response:', e); }

  return { cards: [], problemType: null, overallDifficulty: null, error: 'レスポンスのパースに失敗しました' };
}

/** @deprecated buildTechniqueExtractionPrompt を使用 */
export const buildSkillCardExtractionPrompt = buildTechniqueExtractionPrompt;
/** @deprecated TechniqueExtractionResult を使用 */
export type SkillCardExtractionResult = TechniqueExtractionResult;
/** @deprecated ExtractedTechnique を使用 */
export type ExtractedCard = ExtractedTechnique;
