// FILE: prototype/src/services/problem-generation-service.ts
// ==========================================

/**
 * 問題生成サービス
 * スキル定義から AI を使って練習問題を生成する
 *
 * 設計書: docs/planning/mastery-assessment-implementation-plan.md
 */

import { sendMessage } from '../api/google-genai.js';
import { buildProblemGenerationPrompt, buildFigureGenerationPrompt } from '../prompts/problem-generation.js';
import { buildAnswerEvaluationPrompt } from '../prompts/answer-evaluation.js';
import { getFigureRequirement } from '../prompts/jsxgraph-examples.js';
import { SKILL_DEFINITIONS, type SkillDefinition } from '../data/skill-definitions.js';
import type { GeneratedProblem, ProblemLevel, EvaluationResult } from '../types/practice.js';
import type { ImageContent } from '../types/chat.js';
import { logger } from '../utils/logger.js';
import { sanitizeFigure } from './jsxgraph-validator.js';

// ==========================================
// スキル定義の検索
// ==========================================

/**
 * スキルIDからスキル定義を検索
 */
export function findSkillDefinition(skillId: string): SkillDefinition | undefined {
  return SKILL_DEFINITIONS.find(s => s.id === skillId);
}

// ==========================================
// JSON パース
// ==========================================

/**
 * Gemini が JSON 内で出力する LaTeX コマンドのエスケープを修正する
 *
 * 問題: Gemini が `\frac`, `\times` 等を JSON 文字列内にそのまま出力すると、
 * JSON.parse が `\f`→form feed, `\t`→tab 等の JSON エスケープとして解釈してしまう。
 *
 * 修正: `\` の後に2文字以上の英字が続く場合（= LaTeX コマンド）は `\\` に変換。
 * 1文字だけの `\n`, `\t`, `\r` 等は正規の JSON エスケープとして維持。
 * `\{`, `\}` もLaTeX用なので同様に修正。
 */
function fixLatexInJson(raw: string): string {
  return raw
    .replace(/(?<!\\)\\(?=[a-zA-Z]{2,})/g, '\\\\')
    .replace(/(?<!\\)\\(?=[{}])/g, '\\\\');
}

/**
 * Gemini のレスポンスから JSON を抽出・パースする
 * 既存の parseExtractionResponse と同様の多段フォールバック
 */
export function parseProblemResponse(
  response: string,
  skillId: string,
  level: ProblemLevel,
): GeneratedProblem | null {
  let parsed: Record<string, unknown> | null = null;

  // Try 1: ```json ... ``` ブロック
  const jsonBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    try {
      parsed = JSON.parse(fixLatexInJson(jsonBlockMatch[1]));
    } catch {
      logger.warn('Failed to parse JSON block from problem response');
    }
  }

  // Try 2: ``` ... ``` ブロック
  if (!parsed) {
    const codeBlockMatch = response.match(/```\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      try {
        parsed = JSON.parse(fixLatexInJson(codeBlockMatch[1]));
      } catch {
        logger.warn('Failed to parse code block from problem response');
      }
    }
  }

  // Try 3: { ... } で囲まれた JSON
  if (!parsed) {
    const jsonObjectMatch = response.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      try {
        parsed = JSON.parse(fixLatexInJson(jsonObjectMatch[0]));
      } catch {
        logger.warn('Failed to parse JSON object from problem response');
      }
    }
  }

  if (!parsed) {
    logger.error('All parse attempts failed for problem response');
    return null;
  }

  // バリデーション
  if (
    typeof parsed.questionText !== 'string' ||
    typeof parsed.correctAnswer !== 'string' ||
    !Array.isArray(parsed.solutionSteps) ||
    !Array.isArray(parsed.checkPoints) ||
    typeof parsed.targetPattern !== 'string' ||
    !parsed.cardInfo ||
    typeof (parsed.cardInfo as Record<string, unknown>).cardName !== 'string'
  ) {
    logger.error('Problem response validation failed', { keys: Object.keys(parsed) });
    return null;
  }

  const cardInfo = parsed.cardInfo as Record<string, string>;

  return {
    skillId,
    level,
    questionText: parsed.questionText as string,
    correctAnswer: parsed.correctAnswer as string,
    solutionSteps: parsed.solutionSteps as string[],
    checkPoints: parsed.checkPoints as string[],
    targetPattern: parsed.targetPattern as string,
    cardInfo: {
      cardName: cardInfo.cardName,
      trigger: cardInfo.trigger ?? '',
      method: cardInfo.method ?? '',
    },
    // figure は別途 Flash で生成するため、ここでは含めない
  };
}

// ==========================================
// 問題生成
// ==========================================

/**
 * スキルIDと Level を指定して AI に練習問題を生成させる
 * @param options.model - 使用モデル（'flash' で Flash チェーン、未指定で Pro デフォルト）
 */
export async function generateProblem(
  skillId: string,
  level: ProblemLevel,
  options?: { model?: string },
): Promise<GeneratedProblem> {
  const skillDef = findSkillDefinition(skillId);
  if (!skillDef) {
    throw new Error(`スキルが見つかりません: ${skillId}`);
  }

  const systemPrompt = buildProblemGenerationPrompt(skillDef, level);
  const model = options?.model;
  const useFlash = model === 'flash';

  logger.info(`Generating problem for skill ${skillId} at level ${level} (model: ${model ?? 'default'})`);

  const response = await sendMessage({
    messages: [
      {
        role: 'user',
        content: `スキル「${skillDef.name}」のLevel ${level} の練習問題を1問作成してください。`,
      },
    ],
    system: systemPrompt,
    // NOTE: maxOutputTokens は thinking + output の合計キャップ。上限であって目標ではないため余裕を持たせる
    // 詳細: Gemini 3 maxOutputTokens investigation
    maxTokens: 16384,
    ...(useFlash ? { model: 'flash' } : { model }),
  });

  logger.debug('Problem generation response length:', response.content.length);

  const problem = parseProblemResponse(response.content, skillId, level);
  if (!problem) {
    throw new Error('問題生成レスポンスのパースに失敗しました');
  }

  logger.info(`Generated problem: ${problem.questionText.substring(0, 80)}...`);
  return problem;
}

// ==========================================
// 図生成（Flash モデル）
// ==========================================

/**
 * スキルの subcategory から図が必要かどうかを判定する
 */
export function needsFigure(skillId: string): boolean {
  const skillDef = findSkillDefinition(skillId);
  if (!skillDef) return false;
  return getFigureRequirement(skillDef.subcategory) !== 'none';
}

/**
 * Flash の図生成レスポンスをパースする
 */
export function parseFigureResponse(
  response: string,
): GeneratedProblem['figure'] | null {
  let parsed: Record<string, unknown> | null = null;

  const jsonBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    try {
      parsed = JSON.parse(fixLatexInJson(jsonBlockMatch[1]));
    } catch {
      logger.warn('Failed to parse JSON block from figure response');
    }
  }

  if (!parsed) {
    const jsonObjectMatch = response.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      try {
        parsed = JSON.parse(fixLatexInJson(jsonObjectMatch[0]));
      } catch {
        logger.warn('Failed to parse JSON object from figure response');
      }
    }
  }

  if (!parsed) {
    logger.error('All parse attempts failed for figure response');
    return null;
  }

  // figurePolicy の shouldDraw が false なら図なし
  const policy = parsed.figurePolicy as Record<string, unknown> | undefined;
  if (policy?.shouldDraw === false) {
    logger.info('Figure generation skipped: shouldDraw=false');
    return undefined;
  }

  // figure フィールドを検証
  const figure = parsed.figure as Record<string, unknown> | undefined;
  if (!figure || typeof figure.code !== 'string' || typeof figure.description !== 'string') {
    logger.warn('Figure response missing required fields');
    return null;
  }

  return sanitizeFigure({
    type: 'jsxgraph' as const,
    code: figure.code as string,
    description: figure.description as string,
    boundingBox: figure.boundingBox as [number, number, number, number] | undefined,
  });
}

/**
 * 問題に対する図を Flash モデルで生成する
 */
export async function generateFigure(
  problem: GeneratedProblem,
): Promise<GeneratedProblem['figure'] | undefined> {
  const skillDef = findSkillDefinition(problem.skillId);
  if (!skillDef) {
    logger.warn(`Skill not found for figure generation: ${problem.skillId}`);
    return undefined;
  }

  const requirement = getFigureRequirement(skillDef.subcategory);
  if (requirement === 'none') {
    return undefined;
  }

  const systemPrompt = buildFigureGenerationPrompt(
    skillDef,
    problem.questionText,
    problem.correctAnswer,
  );

  logger.info(`Generating figure for skill ${problem.skillId} (Flash)`);

  const response = await sendMessage({
    messages: [
      {
        role: 'user',
        content: `この問題の補助図を作成してください。`,
      },
    ],
    system: systemPrompt,
    model: 'flash',
    maxTokens: 16384,
  });

  logger.debug('Figure generation response length:', response.content.length);

  const figure = parseFigureResponse(response.content);
  if (figure === null) {
    logger.warn('Figure generation failed, returning undefined');
    return undefined;
  }

  logger.info(`Generated figure: ${figure?.description?.substring(0, 60) ?? 'skipped'}`);
  return figure;
}

// ==========================================
// 回答評価
// ==========================================

/**
 * Gemini のレスポンスから EvaluationResult をパースする
 */
export function parseEvaluationResponse(response: string): EvaluationResult | null {
  let parsed: Record<string, unknown> | null = null;

  // Try 1: ```json ... ``` ブロック
  const jsonBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    try {
      parsed = JSON.parse(fixLatexInJson(jsonBlockMatch[1]));
    } catch {
      logger.warn('Failed to parse JSON block from evaluation response');
    }
  }

  // Try 2: ``` ... ``` ブロック
  if (!parsed) {
    const codeBlockMatch = response.match(/```\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      try {
        parsed = JSON.parse(fixLatexInJson(codeBlockMatch[1]));
      } catch {
        logger.warn('Failed to parse code block from evaluation response');
      }
    }
  }

  // Try 3: { ... } で囲まれた JSON
  if (!parsed) {
    const jsonObjectMatch = response.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      try {
        parsed = JSON.parse(fixLatexInJson(jsonObjectMatch[0]));
      } catch {
        logger.warn('Failed to parse JSON object from evaluation response');
      }
    }
  }

  if (!parsed) {
    logger.error('All parse attempts failed for evaluation response');
    return null;
  }

  // バリデーション
  if (
    typeof parsed.isCorrect !== 'boolean' ||
    typeof parsed.confidence !== 'string' ||
    typeof parsed.feedback !== 'string'
  ) {
    logger.error('Evaluation response validation failed', { keys: Object.keys(parsed) });
    return null;
  }

  const confidence = parsed.confidence as string;
  if (!['high', 'medium', 'low'].includes(confidence)) {
    logger.warn(`Unknown confidence level: ${confidence}, defaulting to medium`);
  }

  // confidence: low なら isCorrect は必ず false
  const isCorrect = confidence === 'low' ? false : (parsed.isCorrect as boolean);

  return {
    isCorrect,
    confidence: confidence as EvaluationResult['confidence'],
    feedback: parsed.feedback as string,
    matchedCheckPoints: (parsed.matchedCheckPoints as string[]) ?? [],
    missedCheckPoints: (parsed.missedCheckPoints as string[]) ?? [],
    indeterminateReason: parsed.indeterminateReason as string | undefined,
  };
}

/**
 * ユーザーの回答を AI で評価する
 */
export async function evaluateAnswer(
  problem: GeneratedProblem,
  userAnswer: string | ImageContent,
): Promise<EvaluationResult> {
  const systemPrompt = buildAnswerEvaluationPrompt(problem);

  logger.info(`Evaluating answer for skill ${problem.skillId} level ${problem.level}`);

  // ユーザーの回答をメッセージとして構築
  const content: string | Array<{ type: string; text?: string; source?: ImageContent['source'] }> =
    typeof userAnswer === 'string'
      ? `生徒の回答:\n${userAnswer}`
      : [
          { type: 'text', text: '生徒の回答（画像）:' },
          { type: 'image', source: userAnswer.source },
        ];

  const response = await sendMessage({
    messages: [{ role: 'user', content: content as string }],
    system: systemPrompt,
    maxTokens: 16384,
  });

  logger.debug('Evaluation response length:', response.content.length);

  const evaluation = parseEvaluationResponse(response.content);
  if (!evaluation) {
    throw new Error('回答評価レスポンスのパースに失敗しました');
  }

  logger.info(`Evaluation result: ${evaluation.isCorrect ? 'correct' : 'incorrect'} (confidence: ${evaluation.confidence})`);
  return evaluation;
}
