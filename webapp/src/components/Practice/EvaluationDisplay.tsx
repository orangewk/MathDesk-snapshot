/**
 * 評価結果表示コンポーネント
 * AI による回答評価のフィードバックを表示する
 */

import React, { memo, useState, useEffect } from 'react';
import { MathText } from '../MathDisplay';
import { analyzeStumble, type StumbleAnalysis } from '../../services/advisor-service';
import type { EvaluationResult, GeneratedProblem, TechniqueInfo } from '../../services/practice-service';
import './EvaluationDisplay.css';

interface EvaluationDisplayProps {
  evaluation: EvaluationResult;
  problem: GeneratedProblem;
  isRankUp?: boolean;
  techniqueInfo?: TechniqueInfo | null;
  onNavigateToSkill?: (skillId: string) => void;
}

/** correctAnswer にデリミタがない生 LaTeX をフォールバックで囲む */
function ensureMathDelimiter(text: string): string {
  if (!text) return text;
  // 既に $...$ で囲まれているか、プレーンテキスト（LaTeXコマンドなし）ならそのまま
  if (text.includes('$') || !/\\[a-zA-Z]/.test(text)) return text;
  return `$${text}$`;
}

const EvaluationDisplayComponent: React.FC<EvaluationDisplayProps> = ({
  evaluation,
  problem,
  isRankUp = false,
  techniqueInfo,
  onNavigateToSkill,
}) => {
  const { isCorrect, confidence, feedback, matchedCheckPoints, missedCheckPoints, indeterminateReason } = evaluation;
  const [stumbleAnalysis, setStumbleAnalysis] = useState<StumbleAnalysis | null>(null);

  // 不正解時にバックグラウンドでつまずき分析を取得
  useEffect(() => {
    if (isCorrect || confidence === 'low') return;
    let cancelled = false;

    analyzeStumble(problem.skillId, feedback, missedCheckPoints)
      .then((data) => {
        if (!cancelled) setStumbleAnalysis(data);
      })
      .catch(() => {
        // サイレントに失敗
      });

    return () => { cancelled = true; };
  }, [isCorrect, confidence, problem.skillId, feedback, missedCheckPoints]);

  return (
    <div className={`evaluation-display evaluation-display--${isCorrect ? 'correct' : 'incorrect'}`}>
      {/* 判定ヘッダー */}
      <div className="evaluation-display__header">
        {confidence === 'low' ? (
          <span className="evaluation-display__verdict evaluation-display__verdict--indeterminate">
            判定できませんでした
          </span>
        ) : isCorrect ? (
          <span className="evaluation-display__verdict evaluation-display__verdict--correct">
            正解!
          </span>
        ) : (
          <span className="evaluation-display__verdict evaluation-display__verdict--incorrect">
            不正解
          </span>
        )}
        {isRankUp && (
          <span className="evaluation-display__rankup">
            ランクアップ!
          </span>
        )}
      </div>

      {/* 判定不能の理由 */}
      {confidence === 'low' && indeterminateReason && (
        <div className="evaluation-display__indeterminate">
          {indeterminateReason}
        </div>
      )}

      {/* フィードバック */}
      <div className="evaluation-display__feedback">
        <MathText text={feedback} />
      </div>

      {/* テクニック情報 */}
      {techniqueInfo && (
        <div className={`evaluation-display__technique ${techniqueInfo.isNewPattern ? 'evaluation-display__technique--new' : ''}`}>
          <div className="evaluation-display__technique-header">
            {techniqueInfo.isNewPattern ? '新テクニック発見!' : 'テクニック'}
          </div>
          <div className="evaluation-display__technique-name"><MathText text={techniqueInfo.name} /></div>
          <div className="evaluation-display__technique-details">
            <div className="evaluation-display__technique-row">
              <span className="evaluation-display__technique-label">使いどころ</span>
              <MathText text={techniqueInfo.trigger} className="evaluation-display__technique-value" />
            </div>
            <div className="evaluation-display__technique-row">
              <span className="evaluation-display__technique-label">解法</span>
              <MathText text={techniqueInfo.method} className="evaluation-display__technique-value" />
            </div>
          </div>
        </div>
      )}

      {/* チェックポイント */}
      {(matchedCheckPoints.length > 0 || missedCheckPoints.length > 0) && (
        <div className="evaluation-display__checkpoints">
          {matchedCheckPoints.map((cp, i) => (
            <div key={`m-${i}`} className="evaluation-display__checkpoint evaluation-display__checkpoint--matched">
              <MathText text={cp} />
            </div>
          ))}
          {missedCheckPoints.map((cp, i) => (
            <div key={`x-${i}`} className="evaluation-display__checkpoint evaluation-display__checkpoint--missed">
              <MathText text={cp} />
            </div>
          ))}
        </div>
      )}

      {/* 不正解時: 解法ステップを表示 */}
      {!isCorrect && confidence !== 'low' && (
        <details className="evaluation-display__solution">
          <summary>解法を見る</summary>
          <div className="evaluation-display__solution-content">
            <div className="evaluation-display__answer">
              <strong>正解:</strong> <MathText text={ensureMathDelimiter(problem.correctAnswer)} />
            </div>
            <ol className="evaluation-display__steps">
              {problem.solutionSteps.map((step, i) => (
                <li key={i}>
                  <MathText text={step} />
                </li>
              ))}
            </ol>
          </div>
        </details>
      )}

      {/* 不正解時: 復習おすすめ */}
      {stumbleAnalysis && stumbleAnalysis.reviewSuggestions.length > 0 && (
        <div className="evaluation-display__review">
          <div className="evaluation-display__review-header">復習のおすすめ</div>
          <p className="evaluation-display__review-analysis">{stumbleAnalysis.analysis}</p>
          <div className="evaluation-display__review-skills">
            {stumbleAnalysis.reviewSuggestions.map((suggestion) => (
              <button
                key={suggestion.skillId}
                className="evaluation-display__review-button"
                onClick={() => onNavigateToSkill?.(suggestion.skillId)}
                title={suggestion.reason}
              >
                {suggestion.skillName} を復習する
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const EvaluationDisplay = memo(EvaluationDisplayComponent);
