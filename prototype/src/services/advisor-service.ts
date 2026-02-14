/**
 * アドバイザーサービス
 * ガイドAI（津田先生）の学習ナビゲーション機能
 *
 * 設計書: docs/planning/learning-navigation.md (Phase 2)
 */

import { sendMessage } from '../api/google-genai.js';
import {
  buildDailyAdvisorPrompt,
  buildStumbleAnalysisPrompt,
} from '../prompts/advisor-prompt.js';
import {
  buildSkillMapSummary,
  formatSummaryForLLM,
} from './skill-map-summary-service.js';
import { getOrCreateStudentModel } from './student-model-service.js';
import { getSkillById } from '../data/skill-definitions.js';
import { findConversationsByUserId } from '../data/firestore/conversation-repository.js';
import { logger } from '../utils/logger.js';

// ------------------------------------
// 型定義
// ------------------------------------

export interface RecommendedSkill {
  skillId: string;
  skillName: string;
  reason: string;
  type: 'new' | 'review' | 'continue';
}

export interface ReviewSuggestion {
  skillId: string;
  skillName: string;
  reason: string;
}

export interface DailyAdvice {
  greeting: string;
  advice: string;
  recommendedSkills: RecommendedSkill[];
  reviewSuggestions: ReviewSuggestion[];
}

export interface StumbleAnalysis {
  analysis: string;
  reviewSuggestions: ReviewSuggestion[];
}

// ------------------------------------
// キャッシュ（インメモリ、1時間TTL）
// ------------------------------------

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1時間
const dailyAdviceCache = new Map<string, CacheEntry<DailyAdvice>>();

function getCachedAdvice(userId: string): DailyAdvice | null {
  const entry = dailyAdviceCache.get(userId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    dailyAdviceCache.delete(userId);
    return null;
  }
  return entry.data;
}

function setCachedAdvice(userId: string, data: DailyAdvice): void {
  dailyAdviceCache.set(userId, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

// ------------------------------------
// 今日のオススメアドバイス
// ------------------------------------

/**
 * 今日のオススメ学習アドバイスを取得
 * - 1時間キャッシュあり
 * - Flash モデルで高速に生成
 */
export async function getDailyAdvice(userId: string): Promise<DailyAdvice> {
  // キャッシュチェック
  const cached = getCachedAdvice(userId);
  if (cached) {
    logger.debug(`[Advisor] Cache hit for user ${userId}`);
    return cached;
  }

  logger.info(`[Advisor] Generating daily advice for user ${userId}`);

  // 直近の会話タイトルを取得（軽量: タイトルのみ）
  const { conversations: recentConvs } = await findConversationsByUserId(userId, { limit: 3 });
  const recentConversationsText = recentConvs
    .filter(c => c.title)
    .map(c => `- ${c.title}（${c.status}）`)
    .join('\n');

  const studentModel = await getOrCreateStudentModel(userId);
  const summary = await buildSkillMapSummary(userId, studentModel);
  const summaryText = formatSummaryForLLM(summary);
  const prompt = buildDailyAdvisorPrompt(summaryText, recentConversationsText);

  const response = await sendMessage({
    messages: [{ role: 'user', content: '今日のおすすめ学習を教えてください。' }],
    system: prompt,
    model: 'flash',
    maxTokens: 2048,
    thinking: false,
  });

  const advice = parseDailyAdviceResponse(response.content);

  // キャッシュに保存
  setCachedAdvice(userId, advice);

  return advice;
}

/**
 * キャッシュを無効化（学習状況が大きく変わった時に呼ぶ）
 */
export function invalidateAdviceCache(userId: string): void {
  dailyAdviceCache.delete(userId);
}

// ------------------------------------
// つまずき分析
// ------------------------------------

/**
 * つまずき分析（不正解後に呼ぶ）
 * - キャッシュなし（毎回異なるコンテキスト）
 */
export async function analyzeStumble(
  userId: string,
  skillId: string,
  evaluationFeedback: string,
  missedCheckPoints: string[],
): Promise<StumbleAnalysis> {
  logger.info(`[Advisor] Analyzing stumble for user ${userId}, skill ${skillId}`);

  const skill = getSkillById(skillId);
  const skillName = skill?.name ?? skillId;

  const studentModel = await getOrCreateStudentModel(userId);
  const summary = await buildSkillMapSummary(userId, studentModel);
  const summaryText = formatSummaryForLLM(summary);

  const prompt = buildStumbleAnalysisPrompt(
    summaryText,
    skillName,
    evaluationFeedback,
    missedCheckPoints,
  );

  const response = await sendMessage({
    messages: [{ role: 'user', content: 'この問題でつまずきました。アドバイスをお願いします。' }],
    system: prompt,
    model: 'flash',
    maxTokens: 2048,
    thinking: false,
  });

  return parseStumbleAnalysisResponse(response.content);
}

// ------------------------------------
// レスポンスパーサー
// ------------------------------------

function parseDailyAdviceResponse(content: string): DailyAdvice {
  const fallback: DailyAdvice = {
    greeting: '',
    advice: '学習を始めましょう。まずは気になるスキルを選んで練習してみてください。',
    recommendedSkills: [],
    reviewSuggestions: [],
  };

  try {
    const cleaned = extractJson(content);
    const parsed = JSON.parse(cleaned);

    return {
      greeting: typeof parsed.greeting === 'string' ? parsed.greeting : '',
      advice: typeof parsed.advice === 'string' ? parsed.advice : fallback.advice,
      recommendedSkills: Array.isArray(parsed.recommendedSkills)
        ? parsed.recommendedSkills.filter(isValidRecommendedSkill)
        : [],
      reviewSuggestions: Array.isArray(parsed.reviewSuggestions)
        ? parsed.reviewSuggestions.filter(isValidReviewSuggestion)
        : [],
    };
  } catch (error) {
    logger.error('[Advisor] Failed to parse daily advice response:', error);
    logger.debug('[Advisor] Raw response:', content.substring(0, 500));
    return fallback;
  }
}

function parseStumbleAnalysisResponse(content: string): StumbleAnalysis {
  const fallback: StumbleAnalysis = {
    analysis: 'もう一度じっくり考えてみましょう。分からないところがあれば、一緒に確認していきましょう。',
    reviewSuggestions: [],
  };

  try {
    const cleaned = extractJson(content);
    const parsed = JSON.parse(cleaned);

    return {
      analysis: typeof parsed.analysis === 'string' ? parsed.analysis : fallback.analysis,
      reviewSuggestions: Array.isArray(parsed.reviewSuggestions)
        ? parsed.reviewSuggestions.filter(isValidReviewSuggestion)
        : [],
    };
  } catch (error) {
    logger.error('[Advisor] Failed to parse stumble analysis response:', error);
    logger.debug('[Advisor] Raw response:', content.substring(0, 500));
    return fallback;
  }
}

/**
 * LLMレスポンスからJSON部分を抽出
 * - コードブロックで囲まれている場合に対応
 */
function extractJson(content: string): string {
  // ```json ... ``` パターン
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // { ... } を直接探す
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return content.trim();
}

function isValidRecommendedSkill(item: unknown): item is RecommendedSkill {
  if (!item || typeof item !== 'object') return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.skillId === 'string' &&
    typeof obj.skillName === 'string' &&
    typeof obj.reason === 'string' &&
    (obj.type === 'new' || obj.type === 'review' || obj.type === 'continue')
  );
}

function isValidReviewSuggestion(item: unknown): item is ReviewSuggestion {
  if (!item || typeof item !== 'object') return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.skillId === 'string' &&
    typeof obj.skillName === 'string' &&
    typeof obj.reason === 'string'
  );
}
