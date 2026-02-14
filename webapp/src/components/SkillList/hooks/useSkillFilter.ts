/**
 * スキルフィルタリング用フック
 */

import { useState, useMemo, useCallback } from 'react';
import type { SkillDefinition, SkillCategory } from '../../../types/skill-tree';
import type { SkillMasteryStatus } from '../../../types/student-model';
import { getSkillStatus } from './useSkillListData';

// ==========================================
// 型定義
// ==========================================

export type StatusFilter = 'all' | 'unlocked' | 'learning' | 'mastered' | 'locked';

export interface UseSkillFilterResult {
  // フィルタ状態
  searchQuery: string;
  statusFilter: StatusFilter;
  categoryFilter: SkillCategory | 'all';

  // アクション
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: StatusFilter) => void;
  setCategoryFilter: (category: SkillCategory | 'all') => void;
  clearFilters: () => void;

  // フィルタ適用
  filterSkills: (skills: SkillDefinition[], masteryMap: Map<string, SkillMasteryStatus>) => SkillDefinition[];
  isFiltering: boolean;

  // 自動展開すべきカテゴリ・単元
  autoExpandCategories: Set<SkillCategory>;
  autoExpandUnits: Set<string>;
}

// ==========================================
// フック本体
// ==========================================

export function useSkillFilter(): UseSkillFilterResult {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('unlocked');
  const [categoryFilter, setCategoryFilter] = useState<SkillCategory | 'all'>('all');

  // フィルタがアクティブか
  const isFiltering = searchQuery !== '' || statusFilter !== 'all' || categoryFilter !== 'all';

  // フィルタをクリア
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
  }, []);

  // スキルをフィルタリング
  const filterSkills = useCallback(
    (skills: SkillDefinition[], masteryMap: Map<string, SkillMasteryStatus>): SkillDefinition[] => {
      return skills.filter(skill => {
        // カテゴリフィルタ
        if (categoryFilter !== 'all' && skill.category !== categoryFilter) {
          return false;
        }

        // ステータスフィルタ
        if (statusFilter !== 'all') {
          const status = getSkillStatus(skill, masteryMap);
          if (statusFilter === 'mastered') {
            if (status !== 'mastered' && status !== 'perfect') return false;
          } else if (status !== statusFilter) {
            return false;
          }
        }

        // 検索クエリ
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const nameMatch = skill.name.toLowerCase().includes(query);
          const keywordMatch = skill.keywords.some(k => k.toLowerCase().includes(query));
          const subcategoryMatch = skill.subcategory.toLowerCase().includes(query);
          if (!nameMatch && !keywordMatch && !subcategoryMatch) {
            return false;
          }
        }

        return true;
      });
    },
    [searchQuery, statusFilter, categoryFilter]
  );

  // 自動展開すべきカテゴリ・単元を計算
  const { autoExpandCategories, autoExpandUnits } = useMemo(() => {
    if (!isFiltering) {
      return { autoExpandCategories: new Set<SkillCategory>(), autoExpandUnits: new Set<string>() };
    }

    // 検索クエリがある場合のみ自動展開
    if (!searchQuery) {
      return { autoExpandCategories: new Set<SkillCategory>(), autoExpandUnits: new Set<string>() };
    }

    // フィルタ結果からカテゴリ・単元を収集する必要があるが、
    // スキルデータがここにはないため、空のSetを返す
    // 実際の自動展開はSkillListPageで行う
    return { autoExpandCategories: new Set<SkillCategory>(), autoExpandUnits: new Set<string>() };
  }, [isFiltering, searchQuery]);

  return {
    searchQuery,
    statusFilter,
    categoryFilter,
    setSearchQuery,
    setStatusFilter,
    setCategoryFilter,
    clearFilters,
    filterSkills,
    isFiltering,
    autoExpandCategories,
    autoExpandUnits,
  };
}
