/**
 * スキルマップサマリサービス
 * LLMアドバイザーに渡すためのユーザー学習状況サマリを構築する
 *
 * 設計書: docs/planning/learning-navigation.md (Phase 1)
 */

import {
  SKILL_DEFINITIONS,
  type SkillDefinition,
  getSkillById,
} from '../data/skill-definitions.js';
import {
  BACKTRACK_RULES,
  type BacktrackRule,
} from '../data/backtrack-rules.js';
import type { StudentModel, SkillStatus } from '../types/student-model.js';
import { findTechniquesByParentSkill } from '../data/firestore/technique-repository.js';

// ------------------------------------
// 型定義
// ------------------------------------

export interface CategoryProgress {
  category: string;
  total: number;
  mastered: number;
  learning: number;
  progressPercent: number;
}

export interface UnitSkillInfo {
  id: string;
  name: string;
  status: SkillStatus;
  rank: number;
  lastPracticed: string | null;
}

export interface UnitProgress {
  category: string;
  unit: string;
  skills: UnitSkillInfo[];
  masteredCount: number;
  totalCount: number;
}

export interface RecentStruggle {
  skillId: string;
  skillName: string;
  errorTypes: string[];
  frequency: number;
  relatedPrerequisites: {
    skillId: string;
    skillName: string;
    message: string;
  }[];
}

export interface LearningMomentum {
  lastStudiedAt: string | null;
  daysSinceLastStudy: number;
  recentSessionCount: number;
  streak: number;
}

export interface SkillMapSummary {
  categoryProgress: CategoryProgress[];
  unitProgress: UnitProgress[];
  recentStruggles: RecentStruggle[];
  momentum: LearningMomentum;
}

// ------------------------------------
// サマリ構築
// ------------------------------------

/**
 * ユーザーのスキルマップサマリを構築する
 */
export async function buildSkillMapSummary(
  userId: string,
  studentModel: StudentModel,
): Promise<SkillMapSummary> {
  const categoryProgress = buildCategoryProgress(studentModel);
  const unitProgress = await buildUnitProgress(userId, studentModel);
  const recentStruggles = buildRecentStruggles(userId, studentModel);
  const momentum = buildMomentum(studentModel);

  return { categoryProgress, unitProgress, recentStruggles, momentum };
}

/**
 * カテゴリ別の習得状況
 */
function buildCategoryProgress(studentModel: StudentModel): CategoryProgress[] {
  const categoryMap = new Map<string, { total: number; mastered: number; learning: number }>();

  for (const skill of SKILL_DEFINITIONS) {
    const entry = categoryMap.get(skill.category) ?? { total: 0, mastered: 0, learning: 0 };
    entry.total++;

    const status = studentModel.skillMastery[skill.id]?.status;
    if (status === 'mastered' || status === 'perfect') {
      entry.mastered++;
    } else if (status === 'learning') {
      entry.learning++;
    }

    categoryMap.set(skill.category, entry);
  }

  return Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    total: data.total,
    mastered: data.mastered,
    learning: data.learning,
    progressPercent: data.total > 0 ? Math.round((data.mastered / data.total) * 100) : 0,
  }));
}

/**
 * 単元（subcategory）別の習得状況
 */
async function buildUnitProgress(userId: string, studentModel: StudentModel): Promise<UnitProgress[]> {
  const unitMap = new Map<string, { category: string; skills: SkillDefinition[] }>();

  for (const skill of SKILL_DEFINITIONS) {
    const key = `${skill.category}::${skill.subcategory}`;
    const entry = unitMap.get(key) ?? { category: skill.category, skills: [] };
    entry.skills.push(skill);
    unitMap.set(key, entry);
  }

  const results: UnitProgress[] = [];

  for (const [key, { category, skills }] of unitMap.entries()) {
    const unit = key.split('::')[1];

    const skillInfos: UnitSkillInfo[] = [];
    for (const skill of skills) {
      const mastery = studentModel.skillMastery[skill.id];
      const cards = await findTechniquesByParentSkill(userId, skill.id);
      const maxRank = cards.reduce((max, c) => Math.max(max, c.rank), 0);

      skillInfos.push({
        id: skill.id,
        name: skill.name,
        status: mastery?.status ?? 'locked',
        rank: maxRank,
        lastPracticed: mastery?.lastPracticed ?? null,
      });
    }

    const masteredCount = skillInfos.filter(
      (s) => s.status === 'mastered' || s.status === 'perfect',
    ).length;

    results.push({
      category,
      unit,
      skills: skillInfos,
      masteredCount,
      totalCount: skillInfos.length,
    });
  }

  return results;
}

/**
 * 最近のつまずきパターンを構築
 * - 学習中 or mastered なスキルのうち、直近の練習でミスが多いものを抽出
 * - backtrack-rules から関連する前提スキル情報を付加
 */
function buildRecentStruggles(
  userId: string,
  studentModel: StudentModel,
): RecentStruggle[] {
  const struggles: RecentStruggle[] = [];

  // 学習履歴から最近つまずいたスキルを抽出
  const recentSessions = studentModel.learningHistory.slice(-20);
  const mistakesBySkill = new Map<string, { errorTypes: Set<string>; frequency: number }>();

  for (const session of recentSessions) {
    if (session.questionsAttempted > 0 && session.questionsCorrect < session.questionsAttempted) {
      const entry = mistakesBySkill.get(session.skillId) ?? {
        errorTypes: new Set<string>(),
        frequency: 0,
      };
      entry.frequency += session.questionsAttempted - session.questionsCorrect;
      for (const mistakeType of session.mistakeTypes) {
        entry.errorTypes.add(mistakeType);
      }
      mistakesBySkill.set(session.skillId, entry);
    }
  }

  // ミスパターン全体の傾向も考慮
  const patterns = studentModel.mistakePatterns;
  const dominantErrorTypes: string[] = [];
  if (patterns.calculation.recentCount > 2) dominantErrorTypes.push('計算ミス');
  if (patterns.strategy.recentCount > 2) dominantErrorTypes.push('解法選択ミス');
  if (patterns.transcription.recentCount > 2) dominantErrorTypes.push('書き写しミス');
  if (patterns.alignment.recentCount > 2) dominantErrorTypes.push('桁ずれ・配置ミス');

  for (const [skillId, data] of mistakesBySkill.entries()) {
    const skill = getSkillById(skillId);
    if (!skill) continue;

    // backtrack-rules から関連する前提スキルを検索
    const relatedRules = BACKTRACK_RULES.filter((r) => r.skillId === skillId);
    const relatedPrerequisites = relatedRules.flatMap((rule) =>
      rule.backtrackTo
        .map((targetId) => {
          const targetSkill = getSkillById(targetId);
          return targetSkill
            ? { skillId: targetId, skillName: targetSkill.name, message: rule.message }
            : null;
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    );

    // 重複除去（同じスキルIDが複数ルールから出てくる場合）
    const uniquePrereqs = Array.from(
      new Map(relatedPrerequisites.map((p) => [p.skillId, p])).values(),
    );

    struggles.push({
      skillId,
      skillName: skill.name,
      errorTypes: [...data.errorTypes],
      frequency: data.frequency,
      relatedPrerequisites: uniquePrereqs,
    });
  }

  // frequency 降順でソートし、上位5件
  return struggles.sort((a, b) => b.frequency - a.frequency).slice(0, 5);
}

/**
 * 学習の勢い（モメンタム）
 */
function buildMomentum(studentModel: StudentModel): LearningMomentum {
  const now = new Date();
  const sessions = studentModel.learningHistory;

  // 最終学習日
  let lastStudiedAt: string | null = null;
  if (sessions.length > 0) {
    lastStudiedAt = sessions[sessions.length - 1].startedAt;
  }

  // 最終学習からの経過日数
  const daysSinceLastStudy = lastStudiedAt
    ? Math.floor((now.getTime() - new Date(lastStudiedAt).getTime()) / (1000 * 60 * 60 * 24))
    : -1;

  // 直近7日のセッション数
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentSessionCount = sessions.filter(
    (s) => new Date(s.startedAt) >= sevenDaysAgo,
  ).length;

  // 連続学習日数（簡易計算: 直近の日付を逆順にチェック）
  let streak = 0;
  const studyDates = new Set(
    sessions.map((s) => new Date(s.startedAt).toISOString().split('T')[0]),
  );

  for (let i = 0; i < 365; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    if (studyDates.has(dateStr)) {
      streak++;
    } else if (i > 0) {
      // 今日（i=0）は学習してなくても昨日から数える
      break;
    }
  }

  return {
    lastStudiedAt,
    daysSinceLastStudy,
    recentSessionCount,
    streak,
  };
}

// ------------------------------------
// LLM向けテキスト変換
// ------------------------------------

/**
 * SkillMapSummary を LLM に渡すための構造化テキストに変換
 */
export function formatSummaryForLLM(summary: SkillMapSummary): string {
  const lines: string[] = [];

  // カテゴリ別進捗
  lines.push('## カテゴリ別進捗');
  for (const cat of summary.categoryProgress) {
    lines.push(
      `- ${cat.category}: ${cat.mastered}/${cat.total} 習得 (${cat.progressPercent}%)` +
        (cat.learning > 0 ? ` / 学習中 ${cat.learning}件` : ''),
    );
  }
  lines.push('');

  // 学習中・未習得の単元（LLMが推薦しやすいようにフィルタ）
  lines.push('## 注目すべき単元');
  const activeUnits = summary.unitProgress.filter(
    (u) => u.masteredCount < u.totalCount,
  );

  for (const unit of activeUnits.slice(0, 15)) {
    const inProgress = unit.skills.filter((s) => s.status === 'learning');
    const unlocked = unit.skills.filter((s) => s.status === 'unlocked');
    const locked = unit.skills.filter((s) => s.status === 'locked');

    lines.push(`### ${unit.category} > ${unit.unit} (${unit.masteredCount}/${unit.totalCount})`);
    if (inProgress.length > 0) {
      lines.push(`  学習中: ${inProgress.map((s) => `${s.name}(rank${s.rank})`).join(', ')}`);
    }
    if (unlocked.length > 0) {
      lines.push(`  学習可能: ${unlocked.map((s) => s.name).join(', ')}`);
    }
    if (locked.length > 0) {
      lines.push(`  ロック中: ${locked.length}件`);
    }
  }
  lines.push('');

  // つまずきパターン
  if (summary.recentStruggles.length > 0) {
    lines.push('## 最近のつまずき');
    for (const struggle of summary.recentStruggles) {
      lines.push(`- ${struggle.skillName}: ミス${struggle.frequency}回 (${struggle.errorTypes.join(', ')})`);
      if (struggle.relatedPrerequisites.length > 0) {
        for (const prereq of struggle.relatedPrerequisites) {
          lines.push(`  → 復習候補: ${prereq.skillName} — ${prereq.message}`);
        }
      }
    }
    lines.push('');
  }

  // モメンタム
  lines.push('## 学習の勢い');
  const m = summary.momentum;
  if (m.lastStudiedAt) {
    lines.push(`- 最終学習: ${m.daysSinceLastStudy === 0 ? '今日' : `${m.daysSinceLastStudy}日前`}`);
    lines.push(`- 直近7日のセッション数: ${m.recentSessionCount}`);
    lines.push(`- 連続学習日数: ${m.streak}日`);
  } else {
    lines.push('- まだ学習履歴がありません');
  }

  return lines.join('\n');
}
