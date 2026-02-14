// FILE: webapp/src/App.tsx
// ==========================================
import { useState, useEffect, useCallback } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { AuthForm } from './components/AuthForm';
import { SkillListPage } from './components/SkillList';
import type { AssessmentMode } from './components/SkillList/SkillDetailSidebar';
import { getNextUnitAction } from './components/SkillList/hooks/useSkillListData';
import { getAllSkills } from './services/skill-service';
import { getStudentModel, invalidateCache } from './services/student-service';
import type { SkillMasteryStatus } from './types/student-model';
import { Home } from './components/Home';
import type { ImageSource } from './types/chat-types';
import { MasteryCelebration } from './components/MasteryCelebration';
import { checkHealth } from './services/api-service';
import { validateSession, logout, getUser, AuthUser } from './services/auth-service';
import { getOrCreateSkillConversation, createConversation } from './services/conversation-service';
import {
  initializeLogService,
  logUncaughtError,
  logLearningStart,
} from './services/client-log-service';
import { DebugPanel } from './components/DebugPanel';
import { AboutModal } from './components/AboutModal';
import { OnboardingModal, type OnboardingFormData } from './components/OnboardingModal';
import { BgmPlayer } from './components/BgmPlayer';
import { completeOnboarding } from './services/student-service';
import './App.css';

type AppState = 'loading' | 'auth' | 'main' | 'error';
type ViewMode = 'home' | 'chat' | 'skills';

interface ChatContext {
  conversationId?: string;
  conversationTitle?: string;
  skillId?: string;
  skillDescription?: string;
  assessmentMode?: AssessmentMode;
  initialImage?: ImageSource;
}

function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [serverStatus, setServerStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [chatContext, setChatContext] = useState<ChatContext>({});
  const [celebrationData, setCelebrationData] = useState<{
    skillId: string;
    skillName: string;
    nextSkillId?: string;
    nextSkillName?: string;
    nextSkillDescription?: string;
    nextAction?: 'learn' | 'assess';
    nextSkillCategory?: string;
  } | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(
    () => localStorage.getItem('learnmath_onboarding_completed') !== 'true'
  );

  useEffect(() => {
    initializeApp();
  }, []);

  // ログサービス初期化 & グローバルエラーハンドラー
  useEffect(() => {
    initializeLogService();

    const handleError = (event: ErrorEvent) => {
      logUncaughtError(
        event.message || 'Unknown error',
        event.error?.name
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || 'Unhandled promise rejection';
      logUncaughtError(message, 'UnhandledRejection');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const initializeApp = async () => {
    try {
      // サーバーヘルスチェック
      await checkHealth();
      setServerStatus('connected');

      // セッション検証
      const session = await validateSession();
      if (session.valid && session.user) {
        setCurrentUser(session.user);
        setAppState('main');
      } else {
        setAppState('auth');
      }
    } catch {
      setServerStatus('error');
      setAppState('error');
    }
  };

  const handleAuthSuccess = (user: AuthUser) => {
    // 登録直後のユーザー情報を補完
    const storedUser = getUser();
    setCurrentUser(storedUser || user);
    setAppState('main');
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setAppState('auth');
  };

  // ホーム画面へ戻る
  const handleNavigateToHome = useCallback(() => {
    setViewMode('home');
    setChatContext({});
  }, []);

  // スキル習得時のハンドラ（祝福演出表示 + 次スキル計算）
  const handleSkillMastered = useCallback(async (skillId: string, skillName: string) => {
    // キャッシュを無効化して最新データを取得できるようにする
    invalidateCache();

    // まず祝福表示（次スキルはバックグラウンドで計算）
    setCelebrationData({ skillId, skillName });

    try {
      // 最新のスキル一覧と習熟度を取得して次スキルを判定
      const [skillsResult, studentResult] = await Promise.all([
        getAllSkills(),
        getStudentModel(),
      ]);

      if (skillsResult.success && skillsResult.skills && studentResult.success && studentResult.studentModel) {
        const allSkills = skillsResult.skills;
        const masteryMap = new Map<string, SkillMasteryStatus>();
        const skillMastery = studentResult.studentModel.skillMastery as Record<string, SkillMasteryStatus>;
        Object.entries(skillMastery).forEach(([id, mastery]) => {
          masteryMap.set(id, mastery);
        });

        // 習得したスキルの単元を特定
        const masteredSkill = allSkills.find(s => s.id === skillId);
        if (masteredSkill) {
          const unitSkills = allSkills.filter(s => s.subcategory === masteredSkill.subcategory && s.category === masteredSkill.category);
          const nextAction = getNextUnitAction({ name: masteredSkill.subcategory, skills: unitSkills }, masteryMap);

          if (nextAction) {
            setCelebrationData(prev => prev ? {
              ...prev,
              nextSkillId: nextAction.skill.id,
              nextSkillName: nextAction.skill.name,
              nextSkillDescription: nextAction.skill.description,
              nextAction: nextAction.action,
              nextSkillCategory: nextAction.skill.category,
            } : prev);
          }
        }
      }
    } catch {
      // 次スキル計算の失敗は無視（祝福は表示される）
    }
  }, []);

  // 祝福演出終了時のハンドラ（スキル一覧に遷移）
  const handleCelebrationClose = useCallback(() => {
    setCelebrationData(null);
    setViewMode('skills');
    setChatContext({});
  }, []);

  // 既存の会話を選択
  const handleSelectConversation = useCallback((conversationId: string) => {
    setChatContext({ conversationId });
    setViewMode('chat');
  }, []);

  // 新規会話を開始
  // 画像付きで学習開始
  const handleStudyWithImage = useCallback((image: ImageSource) => {
    setChatContext({
      conversationTitle: '問題を教えて',
      initialImage: image,
    });
    setViewMode('chat');
  }, []);

  // オンボーディング完了（問診票データ付き）
  const handleOnboardingComplete = useCallback(async (data: OnboardingFormData) => {
    localStorage.setItem('learnmath_onboarding_completed', 'true');
    setIsFirstVisit(false);
    await completeOnboarding({
      nickname: data.nickname,
      gradeLevel: data.gradeLevel,
      studiedSubjects: data.studiedSubjects,
      selfAssessment: data.selfAssessment,
      studyGoal: data.studyGoal,
    });
  }, []);

  // 会話作成時のコールバック
  const handleConversationCreated = useCallback((conversationId: string) => {
    setChatContext(prev => ({ ...prev, conversationId }));
  }, []);

  // スキルツリー画面へ
  const handleNavigateToSkillTree = useCallback(() => {
    setViewMode('skills');
  }, []);

  // スキル学習開始
  const handleStartSkillLearning = useCallback(async (skillId: string, skillName: string, skillDescription: string) => {
    try {
      // 学習開始をログに記録
      logLearningStart(skillId);

      // スキル用の会話を取得または作成
      const result = await getOrCreateSkillConversation({
        skillId,
        skillName,
      });

      setChatContext({
        conversationId: result.conversation.id,
        conversationTitle: result.conversation.title || `${skillName}の学習`,
        skillId,
        skillDescription,
      });
      setViewMode('chat');
    } catch (err) {
      logUncaughtError(
        err instanceof Error ? err.message : 'Failed to start skill learning',
        'SkillLearningError'
      );
      alert('学習の開始に失敗しました');
    }
  }, []);

  // スキル習得判定開始（毎回新規会話を作成）
  const handleStartSkillAssessment = useCallback(async (skillId: string, skillName: string, mode: AssessmentMode) => {
    try {
      // 判定用の新規会話を作成（既存会話は使わない）
      const conversation = await createConversation({
        title: `${skillName}の習得判定`,
        type: 'skill_assessment',
        skillId,
      });

      setChatContext({
        conversationId: conversation.id,
        conversationTitle: `${skillName}の習得判定`,
        skillId,
        assessmentMode: mode,
      });
      setViewMode('chat');
    } catch (err) {
      logUncaughtError(
        err instanceof Error ? err.message : 'Failed to start skill assessment',
        'SkillAssessmentError'
      );
      alert('習得判定の開始に失敗しました');
    }
  }, []);

  // 祝福演出から次のスキルへ遷移
  const handleCelebrationNextSkill = useCallback(() => {
    if (!celebrationData?.nextSkillId) return;

    const { nextSkillId, nextSkillName, nextSkillDescription, nextAction, nextSkillCategory } = celebrationData;
    setCelebrationData(null);

    if (nextAction === 'learn') {
      handleStartSkillLearning(nextSkillId, nextSkillName || '', nextSkillDescription || '');
    } else if (nextAction === 'assess') {
      const mode = nextSkillCategory === '基礎' ? 'ai_generated' : 'textbook_required';
      handleStartSkillAssessment(nextSkillId, nextSkillName || '', mode as AssessmentMode);
    }
  }, [celebrationData, handleStartSkillLearning, handleStartSkillAssessment]);

  // ローディング中
  if (appState === 'loading') {
    return (
      <div className="app loading-screen">
        <div className="loading-content">
          <span className="loading-icon">⏳</span>
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  // サーバーエラー
  if (appState === 'error') {
    return (
      <div className="app">
        <main className="app-main">
          <div className="error-screen">
            <h2>サーバーに接続できません</h2>
            <button onClick={() => window.location.reload()}>
              🔄 再試行
            </button>
          </div>
        </main>
      </div>
    );
  }

  // 認証画面
  if (appState === 'auth') {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  // 共通ヘッダー（home / skills で共有、chat では非表示）
  const renderHeader = () => (
    <header className="app-header">
      <div className="app-header-left">
        <button className="app-logo" onClick={() => setIsAboutOpen(true)} title="About MathDesk">📐</button>
        <nav className="app-nav">
          <button
            className={`app-nav-item ${viewMode === 'home' ? 'app-nav-item--active' : ''}`}
            onClick={handleNavigateToHome}
          >
            ホーム
          </button>
          <button
            className={`app-nav-item ${viewMode === 'skills' ? 'app-nav-item--active' : ''}`}
            onClick={handleNavigateToSkillTree}
          >
            スキル
          </button>
        </nav>
      </div>
      <div className="app-header-right">
        <span className="user-info">
          {currentUser?.nickname || 'ゲスト'}
        </span>
        <button className="logout-button" onClick={handleLogout}>
          ログアウト
        </button>
      </div>
    </header>
  );

  // メイン画面 - ホーム
  if (viewMode === 'home') {
    return (
      <div className="app">
        {renderHeader()}
        <main className="app-main app-main--no-header">
          <Home
            onSelectConversation={handleSelectConversation}
            onNavigateToSkillTree={handleNavigateToSkillTree}
            onStartSkillLearning={(skillId, skillName) => handleStartSkillLearning(skillId, skillName, '')}
            onStudyWithImage={handleStudyWithImage}
            isFirstVisit={isFirstVisit}
          />
        </main>
        <DebugPanel />
        <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
        <OnboardingModal isOpen={isFirstVisit} onComplete={handleOnboardingComplete} />
        <BgmPlayer />
      </div>
    );
  }

  // メイン画面 - チャット
  if (viewMode === 'chat') {
    return (
      <div className="app">
        <main className="app-main app-main--full">
          <ChatInterface
            serverStatus={serverStatus === 'error' ? 'connected' : serverStatus}
            userId={currentUser?.id}
            conversationId={chatContext.conversationId}
            conversationTitle={chatContext.conversationTitle}
            skillId={chatContext.skillId}
            skillDescription={chatContext.skillDescription}
            assessmentMode={chatContext.assessmentMode}
            initialImage={chatContext.initialImage}
            onBack={handleNavigateToHome}
            onConversationCreated={handleConversationCreated}
            onSkillMastered={handleSkillMastered}
          />
        </main>
        <DebugPanel />
        <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
        <MasteryCelebration
          isVisible={!!celebrationData}
          skillName={celebrationData?.skillName}
          nextSkillName={celebrationData?.nextSkillName}
          onClose={handleCelebrationClose}
          onNextSkill={celebrationData?.nextSkillId ? handleCelebrationNextSkill : undefined}
        />
        <BgmPlayer />
      </div>
    );
  }

  // メイン画面 - スキルリスト
  return (
    <div className="app">
      {renderHeader()}
      <main className="app-main app-main--no-header">
        <SkillListPage
          userId={currentUser?.id}
          onStartLearning={handleStartSkillLearning}
          onStartAssessment={handleStartSkillAssessment}
          onSkillMastered={handleSkillMastered}
        />
      </main>
      <DebugPanel />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <MasteryCelebration
        isVisible={!!celebrationData}
        skillName={celebrationData?.skillName}
        nextSkillName={celebrationData?.nextSkillName}
        onClose={handleCelebrationClose}
        onNextSkill={celebrationData?.nextSkillId ? handleCelebrationNextSkill : undefined}
      />
      <BgmPlayer />
    </div>
  );
}

export default App;
