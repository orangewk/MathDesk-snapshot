/**
 * 単元アコーディオンコンポーネント
 */

import React, { memo } from 'react';
import type { SkillMasteryStatus } from '../../types/student-model';
import type { SkillDefinition } from '../../types/skill-tree';
import { SkillRow } from './SkillRow';
import { ProgressBar } from './ProgressBar';
import { getSkillStatus, getUnitProgress, getNextUnitAction, type UnitData, type UnitAction } from './hooks/useSkillListData';
import './UnitAccordion.css';

interface UnitAccordionProps {
  unit: UnitData;
  masteryMap: Map<string, SkillMasteryStatus>;
  isExpanded: boolean;
  onToggle: () => void;
  selectedSkillId: string | null;
  onSkillSelect: (skillId: string) => void;
  onSkipChallenge?: () => void;
  onUnitAction?: (action: UnitAction, skill: SkillDefinition) => void;
}

const ACTION_LABELS: Record<UnitAction, string> = {
  learn: '学習する',
  assess: '判定を受ける',
};

const UnitAccordionComponent: React.FC<UnitAccordionProps> = ({
  unit,
  masteryMap,
  isExpanded,
  onToggle,
  selectedSkillId,
  onSkillSelect,
  onSkipChallenge,
  onUnitAction,
}) => {
  const progress = getUnitProgress(unit, masteryMap);
  const canSkip = progress.mastered < progress.total;
  const nextAction = getNextUnitAction(unit, masteryMap);

  return (
    <div className="unit-accordion">
      <div
        className="unit-accordion__header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <span className="unit-accordion__toggle">
          {isExpanded ? '▼' : '▶'}
        </span>

        <span className="unit-accordion__name">{unit.name}</span>

        <span className="unit-accordion__count">
          ({unit.skills.length})
        </span>

        <div className="unit-accordion__progress">
          <ProgressBar value={progress.percent} size="sm" />
          <span className="unit-accordion__progress-label">
            {progress.mastered}/{progress.total}
          </span>
        </div>

        {nextAction && onUnitAction && (
          <button
            className={`unit-accordion__action-button unit-accordion__action-button--${nextAction.action}`}
            onClick={(e) => {
              e.stopPropagation();
              onUnitAction(nextAction.action, nextAction.skill);
            }}
            title={`${nextAction.skill.name} — ${ACTION_LABELS[nextAction.action]}`}
          >
            {ACTION_LABELS[nextAction.action]}
          </button>
        )}

        {canSkip && onSkipChallenge && (
          <button
            className="unit-accordion__skip-button"
            onClick={(e) => {
              e.stopPropagation();
              onSkipChallenge();
            }}
            title="この単元の習得をスキップします。試問に合格する必要があります"
          >
            Skip
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="unit-accordion__content">
          {unit.skills.map(skill => {
            const mastery = masteryMap.get(skill.id);
            const status = getSkillStatus(skill, masteryMap);

            return (
              <SkillRow
                key={skill.id}
                skill={skill}
                mastery={mastery}
                status={status}
                cardRank={mastery?.rank}
                isSelected={selectedSkillId === skill.id}
                onClick={() => onSkillSelect(skill.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export const UnitAccordion = memo(UnitAccordionComponent);
