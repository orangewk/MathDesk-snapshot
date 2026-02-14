/**
 * スキップ宣言モーダル
 * 単元の一問試問に合格すれば全スキルを mastered にする
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { ProblemDisplay } from './ProblemDisplay';
import { AnswerInput } from './AnswerInput';
import { MathText } from '../MathDisplay';
import {
  generateSkipChallenge,
  evaluateSkipChallenge,
  type GeneratedProblem,
  type SkipTargetSkill,
  type SkipEvaluateResult,
} from '../../services/practice-service';
import './SkipChallengeModal.css';

interface SkipChallengeModalProps {
  isVisible: boolean;
  unitCategory: string | null;
  unitSubcategory: string | null;
  onClose: () => void;
}

type ModalPhase = 'loading' | 'problem' | 'evaluating' | 'result' | 'error';

const SkipChallengeModalComponent: React.FC<SkipChallengeModalProps> = ({
  isVisible,
  unitCategory,
  unitSubcategory,
  onClose,
}) => {
  const [phase, setPhase] = useState<ModalPhase>('loading');
  const [problem, setProblem] = useState<GeneratedProblem | null>(null);
  const [targetSkills, setTargetSkills] = useState<SkipTargetSkill[]>([]);
  const [result, setResult] = useState<SkipEvaluateResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // 試問を生成
  const loadChallenge = useCallback(async () => {
    if (!unitCategory || !unitSubcategory) return;

    setPhase('loading');
    setProblem(null);
    setTargetSkills([]);
    setResult(null);
    setErrorMessage('');

    try {
      const data = await generateSkipChallenge(unitCategory, unitSubcategory);
      setProblem(data.problem);
      setTargetSkills(data.targetSkills);
      setPhase('problem');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'スキップ試問の生成に失敗しました',
      );
      setPhase('error');
    }
  }, [unitCategory, unitSubcategory]);

  // モーダル表示時に試問を生成
  useEffect(() => {
    if (isVisible && unitCategory && unitSubcategory) {
      loadChallenge();
    }
  }, [isVisible, unitCategory, unitSubcategory, loadChallenge]);

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
      if (!problem || targetSkills.length === 0) return;

      setPhase('evaluating');

      try {
        const evalResult = await evaluateSkipChallenge(
          targetSkills,
          problem,
          answer,
        );
        setResult(evalResult);
        setPhase('result');
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : '採点に失敗しました',
        );
        setPhase('error');
      }
    },
    [problem, targetSkills],
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
            スキップ宣言: {unitSubcategory}
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
          {/* ローディング */}
          {(phase === 'loading' || phase === 'evaluating') && (
            <div className="practice-modal__loading">
              <div className="practice-modal__spinner" />
              <p className="practice-modal__loading-text">
                {phase === 'evaluating' ? '採点中...' : 'スキップ試問を準備中...'}
              </p>
            </div>
          )}

          {/* 問題表示 */}
          {phase === 'problem' && problem && (
            <>
              <div className="skip-challenge__intro">
                <p className="skip-challenge__intro-text">
                  この単元の理解度を確認します。以下の問題に正解すると、
                  <strong>{targetSkills.length}つのスキル</strong>が一括で習得済みになります。
                </p>
                <div className="skip-challenge__target-skills">
                  {targetSkills.map((s) => (
                    <span key={s.skillId} className="skip-challenge__skill-tag">
                      {s.skillName}
                    </span>
                  ))}
                </div>
              </div>

              <ProblemDisplay problem={problem} figureLoading={false} />
              <div className="practice-modal__answer-section">
                <AnswerInput onSubmit={handleSubmitAnswer} />
              </div>
            </>
          )}

          {/* 結果表示 */}
          {phase === 'result' && result && (
            <div className="skip-challenge__result">
              {result.passed ? (
                <>
                  <div className="skip-challenge__result-header skip-challenge__result-header--passed">
                    スキップ成功!
                  </div>
                  <p className="skip-challenge__result-feedback">
                    <MathText text={result.evaluation.feedback} />
                  </p>
                  <div className="skip-challenge__skipped-skills">
                    <p className="skip-challenge__skipped-label">
                      以下のスキルが習得済みになりました:
                    </p>
                    {result.skippedSkills.map((s) => (
                      <span key={s.skillId} className="skip-challenge__skill-tag skip-challenge__skill-tag--mastered">
                        {s.skillName}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="skip-challenge__result-header skip-challenge__result-header--failed">
                    もう少し練習が必要です
                  </div>
                  <p className="skip-challenge__result-feedback">
                    <MathText text={result.evaluation.feedback} />
                  </p>
                  <p className="skip-challenge__result-hint">
                    各スキルを個別に練習して、理解を深めましょう。
                  </p>
                </>
              )}

              <div className="practice-modal__actions">
                <button
                  className="practice-modal__close-button"
                  onClick={onClose}
                >
                  閉じる
                </button>
              </div>
            </div>
          )}

          {/* エラー */}
          {phase === 'error' && (
            <div className="practice-modal__error">
              <p className="practice-modal__error-text">{errorMessage}</p>
              <button
                className="practice-modal__retry-button"
                onClick={loadChallenge}
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

export const SkipChallengeModal = memo(SkipChallengeModalComponent);
