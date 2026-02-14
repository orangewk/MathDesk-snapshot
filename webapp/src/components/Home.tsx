/**
 * ホーム画面コンポーネント
 * スレッド一覧の表示と管理
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  listConversations,
  deleteConversation,
} from '../services/conversation-service';
import { getDailyAdvice, type DailyAdvice } from '../services/advisor-service';
import type { ConversationWithPreview } from '../types/conversation-types';
import type { ImageSource } from '../types/chat-types';
import { processImage, isSupportedImageType } from '../utils/image-utils';
import { pickGuideImage } from '../utils/guide-images';
import './Home.css';

interface HomeProps {
  onSelectConversation: (conversationId: string) => void;
  onNavigateToSkillTree: () => void;
  onStartSkillLearning: (skillId: string, skillName: string) => void;
  onStudyWithImage?: (image: ImageSource) => void;
  isFirstVisit: boolean;
}

export const Home: React.FC<HomeProps> = ({
  onSelectConversation,
  onNavigateToSkillTree,
  onStartSkillLearning,
  onStudyWithImage,
  isFirstVisit,
}) => {
  const [conversations, setConversations] = useState<ConversationWithPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [advice, setAdvice] = useState<DailyAdvice | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [guideImg] = useState(() =>
    pickGuideImage(isFirstVisit ? 'homeFirstVisit' : 'homeReturn')
  );

  // アドバイザーからの今日のオススメを取得
  useEffect(() => {
    let cancelled = false;
    const loadAdvice = async () => {
      setAdviceLoading(true);
      try {
        const data = await getDailyAdvice();
        if (!cancelled) setAdvice(data);
      } catch {
        // アドバイス取得失敗はサイレントに無視（必須機能ではない）
      } finally {
        if (!cancelled) setAdviceLoading(false);
      }
    };
    loadAdvice();
    return () => { cancelled = true; };
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await listConversations({ limit: 50 });
      setConversations(result.conversations);
    } catch (err) {
      setError(err instanceof Error ? err.message : '読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleDelete = async (
    e: React.MouseEvent,
    conversationId: string
  ) => {
    e.stopPropagation();

    if (!confirm('この会話を削除しますか？')) {
      return;
    }

    try {
      setDeletingId(conversationId);
      await deleteConversation(conversationId);
      setConversations((prev) =>
        prev.filter((c) => c.id !== conversationId)
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : '削除に失敗しました');
    } finally {
      setDeletingId(null);
    }
  };

  // 画像ファイル選択ハンドラ
  const handleImageButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // リセット
    e.target.value = '';
    setImageError(null);

    if (!isSupportedImageType(file)) {
      setImageError('対応形式: JPEG, PNG, GIF, WebP');
      return;
    }

    setImageProcessing(true);
    try {
      const processed = await processImage(file);
      onStudyWithImage?.(processed);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : '画像の処理に失敗しました');
    } finally {
      setImageProcessing(false);
    }
  }, [onStudyWithImage]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (days === 1) {
      return '昨日';
    } else if (days < 7) {
      return `${days}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getConversationTitle = (conversation: ConversationWithPreview) => {
    if (conversation.title) {
      return conversation.title;
    }
    if (conversation.type === 'skill_learning' && conversation.skillId) {
      return `スキル学習: ${conversation.skillId}`;
    }
    return '新しい会話';
  };

  return (
    <div className="home">
      {/* 左カラム: アバター + アクション */}
      <div className="home-actions-col">
        <div className="home-guide">
          <img
            src={guideImg}
            alt="津田マセマ先生"
            className="home-guide-avatar"
          />
        </div>

        {/* メイン導線: 単元を選んで学ぶ */}
        <div className="home-featured-action">
          <button
            className="home-action-button featured"
            onClick={onNavigateToSkillTree}
          >
            <span className="action-icon">📚</span>
            単元を選んで学ぶ
          </button>
        </div>

        <div className="home-actions">
          {onStudyWithImage && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageSelect}
                disabled={imageProcessing}
                className="file-input-hidden"
              />
              <button
                className="home-action-button secondary"
                onClick={handleImageButtonClick}
                disabled={imageProcessing}
              >
                <span className="action-icon">🔍</span>
                {imageProcessing ? '処理中...' : <>この問題を<br />教えて</>}
              </button>
              {imageError && (
                <div className="image-error-message">{imageError}</div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 右カラム: ツダ先生の発話 + 会話履歴 */}
      <div className="conversations-section">
        {/* ツダ先生のセリフ（greeting + アドバイス統合） */}
        {adviceLoading && (
          <div className="guide-speech guide-speech--loading">
            <div className="guide-speech__bubble">
              <div className="guide-speech__loading">...</div>
            </div>
          </div>
        )}
        {advice && !adviceLoading && (
          <div className="guide-speech">
            <div className="guide-speech__bubble">
              {advice.greeting && (
                <p className="guide-speech__greeting">{advice.greeting}</p>
              )}
              <p className="guide-speech__text">{advice.advice}</p>
              {advice.recommendedSkills.length > 0 && (
                <div className="guide-speech__skills">
                  {advice.recommendedSkills.map((skill) => (
                    <button
                      key={skill.skillId}
                      className={`advisor-skill-chip advisor-skill-chip--${skill.type}`}
                      onClick={() => onStartSkillLearning(skill.skillId, skill.skillName)}
                      title={skill.reason}
                    >
                      <span className="advisor-skill-chip__icon">
                        {skill.type === 'continue' ? '▶' : skill.type === 'review' ? '↺' : '★'}
                      </span>
                      {skill.skillName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <h2>会話履歴</h2>

        {loading && (
          <div className="conversations-loading">読み込み中...</div>
        )}

        {error && (
          <div className="conversations-error">
            <p>{error}</p>
            <button onClick={loadConversations}>再試行</button>
          </div>
        )}

        {!loading && !error && conversations.length === 0 && (
          <div className="conversations-empty">
            <p>会話履歴がありません</p>
            <p className="conversations-empty-hint">
              上のボタンから学習を始めましょう
            </p>
          </div>
        )}

        {!loading && !error && conversations.length > 0 && (
          <ul className="conversations-list">
            {conversations.map((conversation) => {
              const isCompleted = conversation.status === 'completed';
              return (
                <li
                  key={conversation.id}
                  className={`conversation-item ${conversation.type === 'skill_learning' ? 'skill-learning' : ''
                    } ${deletingId === conversation.id ? 'deleting' : ''} ${isCompleted ? 'completed' : ''}`}
                  onClick={() => !isCompleted && onSelectConversation(conversation.id)}
                  style={isCompleted ? { cursor: 'default', opacity: 0.7 } : undefined}
                >
                  <div className="conversation-content">
                    <div className="conversation-header">
                      <span className="conversation-title">
                        {getConversationTitle(conversation)}
                      </span>
                      {isCompleted && (
                        <span className="conversation-badge completed-badge">✓ 完了</span>
                      )}
                      {!isCompleted && conversation.type === 'skill_learning' && (
                        <span className="conversation-badge">スキル学習</span>
                      )}
                    </div>
                    {conversation.preview && (
                      <p className="conversation-preview">
                        {conversation.preview}
                      </p>
                    )}
                    <div className="conversation-meta">
                      <span className="conversation-count">
                        {conversation.messageCount}件のメッセージ
                      </span>
                      <span className="conversation-date">
                        {formatDate(conversation.lastMessageAt || conversation.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <button
                    className="conversation-delete"
                    onClick={(e) => handleDelete(e, conversation.id)}
                    disabled={deletingId === conversation.id}
                    aria-label="削除"
                  >
                    {deletingId === conversation.id ? '...' : '×'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Home;
