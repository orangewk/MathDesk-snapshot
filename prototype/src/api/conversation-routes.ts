/**
 * Conversation APIエンドポイント
 * マルチデバイス対応のための会話スレッド管理
 */

import express, { Router, Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { validateToken } from '../services/user-service.js';
import {
  createConversation,
  getConversationWithMessages,
  listConversations,
  updateConversation,
  deleteConversation,
  getOrCreateSkillConversation,
  getMessages,
} from '../services/conversation-service.js';
import type { ConversationType, ConversationStatus } from '../data/firestore/conversation-repository.js';

// ================================
// 認証ミドルウェア
// ================================

interface AuthenticatedRequest extends Request {
  userId?: string;
  userNickname?: string;
}

async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: '認証が必要です',
    });
    return;
  }

  const token = authHeader.substring(7);
  const result = await validateToken(token);

  if ('error' in result) {
    res.status(401).json({
      success: false,
      error: result.error,
    });
    return;
  }

  req.userId = result.user.id;
  req.userNickname = result.user.nickname;

  next();
}

// ================================
// ルーター設定
// ================================

const router: Router = express.Router();

// 全エンドポイントに認証を適用
router.use(authMiddleware);

// ================================
// 会話スレッド一覧取得
// GET /api/conversations
// ================================

interface ListConversationsQuery {
  limit?: string;
  offset?: string;
  status?: ConversationStatus;
  skillId?: string;
}

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = req.query as ListConversationsQuery;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const offset = query.offset ? parseInt(query.offset, 10) : 0;

    if (isNaN(limit) || limit < 1 || limit > 100) {
      res.status(400).json({
        success: false,
        error: 'limitは1-100の範囲で指定してください',
      });
      return;
    }

    if (isNaN(offset) || offset < 0) {
      res.status(400).json({
        success: false,
        error: 'offsetは0以上の整数で指定してください',
      });
      return;
    }

    const result = await listConversations(req.userId!, {
      limit,
      offset,
      status: query.status,
      skillId: query.skillId,
    });

    res.json({
      success: true,
      data: {
        conversations: result.conversations,
        total: result.total,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    logger.error('Failed to list conversations', error);
    res.status(500).json({
      success: false,
      error: '会話一覧の取得に失敗しました',
    });
  }
});

// ================================
// 会話スレッド作成
// POST /api/conversations
// ================================

interface CreateConversationBody {
  title?: string;
  type?: ConversationType;
  skillId?: string;
}

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = req.body as CreateConversationBody;

    // バリデーション
    if (body.type && !['general', 'skill_learning', 'skill_assessment'].includes(body.type)) {
      res.status(400).json({
        success: false,
        error: 'typeは "general" または "skill_learning" を指定してください',
      });
      return;
    }

    if (body.type === 'skill_learning' && !body.skillId) {
      res.status(400).json({
        success: false,
        error: 'skill_learningタイプにはskillIdが必要です',
      });
      return;
    }

    if (body.title && body.title.length > 100) {
      res.status(400).json({
        success: false,
        error: 'タイトルは100文字以内で指定してください',
      });
      return;
    }

    const conversation = await createConversation(req.userId!, {
      title: body.title,
      type: body.type,
      skillId: body.skillId,
    });

    logger.info(`Conversation created: ${conversation.id} by user ${req.userId}`);

    res.status(201).json({
      success: true,
      data: {
        conversation,
      },
    });
  } catch (error) {
    logger.error('Failed to create conversation', error);
    res.status(500).json({
      success: false,
      error: '会話の作成に失敗しました',
    });
  }
});

// ================================
// スキル学習用会話の取得または作成
// POST /api/conversations/skill
// ================================

interface GetOrCreateSkillConversationBody {
  skillId: string;
  skillName?: string;
}

router.post('/skill', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = req.body as GetOrCreateSkillConversationBody;

    if (!body.skillId) {
      res.status(400).json({
        success: false,
        error: 'skillIdは必須です',
      });
      return;
    }

    const result = await getOrCreateSkillConversation(
      req.userId!,
      body.skillId,
      body.skillName
    );

    if (result.isNew) {
      logger.info(`Skill conversation created: ${result.conversation.id} for skill ${body.skillId}`);
    }

    res.status(result.isNew ? 201 : 200).json({
      success: true,
      data: {
        conversation: result.conversation,
        isNew: result.isNew,
      },
    });
  } catch (error) {
    logger.error('Failed to get or create skill conversation', error);
    res.status(500).json({
      success: false,
      error: 'スキル学習用会話の取得/作成に失敗しました',
    });
  }
});

// ================================
// 会話スレッド詳細取得
// GET /api/conversations/:id
// ================================

interface GetConversationQuery {
  messagesLimit?: string;
  messagesBefore?: string;
}

router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const query = req.query as GetConversationQuery;

    const messagesLimit = query.messagesLimit
      ? parseInt(query.messagesLimit, 10)
      : 50;
    const messagesBefore = query.messagesBefore
      ? new Date(query.messagesBefore)
      : undefined;

    if (isNaN(messagesLimit) || messagesLimit < 1 || messagesLimit > 200) {
      res.status(400).json({
        success: false,
        error: 'messagesLimitは1-200の範囲で指定してください',
      });
      return;
    }

    const result = await getConversationWithMessages(id, req.userId!, {
      limit: messagesLimit,
      before: messagesBefore,
    });

    if (!result) {
      res.status(404).json({
        success: false,
        error: '会話が見つかりません',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        conversation: result.conversation,
        messages: result.messages,
        hasMoreMessages: result.hasMoreMessages,
      },
    });
  } catch (error) {
    logger.error('Failed to get conversation', error);
    res.status(500).json({
      success: false,
      error: '会話の取得に失敗しました',
    });
  }
});

// ================================
// 会話スレッド更新
// PATCH /api/conversations/:id
// ================================

interface UpdateConversationBody {
  title?: string | null;
  status?: ConversationStatus;
}

router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body as UpdateConversationBody;

    // バリデーション
    if (body.status && !['active', 'archived'].includes(body.status)) {
      res.status(400).json({
        success: false,
        error: 'statusは "active" または "archived" を指定してください',
      });
      return;
    }

    if (body.title !== undefined && body.title !== null && body.title.length > 100) {
      res.status(400).json({
        success: false,
        error: 'タイトルは100文字以内で指定してください',
      });
      return;
    }

    const conversation = await updateConversation(id, req.userId!, body);

    if (!conversation) {
      res.status(404).json({
        success: false,
        error: '会話が見つかりません',
      });
      return;
    }

    logger.info(`Conversation updated: ${id}`);

    res.json({
      success: true,
      data: {
        conversation,
      },
    });
  } catch (error) {
    logger.error('Failed to update conversation', error);
    res.status(500).json({
      success: false,
      error: '会話の更新に失敗しました',
    });
  }
});

// ================================
// 会話スレッド削除
// DELETE /api/conversations/:id
// ================================

router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await deleteConversation(id, req.userId!);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: '会話が見つかりません',
      });
      return;
    }

    logger.info(`Conversation deleted: ${id}`);

    res.json({
      success: true,
      data: {
        deleted: true,
      },
    });
  } catch (error) {
    logger.error('Failed to delete conversation', error);
    res.status(500).json({
      success: false,
      error: '会話の削除に失敗しました',
    });
  }
});

// ================================
// メッセージ一覧取得（ページネーション用）
// GET /api/conversations/:id/messages
// ================================

interface GetMessagesQuery {
  limit?: string;
  before?: string;
}

router.get('/:id/messages', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const query = req.query as GetMessagesQuery;

    const limit = query.limit ? parseInt(query.limit, 10) : 50;
    const before = query.before ? new Date(query.before) : undefined;

    if (isNaN(limit) || limit < 1 || limit > 200) {
      res.status(400).json({
        success: false,
        error: 'limitは1-200の範囲で指定してください',
      });
      return;
    }

    const result = await getMessages(id, req.userId!, { limit, before });

    if (!result) {
      res.status(404).json({
        success: false,
        error: '会話が見つかりません',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        messages: result.messages,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    logger.error('Failed to get messages', error);
    res.status(500).json({
      success: false,
      error: 'メッセージの取得に失敗しました',
    });
  }
});

export default router;
