// FILE: prototype/src/api/google-genai.ts
// ---------------------------------------------------------
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { ChatRequest, ChatResponse, ContentBlock } from '../types/chat.js';
import { logger } from '../utils/logger.js';
import { GeminiFallbackStrategy } from './gemini-fallback-strategy.js';

export const APP_MODEL_ID = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

// サービスアカウントキーのパス（firebase-admin.ts と同じロジック）
const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.resolve(process.cwd(), 'serviceAccountKey.json');

// クライアントキャッシュ (リージョンごとにキャッシュ)
const clients: Record<string, GoogleGenAI> = {};

function getClient(location: string = 'us-central1'): GoogleGenAI {
    // キャッシュがあれば返す
    if (clients[location]) return clients[location];

    const projectId = process.env.GCP_PROJECT_ID;

    if (!projectId) {
        logger.warn('GCP_PROJECT_ID is not set in environment variables. Vertex AI calls may fail.');
    }

    // サービスアカウントキーを読み込む
    let credentials: object | undefined;
    if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        try {
            credentials = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'));
            logger.debug(`Vertex AI: Using service account from ${SERVICE_ACCOUNT_PATH}`);
        } catch (error) {
            logger.error(`Failed to read service account key: ${error}`);
        }
    } else {
        // ADC (Application Default Credentials) に任せる
        // logger.warn(`Service account key not found at ${SERVICE_ACCOUNT_PATH}. Falling back to ADC.`);
    }

    // Initialize with project and location implies Vertex AI
    const client = new GoogleGenAI({
        project: projectId || 'MISSING_PROJECT_ID',
        location: location,
        vertexai: true,
        googleAuthOptions: credentials ? { credentials } : undefined,
    });

    clients[location] = client;
    return client;
}

/**
 * ChatMessage[] を Gemini Content 形式に変換（共通ヘルパー）
 */
function toGeminiContents(messages: ChatRequest['messages']) {
    return messages.map(msg => {
        const role = msg.role === 'assistant' ? 'model' : 'user';

        let parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

        if (typeof msg.content === 'string') {
            parts = [{ text: msg.content }];
        } else if (Array.isArray(msg.content)) {
            parts = msg.content.map((block: ContentBlock) => {
                if (block.type === 'text') {
                    return { text: block.text };
                } else if (block.type === 'image') {
                    return {
                        inlineData: {
                            mimeType: block.source.media_type,
                            data: block.source.data
                        }
                    };
                }
                return { text: '' };
            });
        }

        return { role, parts };
    });
}

/**
 * Fallback 戦略の共通セットアップ
 * @param thinkingDisabled true の場合、thinkingBudget: 0 で thinking を無効化
 */
function buildGenConfig(
    system: string | undefined,
    maxTokens: number,
    thinkingLevel?: string,
    thinkingDisabled?: boolean,
): Record<string, unknown> {
    const genConfig: Record<string, unknown> = {
        systemInstruction: system,
        maxOutputTokens: maxTokens,
    };
    if (thinkingDisabled) {
        genConfig.thinkingConfig = { thinkingBudget: 0 };
    } else if (thinkingLevel) {
        genConfig.thinkingConfig = { thinkingLevel };
    }
    return genConfig;
}

/**
 * Send a message to Google GenAI (Vertex AI) - 非ストリーミング版
 */
export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const { messages, maxTokens = 16384, system } = request;

    if (!messages || messages.length === 0) {
        throw new Error('Messages array is empty');
    }

    const contents = toGeminiContents(messages);
    const preferFlash = request.model?.toLowerCase().includes('flash') ?? false;
    const strategy = new GeminiFallbackStrategy(preferFlash);
    let lastError: Error | null = null;
    let config = strategy.getNextConfig();

    while (config) {
        try {
            const client = getClient(config.location);
            const modelName = config.model;

            // thinking: false が明示された場合、thinkingBudget: 0 で無効化
            const thinkingDisabled = request.thinking === false;

            logger.debug(`Sending request to Vertex AI (Attempt ${strategy.getAttemptCount()}: ${modelName} @ ${config.location}${thinkingDisabled ? ' thinking=OFF' : config.thinkingLevel ? ` thinking=${config.thinkingLevel}` : ''})`);

            const genConfig = buildGenConfig(system, maxTokens, config.thinkingLevel, thinkingDisabled);

            const startMs = performance.now();
            const response = await client.models.generateContent({
                model: modelName,
                contents: contents,
                config: genConfig,
            });
            const elapsedMs = Math.round(performance.now() - startMs);

            const responseParts = response.candidates?.[0]?.content?.parts || [];
            const responseText = responseParts
                .filter((p: Record<string, unknown>) => p.text && !p.thought)
                .map((p: Record<string, unknown>) => p.text)
                .join('') || '';
            const usage = response.usageMetadata;

            logger.info(`[CHAT] model=${modelName} ms=${elapsedMs} tokens_in=${usage?.promptTokenCount || 0} tokens_out=${usage?.candidatesTokenCount || 0}${thinkingDisabled ? ' thinking=OFF' : config.thinkingLevel ? ` thinking=${config.thinkingLevel}` : ''}`);

            return {
                content: responseText,
                model: modelName,
                usage: {
                    input_tokens: usage?.promptTokenCount || 0,
                    output_tokens: usage?.candidatesTokenCount || 0
                }
            };

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            lastError = error instanceof Error ? error : new Error(errorMessage);

            logger.warn(`❌ Failed attempt ${strategy.getAttemptCount()} (${config.model} @ ${config.location}): ${errorMessage}`);

            config = strategy.getNextConfig();

            if (config) {
                logger.info(`🔄 Retrying with next configuration: ${config.model} @ ${config.location}`);
            }
        }
    }

    logger.error('All fallback attempts failed.');
    throw lastError || new Error('All Vertex AI attempts failed');
}

/**
 * ストリーミング版イベント型
 */
export type StreamEvent =
    | { type: 'chunk'; text: string }
    | { type: 'done'; model: string; usage: { input_tokens: number; output_tokens: number } };

/**
 * Send a message to Google GenAI (Vertex AI) - ストリーミング版
 *
 * AsyncGenerator でチャンクを yield する。
 * フォールバック: ストリーム開始前のエラーのみ次のモデルに切り替え。
 */
export async function* sendMessageStream(request: ChatRequest): AsyncGenerator<StreamEvent> {
    const { messages, maxTokens = 16384, system } = request;

    if (!messages || messages.length === 0) {
        throw new Error('Messages array is empty');
    }

    const contents = toGeminiContents(messages);
    const preferFlash = request.model?.toLowerCase().includes('flash') ?? false;
    const strategy = new GeminiFallbackStrategy(preferFlash);
    let lastError: Error | null = null;
    let config = strategy.getNextConfig();

    while (config) {
        try {
            const client = getClient(config.location);
            const modelName = config.model;

            const thinkingDisabled = request.thinking === false;

            logger.debug(`[STREAM] Attempt ${strategy.getAttemptCount()}: ${modelName} @ ${config.location}${thinkingDisabled ? ' thinking=OFF' : config.thinkingLevel ? ` thinking=${config.thinkingLevel}` : ''}`);

            const genConfig = buildGenConfig(system, maxTokens, config.thinkingLevel, thinkingDisabled);

            const startMs = performance.now();
            const stream = await client.models.generateContentStream({
                model: modelName,
                contents: contents,
                config: genConfig,
            });

            // ストリーミング開始成功 — チャンクを yield
            let lastUsage: { promptTokenCount?: number; candidatesTokenCount?: number } | undefined;

            for await (const chunk of stream) {
                // thinking parts を除外してテキストのみ yield
                if (chunk.text) {
                    yield { type: 'chunk', text: chunk.text };
                }
                // usageMetadata は最終チャンクに含まれることが多い
                if (chunk.usageMetadata) {
                    lastUsage = chunk.usageMetadata;
                }
            }

            const elapsedMs = Math.round(performance.now() - startMs);
            logger.info(`[STREAM] model=${modelName} ms=${elapsedMs} tokens_in=${lastUsage?.promptTokenCount || 0} tokens_out=${lastUsage?.candidatesTokenCount || 0}${config.thinkingLevel ? ` thinking=${config.thinkingLevel}` : ''}`);

            yield {
                type: 'done',
                model: modelName,
                usage: {
                    input_tokens: lastUsage?.promptTokenCount || 0,
                    output_tokens: lastUsage?.candidatesTokenCount || 0,
                },
            };

            return; // 成功したので終了

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            lastError = error instanceof Error ? error : new Error(errorMessage);

            logger.warn(`❌ [STREAM] Failed attempt ${strategy.getAttemptCount()} (${config.model} @ ${config.location}): ${errorMessage}`);

            config = strategy.getNextConfig();

            if (config) {
                logger.info(`🔄 [STREAM] Retrying with next configuration: ${config.model} @ ${config.location}`);
            }
        }
    }

    logger.error('[STREAM] All fallback attempts failed.');
    throw lastError || new Error('All Vertex AI streaming attempts failed');
}
