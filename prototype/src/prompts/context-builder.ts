// FILE: prototype/src/prompts/context-builder.ts
// ==========================================

/**
 * StudentContext ビルダー
 * Phase 2A - システムプロンプト設計・実装
 * * 設計書: plans/task2-system-prompt-design.md
 */

import type { StudentModel } from '../types/student-model.js';
import type { 
  StudentContext, 
  MistakePatternSummary, 
  MistakePatternType, 
  SkillRecommendationSummary, 
  BacktrackSummary 
} from './types.js';
import { getNextRecommendedSkills, getBacktrackRecommendation } from '../services/skill-recommendation-service.js';
import { getSkillById } from '../data/skill-definitions.js';
import type { ErrorType } from '../data/backtrack-rules.js';

/**
 * StudentModelからStudentContextを生成
 */
export function buildStudentContext(
  studentModel: StudentModel,
  currentSkillId?: string,
  recentErrorType?: ErrorType
): StudentContext {
  // ミスパターン傾向を抽出
  const topMistakePatterns = extractTopMistakePatterns(studentModel);

  // 推薦スキル取得
  const nextRecommendedSkills = extractRecommendedSkills(studentModel);

  // 現在のスキル情報
  const currentSkill = currentSkillId ? getSkillById(currentSkillId) : undefined;

  // 遡り推薦（つまずき検出時）
  const recentBacktrack = currentSkillId && recentErrorType
    ? extractBacktrackRecommendation(currentSkillId, recentErrorType)
    : undefined;

  return {
    topMistakePatterns,
    independenceLevel: studentModel.independenceMetrics.independenceLevel,
    recentSessionCount: studentModel.learningHistory.length,
    currentSkillId,
    currentSkillName: currentSkill?.name,
    nextRecommendedSkills,
    recentBacktrack,
    onboardingCompleted: studentModel.onboarding.completed,
    selfAssessment: studentModel.onboarding.selfAssessment,
    gradeLevel: studentModel.onboarding.gradeLevel ?? null,
    studyGoal: studentModel.onboarding.studyGoal ?? null,
  };
}

/**
 * ミスパターン傾向を抽出（上位3つ）
 */
function extractTopMistakePatterns(studentModel: StudentModel): MistakePatternSummary[] {
  const mistakeTypes: MistakePatternType[] = ['transcription', 'alignment', 'strategy', 'calculation'];

  return mistakeTypes
    .map(type => ({
      type,
      count: studentModel.mistakePatterns[type].totalCount,
      trend: studentModel.mistakePatterns[type].trend
    }))
    .filter(p => p.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

/**
 * 推薦スキルを抽出
 */
function extractRecommendedSkills(studentModel: StudentModel): SkillRecommendationSummary[] {
  const recommendations = getNextRecommendedSkills(studentModel, 3);

  return recommendations.map(r => ({
    skillId: r.skill.id,
    skillName: r.skill.name,
    reason: r.reason
  }));
}

/**
 * 遡り推薦を抽出
 */
function extractBacktrackRecommendation(
  skillId: string,
  errorType: ErrorType
): BacktrackSummary | undefined {
  const backtrack = getBacktrackRecommendation(skillId, errorType);

  if (!backtrack) {
    return undefined;
  }

  return {
    message: backtrack.rule.message,
    targetSkills: backtrack.targetSkills.map(skill => ({
      skillId: skill.id,
      skillName: skill.name
    }))
  };
}

/**
 * 最小限のStudentContextを生成（新規ユーザー用）
 */
export function buildMinimalStudentContext(): StudentContext {
  return {
    topMistakePatterns: [],
    independenceLevel: 1,
    recentSessionCount: 0,
    currentSkillId: undefined,
    currentSkillName: undefined,
    nextRecommendedSkills: [],
    recentBacktrack: undefined,
    onboardingCompleted: false,
    selfAssessment: null,
    gradeLevel: null,
    studyGoal: null,
  };
}

/**
 * StudentContextを部分的に更新
 */
export function updateStudentContext(
  context: StudentContext,
  updates: Partial<StudentContext>
): StudentContext {
  return {
    ...context,
    ...updates
  };
}