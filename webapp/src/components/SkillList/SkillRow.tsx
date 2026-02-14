/**
 * スキル行コンポーネント
 */

import React, { memo } from 'react';
import type { SkillDefinition } from '../../types/skill-tree';
import type { SkillMasteryStatus, SkillStatus } from '../../types/student-model';
import { StatusIcon } from './StatusIcon';
import { ProgressBar } from './ProgressBar';
import './SkillRow.css';

interface SkillRowProps {
  skill: SkillDefinition;
  mastery?: SkillMasteryStatus;
  status: SkillStatus;
  cardRank?: number;
  isSelected: boolean;
  onClick: () => void;
}

function getRankBadge(rank: number | undefined): { label: string; className: string } | null {
  if (rank === undefined || rank === 0) return null;
  if (rank >= 3) return { label: '\u2605Master', className: 'skill-row__rank--master' };
  if (rank === 2) return { label: 'Lv.2', className: 'skill-row__rank--lv2' };
  return { label: 'Lv.1', className: 'skill-row__rank--lv1' };
}

const SkillRowComponent: React.FC<SkillRowProps> = ({
  skill,
  mastery,
  status,
  cardRank,
  isSelected,
  onClick,
}) => {
  const masteryLevel = mastery?.masteryLevel ?? 0;
  const showProgress = status === 'learning' || status === 'mastered' || status === 'perfect';

  return (
    <div
      className={`skill-row skill-row--${status} ${isSelected ? 'skill-row--selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <StatusIcon status={status} size="sm" />

      <div className="skill-row__content">
        <span className="skill-row__name">{skill.name}</span>
        {showProgress && (
          <div className="skill-row__progress">
            <ProgressBar value={masteryLevel} size="sm" />
            <span className="skill-row__progress-label">{masteryLevel}%</span>
          </div>
        )}
      </div>

      {(() => {
        const badge = getRankBadge(cardRank);
        return badge ? (
          <span className={`skill-row__rank ${badge.className}`}>{badge.label}</span>
        ) : null;
      })()}

      {skill.importance === 'core' && (
        <span className="skill-row__importance" title="重要スキル">★</span>
      )}
    </div>
  );
};

export const SkillRow = memo(SkillRowComponent);
