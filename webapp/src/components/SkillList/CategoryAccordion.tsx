/**
 * カテゴリアコーディオンコンポーネント
 */

import React, { memo } from 'react';
import type { SkillMasteryStatus } from '../../types/student-model';
import type { SkillDefinition } from '../../types/skill-tree';
import { UnitAccordion } from './UnitAccordion';
import { ProgressBar } from './ProgressBar';
import type { CategoryData, UnitAction } from './hooks/useSkillListData';
import './CategoryAccordion.css';

// カテゴリ別の色設定
const CATEGORY_COLORS: Record<string, { bg: string; border: string }> = {
  '基礎': { bg: '#E3F2FD', border: '#1976D2' },
  '数学I': { bg: '#E8F5E9', border: '#388E3C' },
  '数学A': { bg: '#FFF3E0', border: '#F57C00' },
  '数学II': { bg: '#F3E5F5', border: '#7B1FA2' },
  '数学B': { bg: '#FFFDE7', border: '#FBC02D' },
  '数学C': { bg: '#E0F7FA', border: '#0097A7' },
};

interface CategoryAccordionProps {
  categoryData: CategoryData;
  masteryMap: Map<string, SkillMasteryStatus>;
  isExpanded: boolean;
  onToggle: () => void;
  expandedUnits: Set<string>;
  onUnitToggle: (unitName: string) => void;
  selectedSkillId: string | null;
  onSkillSelect: (skillId: string) => void;
  onSkipChallenge?: (category: string, subcategory: string) => void;
  onUnitAction?: (action: UnitAction, skill: SkillDefinition) => void;
}

const CategoryAccordionComponent: React.FC<CategoryAccordionProps> = ({
  categoryData,
  masteryMap,
  isExpanded,
  onToggle,
  expandedUnits,
  onUnitToggle,
  selectedSkillId,
  onSkillSelect,
  onSkipChallenge,
  onUnitAction,
}) => {
  const colors = CATEGORY_COLORS[categoryData.category] || { bg: '#f5f5f5', border: '#9e9e9e' };

  return (
    <div
      className="category-accordion"
      style={{
        '--category-bg': colors.bg,
        '--category-border': colors.border,
      } as React.CSSProperties}
    >
      <div
        className="category-accordion__header"
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
        <span className="category-accordion__toggle">
          {isExpanded ? '▼' : '▶'}
        </span>

        <span className="category-accordion__name">{categoryData.category}</span>

        <span className="category-accordion__count">
          ({categoryData.totalSkills}スキル)
        </span>

        <div className="category-accordion__progress">
          <ProgressBar value={categoryData.progressPercent} size="md" />
          <span className="category-accordion__progress-label">
            {categoryData.progressPercent}%
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="category-accordion__content">
          {categoryData.units.map(unit => (
            <UnitAccordion
              key={`${categoryData.category}-${unit.name}`}
              unit={unit}
              masteryMap={masteryMap}
              isExpanded={expandedUnits.has(unit.name)}
              onToggle={() => onUnitToggle(unit.name)}
              selectedSkillId={selectedSkillId}
              onSkillSelect={onSkillSelect}
              onSkipChallenge={onSkipChallenge ? () => onSkipChallenge(categoryData.category, unit.name) : undefined}
              onUnitAction={onUnitAction}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CategoryAccordion = memo(CategoryAccordionComponent);
