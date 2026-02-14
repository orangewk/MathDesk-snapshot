/**
 * スキルリストページコンポーネント
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { SkillCategory } from '../../types/skill-tree';
import { FilterBar } from './FilterBar';
import { CategoryAccordion } from './CategoryAccordion';
import { SkillDetailSidebar, type AssessmentMode } from './SkillDetailSidebar';
import { PracticeModal } from '../Practice/PracticeModal';
import { SkipChallengeModal } from '../Practice/SkipChallengeModal';
import { useSkillListData, getSkillStatus, type UnitAction } from './hooks/useSkillListData';
import { useSkillFilter } from './hooks/useSkillFilter';
import './SkillListPage.css';

interface SkillListPageProps {
  userId?: string;
  onStartLearning?: (skillId: string, skillName: string, skillDescription: string) => void;
  onStartAssessment?: (skillId: string, skillName: string, mode: AssessmentMode) => void;
  onSkillMastered?: (skillId: string, skillName: string) => void;
}

export const SkillListPage: React.FC<SkillListPageProps> = ({
  userId,
  onStartLearning,
  onStartAssessment,
  onSkillMastered,
}) => {
  // 練習モーダル
  const [practiceSkillId, setPracticeSkillId] = useState<string | null>(null);
  const [practiceSkillName, setPracticeSkillName] = useState<string | null>(null);

  // スキップ宣言モーダル
  const [skipCategory, setSkipCategory] = useState<string | null>(null);
  const [skipSubcategory, setSkipSubcategory] = useState<string | null>(null);

  // データ取得
  const {
    categories,
    skills,
    masteryMap,
    selectedSkill,
    selectedSkillPrereqs,
    selectedSkillSuccessors,
    isLoading,
    error,
    selectSkill,
    totalSkills,
    masteredSkills,
    overallProgress,
    refresh,
  } = useSkillListData(userId);

  // フィルタ
  const {
    searchQuery,
    statusFilter,
    setSearchQuery,
    setStatusFilter,
    filterSkills,
    isFiltering,
  } = useSkillFilter();

  // 展開状態
  const [expandedCategories, setExpandedCategories] = useState<Set<SkillCategory>>(new Set());
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  // カテゴリ展開/折りたたみ
  const toggleCategory = useCallback((category: SkillCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  // 単元展開/折りたたみ
  const toggleUnit = useCallback((unitName: string) => {
    setExpandedUnits(prev => {
      const next = new Set(prev);
      if (next.has(unitName)) {
        next.delete(unitName);
      } else {
        next.add(unitName);
      }
      return next;
    });
  }, []);

  // フィルタ適用したスキル
  const filteredSkills = useMemo(() => {
    return filterSkills(skills, masteryMap);
  }, [filterSkills, skills, masteryMap]);

  // フィルタ適用したカテゴリデータ
  const filteredCategories = useMemo(() => {
    if (!isFiltering) return categories;

    const filteredSkillIds = new Set(filteredSkills.map(s => s.id));

    return categories.map(cat => {
      const filteredUnits = cat.units.map(unit => ({
        ...unit,
        skills: unit.skills.filter(s => filteredSkillIds.has(s.id)),
      })).filter(unit => unit.skills.length > 0);

      let masteredCount = 0;
      let totalCount = 0;
      filteredUnits.forEach(unit => {
        unit.skills.forEach(skill => {
          totalCount++;
          const mastery = masteryMap.get(skill.id);
          if (mastery && (mastery.status === 'mastered' || mastery.status === 'perfect')) {
            masteredCount++;
          }
        });
      });

      return {
        ...cat,
        units: filteredUnits,
        totalSkills: totalCount,
        masteredCount,
        progressPercent: totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0,
      };
    }).filter(cat => cat.units.length > 0);
  }, [categories, filteredSkills, isFiltering, masteryMap]);

  // 検索時の自動展開
  useEffect(() => {
    if (searchQuery && filteredSkills.length > 0) {
      const categoriesToExpand = new Set<SkillCategory>();
      const unitsToExpand = new Set<string>();

      filteredSkills.forEach(skill => {
        categoriesToExpand.add(skill.category);
        unitsToExpand.add(skill.subcategory);
      });

      setExpandedCategories(categoriesToExpand);
      setExpandedUnits(unitsToExpand);
    }
  }, [searchQuery, filteredSkills]);

  // スキル選択ハンドラ
  const handleSkillSelect = useCallback((skillId: string) => {
    selectSkill(skillId);
  }, [selectSkill]);

  // サイドバー閉じる
  const handleCloseSidebar = useCallback(() => {
    selectSkill(null);
  }, [selectSkill]);

  // スキルへナビゲート
  const handleNavigateToSkill = useCallback((skillId: string) => {
    // スキルのカテゴリと単元を展開
    const skill = skills.find(s => s.id === skillId);
    if (skill) {
      setExpandedCategories(prev => new Set([...prev, skill.category]));
      setExpandedUnits(prev => new Set([...prev, skill.subcategory]));
    }
    selectSkill(skillId);
  }, [skills, selectSkill]);

  // 練習問題モーダルを開く
  const handleStartPractice = useCallback((skillId: string, skillName: string) => {
    setPracticeSkillId(skillId);
    setPracticeSkillName(skillName);
  }, []);

  const handleClosePractice = useCallback(() => {
    setPracticeSkillId(null);
    setPracticeSkillName(null);
    refresh();
  }, [refresh]);

  // スキップ宣言
  const handleSkipChallenge = useCallback((category: string, subcategory: string) => {
    setSkipCategory(category);
    setSkipSubcategory(subcategory);
  }, []);

  const handleCloseSkipChallenge = useCallback(() => {
    setSkipCategory(null);
    setSkipSubcategory(null);
    refresh();
  }, [refresh]);

  // 単元アクション（スマートルーティング）
  const handleUnitAction = useCallback((action: UnitAction, skill: { id: string; name: string; description: string; category: string }) => {
    if (action === 'learn' && onStartLearning) {
      onStartLearning(skill.id, skill.name, skill.description);
    } else if (action === 'assess' && onStartAssessment) {
      const mode = skill.category === '基礎' ? 'ai_generated' : 'textbook_required';
      onStartAssessment(skill.id, skill.name, mode);
    }
  }, [onStartLearning, onStartAssessment]);

  // 選択されたスキルのステータス
  const selectedSkillStatus = useMemo(() => {
    if (!selectedSkill) return 'unlocked';
    return getSkillStatus(selectedSkill, masteryMap);
  }, [selectedSkill, masteryMap]);

  // ローディング
  if (isLoading) {
    return (
      <div className="skill-list-page skill-list-page--loading">
        <div className="skill-list-page__spinner" />
        <p>スキル情報を読み込み中...</p>
      </div>
    );
  }

  // エラー
  if (error) {
    return (
      <div className="skill-list-page skill-list-page--error">
        <p className="skill-list-page__error-message">{error}</p>
        <button
          className="skill-list-page__retry-button"
          onClick={() => window.location.reload()}
        >
          再読み込み
        </button>
      </div>
    );
  }

  return (
    <div className="skill-list-page">
      {/* フィルタバー */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        totalSkills={totalSkills}
        masteredSkills={masteredSkills}
        overallProgress={overallProgress}
      />

      <div className="skill-list-page__content">
        <div className="skill-list-page__list">
          {filteredCategories.length === 0 ? (
            <div className="skill-list-page__empty">
              <p>該当するスキルがありません</p>
            </div>
          ) : (
            filteredCategories.map(categoryData => (
              <CategoryAccordion
                key={categoryData.category}
                categoryData={categoryData}
                masteryMap={masteryMap}
                isExpanded={expandedCategories.has(categoryData.category)}
                onToggle={() => toggleCategory(categoryData.category)}
                expandedUnits={expandedUnits}
                onUnitToggle={toggleUnit}
                selectedSkillId={selectedSkill?.id || null}
                onSkillSelect={handleSkillSelect}
                onSkipChallenge={handleSkipChallenge}
                onUnitAction={handleUnitAction}
              />
            ))
          )}
        </div>

        {/* 詳細サイドバー */}
        <div className="skill-list-page__sidebar">
          <SkillDetailSidebar
            skill={selectedSkill}
            mastery={selectedSkill ? masteryMap.get(selectedSkill.id) || null : null}
            status={selectedSkillStatus}
            cardRank={selectedSkill ? masteryMap.get(selectedSkill.id)?.rank : undefined}
            prerequisites={selectedSkillPrereqs}
            successors={selectedSkillSuccessors}
            onClose={handleCloseSidebar}
            onNavigateToSkill={handleNavigateToSkill}
            onStartLearning={onStartLearning}
            onStartAssessment={onStartAssessment}
            onStartPractice={handleStartPractice}
          />
        </div>
      </div>
      {/* 練習問題モーダル */}
      <PracticeModal
        isVisible={practiceSkillId !== null}
        skillId={practiceSkillId}
        skillName={practiceSkillName}
        onClose={handleClosePractice}
        onSkillMastered={onSkillMastered}
      />

      {/* スキップ宣言モーダル */}
      <SkipChallengeModal
        isVisible={skipCategory !== null}
        unitCategory={skipCategory}
        unitSubcategory={skipSubcategory}
        onClose={handleCloseSkipChallenge}
      />

    </div>
  );
};
