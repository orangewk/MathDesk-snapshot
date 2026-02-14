/**
 * 練習問題モーダル
 * スキルの練習問題を生成・回答・評価するメインUI
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { ProblemDisplay } from './ProblemDisplay';
import { AnswerInput } from './AnswerInput';
import { EvaluationDisplay } from './EvaluationDisplay';
import {
  generateProblemStream,
  evaluateAnswer,
  type GeneratedProblem,
  type EvaluationResult,
  type DifficultyMode,
  type TechniqueInfo,
} from '../../services/practice-service';
import './PracticeModal.css';

// ツタ先生の作問メッセージ
const LOADING_MESSAGES = [
  '問題を考え中...',
  'ちょうどいい難易度を調整中...',
  '解法を検証中...',
  '数式を組み立て中...',
  'あなたに合った問題を選んでいます...',
  'もう少しだけ待ってね...',
];

interface PracticeModalProps {
  isVisible: boolean;
  skillId: string | null;
  skillName: string | null;
  onClose: () => void;
  onSkillMastered?: (skillId: string, skillName: string) => void;
}

type ModalPhase = 'select' | 'loading' | 'problem' | 'evaluating' | 'result' | 'error';

const PracticeModalComponent: React.FC<PracticeModalProps> = ({
  isVisible,
  skillId,
  skillName,
  onClose,
  onSkillMastered,
}) => {
  const [phase, setPhase] = useState<ModalPhase>('select');
  const [difficulty, setDifficulty] = useState<DifficultyMode | null>(null);
  const [problem, setProblem] = useState<GeneratedProblem | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isRankUp, setIsRankUp] = useState(false);
  const [techniqueInfo, setTechniqueInfo] = useState<TechniqueInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [figureLoading, setFigureLoading] = useState(false);
  const [problemPoolId, setProblemPoolId] = useState<string | null>(null);

  // ローディングメッセージのローテーション
  useEffect(() => {
    if (phase !== 'loading' && phase !== 'evaluating') return;

    // 基礎問は短いメッセージ
    if (difficulty === 'basic') {
      setLoadingMessage('基礎問を準備中...');
      return;
    }

    let index = 0;
    setLoadingMessage(LOADING_MESSAGES[0]);
    const interval = setInterval(() => {
      index = (index + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[index]);
    }, 3000);

    return () => clearInterval(interval);
  }, [phase, difficulty]);

  // SSE ストリーミングで問題 + 図を1コネクションで受信
  const abortRef = React.useRef<AbortController | null>(null);

  const loadProblem = useCallback((selectedDifficulty: DifficultyMode) => {
    if (!skillId) return;

    // 前回のストリームをキャンセル
    abortRef.current?.abort();

    setDifficulty(selectedDifficulty);
    setPhase('loading');
    setProblem(null);
    setEvaluation(null);
    setIsRankUp(false);
    setTechniqueInfo(null);
    setErrorMessage('');
    setFigureLoading(false);
    setProblemPoolId(null);

    abortRef.current = generateProblemStream(skillId, undefined, {
      onProblem: (data) => {
        setProblem(data.problem);
        setProblemPoolId(data.problemPoolId ?? null);
        setPhase('problem');
        if (data.needsFigure) {
          setFigureLoading(true);
        }
      },
      onFigure: ({ figure }) => {
        if (figure) {
          setProblem(prev => prev ? { ...prev, figure } : prev);
        }
        setFigureLoading(false);
      },
      onError: (err) => {
        setErrorMessage(err.message);
        setPhase('error');
      },
    }, selectedDifficulty);
  }, [skillId]);

  // モーダル表示時に select フェーズへ、非表示時にストリームをキャンセル
  useEffect(() => {
    if (isVisible && skillId) {
      setPhase('select');
      setDifficulty(null);
    }

    return () => {
      abortRef.current?.abort();
    };
  }, [isVisible, skillId]);

  // ESC キーで閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isVisible, onClose]);

  // 回答を送信
  const handleSubmitAnswer = useCallback(
    async (answer: string) => {
      if (!skillId || !problem) return;

      setPhase('evaluating');

      try {
        const result = await evaluateAnswer(
          skillId,
          problem.level,
          problem,
          answer,
          difficulty ?? undefined,
          problemPoolId ?? undefined,
        );
        setEvaluation(result.evaluation);
        setIsRankUp(result.cardUpdate?.isRankUp === true || result.cardUpdate?.isNewAcquisition === true);
        setTechniqueInfo(result.techniqueInfo ?? null);
        setPhase('result');

        if (result.skillMastered) {
          onSkillMastered?.(result.skillMastered.skillId, result.skillMastered.skillName);
        }
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : '回答の評価に失敗しました',
        );
        setPhase('error');
      }
    },
    [skillId, problem, difficulty, problemPoolId, onSkillMastered],
  );

  if (!isVisible) return null;

  return (
    <div className="practice-modal-overlay" onClick={onClose}>
      <div
        className="practice-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="practice-modal__header">
          <h2 className="practice-modal__title">
            {skillName ?? '練習問題'}
          </h2>
          <button
            className="practice-modal__close"
            onClick={onClose}
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        {/* コンテンツ */}
        <div className="practice-modal__body">
          {/* 難易度選択 */}
          {phase === 'select' && (
            <div className="practice-modal__select">
              <p className="practice-modal__select-description">
                練習モードを選んでください
              </p>
              <button
                className="practice-modal__select-button practice-modal__select-button--basic"
                onClick={() => loadProblem('basic')}
              >
                <span className="practice-modal__select-label">基礎問で練習</span>
                <span className="practice-modal__select-detail">すぐに出題されます</span>
              </button>
              <button
                className="practice-modal__select-button practice-modal__select-button--challenge"
                onClick={() => loadProblem('challenge')}
              >
                <span className="practice-modal__select-label">難問に挑戦</span>
                <span className="practice-modal__select-detail">
                  じっくり考える問題（出題に約1分）
                </span>
                <span className="practice-modal__select-badge">ランクアップ対象</span>
              </button>
            </div>
          )}

          {/* ローディング */}
          {(phase === 'loading' || phase === 'evaluating') && (
            <div className="practice-modal__loading">
              <div className="practice-modal__spinner" />
              <p className="practice-modal__loading-text">
                {phase === 'evaluating' ? '回答を評価中...' : loadingMessage}
              </p>
              {difficulty === 'challenge' && phase === 'loading' && (
                <p className="practice-modal__loading-hint">
                  難問は出題に時間がかかります
                </p>
              )}
            </div>
          )}

          {/* 問題表示 */}
          {phase === 'problem' && problem && (
            <>
              <ProblemDisplay problem={problem} figureLoading={figureLoading} />
              <div className="practice-modal__answer-section">
                <AnswerInput onSubmit={handleSubmitAnswer} />
              </div>
            </>
          )}

          {/* 評価結果 */}
          {phase === 'result' && evaluation && problem && (
            <>
              <ProblemDisplay problem={problem} figureLoading={false} />
              <EvaluationDisplay
                evaluation={evaluation}
                problem={problem}
                isRankUp={isRankUp}
                techniqueInfo={techniqueInfo}
              />
              <div className="practice-modal__actions">
                <button
                  className="practice-modal__next-button"
                  onClick={() => setPhase('select')}
                >
                  次の問題へ
                </button>
                <button
                  className="practice-modal__close-button"
                  onClick={onClose}
                >
                  終了する
                </button>
              </div>
            </>
          )}

          {/* エラー */}
          {phase === 'error' && (
            <div className="practice-modal__error">
              <p className="practice-modal__error-text">{errorMessage}</p>
              <button
                className="practice-modal__retry-button"
                onClick={() => difficulty ? loadProblem(difficulty) : setPhase('select')}
              >
                もう一度試す
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const PracticeModal = memo(PracticeModalComponent);
