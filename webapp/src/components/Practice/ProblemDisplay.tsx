/**
 * 問題表示コンポーネント
 * AI生成の問題をKaTeX数式付きで表示する
 * 図形系の問題にはJSXGraphで作図を表示する
 */

import React, { memo } from 'react';
import { MathText } from '../MathDisplay';
import { JSXGraphRenderer } from './JSXGraphRenderer';
import type { GeneratedProblem, ProblemLevel } from '../../services/practice-service';
import './ProblemDisplay.css';

const LEVEL_LABELS: Record<ProblemLevel, string> = {
  1: 'Level 1 基本',
  2: 'Level 2 標準',
  3: 'Level 3 応用',
  4: 'Level 4 発展',
};

interface ProblemDisplayProps {
  problem: GeneratedProblem;
  figureLoading?: boolean;
}

const ProblemDisplayComponent: React.FC<ProblemDisplayProps> = ({ problem, figureLoading = false }) => {
  const { figure } = problem;
  const hasJsxGraph = figure?.type === 'jsxgraph' && figure.code;

  return (
    <div className="problem-display">
      <div className="problem-display__level-badge">
        {LEVEL_LABELS[problem.level]}
      </div>
      <div className="problem-display__question">
        <MathText text={problem.questionText} />
      </div>
      {hasJsxGraph && (
        <JSXGraphRenderer
          code={figure.code}
          description={figure.description}
          boundingBox={figure.boundingBox}
        />
      )}
      {!hasJsxGraph && figureLoading && (
        <div className="problem-display__figure-loading">
          <div className="problem-display__figure-spinner" />
          <span>図を作成中...</span>
        </div>
      )}
      {!hasJsxGraph && !figureLoading && figure?.description && (
        <div className="problem-display__figure-desc">
          {figure.description}
        </div>
      )}
    </div>
  );
};

export const ProblemDisplay = memo(ProblemDisplayComponent);
