/**
 * フィルタバーコンポーネント
 */

import React, { memo } from 'react';
import type { SkillCategory } from '../../types/skill-tree';
import type { StatusFilter } from './hooks/useSkillFilter';
import { ProgressBar } from './ProgressBar';
import './FilterBar.css';

interface FilterBarProps {
  // 検索
  searchQuery: string;
  onSearchChange: (query: string) => void;

  // ステータスフィルタ
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;

  // カテゴリフィルタ（オプション）
  categoryFilter?: SkillCategory | 'all';
  onCategoryFilterChange?: (category: SkillCategory | 'all') => void;

  // 統計
  totalSkills: number;
  masteredSkills: number;
  overallProgress: number;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '全て' },
  { value: 'unlocked', label: '学習可能' },
  { value: 'learning', label: '学習中' },
  { value: 'mastered', label: '習得済み' },
  { value: 'locked', label: '未解放' },
];

const CATEGORY_OPTIONS: { value: SkillCategory | 'all'; label: string }[] = [
  { value: 'all', label: '全科目' },
  { value: '基礎', label: '基礎' },
  { value: '数学I', label: '数学I' },
  { value: '数学A', label: '数学A' },
  { value: '数学II', label: '数学II' },
  { value: '数学B', label: '数学B' },
  { value: '数学C', label: '数学C' },
];

const FilterBarComponent: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  totalSkills,
  masteredSkills,
  overallProgress,
}) => {
  return (
    <div className="filter-bar">
      <div className="filter-bar__row">
        {/* 検索 */}
        <div className="filter-bar__search">
          <span className="filter-bar__search-icon">🔍</span>
          <input
            type="text"
            className="filter-bar__search-input"
            placeholder="スキルを検索..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              className="filter-bar__search-clear"
              onClick={() => onSearchChange('')}
              aria-label="検索をクリア"
            >
              ✕
            </button>
          )}
        </div>

        {/* ステータスフィルタ */}
        <div className="filter-bar__filter">
          <label className="filter-bar__filter-label">状態:</label>
          <select
            className="filter-bar__select"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* カテゴリフィルタ（オプション） */}
        {onCategoryFilterChange && (
          <div className="filter-bar__filter">
            <label className="filter-bar__filter-label">科目:</label>
            <select
              className="filter-bar__select"
              value={categoryFilter || 'all'}
              onChange={(e) => onCategoryFilterChange(e.target.value as SkillCategory | 'all')}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 進捗サマリー */}
      <div className="filter-bar__summary">
        <div className="filter-bar__progress-info">
          <span className="filter-bar__progress-label">全体進捗</span>
          <span className="filter-bar__progress-value">{overallProgress}%</span>
        </div>
        <ProgressBar value={overallProgress} size="md" className="filter-bar__progress-bar" />
        <span className="filter-bar__stats">
          {masteredSkills} / {totalSkills} スキル習得
        </span>
        <span className="filter-bar__scope-note">
          対象: 高校数学（数学I〜C）
        </span>
      </div>
    </div>
  );
};

export const FilterBar = memo(FilterBarComponent);
