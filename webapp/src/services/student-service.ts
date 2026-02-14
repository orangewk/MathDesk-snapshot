// ==========================================
// FILE: webapp/src/services/student-service.ts
// ==========================================
/**
 * Student Model サービス
 * Phase 2A - フロントエンドから Student Model APIを呼び出す
 * * 設計書: plans/task1-student-model-design.md
 */

import { getAuthHeaders } from './auth-service';
import type {
  StudentModel,
  SkillMasteryStatus,
  SkillStatus,
  MistakeType,
  MistakePatternRecord,
  IndependenceMetrics,
  OnboardingStatus,
  SelfAssessment,
  LearningSummary,
} from '../types/student-model';

const API_BASE_URL = '/api';

// ==========================================
// キャッシュ管理
// ==========================================

let cachedStudentModel: StudentModel | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5分

/**
 * キャッシュを無効化
 */
export function invalidateCache(): void {
  cachedStudentModel = null;
  cacheTimestamp = 0;
}

/**
 * キャッシュが有効かチェック
 */
function isCacheValid(): boolean {
  return cachedStudentModel !== null && Date.now() - cacheTimestamp < CACHE_TTL_MS;
}

// ==========================================
// API呼び出しヘルパー
// ==========================================

interface ApiResponse<T> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * 認証付きGETリクエスト
 */
async function authGet<T>(endpoint: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || `HTTP ${response.status}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('API GET error:', error);
    return { success: false, error: 'ネットワークエラーが発生しました' };
  }
}

/**
 * 認証付きPOSTリクエスト
 */
async function authPost<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || `HTTP ${response.status}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('API POST error:', error);
    return { success: false, error: 'ネットワークエラーが発生しました' };
  }
}

/**
 * 認証付きPATCHリクエスト
 */
async function authPatch<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || `HTTP ${response.status}` };
    }

    return { success: true, data };
  } catch (error) {
    console.error('API PATCH error:', error);
    return { success: false, error: 'ネットワークエラーが発生しました' };
  }
}

// ==========================================
// Student Model 取得
// ==========================================

/**
 * Student Modelを取得
 */
export async function getStudentModel(forceRefresh = false): Promise<{
  success: boolean;
  studentModel?: StudentModel;
  error?: string;
}> {
  // キャッシュを使用
  if (!forceRefresh && isCacheValid()) {
    return { success: true, studentModel: cachedStudentModel! };
  }

  const result = await authGet<{ success: boolean; studentModel: StudentModel }>('/student');

  if (result.success && result.data?.studentModel) {
    cachedStudentModel = result.data.studentModel;
    cacheTimestamp = Date.now();
    return { success: true, studentModel: result.data.studentModel };
  }

  return { success: false, error: result.error };
}

/**
 * 学習サマリーを取得
 */
export async function getLearningSummary(): Promise<{
  success: boolean;
  summary?: LearningSummary;
  error?: string;
}> {
  const result = await authGet<{ success: boolean; summary: LearningSummary }>('/student/summary');

  if (result.success && result.data?.summary) {
    return { success: true, summary: result.data.summary };
  }

  return { success: false, error: result.error };
}

// ==========================================
// オンボーディング
// ==========================================

/**
 * オンボーディングを開始
 */
export async function startOnboarding(): Promise<{
  success: boolean;
  onboarding?: OnboardingStatus;
  error?: string;
}> {
  const result = await authPost<{ success: boolean; onboarding: OnboardingStatus }>(
    '/student/onboarding/start'
  );

  if (result.success && result.data?.onboarding) {
    invalidateCache();
    return { success: true, onboarding: result.data.onboarding };
  }

  return { success: false, error: result.error };
}

/**
 * 自己申告レベルを設定
 */
export async function setSelfAssessment(selfAssessment: SelfAssessment): Promise<{
  success: boolean;
  onboarding?: OnboardingStatus;
  error?: string;
}> {
  const result = await authPost<{ success: boolean; onboarding: OnboardingStatus }>(
    '/student/onboarding/self-assessment',
    { selfAssessment }
  );

  if (result.success && result.data?.onboarding) {
    invalidateCache();
    return { success: true, onboarding: result.data.onboarding };
  }

  return { success: false, error: result.error };
}

/**
 * オンボーディング完了データ
 */
export interface OnboardingCompleteData {
  nickname?: string;
  gradeLevel?: string | null;
  studiedSubjects?: string[];
  selfAssessment?: string | null;
  studyGoal?: string | null;
}

/**
 * オンボーディングを完了（問診票データ付き）
 */
export async function completeOnboarding(data?: OnboardingCompleteData): Promise<{
  success: boolean;
  onboarding?: OnboardingStatus;
  error?: string;
}> {
  const result = await authPost<{ success: boolean; onboarding: OnboardingStatus }>(
    '/student/onboarding/complete',
    data ?? {}
  );

  if (result.success && result.data?.onboarding) {
    invalidateCache();
    return { success: true, onboarding: result.data.onboarding };
  }

  return { success: false, error: result.error };
}

// ==========================================
// スキル習熟度
// ==========================================

/**
 * スキル習熟度を取得
 */
export async function getSkillMastery(skillId: string): Promise<{
  success: boolean;
  skillMastery?: SkillMasteryStatus;
  error?: string;
}> {
  const result = await authGet<{ success: boolean; skillMastery: SkillMasteryStatus }>(
    `/student/skill/${encodeURIComponent(skillId)}`
  );

  if (result.success && result.data?.skillMastery) {
    return { success: true, skillMastery: result.data.skillMastery };
  }

  return { success: false, error: result.error };
}

/**
 * スキル習熟度を更新
 */
export async function updateSkillMastery(
  skillId: string,
  update: {
    status?: SkillStatus;
    masteryLevel?: number;
    attempts?: number;
  }
): Promise<{
  success: boolean;
  skillMastery?: SkillMasteryStatus;
  error?: string;
}> {
  const result = await authPatch<{ success: boolean; skillMastery: SkillMasteryStatus }>(
    `/student/skill/${encodeURIComponent(skillId)}`,
    update
  );

  if (result.success && result.data?.skillMastery) {
    invalidateCache();
    return { success: true, skillMastery: result.data.skillMastery };
  }

  return { success: false, error: result.error };
}

/**
 * 練習を記録
 */
export async function recordPractice(skillId: string): Promise<{
  success: boolean;
  skillMastery?: SkillMasteryStatus;
  error?: string;
}> {
  const result = await authPost<{ success: boolean; skillMastery: SkillMasteryStatus }>(
    `/student/skill/${encodeURIComponent(skillId)}/practice`
  );

  if (result.success && result.data?.skillMastery) {
    invalidateCache();
    return { success: true, skillMastery: result.data.skillMastery };
  }

  return { success: false, error: result.error };
}

// ==========================================
// ミスパターン
// ==========================================

/**
 * ミスを記録
 */
export async function recordMistake(
  mistakeType: MistakeType,
  example: {
    questionId: string;
    skillId: string;
    description: string;
    userWork: string;
    correction: string;
  }
): Promise<{
  success: boolean;
  mistakePatterns?: MistakePatternRecord;
  error?: string;
}> {
  const result = await authPost<{ success: boolean; mistakePatterns: MistakePatternRecord }>(
    '/student/mistake',
    { mistakeType, example }
  );

  if (result.success && result.data?.mistakePatterns) {
    invalidateCache();
    return { success: true, mistakePatterns: result.data.mistakePatterns };
  }

  return { success: false, error: result.error };
}

// ==========================================
// 自立度
// ==========================================

/**
 * 自力でエラーを検出した場合
 */
export async function recordSelfDetectedError(): Promise<{
  success: boolean;
  independenceMetrics?: IndependenceMetrics;
  error?: string;
}> {
  const result = await authPost<{ success: boolean; independenceMetrics: IndependenceMetrics }>(
    '/student/independence/self-detected'
  );

  if (result.success && result.data?.independenceMetrics) {
    invalidateCache();
    return { success: true, independenceMetrics: result.data.independenceMetrics };
  }

  return { success: false, error: result.error };
}

/**
 * AI指摘後にエラーに気づいた場合
 */
export async function recordAiAssistedError(): Promise<{
  success: boolean;
  independenceMetrics?: IndependenceMetrics;
  error?: string;
}> {
  const result = await authPost<{ success: boolean; independenceMetrics: IndependenceMetrics }>(
    '/student/independence/ai-assisted'
  );

  if (result.success && result.data?.independenceMetrics) {
    invalidateCache();
    return { success: true, independenceMetrics: result.data.independenceMetrics };
  }

  return { success: false, error: result.error };
}

// ==========================================
// ユーティリティ
// ==========================================

/**
 * スキルステータスの表示名を取得
 */
export function getSkillStatusLabel(status: SkillStatus): string {
  switch (status) {
    case 'locked':
      return '🔒 未解放';
    case 'unlocked':
      return '☆☆☆ 学習可能';
    case 'learning':
      return '★☆☆ 学習中';
    case 'mastered':
      return '★★★ 習得済み';
    case 'perfect':
      return '🏆 完全習得';
    default:
      return status;
  }
}

/**
 * 自立度レベルの表示名を取得
 */
export function getIndependenceLevelLabel(level: 1 | 2 | 3 | 4 | 5): string {
  switch (level) {
    case 1:
      return 'Lv1: AI依存';
    case 2:
      return 'Lv2: 発達中';
    case 3:
      return 'Lv3: 成長中';
    case 4:
      return 'Lv4: ほぼ自立';
    case 5:
      return 'Lv5: 自立達成';
    default:
      return `Lv${level}`;
  }
}

/**
 * 自己申告レベルの表示名を取得
 */
export function getSelfAssessmentLabel(assessment: SelfAssessment): string {
  switch (assessment) {
    case 'struggling':
      return '何がわからないかもわからない';
    case 'basic-ok':
      return '計算はできるけど応用が苦手';
    case 'want-more':
      return 'そこそこできるけど、もっと取りたい';
    case null:
      return '未回答';
    default:
      return String(assessment);
  }
}