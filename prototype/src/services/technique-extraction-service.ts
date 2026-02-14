/**
 * テクニック抽出サービス
 * 参考書画像からテクニック（解法パターン）を抽出
 *
 * 旧: skill-card-service.ts の extractSkillCardsFromImage を分離 (#143)
 */

import { v4 as uuidv4 } from 'uuid';
import { sendMessage } from '../api/google-genai.js';
import {
  buildTechniqueExtractionPrompt,
  parseExtractionResponse,
  type ExtractedTechnique,
} from '../prompts/technique-extraction.js';
import {
  createTechnique,
  findTechniqueByPattern,
} from '../data/firestore/technique-repository.js';
import type { Technique } from '../types/technique.js';
import { logger } from '../utils/logger.js';

// ==========================================
// 型定義
// ==========================================

export interface ExtractTechniquesInput {
  userId: string;
  imageData: string;
  mediaType: string;
}

export interface ExtractTechniquesResult {
  techniques: Technique[];
  problemType: string | null;
  overallDifficulty: number | null;
  error?: string;
}

// ==========================================
// 画像からテクニックを抽出
// ==========================================

/**
 * 画像からテクニックを抽出
 * 既存のテクニックがあればそれを返し、なければ新規作成
 */
export async function extractTechniquesFromImage(
  input: ExtractTechniquesInput
): Promise<ExtractTechniquesResult> {
  const { userId, imageData, mediaType } = input;

  try {
    // 1. Geminiで画像を分析
    const systemPrompt = buildTechniqueExtractionPrompt();

    const response = await sendMessage({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'この問題画像を分析して、必要なテクニックを抽出してください。',
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageData,
              },
            },
          ],
        },
      ],
      system: systemPrompt,
      maxTokens: 8192,
    });

    // 2. レスポンスをパース
    logger.info('=== TECHNIQUE EXTRACTION RESPONSE ===');
    logger.info(response.content);
    logger.info('=== END RESPONSE ===');
    const extractionResult = parseExtractionResponse(response.content);

    if (extractionResult.error) {
      logger.error('Failed to parse Gemini response for technique extraction');
      logger.error('Response length:', response.content.length);
      logger.error('First 1000 chars:', response.content.substring(0, 1000));
      return {
        techniques: [],
        problemType: null,
        overallDifficulty: null,
        error: extractionResult.error,
      };
    }

    // 3. テクニックを作成または既存テクニックを取得
    const techniques: Technique[] = [];

    for (const extracted of extractionResult.cards) {
      const technique = await getOrCreateTechnique(userId, extracted);
      techniques.push(technique);
    }

    return {
      techniques,
      problemType: extractionResult.problemType,
      overallDifficulty: extractionResult.overallDifficulty,
    };
  } catch (error) {
    logger.error('Failed to extract techniques from image:', error);
    return {
      techniques: [],
      problemType: null,
      overallDifficulty: null,
      error: 'テクニックの抽出に失敗しました',
    };
  }
}

// ==========================================
// ヘルパー
// ==========================================

/**
 * 既存テクニックを取得または新規作成
 */
async function getOrCreateTechnique(
  userId: string,
  extracted: ExtractedTechnique
): Promise<Technique> {
  // 同じパターンのテクニックが既に存在するか確認
  const existing = await findTechniqueByPattern(
    userId,
    extracted.parentSkillId,
    extracted.pattern
  );

  if (existing) {
    logger.debug(`Found existing technique: ${existing.cardName}`);
    return existing;
  }

  // 新規作成
  const newTechnique = await createTechnique({
    id: uuidv4(),
    userId,
    parentSkillId: extracted.parentSkillId,
    pattern: extracted.pattern,
    techniques: extracted.techniques,
    difficulty: extracted.difficulty,
    rarity: extracted.rarity || 'common',
    cardName: extracted.cardName,
    trigger: extracted.trigger,
    method: extracted.method,
    tip: extracted.tip,
    status: 'identified',
  });

  logger.info(`Created new technique: ${newTechnique.cardName}`);
  return newTechnique;
}
