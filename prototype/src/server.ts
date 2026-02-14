// FILE: prototype/src/server.ts
// ---------------------------------------------------------
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sendMessage, sendMessageStream, APP_MODEL_ID } from './api/google-genai.js';
import { TagFilter, DetectedTag, stripTags } from './utils/tag-filter.js';
import { ChatMessage } from './types/chat.js';
import authRoutes from './api/auth-routes.js';
import studentRoutes from './api/student-routes.js';
import skillRoutes from './api/skill-routes.js';
import conversationRoutes from './api/conversation-routes.js';
import logRoutes from './api/log-routes.js';
import techniqueRoutes from './api/technique-routes.js';
import practiceRoutes from './api/practice-routes.js';
import advisorRoutes from './api/advisor-routes.js';

import { validateToken } from './services/user-service.js';
import {
  createConversation,
  addMessage,
  getConversation,
  updateConversation,
} from './services/conversation-service.js';
import { buildSystemPrompt } from './prompts/prompt-builder.js';
import { buildStudentContext, buildMinimalStudentContext } from './prompts/context-builder.js';
import { getStudentModel, updateStudentModel, addLearningSession } from './services/student-model-service.js';
import { processSkillUpdate, rankUpSkill } from './services/skill-recommendation-service.js';
import { invalidateAdviceCache } from './services/advisor-service.js';
import { v4 as uuidv4 } from 'uuid';
import {
  recordProblemAttempt,
  detectProblemResultTag,
  removeProblemResultTag,
} from './services/problem-attempt-service.js';
import { getSkillById } from './data/skill-definitions.js';
import type { ErrorType } from './data/backtrack-rules.js';
import { logger } from './utils/logger.js';

// 環境変数の読み込み
dotenv.config();


const app = express();
const PORT = process.env.PORT || 8000;

// ミドルウェア
// 本番: ALLOWED_ORIGINS 環境変数 or 同一オリジンのみ、開発: 全オリジン許可
const corsOrigin = process.env.NODE_ENV === 'production'
  ? process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : false  // 同一オリジンのみ（Cloud Run では SPA 同梱）
  : true;    // 開発環境: 全許可（スマホ実機テスト等）

app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' })); // 画像アップロード用に大きめに設定

// #185: JSON パースエラー時に HTML ではなく JSON レスポンスを返す
app.use((err: SyntaxError & { status?: number; type?: string }, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  next(err);
});

// Static file serving for production (Cloud Run)
if (process.env.NODE_ENV === 'production') {
  const publicPath = process.env.PUBLIC_DIR || 'public';
  logger.info(`Serving static files from ${publicPath}`);
  app.use(express.static(publicPath));
}

// リクエストログ (debugレベル)
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// 認証ルーター
app.use('/api/auth', authRoutes);

// Student Modelルーター
app.use('/api/student', studentRoutes);

// スキルルーター
app.use('/api/skills', skillRoutes);

// 会話ルーター
app.use('/api/conversations', conversationRoutes);

// ログルーター
app.use('/api/logs', logRoutes);

// テクニックルーター
app.use('/api/techniques', techniqueRoutes);

// 練習問題ルーター
app.use('/api/practice', practiceRoutes);

// アドバイザールーター
app.use('/api/advisor', advisorRoutes);

// ヘルスチェック
app.get('/api/health', (req, res) => {
  logger.debug('Health check request received');
  res.json({
    status: 'ok',
    message: 'MathDesk API Server is running',
    mode: 'Guide AI (Gemini 3 Pro)',
    model: APP_MODEL_ID,
    projectId: process.env.GCP_PROJECT_ID || 'NOT SET'
  });
});

// Gemini API接続テスト
app.get('/api/test-genai', async (req, res) => {
  try {
    logger.info('Testing Gemini API connection...');

    const testResponse = await sendMessage({
      messages: [
        {
          role: 'user',
          content: 'こんにちは！あなたは誰ですか？簡潔に答えてください。'
        }
      ],
      model: APP_MODEL_ID,
      maxTokens: 200
    });

    logger.info('Gemini API test successful');

    res.json({
      status: 'success',
      message: 'Gemini API connection test successful',
      response: testResponse.content,
      model: testResponse.model,
      usage: testResponse.usage
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Gemini API test failed:', errorMessage);
    res.status(500).json({
      status: 'error',
      message: 'Gemini API connection test failed',
      error: errorMessage,
    });
  }
});

// 判定モードの種類
type AssessmentMode = 'ai_generated' | 'textbook_required';

// チャットリクエストの型
interface ChatApiRequest {
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
  studentContext?: {
    userId: string;
    currentSkillId?: string;
    recentErrorType?: ErrorType;
  };
  // 会話永続化オプション
  conversationId?: string;
  saveMessages?: boolean;
  // 習得判定モード
  assessmentMode?: AssessmentMode;
}

// チャットレスポンスの型（拡張）
interface ChatApiResponse {
  content: string;
  model: string;
  usage?: { input_tokens: number; output_tokens: number };
  conversationId?: string;
  userMessageId?: string;
  assistantMessageId?: string;
  conversationStatus?: string;
}

// ===============================================
// タグ処理ヘルパー（ストリーミング・非ストリーミング共通）
// TagFilter が検出したタグに対して副作用（DB更新等）を実行する
// ===============================================
async function processDetectedTags(
  tags: DetectedTag[],
  rawContent: string,
  opts: {
    userId?: string;
    conversationId?: string;
    currentSkillId?: string;
  }
): Promise<{
  skillUpdateMeta: any;
  isOffTopic: boolean;
  conversationCompleted: boolean;
}> {
  const { userId, conversationId, currentSkillId } = opts;
  let skillUpdateMeta: any = undefined;
  let isOffTopic = false;
  let conversationCompleted = false;

  for (const tag of tags) {
    // SKILL_MASTERY / CARD_MASTERY
    if ((tag.type === 'SKILL_MASTERY' || tag.type === 'CARD_MASTERY') && userId) {
      const rawId = tag.params[0] || '';
      const score = parseInt(tag.params[1] || '0', 10);

      let skillId: string | undefined;
      if (rawId.startsWith('I-')) {
        skillId = rawId;
      } else if (rawId && rawId.includes('-') && rawId.length > 10) {
        try {
          const { findTechniqueById } = await import('./data/firestore/technique-repository.js');
          const card = await findTechniqueById(rawId);
          skillId = card?.parentSkillId;
        } catch (err) {
          logger.warn(`Failed to resolve cardId ${rawId} to skillId:`, err);
        }
      }
      if (!skillId) skillId = currentSkillId;

      logger.info(`Skill mastery detected: skillId=${skillId}, score=${score}`);

      if (skillId) {
        try {
          if (score >= 70) {
            const studentModel = await getStudentModel(userId);
            if (studentModel) {
              const result = rankUpSkill(studentModel, skillId);
              await updateStudentModel(result.updatedModel);
              skillUpdateMeta = {
                type: 'skill_mastery', skillId, score,
                skillName: getSkillById(skillId)?.name || skillId,
                newRank: result.newRank, mastered: result.mastered,
              };
              logger.info(`Skill ${skillId} rank up → rank ${result.newRank}, mastered=${result.mastered}`);
              if (result.mastered && conversationId) {
                await updateConversation(conversationId, userId, { status: 'completed' });
                conversationCompleted = true;
                logger.info(`Conversation ${conversationId} marked as completed (skill mastered)`);
              }
              // スキル状態が変わったのでアドバイスキャッシュを無効化
              invalidateAdviceCache(userId);
            }
          } else {
            logger.info(`Skill mastery score ${score} < 70, skipping rank up`);
          }
        } catch (err) {
          logger.error('Failed to update skill mastery:', err);
        }
      }
    }

    // MASTERY_SCORE (レガシー)
    if (tag.type === 'MASTERY_SCORE' && userId && currentSkillId) {
      const score = parseInt(tag.params[0] || '0', 10);
      logger.info(`[DEPRECATED] Mastery score detected: ${score} for skill ${currentSkillId}`);
      try {
        const currentModel = await getStudentModel(userId);
        if (currentModel) {
          const result = processSkillUpdate(currentModel, currentSkillId, score);
          await updateStudentModel(result.updatedModel);
          skillUpdateMeta = {
            type: 'legacy_mastery', skillId: currentSkillId, score,
            skillName: getSkillById(currentSkillId)?.name || currentSkillId,
            oldStatus: result.mastered ? 'learning' : result.newStatus.status,
            newStatus: result.newStatus.status,
            mastered: result.mastered, skillUpdated: result.skillUpdated,
          };
          if (conversationId) {
            await updateConversation(conversationId, userId, { status: 'completed' });
            conversationCompleted = true;
          }
        }
      } catch (err) {
        logger.error('Failed to update skill mastery:', err);
      }
    }

    // PROBLEM_RESULT
    if (tag.type === 'PROBLEM_RESULT' && userId) {
      const isCorrect = tag.params[0] === 'correct';
      const skillId = tag.params[1] || currentSkillId || '';
      logger.info(`Problem result detected: ${isCorrect ? 'correct' : 'incorrect'} for skill ${skillId}`);
      try {
        const attemptResult = await recordProblemAttempt({
          userId, skillId, isCorrect,
          problemSource: 'reference_book',
          conversationId,
        });

        // 学習セッションを記録（アドバイザーの learningHistory に反映）
        await addLearningSession(userId, {
          id: uuidv4(),
          skillId,
          startedAt: new Date().toISOString(),
          endedAt: new Date().toISOString(),
          durationMinutes: 0,
          questionsAttempted: 1,
          questionsCorrect: isCorrect ? 1 : 0,
          mistakeTypes: [],
          notes: '',
        });

        if (attemptResult.skillMastery.mastered) {
          skillUpdateMeta = {
            skillId, mastered: true,
            skillName: getSkillById(skillId)?.name || skillId,
            reason: attemptResult.skillMastery.reason,
            stats: attemptResult.stats,
          };
          logger.info(`Skill mastered via problem attempts: ${skillId}`);
          invalidateAdviceCache(userId);
        }
      } catch (err) {
        logger.error('Failed to record problem attempt:', err);
      }
    }

    // OFF_TOPIC
    if (tag.type === 'OFF_TOPIC') {
      isOffTopic = true;
      logger.info('Off-topic message detected, Gemini redirect suggested');
    }
  }

  return { skillUpdateMeta, isOffTopic, conversationCompleted };
}

// ===============================================
// 会話永続化ヘルパー
// ===============================================
async function persistConversation(
  messages: ChatMessage[],
  aiContent: string,
  opts: {
    userId: string;
    conversationId?: string;
    currentSkillId?: string;
  }
): Promise<{
  conversationId?: string;
  userMessageId?: string;
  assistantMessageId?: string;
}> {
  const result: { conversationId?: string; userMessageId?: string; assistantMessageId?: string } = {};

  try {
    let targetConversationId = opts.conversationId;

    if (!targetConversationId) {
      const newConversation = await createConversation(opts.userId, {
        type: opts.currentSkillId ? 'skill_learning' : 'general',
        skillId: opts.currentSkillId,
      });
      targetConversationId = newConversation.id;
      logger.debug(`New conversation created: ${targetConversationId}`);
    } else {
      const existing = await getConversation(targetConversationId, opts.userId);
      if (!existing) {
        logger.warn(`Conversation ${targetConversationId} not found or not owned by user ${opts.userId}`);
        targetConversationId = undefined;
      }
    }

    if (targetConversationId) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage && lastUserMessage.role === 'user') {
        let textContent: string;
        let hasImages = false;
        let imageCount = 0;

        if (typeof lastUserMessage.content === 'string') {
          textContent = lastUserMessage.content;
        } else if (Array.isArray(lastUserMessage.content)) {
          const textParts = lastUserMessage.content
            .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
            .map((part) => part.text);
          textContent = textParts.join('\n');
          const imageParts = lastUserMessage.content.filter((part) => part.type === 'image');
          hasImages = imageParts.length > 0;
          imageCount = imageParts.length;
          if (hasImages) textContent += `\n[画像${imageCount}枚を送信しました]`;
        } else {
          textContent = '';
        }

        const userMsg = await addMessage(targetConversationId, opts.userId, 'user', textContent, {
          contentType: hasImages ? 'mixed' : 'text',
          metadata: hasImages ? { hasImages, imageCount } : undefined,
        });
        if (userMsg) result.userMessageId = userMsg.id;
      }

      const assistantMsg = await addMessage(targetConversationId, opts.userId, 'assistant', aiContent);
      if (assistantMsg) result.assistantMessageId = assistantMsg.id;
      result.conversationId = targetConversationId;
    }
  } catch (saveError) {
    logger.error('Failed to save messages to conversation', saveError);
  }

  return result;
}

// ===============================================
// SSE ヘルパー
// ===============================================
function sendSSE(res: express.Response, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ===============================================
// チャットエンドポイント（SSE ストリーミング対応）
// ===============================================
app.post('/api/chat', async (req, res) => {
  try {
    const {
      messages,
      model,
      maxTokens,
      studentContext,
      conversationId,
      saveMessages = true,
      assessmentMode,
    } = req.body as ChatApiRequest;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages is required and must be an array' });
    }

    // #187: 空配列チェック
    if (messages.length === 0) {
      return res.status(400).json({ error: 'messages must not be empty' });
    }

    // #184: 最後のメッセージの content が空でないことを確認
    const lastMessage = messages[messages.length - 1];
    if (typeof lastMessage.content === 'string' && !lastMessage.content.trim()) {
      return res.status(400).json({ error: 'message content must not be empty' });
    }

    // 会話履歴のガードレール: 直近30ターン（60メッセージ）のみ保持
    const MAX_MESSAGES = 60;
    const trimmedMessages = messages.length > MAX_MESSAGES
      ? messages.slice(-MAX_MESSAGES)
      : messages;

    // 認証チェック（必須）— #183 fix
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    const token = authHeader.substring(7);
    const tokenResult = await validateToken(token);
    if (!tokenResult.success) {
      const { error: authError } = tokenResult as { success: false; error: string };
      return res.status(401).json({ error: authError });
    }

    const userId = tokenResult.user.id;

    // 会話が完了している場合は新規メッセージを拒否
    if (conversationId && userId) {
      const conv = await getConversation(conversationId, userId);
      if (conv && conv.status === 'completed') {
        return res.status(403).json({ error: 'This conversation is completed and cannot be continued.' });
      }
    }

    // システムプロンプトを生成
    let systemPrompt: string;

    const hasImage = trimmedMessages.some((m: any) =>
      Array.isArray(m.content) && m.content.some((b: any) => b.type === 'image')
    );

    const promptOptions: import('./prompts/types.js').PromptBuildOptions = {
      ...(assessmentMode && { assessmentMode }),
      ...(hasImage && { includeImageProtocol: true }),
    };

    // userId は認証済みのため必ず存在する
    const studentModel = await getStudentModel(userId);
    if (studentModel) {
      const context = buildStudentContext(
        studentModel,
        studentContext?.currentSkillId,
        studentContext?.recentErrorType
      );
      systemPrompt = buildSystemPrompt(context, promptOptions);
      logger.debug(`System prompt generated for user: ${userId} (independence level: ${context.independenceLevel})${assessmentMode ? ` [Assessment Mode: ${assessmentMode}]` : ''}`);
    } else {
      const context = buildMinimalStudentContext();
      systemPrompt = buildSystemPrompt(context, promptOptions);
      logger.debug(`Minimal system prompt generated for new user: ${userId}${assessmentMode ? ` [Assessment Mode: ${assessmentMode}]` : ''}`);
    }

    // モデルルーティング
    const routedModel = assessmentMode ? undefined : 'flash';
    logger.info(`[ROUTE] ${assessmentMode ? `assessment(${assessmentMode}) → Pro High` : 'default → Flash'}`);

    // --- SSE ストリーミング ---
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // nginx proxy buffering 無効化
    });
    res.flushHeaders();

    // クライアント切断検知（MEMORY: res.on('close') を使う）
    let clientDisconnected = false;
    res.on('close', () => { clientDisconnected = true; });

    // TagFilter: タグをバッファリングし、クリーンなテキストのみ SSE で送信
    const tagFilter = new TagFilter((text) => {
      if (!clientDisconnected) {
        sendSSE(res, 'chunk', { text });
      }
    });

    // Gemini ストリーミング
    const fullContentParts: string[] = [];
    let streamModel = '';
    let streamUsage = { input_tokens: 0, output_tokens: 0 };

    try {
      for await (const event of sendMessageStream({
        messages: trimmedMessages,
        model: routedModel ?? model,
        maxTokens,
        system: systemPrompt,
      })) {
        if (clientDisconnected) break;

        if (event.type === 'chunk') {
          fullContentParts.push(event.text);
          tagFilter.process(event.text);
        } else if (event.type === 'done') {
          streamModel = event.model;
          streamUsage = event.usage;
        }
      }
    } catch (streamError) {
      // ストリーミング途中のエラー（内部詳細を漏洩させない）
      const errMsg = streamError instanceof Error ? streamError.message : 'Unknown error';
      logger.error('Stream error:', errMsg);
      if (!clientDisconnected) {
        sendSSE(res, 'error', { error: 'AI応答の生成中にエラーが発生しました。しばらくしてから再度お試しください。' });
        res.end();
      }
      return;
    }

    // バッファに残ったテキストを flush
    tagFilter.end();

    if (clientDisconnected) {
      logger.info('Client disconnected during streaming');
      return;
    }

    // --- ストリーム完了後の処理 ---
    const rawContent = fullContentParts.join('');
    const detectedTags = tagFilter.getDetectedTags();

    // タグ処理（スキルマスタリー、問題結果、OFF_TOPIC）
    const tagResult = await processDetectedTags(detectedTags, rawContent, {
      userId,
      conversationId,
      currentSkillId: studentContext?.currentSkillId,
    });

    // Firestore 永続化（タグを除去したクリーンなテキストを保存）
    const cleanContent = stripTags(rawContent);
    let persistResult: { conversationId?: string; userMessageId?: string; assistantMessageId?: string } = {};
    if (saveMessages) {
      persistResult = await persistConversation(messages, cleanContent, {
        userId,
        conversationId,
        currentSkillId: studentContext?.currentSkillId,
      });
    }

    // done イベント送信（メタデータ）
    sendSSE(res, 'done', {
      model: streamModel,
      usage: streamUsage,
      conversationId: persistResult.conversationId || conversationId,
      userMessageId: persistResult.userMessageId,
      assistantMessageId: persistResult.assistantMessageId,
      skillUpdate: tagResult.skillUpdateMeta,
      offTopic: tagResult.isOffTopic || undefined,
      conversationStatus: tagResult.conversationCompleted ? 'completed' : undefined,
    });

    res.end();

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Chat API Error:', errorMessage);
    // SSE ヘッダーが送信済みかどうかで分岐（内部詳細を漏洩させない）
    if (res.headersSent) {
      sendSSE(res, 'error', { error: 'リクエストの処理中にエラーが発生しました。' });
      res.end();
    } else {
      res.status(500).json({ error: 'リクエストの処理中にエラーが発生しました。' });
    }
  }
});

// Catch-all route for SPA (must be after all API routes)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    // APIリクエストは除外（万が一ここまで来た場合）
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Not Found' });
    }

    const publicPath = process.env.PUBLIC_DIR || 'public';
    // index.htmlを返す（SPAルーティング）
    res.sendFile('index.html', { root: publicPath });
  });
}

// サーバー起動（0.0.0.0でリッスン: スマホからのアクセス対応）
const HOST = '0.0.0.0';
app.listen(Number(PORT), HOST, () => {
  logger.info(`MathDesk API Server running on http://${HOST}:${PORT}`);
  logger.info(`Local access: http://localhost:${PORT}`);
  logger.info(`Network access: http://<YOUR_LOCAL_IP>:${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/api/health`);
  logger.info(`Mode: Guide AI (Flash default, Pro High for assessment)`);
  logger.info(`Project ID: ${process.env.GCP_PROJECT_ID || 'NOT SET'}`);
});

// グレースフルシャットダウン
function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully...`);
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));