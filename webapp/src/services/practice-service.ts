/**
 * 練習問題APIサービス
 * バックエンドの練習問題APIと通信
 */

import { getToken } from './auth-service';

const API_BASE_URL = '/api/practice';

/**
 * 認証ヘッダーを取得
 */
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
// 型定義（バックエンドと共通）
// ==========================================

export type ProblemLevel = 1 | 2 | 3 | 4;

export type EvaluationConfidence = 'high' | 'medium' | 'low';

export interface ProblemCardInfo {
  cardName: string;
  trigger: string;
  method: string;
}

export interface GeneratedProblem {
  skillId: string;
  level: ProblemLevel;
  questionText: string;
  correctAnswer: string;
  solutionSteps: string[];
  checkPoints: string[];
  targetPattern: string;
  cardInfo: ProblemCardInfo;
  figure?: {
    type: 'jsxgraph' | 'svg' | 'none';
    code: string;
    description: string;
    boundingBox?: [number, number, number, number];
  };
}

export interface EvaluationResult {
  isCorrect: boolean;
  confidence: EvaluationConfidence;
  feedback: string;
  matchedCheckPoints: string[];
  missedCheckPoints: string[];
  indeterminateReason?: string;
}

export interface SkillMasteryInfo {
  skillId: string;
  points: number;
  level: number;
  levelName: string;
  nextLevelPoints: number | null;
  progress: number;
  masteredCardCount: number;
  totalCardCount: number;
}

export interface CardUpdateResult {
  card: unknown;
  isNewAcquisition: boolean;
  isRankUp: boolean;
}

export interface TechniqueInfo {
  name: string;
  trigger: string;
  method: string;
  pattern: string;
  isNewPattern: boolean;
}

// ==========================================
// 問題生成
// ==========================================

export type ProblemSource = 'pool' | 'retry' | 'ai_generated';

export interface GenerateProblemResult {
  problem: GeneratedProblem;
  recommendedLevel: ProblemLevel;
  needsFigure: boolean;
  source?: ProblemSource;
  problemPoolId?: string | null;
}

/**
 * 練習問題を生成する
 */
export async function generateProblem(
  skillId: string,
  level?: ProblemLevel,
): Promise<GenerateProblemResult> {
  const response = await fetch(`${API_BASE_URL}/generate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ skillId, level }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || '問題の生成に失敗しました');
  }

  return result.data;
}

// ==========================================
// 図生成（Flash モデルで非同期）
// ==========================================

export type FigureData = GeneratedProblem['figure'];

/**
 * 問題に対する図を生成する（Flash モデル、バックグラウンド）
 */
export async function generateFigure(
  problem: GeneratedProblem,
): Promise<FigureData | null> {
  const response = await fetch(`${API_BASE_URL}/generate-figure`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ problem }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || '図の生成に失敗しました');
  }

  return result.data.figure;
}

// ==========================================
// SSE ストリーミング問題生成
// ==========================================

export interface StreamCallbacks {
  onProblem: (data: GenerateProblemResult) => void;
  onFigure: (data: { figure: FigureData | null }) => void;
  onError: (error: Error) => void;
}

/**
 * SSE で問題 + 図を1コネクションで受信する
 * @returns AbortController - 呼び出し側でキャンセル可能
 */
export type DifficultyMode = 'basic' | 'challenge';

export function generateProblemStream(
  skillId: string,
  level: ProblemLevel | undefined,
  callbacks: StreamCallbacks,
  difficulty?: DifficultyMode,
): AbortController {
  const abortController = new AbortController();

  (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/generate-stream`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ skillId, level, difficulty }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        let message = '問題の生成に失敗しました';
        try {
          const json = JSON.parse(text);
          message = json.error || message;
        } catch { /* non-JSON error */ }
        callbacks.onError(new Error(message));
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError(new Error('ReadableStream not supported'));
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE イベントは \n\n で区切られる
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const eventBlock of events) {
          if (!eventBlock.trim()) continue;

          let eventName = '';
          let eventData = '';

          for (const line of eventBlock.split('\n')) {
            if (line.startsWith('event: ')) {
              eventName = line.slice(7);
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6);
            }
          }

          if (!eventName || !eventData) continue;

          const parsed = JSON.parse(eventData);

          switch (eventName) {
            case 'problem':
              callbacks.onProblem(parsed);
              break;
            case 'figure':
              callbacks.onFigure(parsed);
              break;
            case 'error':
              callbacks.onError(new Error(parsed.message));
              break;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      callbacks.onError(
        err instanceof Error ? err : new Error('ストリーミングエラー'),
      );
    }
  })();

  return abortController;
}

// ==========================================
// 回答評価
// ==========================================

export interface EvaluateAnswerResult {
  evaluation: EvaluationResult;
  cardUpdate: CardUpdateResult | null;
  skillMastery: SkillMasteryInfo | null;
  skillMastered: { skillId: string; skillName: string } | null;
  techniqueInfo: TechniqueInfo | null;
}

/**
 * 回答を評価する
 */
export async function evaluateAnswer(
  skillId: string,
  level: ProblemLevel,
  problem: GeneratedProblem,
  userAnswer: string,
  difficulty?: DifficultyMode,
  problemPoolId?: string | null,
): Promise<EvaluateAnswerResult> {
  const response = await fetch(`${API_BASE_URL}/evaluate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ skillId, level, problem, userAnswer, difficulty, problemPoolId }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || '回答の評価に失敗しました');
  }

  return result.data;
}

// ==========================================
// スキップ宣言
// ==========================================

export interface SkipTargetSkill {
  skillId: string;
  skillName: string;
}

export interface SkipChallengeResult {
  problem: GeneratedProblem;
  targetSkills: SkipTargetSkill[];
}

export interface SkipEvaluateResult {
  passed: boolean;
  evaluation: {
    isCorrect: boolean;
    confidence: string;
    feedback: string;
  };
  skippedSkills: SkipTargetSkill[];
}

/**
 * スキップ試問を生成する
 */
export async function generateSkipChallenge(
  unitCategory: string,
  unitSubcategory: string,
): Promise<SkipChallengeResult> {
  const response = await fetch(`${API_BASE_URL}/skip-challenge`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ unitCategory, unitSubcategory }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'スキップ試問の生成に失敗しました');
  }

  return result.data;
}

/**
 * スキップ試問の回答を評価する
 */
export async function evaluateSkipChallenge(
  targetSkills: SkipTargetSkill[],
  problem: GeneratedProblem,
  userAnswer: string,
): Promise<SkipEvaluateResult> {
  const response = await fetch(`${API_BASE_URL}/skip-evaluate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ targetSkills, problem, userAnswer }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'スキップ試問の採点に失敗しました');
  }

  return result.data;
}

// ==========================================
// テクニック一覧
// ==========================================

export interface TechniqueSummary {
  name: string;
  pattern: string;
  trigger: string;
  method: string;
  tip: string | null;
}

/**
 * スキルに紐づくテクニック一覧を取得する
 */
export async function getSkillTechniques(
  skillId: string,
): Promise<TechniqueSummary[]> {
  const response = await fetch(`${API_BASE_URL}/techniques/${encodeURIComponent(skillId)}`, {
    headers: getAuthHeaders(),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'テクニック一覧の取得に失敗しました');
  }

  return result.data.techniques;
}
