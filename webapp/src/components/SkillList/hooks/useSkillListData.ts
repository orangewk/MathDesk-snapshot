/**
 * スキルリスト用データ取得・整形フック
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getAllSkills, getSkillDetail } from '../../../services/skill-service';
import { getStudentModel } from '../../../services/student-service';
import type { SkillDefinition, SkillCategory } from '../../../types/skill-tree';
import type { SkillMasteryStatus, SkillStatus } from '../../../types/student-model';

// ==========================================
// 型定義
// ==========================================

/** 単元データ */
export interface UnitData {
  name: string;
  skills: SkillDefinition[];
}

/** カテゴリデータ */
export interface CategoryData {
  category: SkillCategory;
  units: UnitData[];
  totalSkills: number;
  masteredCount: number;
  progressPercent: number;
}

/** フックの戻り値 */
export interface UseSkillListDataResult {
  // データ
  categories: CategoryData[];
  skills: SkillDefinition[];
  masteryMap: Map<string, SkillMasteryStatus>;

  // 選択されたスキル
  selectedSkill: SkillDefinition | null;
  selectedSkillPrereqs: SkillDefinition[];
  selectedSkillSuccessors: SkillDefinition[];

  // 状態
  isLoading: boolean;
  error: string | null;

  // アクション
  selectSkill: (skillId: string | null) => void;
  refresh: () => Promise<void>;

  // 計算値
  totalSkills: number;
  masteredSkills: number;
  overallProgress: number;
}

// ==========================================
// カテゴリ順序
// ==========================================

const CATEGORY_ORDER: SkillCategory[] = [
  '基礎',
  '数学I',
  '数学A',
  '数学II',
  '数学B',
  '数学C',
];

// ==========================================
// フック本体
// ==========================================

export function useSkillListData(userId?: string): UseSkillListDataResult {
  // 状態
  const [skills, setSkills] = useState<SkillDefinition[]>([]);
  const [masteryMap, setMasteryMap] = useState<Map<string, SkillMasteryStatus>>(new Map());
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [selectedSkillPrereqs, setSelectedSkillPrereqs] = useState<SkillDefinition[]>([]);
  const [selectedSkillSuccessors, setSelectedSkillSuccessors] = useState<SkillDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // データ取得
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // スキル一覧取得
      const skillsResult = await getAllSkills();
      if (!skillsResult.success || !skillsResult.skills) {
        throw new Error(skillsResult.error || 'スキル取得失敗');
      }
      setSkills(skillsResult.skills);

      // 習熟度データを取得（ログイン済みの場合）
      if (userId) {
        const studentResult = await getStudentModel();

        if (studentResult.success && studentResult.studentModel) {
          const newMasteryMap = new Map<string, SkillMasteryStatus>();
          const skillMastery = studentResult.studentModel.skillMastery as Record<string, SkillMasteryStatus>;
          Object.entries(skillMastery).forEach(([skillId, mastery]) => {
            newMasteryMap.set(skillId, mastery);
          });
          setMasteryMap(newMasteryMap);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラー');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // 初回ロード
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // スキル選択
  const selectSkill = useCallback(async (skillId: string | null) => {
    setSelectedSkillId(skillId);

    if (!skillId) {
      setSelectedSkillPrereqs([]);
      setSelectedSkillSuccessors([]);
      return;
    }

    // 詳細取得
    const detailResult = await getSkillDetail(skillId);
    if (detailResult.success) {
      setSelectedSkillPrereqs(detailResult.prerequisites || []);
      setSelectedSkillSuccessors(detailResult.successors || []);
    }
  }, []);

  // カテゴリ・単元でグループ化
  const categories = useMemo(() => {
    const grouped = new Map<SkillCategory, Map<string, SkillDefinition[]>>();

    // 初期化
    CATEGORY_ORDER.forEach(cat => {
      grouped.set(cat, new Map());
    });

    // グループ化
    skills.forEach(skill => {
      const catMap = grouped.get(skill.category);
      if (catMap) {
        const unitSkills = catMap.get(skill.subcategory) || [];
        catMap.set(skill.subcategory, [...unitSkills, skill]);
      }
    });

    // CategoryData配列に変換
    const result: CategoryData[] = [];

    CATEGORY_ORDER.forEach(category => {
      const unitMap = grouped.get(category);
      if (!unitMap || unitMap.size === 0) return;

      const units: UnitData[] = [];
      let totalSkills = 0;
      let masteredCount = 0;

      unitMap.forEach((unitSkills, unitName) => {
        units.push({ name: unitName, skills: unitSkills });
        totalSkills += unitSkills.length;

        // 習得数カウント
        unitSkills.forEach(skill => {
          const mastery = masteryMap.get(skill.id);
          if (mastery && (mastery.status === 'mastered' || mastery.status === 'perfect')) {
            masteredCount++;
          }
        });
      });

      result.push({
        category,
        units,
        totalSkills,
        masteredCount,
        progressPercent: totalSkills > 0 ? Math.round((masteredCount / totalSkills) * 100) : 0,
      });
    });

    return result;
  }, [skills, masteryMap]);

  // 選択されたスキル
  const selectedSkill = useMemo(() => {
    if (!selectedSkillId) return null;
    return skills.find(s => s.id === selectedSkillId) || null;
  }, [skills, selectedSkillId]);

  // 全体統計
  const totalSkills = skills.length;
  const masteredSkills = useMemo(() => {
    let count = 0;
    masteryMap.forEach(mastery => {
      if (mastery.status === 'mastered' || mastery.status === 'perfect') {
        count++;
      }
    });
    return count;
  }, [masteryMap]);
  const overallProgress = totalSkills > 0 ? Math.round((masteredSkills / totalSkills) * 100) : 0;

  return {
    categories,
    skills,
    masteryMap,
    selectedSkill,
    selectedSkillPrereqs,
    selectedSkillSuccessors,
    isLoading,
    error,
    selectSkill,
    refresh: fetchData,
    totalSkills,
    masteredSkills,
    overallProgress,
  };
}

// ==========================================
// 単元アクション判定
// ==========================================

/** 単元内の次のアクション */
export type UnitAction = 'learn' | 'assess';

export interface NextUnitAction {
  action: UnitAction;
  skill: SkillDefinition;
}

/**
 * 単元内で次にやるべきスキル＋アクションを自動判定
 * メインフロー: 学習(rank 0-1) → 判定(rank 2) → mastered(rank 3+)
 */
export function getNextUnitAction(
  unit: UnitData,
  masteryMap: Map<string, SkillMasteryStatus>
): NextUnitAction | null {
  for (const skill of unit.skills) {
    const mastery = masteryMap.get(skill.id);
    const rank = mastery?.rank ?? 0;
    const status = getSkillStatus(skill, masteryMap);

    if (status === 'locked') continue;
    if (status === 'mastered' || status === 'perfect') continue;

    if (rank <= 1) return { action: 'learn', skill };
    return { action: 'assess', skill };
  }

  return null; // 全スキル mastered
}

// ==========================================
// ヘルパー関数
// ==========================================

/**
 * スキルのステータスを判定
 */
export function getSkillStatus(
  skill: SkillDefinition,
  masteryMap: Map<string, SkillMasteryStatus>
): SkillStatus {
  const mastery = masteryMap.get(skill.id);
  if (mastery) {
    return mastery.status;
  }

  // 前提スキルがすべて習得済みかチェック
  if (skill.prerequisites.length === 0) {
    return 'unlocked';
  }

  const allPrereqsMastered = skill.prerequisites.every(prereqId => {
    const prereqMastery = masteryMap.get(prereqId);
    return prereqMastery && (prereqMastery.status === 'mastered' || prereqMastery.status === 'perfect');
  });

  return allPrereqsMastered ? 'unlocked' : 'locked';
}

/**
 * 単元内の進捗を計算
 */
export function getUnitProgress(
  unit: UnitData,
  masteryMap: Map<string, SkillMasteryStatus>
): { mastered: number; total: number; percent: number } {
  let mastered = 0;
  unit.skills.forEach(skill => {
    const mastery = masteryMap.get(skill.id);
    if (mastery && (mastery.status === 'mastered' || mastery.status === 'perfect')) {
      mastered++;
    }
  });

  return {
    mastered,
    total: unit.skills.length,
    percent: unit.skills.length > 0 ? Math.round((mastered / unit.skills.length) * 100) : 0,
  };
}
