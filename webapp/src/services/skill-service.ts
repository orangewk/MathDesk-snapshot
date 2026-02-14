// ==========================================
// FILE: webapp/src/services/skill-service.ts
// ==========================================
/**
 * スキルAPIサービス
 * Phase 2B-1 - スキルツリー用API呼び出し
 * * 設計書: plans/phase2b-skill-tree-ui-design.md
 */

import { getAuthHeaders } from './auth-service'; 
import type {
  SkillDefinition,
  SkillDetailResponse,
  SkillsResponse,
  ProgressResponse,
} from '../types/skill-tree';

const API_BASE_URL_SKILLS = '/api/skills';
const API_BASE_URL = '/api';

// ==========================================
// スキル取得
// ==========================================

/**
 * 全スキル定義を取得
 */
export async function getAllSkills(): Promise<{
    success: boolean;
    skills?: SkillDefinition[]; // 修正: 単体ではなく配列型に修正
    error?: string;
}> {
  try {
    const response = await fetch(API_BASE_URL_SKILLS, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    const data: SkillsResponse = await response.json();

    if (!response.ok || !data.success) {
      return { success: false, error: 'スキル一覧の取得に失敗しました' };
    }

    return { success: true, skills: data.skills };
  } catch (error) {
    console.error('getAllSkills error:', error);
    return { success: false, error: 'ネットワークエラーが発生しました' };
  }
}

/**
 * スキル詳細を取得（前提・後続スキル含む）
 */
export async function getSkillDetail(skillId: string): Promise<{
    success: boolean;
    skill?: SkillDefinition;
    prerequisites?: SkillDefinition[];
    successors?: SkillDefinition[];
    error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL_SKILLS}/${encodeURIComponent(skillId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    const data: SkillDetailResponse = await response.json();

    if (!response.ok || !data.success) {
      return { success: false, error: 'スキル詳細の取得に失敗しました' };
    }

    return {
      success: true,
      skill: data.skill,
      prerequisites: data.prerequisites,
      successors: data.successors,
    };
  } catch (error) {
    console.error('getSkillDetail error:', error);
    return { success: false, error: 'ネットワークエラーが発生しました' };
  }
}

// ==========================================
// 進捗取得
// ==========================================

/**
 * 学習進捗サマリーを取得（要認証）
 */
export async function getProgressSummary(): Promise<{
    success: boolean;
    progress?: ProgressResponse['progress'];
    error?: string; 
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/progress`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    const data: ProgressResponse = await response.json();

    if (!response.ok || !data.success) {
      return { success: false, error: '進捗の取得に失敗しました' };
    }

    return { success: true, progress: data.progress };
  } catch (error) {
    console.error('getProgressSummary error:', error);
    return { success: false, error: 'ネットワークエラーが発生しました' };
  }
}

// ==========================================
// 推薦スキル
// ==========================================

/**
 * 推薦スキルを取得
 */
export async function getRecommendedSkills(count = 3): Promise<{
  success: boolean;
  recommended?: Array<{
    skill: SkillDefinition;
    reason: string;
    priority: number;
  }>;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/recommended?count=${count}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return { success: false, error: '推薦スキルの取得に失敗しました' };
    }

    return { success: true, recommended: data.recommended };
  } catch (error) {
    console.error('getRecommendedSkills error:', error);
    return { success: false, error: 'ネットワークエラーが発生しました' };
  }
}