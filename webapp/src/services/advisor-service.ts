/**
 * アドバイザーAPIサービス
 * バックエンドのアドバイザーAPIと通信
 */

import { getToken } from './auth-service';

const API_BASE_URL = '/api/advisor';

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

// ==========================================
// 型定義
// ==========================================

export interface RecommendedSkill {
  skillId: string;
  skillName: string;
  reason: string;
  type: 'new' | 'review' | 'continue';
}

export interface ReviewSuggestion {
  skillId: string;
  skillName: string;
  reason: string;
}

export interface DailyAdvice {
  greeting: string;
  advice: string;
  recommendedSkills: RecommendedSkill[];
  reviewSuggestions: ReviewSuggestion[];
}

export interface StumbleAnalysis {
  analysis: string;
  reviewSuggestions: ReviewSuggestion[];
}

// ==========================================
// API 関数
// ==========================================

/**
 * 今日のオススメ学習アドバイスを取得
 */
export async function getDailyAdvice(): Promise<DailyAdvice> {
  const response = await fetch(`${API_BASE_URL}/daily`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error ?? 'アドバイスの取得に失敗しました');
  }

  const data = await response.json();
  return data.data;
}

/**
 * つまずき分析を取得
 */
export async function analyzeStumble(
  skillId: string,
  feedback: string,
  missedCheckPoints: string[],
): Promise<StumbleAnalysis> {
  const response = await fetch(`${API_BASE_URL}/analyze-stumble`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ skillId, feedback, missedCheckPoints }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error ?? 'つまずき分析に失敗しました');
  }

  const data = await response.json();
  return data.data;
}
