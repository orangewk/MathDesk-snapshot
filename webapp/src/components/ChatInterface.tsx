// FILE: webapp/src/components/ChatInterface.tsx
// ==========================================
/**
 * チャットインターフェースコンポーネント
 * サーバー側で会話を永続化
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage, ImageSource, ContentBlock } from '../types/chat-types';
import { getMessageText, getMessageImages } from '../types/chat-types';
import { sendChatMessageStream, type ChatOptions } from '../services/api-service';
import { getConversation } from '../services/conversation-service';
import { invalidateCache } from '../services/student-service';
import type { Message } from '../types/conversation-types';
import { MathText } from './MathDisplay';
import { LatexHelpPanel } from './LatexHelpPanel';
import { LearningTopics } from './LearningTopics';
import { ToastNotification } from './ToastNotification';
import { MathKeypad } from './MathKeypad';
import { ImageUpload } from './ImageUpload';
import type { LearningTopic } from '../data/learning-topics';
import { copyToClipboard } from '../utils/clipboard-utils';
import { FeedbackOverlay } from './FeedbackOverlay';
import { ImageModal } from './ImageModal';
import { playCorrectSound } from '../utils/sound-effect';
import guideThinkingImg from '../assets/images/guide-thinking.png';
import guideWorriedImg from '../assets/images/guide-worried.png';
import guideNervousImg from '../assets/images/guide-nervous.png';
import { playTsutaVoice } from '../utils/voice';
import { useVoiceInput } from '../hooks/useVoiceInput';
import './ChatInterface.css';

// セッション中に保持する画像付きメッセージの上限
const MAX_IMAGE_MESSAGES = 5;

/**
 * メッセージから画像を除外してテキストのみのメッセージに変換
 * (localStorage保存用)
 */
function stripImagesFromMessage(message: ChatMessage): ChatMessage {
  if (typeof message.content === 'string') {
    return message;
  }

  // ContentBlock[]の場合、テキストブロックのみを抽出
  const textBlocks = message.content.filter(
    (block): block is { type: 'text'; text: string } => block.type === 'text'
  );

  if (textBlocks.length === 0) {
    // テキストがない場合は「[画像]」というプレースホルダーを設定
    return {
      ...message,
      content: '[画像を送信しました]'
    };
  }

  if (textBlocks.length === 1) {
    return {
      ...message,
      content: textBlocks[0].text
    };
  }

  // 複数のテキストブロックがある場合は結合
  return {
    ...message,
    content: textBlocks.map(b => b.text).join('\n')
  };
}

/**
 * メッセージ配列から画像付きメッセージの数をカウント
 */
function countImageMessages(messages: ChatMessage[]): number {
  return messages.filter(msg => {
    if (typeof msg.content === 'string') return false;
    return msg.content.some(block => block.type === 'image');
  }).length;
}

/**
 * 古い画像付きメッセージから画像を除去して上限を維持
 */
function limitImageMessages(messages: ChatMessage[], maxImages: number): ChatMessage[] {
  let imageCount = 0;
  // 新しいメッセージから逆順で処理し、上限を超えた古い画像を除去
  const reversed = [...messages].reverse();
  const processed = reversed.map(msg => {
    if (typeof msg.content === 'string') return msg;

    const hasImage = msg.content.some(block => block.type === 'image');
    if (!hasImage) return msg;

    imageCount++;
    if (imageCount > maxImages) {
      // 上限超過：画像を除去してテキストのみに
      return stripImagesFromMessage(msg);
    }
    return msg;
  });

  return processed.reverse();
}

/**
 * サーバーから読み込んだメッセージに、セッション中の画像を復元してマージ
 */
function mergeMessagesPreservingImages(
  currentMessages: ChatMessage[],
  serverMessages: ChatMessage[]
): ChatMessage[] {
  // 現在のメッセージから画像付きのものをインデックスでマップ
  const imagesMap = new Map<number, { type: 'image'; source: ImageSource }[]>();
  currentMessages.forEach((msg, index) => {
    const images = getMessageImages(msg);
    if (images.length > 0) {
      imagesMap.set(index, images);
    }
  });

  // 画像がなければそのままサーバーメッセージを返す
  if (imagesMap.size === 0) {
    return serverMessages;
  }

  // サーバーメッセージに画像をマージ
  return serverMessages.map((msg, index) => {
    const images = imagesMap.get(index);
    if (images && images.length > 0) {
      // 画像を復元
      const textContent = typeof msg.content === 'string'
        ? msg.content
        : getMessageText(msg);
      return {
        ...msg,
        content: [
          ...images,
          { type: 'text' as const, text: textContent }
        ]
      };
    }
    return msg;
  });
}

// 判定モードの種類
type AssessmentMode = 'ai_generated' | 'textbook_required';

interface ChatInterfaceProps {
  serverStatus: 'checking' | 'connected';
  userId?: string;
  conversationId?: string;
  conversationTitle?: string;
  skillId?: string;
  skillDescription?: string;
  assessmentMode?: AssessmentMode;
  /** ホームから渡される初期画像（参考書ページ） */
  initialImage?: ImageSource;
  onBack?: () => void;
  onConversationCreated?: (conversationId: string) => void;
  onSkillMastered?: (skillId: string, skillName: string) => void;
}

/**
 * サーバーのMessageをChatMessageに変換
 */
function serverMessageToChatMessage(msg: Message): ChatMessage {
  return {
    role: msg.role,
    content: msg.content,
    timestamp: new Date(msg.createdAt).getTime(),
  };
}

const LOADING_MESSAGES = [
  "チョークで黒板に数式を書いています",
  "メガネの真ん中を指でクイッと直しています",
  "あなたの解き方をじっと見守っています",
  "黒板の重要なポイントをチョークで叩いています",
  "参考書をパラパラとめくって調べています",
  "メガネを外して、布で丁寧に拭いています",
  "次にどんなヒントを出そうか考えています",
  "チョークの粉をパッパと払っています",
  "三角定規をあてて、きれいな図形を描いています",
  "教卓に手をついて、あなたのノートをのぞき込んでいます",
  "「ふむふむ」と言いたげに頷きながら待っています",
  "教科書の大事なところに付箋を貼っています",
  "手元のノートに赤ペンでメモを取っています",
  "チョークケースから新しいチョークを選んでいます",
  "黒板消しで板書をきれいに消しています",
  "髪の毛のハネを少しだけ気にしています",
  "窓の外の景色を眺めて、一息ついています",
  "難問の解法を思いついて、瞳を輝かせています",
  "背筋をピンと伸ばして、あなたに向き合っています",
  "コンパスを慎重に回して円を描いています",
  "黒板の端に「ポイント！」と書き込んでいます",
  "あなたのやる気に、心の中でエールを送っています",
  "教卓の上のペンをきれいに並べ直しています",
  "難しい数式を見て、少しだけ楽しそうにしています",
  "自分のメガネが曇っていないか確認しています",
  "授業の準備をしながら、あなたの質問を待っています",
  "スリッパを履き直して、姿勢を整えています",
  "参考書のしおりを挟み直しています",
  "「次はこれですね」と心の中で準備をしています",
  "チョークが短くなったので、新しいのと交換しています"
];

export function ChatInterface({
  serverStatus,
  userId,
  conversationId,
  conversationTitle,
  skillId,
  skillDescription,
  assessmentMode,
  initialImage,
  onBack,
  onConversationCreated,
  onSkillMastered,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isTopicsOpen, setIsTopicsOpen] = useState(false);
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageSource | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);
  const [showFeedback, setShowFeedback] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const voiceInput = useVoiceInput({
    onResult: (transcript) => {
      setInputValue(prev => prev ? `${prev} ${transcript}` : transcript);
    },
  });

  // ローディングメッセージの更新
  useEffect(() => {
    if (!isLoading) {
      setLoadingMessage(LOADING_MESSAGES[0]);
      return;
    }

    // 初回ランダム
    setLoadingMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);

    const interval = setInterval(() => {
      setLoadingMessage(() => {
        const nextIndex = Math.floor(Math.random() * LOADING_MESSAGES.length);
        return LOADING_MESSAGES[nextIndex];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isLoading]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // サーバーからメッセージを読み込み
  useEffect(() => {
    const loadMessages = async () => {
      if (!conversationId || !userId) {
        setMessages([]);
        setCurrentConversationId(conversationId);
        return;
      }

      try {
        setIsLoadingMessages(true);
        const result = await getConversation(conversationId);
        const serverMessages = result.messages.map(serverMessageToChatMessage);
        // セッション中の画像を保持してマージ
        setMessages(prev => mergeMessagesPreservingImages(prev, serverMessages));
        setCurrentConversationId(conversationId);
        setIsCompleted(result.conversation.status === 'completed');
      } catch (err) {
        console.error('Failed to load messages:', err);
        setError('メッセージの読み込みに失敗しました');
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [conversationId, userId]);

  // セッション中の画像上限を維持
  useEffect(() => {
    const imageCount = countImageMessages(messages);
    if (imageCount > MAX_IMAGE_MESSAGES) {
      const limited = limitImageMessages(messages, MAX_IMAGE_MESSAGES);
      setMessages(limited);
    }
  }, [messages]);

  // ウェルカム画面表示時にボイスを再生
  const welcomeVoicePlayedRef = useRef(false);
  useEffect(() => {
    if (!isLoadingMessages && messages.length === 0 && !welcomeVoicePlayedRef.current) {
      welcomeVoicePlayedRef.current = true;
      playTsutaVoice('onboarding');
    }
  }, [isLoadingMessages, messages.length]);

  // 初期画像がある場合（ホームから参考書ページを見せる）、自動送信
  const initialImageSentRef = useRef(false);
  useEffect(() => {
    if (initialImage && !initialImageSentRef.current && !isLoading && messages.length === 0) {
      initialImageSentRef.current = true;
      // selectedImageにセットして、自動送信
      setSelectedImage(initialImage);
      // 少し遅延して送信（UIが安定してから）
      setTimeout(() => {
        const content: ContentBlock[] = [
          { type: 'image', source: initialImage },
          { type: 'text', text: 'この参考書のページを見てください。' }
        ];
        const userMessage: ChatMessage = {
          role: 'user',
          content,
          timestamp: Date.now()
        };
        setMessages([userMessage]);
        setSelectedImage(null);
        // handleSendMessageを直接呼ぶ代わりに、状態を更新してからAPI呼び出し
        setIsLoading(true);
        sendInitialImageMessage(userMessage);
      }, 100);
    }
  }, [initialImage, isLoading, messages.length]);

  // 初期画像メッセージの送信処理
  const sendInitialImageMessage = async (userMessage: ChatMessage) => {
    try {
      const chatOptions: ChatOptions = {
        conversationId: currentConversationId,
        saveMessages: !!userId,
      };
      if (userId) {
        chatOptions.studentContext = { userId };
      }

      // 空の assistant メッセージを先に追加（ストリーミング表示用）
      const streamingMessage: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, streamingMessage]);

      const response = await sendChatMessageStream([userMessage], chatOptions, (chunk) => {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: (last.content as string) + chunk };
          }
          return updated;
        });
      });

      if (response.conversationId && !currentConversationId) {
        setCurrentConversationId(response.conversationId);
        onConversationCreated?.(response.conversationId);
      }

      // 最終メタデータでメッセージを更新
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === 'assistant') {
          updated[updated.length - 1] = { ...last, model: response.model };
        }
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 自動スクロール
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // ローディング中の経過秒数カウンター
  useEffect(() => {
    if (!isLoading) {
      setElapsedSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSendMessage = async (manualContent?: string) => {
    // マニュアルコンテンツがある場合は、inputValueのチェックをスキップ
    const textToSend = manualContent || inputValue;
    if ((!textToSend.trim() && !selectedImage) || isLoading) return;

    // 画像付きの場合はContentBlock配列を作成
    let content: string | ContentBlock[];
    if (selectedImage) {
      const blocks: ContentBlock[] = [
        {
          type: 'image',
          source: selectedImage
        }
      ];
      if (textToSend.trim()) {
        blocks.push({
          type: 'text',
          text: textToSend.trim()
        });
      } else {
        // テキストがない場合はデフォルトのプロンプトを追加
        blocks.push({
          type: 'text',
          text: 'この画像の数式や問題を読み取って解説してください。'
        });
      }
      content = blocks;
    } else {
      content = textToSend.trim();
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setSelectedImage(null);
    setIsLoading(true);
    setError(null);

    try {
      // チャットオプションを設定
      const chatOptions: ChatOptions = {
        conversationId: currentConversationId,
        saveMessages: !!userId,
        assessmentMode,
      };

      // 認証済みユーザーの場合は学習者コンテキストを追加
      if (userId) {
        chatOptions.studentContext = {
          userId,
          currentSkillId: skillId,
        };
      }

      // 空の assistant メッセージを先に追加（ストリーミング表示用）
      const streamingMessage: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, streamingMessage]);

      const response = await sendChatMessageStream(
        [...messages, userMessage],
        chatOptions,
        (chunk) => {
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === 'assistant') {
              updated[updated.length - 1] = { ...last, content: (last.content as string) + chunk };
            }
            return updated;
          });
        }
      );

      // 新規会話の場合、conversationIdを更新
      if (response.conversationId && !currentConversationId) {
        setCurrentConversationId(response.conversationId);
        onConversationCreated?.(response.conversationId);
      }

      // 会話ステータスの更新（習得判定完了時など）
      if (response.conversationStatus === 'completed') {
        setIsCompleted(true);
      }

      // 最終メタデータでメッセージを更新（model, offTopic）
      const isOffTopic = response.offTopic;
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === 'assistant') {
          updated[updated.length - 1] = {
            ...last,
            model: response.model,
            offTopic: isOffTopic || undefined,
          };
        }
        return updated;
      });

      // 正解タグのフォールバック検出（サーバーの TagFilter が処理済みだが念のため）
      const finalContent = response.content;
      if (finalContent.includes('[[PROBLEM_RESULT:correct')) {
        setShowFeedback(true);
        playCorrectSound();
        playTsutaVoice('correct');
      }

      // スキル進捗が更新されたらキャッシュを無効化（全 rank-up 共通）
      if (response.skillUpdate) {
        invalidateCache();
      }

      // スキル習得のお祝い
      if (response.skillUpdate && response.skillUpdate.mastered) {
        playTsutaVoice('mastery');
        const skillNameForCelebration = response.skillUpdate.skillName
          || conversationTitle?.replace('の習得判定', '').replace('の学習', '')
          || 'スキル';

        // チャット内に認定メッセージを挿入（タイムラインに残る永続的な痕跡）
        const masteryMessage: ChatMessage = {
          role: 'system',
          content: `「${skillNameForCelebration}」を習得しました！`,
          timestamp: Date.now(),
          systemType: 'mastery',
        };
        setMessages(prev => [...prev, masteryMessage]);

        onSkillMastered?.(skillId || '', skillNameForCelebration);
      }

      // rank-up（mastered 未達）→ 次のステップ案内
      if (response.skillUpdate && !response.skillUpdate.mastered
          && response.skillUpdate.newRank !== undefined && response.skillUpdate.newRank >= 2) {
        const nextStepMessage: ChatMessage = {
          role: 'system',
          content: '理解が深まりましたね。準備ができたら「判定を受ける」に進みましょう。',
          timestamp: Date.now(),
          systemType: 'next_step',
        };
        setMessages(prev => [...prev, nextStepMessage]);
      }
    } catch (err: unknown) {
      console.error('Failed to send message:', err);
      // ユーザー向けに穏当なメッセージを表示
      setError('申し訳ありません、アクセス集中によりAIからの応答が遅れています。しばらく待ってから、もう一度試していただけますか？');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTopicSelect = async (topic: LearningTopic) => {
    const userMessage: ChatMessage = {
      role: 'user',
      content: topic.prompt,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // チャットオプションを設定
      const chatOptions: ChatOptions = {
        conversationId: currentConversationId,
        saveMessages: !!userId,
        assessmentMode,
      };

      if (userId) {
        chatOptions.studentContext = {
          userId,
          currentSkillId: skillId,
        };
      }

      // 空の assistant メッセージを先に追加（ストリーミング表示用）
      const streamingMessage: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, streamingMessage]);

      const response = await sendChatMessageStream(
        [...messages, userMessage],
        chatOptions,
        (chunk) => {
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === 'assistant') {
              updated[updated.length - 1] = { ...last, content: (last.content as string) + chunk };
            }
            return updated;
          });
        }
      );

      // 新規会話の場合、conversationIdを更新
      if (response.conversationId && !currentConversationId) {
        setCurrentConversationId(response.conversationId);
        onConversationCreated?.(response.conversationId);
      }

      // 最終メタデータでメッセージを更新
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === 'assistant') {
          updated[updated.length - 1] = { ...last, model: response.model };
        }
        return updated;
      });

      // スキル進捗が更新されたらキャッシュを無効化（handleTopicSelect パス）
      if (response.skillUpdate) {
        invalidateCache();
      }

      // スキル習得のお祝い（handleTopicSelect パス）
      if (response.skillUpdate && response.skillUpdate.mastered) {
        playTsutaVoice('mastery');
        const skillNameForCelebration = response.skillUpdate.skillName
          || conversationTitle?.replace('の習得判定', '').replace('の学習', '')
          || 'スキル';

        const masteryMessage: ChatMessage = {
          role: 'system',
          content: `「${skillNameForCelebration}」を習得しました！`,
          timestamp: Date.now(),
          systemType: 'mastery',
        };
        setMessages(prev => [...prev, masteryMessage]);

        onSkillMastered?.(skillId || '', skillNameForCelebration);
      }
    } catch (err: unknown) {
      console.error('Failed to send message:', err);
      setError('申し訳ありません、アクセス集中によりAIからの応答が遅れています。しばらく待ってから、もう一度試していただけますか？');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = async (content: string) => {
    const success = await copyToClipboard(content);
    if (success) {
      setToastMessage('コピーしました');
    } else {
      setToastMessage('コピーに失敗しました');
    }
  };

  // 数式キーパッドからLaTeXを挿入
  const handleInsertLatex = useCallback((latex: string, cursorOffset?: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = inputValue.slice(0, start) + latex + inputValue.slice(end);

    setInputValue(newValue);

    // カーソル位置を設定
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const newPos = cursorOffset !== undefined
          ? start + latex.length + cursorOffset
          : start + latex.length;
        textareaRef.current.selectionStart = newPos;
        textareaRef.current.selectionEnd = newPos;
        textareaRef.current.focus();
      }
    });
  }, [inputValue]);

  // メッセージコンテナ内でのHome/Endキーをコンテナ内スクロールに限定
  const handleContainerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = e.key === 'Home'
          ? 0
          : messagesContainerRef.current.scrollHeight;
      }
    }
  };

  // 表示するタイトルを決定
  const displayTitle = conversationTitle || (skillId ? `スキル学習` : '新しいチャット');

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <div className="header-left">
          {onBack && (
            <button onClick={onBack} className="back-button" aria-label="戻る">
              ←
            </button>
          )}
          <span className={`status-dot ${serverStatus}`}></span>
          <h2>{displayTitle}</h2>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        className="messages-container"
        onKeyDown={handleContainerKeyDown}
        tabIndex={-1}
      >
        {isLoadingMessages && (
          <div className="messages-loading">
            <div className="loading-indicator">
              <span className="dot">.</span>
              <span className="dot">.</span>
              <span className="dot">.</span>
            </div>
            <p>メッセージを読み込み中...</p>
          </div>
        )}

        {!isLoadingMessages && messages.length === 0 && (
          <div className="welcome-message">
            {/* ウェルカムメッセージ（コンテキスト別） */}
            {/* 習得判定モード */}
            {assessmentMode && skillId ? (
                  <div className="assessment-intro">
                    <img src={guideNervousImg} alt="緊張" className="guide-expression guide-expression--large" />
                    <h3>🎯 {conversationTitle?.replace('の習得判定', '')} の習得判定</h3>
                    {assessmentMode === 'ai_generated' ? (
                      <>
                        <p>これから6問出題します。基礎から応用まで段階的に出題し、70点以上でスキル習得となります。</p>
                        <p className="assessment-hint">持ち込み資料は不要です。準備ができたら「開始」と入力してください。</p>
                      </>
                    ) : (
                      <>
                        <p>参考書や教科書の問題を使って習得判定を行います。</p>
                        <p className="assessment-hint">問題の画像をアップロードして、解答を入力してください。</p>
                      </>
                    )}
                    <button
                      onClick={() => {
                        if (assessmentMode === 'ai_generated') {
                          playTsutaVoice('start');
                          handleSendMessage('開始');
                        }
                      }}
                      className="assessment-start-button"
                    >
                      {assessmentMode === 'ai_generated' ? '🚀 判定を開始する' : '📷 問題をアップロード'}
                    </button>
                  </div>
                ) : skillId && skillDescription ? (
                  <>
                    <p>👋 <strong>{conversationTitle?.replace('の学習', '')}</strong>について学んでいきましょう。</p>
                    <p>このスキルでは以下を扱います。どこがわからないですか？</p>
                    <div className="welcome-choices">
                      {skillDescription.split('、').map((item, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            const skillName = conversationTitle?.replace('の学習', '') || 'このスキル';
                            setInputValue(`${skillName}の「${item.trim()}」について教えてください。`);
                          }}
                          className="choice-button"
                        >
                          {item.trim()}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          const skillName = conversationTitle?.replace('の学習', '') || 'このスキル';
                          setInputValue(`${skillName}について、全部わからないので基本から教えてください。`);
                        }}
                        className="choice-button choice-button--escape"
                      >
                        全部わからない / 基本から教えてほしい
                      </button>
                    </div>
                  </>
                ) : skillId ? (
                  <>
                    <p>👋 <strong>{conversationTitle?.replace('の学習', '')}</strong>について学んでいきましょう。</p>
                    <p>分からないところがあれば、一つずつ確認していきます。</p>
                  </>
                ) : (
                  <>
                    <p>👋 数学を、どこから勉強していきたいでしょうか？</p>
                    <p>学習マップを見て、あなたの現在地を確認しましょう。</p>
                    <button
                      onClick={() => setIsTopicsOpen(true)}
                      className="topics-button"
                    >
                      📚 学習トピックから選ぶ
                    </button>
                  </>
                )}
          </div>
        )}

        {messages.map((message, index) => {
          // システムメッセージ（マスタリー通知など）は専用レンダリング
          if (message.role === 'system' && message.systemType === 'mastery') {
            return (
              <div key={index} className="mastery-notification">
                <span className="mastery-notification-icon">🏆</span>
                <span className="mastery-notification-text">{getMessageText(message)}</span>
              </div>
            );
          }

          if (message.role === 'system' && message.systemType === 'next_step') {
            return (
              <div key={index} className="next-step-notification">
                <span className="next-step-notification-text">{getMessageText(message)}</span>
              </div>
            );
          }

          const messageText = getMessageText(message);
          const messageImages = getMessageImages(message);

          return (
            <div key={index} className={`message ${message.role}`}>
              <div className="message-content">
                {/* 画像がある場合は表示（クリックで拡大） */}
                {messageImages.length > 0 && (
                  <div className="message-images">
                    {messageImages.map((img, imgIndex) => {
                      const imgSrc = `data:${img.source.media_type};base64,${img.source.data}`;
                      return (
                        <img
                          key={imgIndex}
                          src={imgSrc}
                          alt="添付画像（クリックで拡大）"
                          className="message-image clickable"
                          onClick={() => setExpandedImage(imgSrc)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && setExpandedImage(imgSrc)}
                        />
                      );
                    })}
                  </div>
                )}
                <div className="message-text">
                  <MathText text={messageText} />
                </div>
                {/* オフトピック案内 */}
                {message.offTopic && (
                  <div className="off-topic-notice">
                    <p>数学に関する質問をしてみてください</p>
                  </div>
                )}
                <div className="message-footer">
                  {message.timestamp && (
                    <span className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString('ja-JP')}
                    </span>
                  )}
                  {message.model && (
                    <span className="message-model" title={`Model: ${message.model}`}>
                      {message.model.replace('models/', '').replace(/-/g, ' ')}
                    </span>
                  )}
                  <button
                    className="copy-button"
                    onClick={() => handleCopyMessage(messageText)}
                    title="メッセージをコピー"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="loading-indicator">
                <img src={guideThinkingImg} alt="考え中" className="guide-expression" />
                <div className="loading-details">
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                  <span className="loading-text">{loadingMessage}</span>
                </div>
                <span className="elapsed-time">({elapsedSeconds}秒)</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            <img src={guideWorriedImg} alt="心配" className="guide-expression" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <FeedbackOverlay
        isVisible={showFeedback}
        onAnimationEnd={() => setShowFeedback(false)}
      />

      <ImageModal
        imageSrc={expandedImage}
        onClose={() => setExpandedImage(null)}
      />

      <div className="input-container">
        <MathKeypad
          isOpen={isKeypadOpen}
          onClose={() => setIsKeypadOpen(false)}
          onInsert={handleInsertLatex}
          inputValue={inputValue}
        />
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isCompleted ? "この会話は終了しました" : "メッセージを入力してください (Shift+Enterで改行)"}
          disabled={isLoading || isCompleted}
        />
        <div className="input-actions">
          <ImageUpload
            selectedImage={selectedImage}
            onImageSelect={setSelectedImage}
            disabled={isLoading}
          />
          <button
            onClick={() => setIsKeypadOpen(!isKeypadOpen)}
            className={`keypad-toggle-button ${isKeypadOpen ? 'active' : ''}`}
            title="数式キーパッド"
          >
            🔢
          </button>
          <button
            onClick={() => setIsHelpModalOpen(true)}
            className="help-button"
            title="数式の入力方法を見る"
          >
            ❓ ヘルプ
          </button>
          {voiceInput.isSupported && (
            <button
              onClick={() => voiceInput.status === 'listening' ? voiceInput.stopListening() : voiceInput.startListening()}
              className={`voice-input-button ${voiceInput.status === 'listening' ? 'recording' : ''}`}
              title={voiceInput.status === 'listening' ? '音声入力を停止' : '音声で入力'}
              disabled={isLoading || isCompleted}
            >
              🎤
            </button>
          )}
          <button
            onClick={() => handleSendMessage()}
            disabled={(!inputValue.trim() && !selectedImage) || isLoading || isCompleted}
            className="send-button"
          >
            {isLoading ? '送信中...' : '送信 📩'}
          </button>
        </div>
      </div>

      <LatexHelpPanel
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      <LearningTopics
        isOpen={isTopicsOpen}
        onClose={() => setIsTopicsOpen(false)}
        onTopicSelect={handleTopicSelect}
      />

      {toastMessage && (
        <ToastNotification
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}