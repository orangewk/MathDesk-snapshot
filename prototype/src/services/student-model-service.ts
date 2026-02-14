import {
  StudentModel,
  SkillMasteryStatus,
  SkillStatus,
  MistakeType,
  MistakeExample,
  MistakePatternRecord,
  IndependenceMetrics,
  OnboardingStatus,
  SelfAssessment,
  LearningSession,
  UserMilestones,
  createInitialStudentModel,
  createInitialSkillMastery,
  createEmptyMilestones,
  calculateIndependenceLevel,
  calculateIndependenceScore,
  MISTAKE_TYPE_CATEGORIES,
  GradeLevel,
  StudiedSubject,
  StudyGoal,
} from '../types/student-model.js';

import {
  saveStudentModel as dbSaveStudentModel,
  getStudentModel as dbGetStudentModel,
} from '../data/firestore/student-model-repository.js';
import { findTechniquesByUserId } from '../data/firestore/technique-repository.js';
import { updateUserNickname } from '../data/firestore/user-repository.js';
import { initializeSkillMasteryWithSubjects } from './skill-recommendation-service.js';

// ------------------------------------
// 定数
// ------------------------------------

/** ミス例の最大保持数 */
const MAX_MISTAKE_EXAMPLES = 5;

/** 直近のミスカウント対象問題数 */
const RECENT_MISTAKE_WINDOW = 10;

// ------------------------------------
// Student Model 基本操作
// ------------------------------------

/**
 * Student Modelをパース (JSONからオブジェクトへ)
 */
function parseStudentModel(data: string): StudentModel {
  const parsed = JSON.parse(data);

  // バージョンマイグレーション
  if (parsed.version === undefined) {
    parsed.version = 1;
  }

  // milestones フィールドがない古いデータのマイグレーション
  if (!parsed.milestones) {
    parsed.milestones = createEmptyMilestones();
    // 既存のオンボーディング完了情報があれば移行
    if (parsed.onboarding?.completedAt) {
      parsed.milestones.onboardingCompletedAt = parsed.onboarding.completedAt;
    }
    // createdAtをfirstVisitAtとして設定
    if (parsed.createdAt) {
      parsed.milestones.firstVisitAt = parsed.createdAt;
    }
  }

  return parsed as StudentModel;
}

/**
 * Student Modelをシリアライズ (オブジェクトからJSONへ)
 */
function serializeStudentModel(model: StudentModel): string {
  return JSON.stringify(model);
}

/**
 * 学習者モデルを取得 (存在しない場合はnull)
 */
export async function getStudentModel(userId: string): Promise<StudentModel | null> {
  const existing = await dbGetStudentModel(userId);

  if (existing) {
    const model = parseStudentModel(existing.data);

    // 遅延マイグレーション: SkillCard rank → SkillMasteryStatus.rank
    // Firestore の既存データには rank フィールドがないため undefined チェック
    const needsMigration = Object.values(model.skillMastery)
      .some(m => !('rank' in m) || m.rank === undefined);

    if (needsMigration) {
      const { cards } = await findTechniquesByUserId(userId, { limit: 500 });
      for (const card of cards) {
        const mastery = model.skillMastery[card.parentSkillId];
        if (mastery) {
          mastery.rank = Math.max(mastery.rank ?? 0, card.rank);
        }
      }
      for (const mastery of Object.values(model.skillMastery)) {
        if (mastery.rank === undefined || mastery.rank === null) {
          mastery.rank = 0;
        }
      }
      await dbSaveStudentModel(userId, serializeStudentModel({
        ...model,
        updatedAt: new Date().toISOString(),
      }));
    }

    // mastered/perfect なのに rank < 3 のエントリを補正
    // (MASTERY_SCORE パスで直接 mastered になったスキル)
    let rankFixed = false;
    for (const mastery of Object.values(model.skillMastery)) {
      if ((mastery.status === 'mastered' || mastery.status === 'perfect') && (mastery.rank ?? 0) < 3) {
        mastery.rank = 3;
        rankFixed = true;
      }
    }
    if (rankFixed) {
      await dbSaveStudentModel(userId, serializeStudentModel({
        ...model,
        updatedAt: new Date().toISOString(),
      }));
    }

    return model;
  }

  return null;
}

/**
 * 学習者モデルを取得 (存在しない場合は新規作成)
 */
export async function getOrCreateStudentModel(userId: string): Promise<StudentModel> {
  const existing = await getStudentModel(userId);

  if (existing) {
    return existing;
  }

  // 新規作成
  const newModel = createInitialStudentModel(userId);
  await dbSaveStudentModel(userId, serializeStudentModel(newModel));

  return newModel;
}

/**
 * 学習者モデルを保存
 */
export async function updateStudentModel(studentModel: StudentModel): Promise<StudentModel> {
  const now = new Date().toISOString();
  const updated: StudentModel = {
    ...studentModel,
    updatedAt: now,
  };

  await dbSaveStudentModel(studentModel.id, serializeStudentModel(updated));

  return updated;
}

// ------------------------------------
// オンボーディング操作
// ------------------------------------

/**
 * オンボーディングを開始
 */
export async function startOnboarding(userId: string): Promise<StudentModel> {
  const model = await getOrCreateStudentModel(userId);
  const now = new Date().toISOString();

  const updated: StudentModel = {
    ...model,
    onboarding: {
      ...model.onboarding,
      startedAt: now,
    },
  };

  return updateStudentModel(updated);
}

/**
 * 自己申告レベルを設定
 */
export async function setSelfAssessment(
  userId: string,
  selfAssessment: SelfAssessment
): Promise<StudentModel> {
  const model = await getOrCreateStudentModel(userId);

  const updated: StudentModel = {
    ...model,
    onboarding: {
      ...model.onboarding,
      selfAssessment,
    },
  };

  return updateStudentModel(updated);
}

/**
 * オンボーディング完了データ
 */
export interface OnboardingData {
  nickname?: string;
  gradeLevel?: GradeLevel;
  studiedSubjects?: StudiedSubject[];
  selfAssessment?: SelfAssessment;
  studyGoal?: StudyGoal;
}

/**
 * オンボーディングを完了
 * 問診票データの保存 + 履修科目ベースのスキル一括解禁を行う
 */
export async function completeOnboarding(
  userId: string,
  data?: OnboardingData
): Promise<StudentModel> {
  const model = await getOrCreateStudentModel(userId);
  const now = new Date().toISOString();

  // nickname 更新（User レコード）
  if (data?.nickname) {
    await updateUserNickname(userId, data.nickname);
  }

  // 履修科目ベースのスキル一括解禁
  const studiedSubjects = data?.studiedSubjects ?? [];
  const skillMastery = studiedSubjects.length > 0
    ? initializeSkillMasteryWithSubjects(studiedSubjects)
    : model.skillMastery;

  const updated: StudentModel = {
    ...model,
    milestones: {
      ...model.milestones,
      onboardingCompletedAt: model.milestones.onboardingCompletedAt ?? now,
    },
    onboarding: {
      ...model.onboarding,
      completed: true,
      completedAt: now,
      selfAssessment: data?.selfAssessment ?? model.onboarding.selfAssessment,
      gradeLevel: data?.gradeLevel ?? model.onboarding.gradeLevel,
      studiedSubjects,
      studyGoal: data?.studyGoal ?? model.onboarding.studyGoal,
    },
    skillMastery,
  };

  return updateStudentModel(updated);
}

// ------------------------------------
// スキル習熟度操作
// ------------------------------------

/**
 * スキル習熟度を取得 (存在しない場合は初期化)
 */
export async function getSkillMastery(
  userId: string,
  skillId: string
): Promise<SkillMasteryStatus> {
  const model = await getOrCreateStudentModel(userId);

  if (model.skillMastery[skillId]) {
    return model.skillMastery[skillId];
  }

  return createInitialSkillMastery(skillId);
}

/**
 * スキル習熟度を更新
 */
export async function updateSkillMastery(
  userId: string,
  skillId: string,
  update: Partial<SkillMasteryStatus>
): Promise<StudentModel> {
  const model = await getOrCreateStudentModel(userId);
  const now = new Date().toISOString();

  const existing = model.skillMastery[skillId] || createInitialSkillMastery(skillId);

  const updatedSkill: SkillMasteryStatus = {
    ...existing,
    ...update,
    skillId, // skillIdは上書き不可
  };

  // マイルストーン更新用
  let updatedMilestones = { ...model.milestones };

  // ステータス変更時の追加処理
  if (update.status) {
    if (update.status === "unlocked" && !existing.unlockedAt) {
      updatedSkill.unlockedAt = now;
    }

    // 学習開始（learning に移行）→ 初回のみマイルストーン記録
    if (update.status === "learning" && existing.status !== "learning") {
      if (!model.milestones.firstSkillStartedAt) {
        updatedMilestones = {
          ...updatedMilestones,
          firstSkillStartedAt: now,
          firstSkillStartedId: skillId,
        };
      }
    }

    // 習得（mastered に移行）→ 初回のみマイルストーン記録
    if (update.status === "mastered" && !existing.masteredAt) {
      updatedSkill.masteredAt = now;
      if (!model.milestones.firstSkillMasteredAt) {
        updatedMilestones = {
          ...updatedMilestones,
          firstSkillMasteredAt: now,
          firstSkillMasteredId: skillId,
        };
      }
    }

    // 降格の場合、masteredAtをクリア
    if (
      (update.status === "learning" || update.status === "unlocked") &&
      existing.status === "mastered"
    ) {
      updatedSkill.masteredAt = null;
    }
  }

  const updated: StudentModel = {
    ...model,
    milestones: updatedMilestones,
    skillMastery: {
      ...model.skillMastery,
      [skillId]: updatedSkill,
    },
  };

  return updateStudentModel(updated);
}

/**
 * 練習を記録 (lastPracticed更新)
 */
export async function recordPractice(
  userId: string,
  skillId: string
): Promise<StudentModel> {
  const now = new Date().toISOString();
  return updateSkillMastery(userId, skillId, {
    lastPracticed: now,
  });
}

/**
 * 診断結果を記録
 */
export async function recordDiagnosisResult(
  userId: string,
  skillId: string,
  score: number,
  isCorrect: boolean
): Promise<StudentModel> {
  const model = await getOrCreateStudentModel(userId);
  const now = new Date().toISOString();

  const existing = model.skillMastery[skillId] || createInitialSkillMastery(skillId);

  // 習熟度レベルの更新
  let newMasteryLevel = existing.masteryLevel;
  if (isCorrect) {
    newMasteryLevel = Math.min(100, existing.masteryLevel + 10);
  } else {
    newMasteryLevel = Math.max(0, existing.masteryLevel - 5);
  }

  // ステータスの自動更新
  let newStatus: SkillStatus = existing.status;
  if (newMasteryLevel >= 90) {
    newStatus = "perfect";
  } else if (newMasteryLevel >= 70) {
    newStatus = "mastered";
  } else if (newMasteryLevel >= 30) {
    newStatus = "learning";
  } else if (existing.status === "locked") {
    newStatus = "unlocked";
  }

  return updateSkillMastery(userId, skillId, {
    status: newStatus,
    masteryLevel: newMasteryLevel,
    attempts: existing.attempts + 1,
    lastAttempt: now,
    lastPracticed: now,
    bestScore: existing.bestScore === null
      ? score
      : Math.max(existing.bestScore, score),
  });
}

// ------------------------------------
// ミスパターン操作
// ------------------------------------

/**
 * ミスタイプのカテゴリを取得
 */
function getMistakeCategory(mistakeType: MistakeType): keyof MistakePatternRecord {
  const category = MISTAKE_TYPE_CATEGORIES[mistakeType];

  switch (category) {
    case "L1":
      return mistakeType === "transcription" ? "transcription" : "alignment";
    case "L2":
      return "strategy";
    case "L3":
      return "calculation";
    default:
      return "calculation";
  }
}

/**
 * ミスを記録
 */
export async function recordMistake(
  userId: string,
  mistakeType: MistakeType,
  example: Omit<MistakeExample, "timestamp">
): Promise<StudentModel> {
  const model = await getOrCreateStudentModel(userId);
  const now = new Date().toISOString();

  const category = getMistakeCategory(mistakeType);
  const currentStats = model.mistakePatterns[category];

  // 新しい例を追加 (最新5件を保持)
  const newExample: MistakeExample = {
    ...example,
    timestamp: now,
  };
  const updatedExamples = [newExample, ...currentStats.examples].slice(0, MAX_MISTAKE_EXAMPLES);

  // 傾向を判定
  const oldRecentCount = currentStats.recentCount;
  const newRecentCount = Math.min(currentStats.recentCount + 1, RECENT_MISTAKE_WINDOW);
  let trend = currentStats.trend;

  if (newRecentCount > oldRecentCount + 2) {
    trend = "worsening";
  } else if (newRecentCount < oldRecentCount) {
    trend = "improving";
  }

  const updated: StudentModel = {
    ...model,
    mistakePatterns: {
      ...model.mistakePatterns,
      [category]: {
        totalCount: currentStats.totalCount + 1,
        recentCount: newRecentCount,
        lastOccurred: now,
        examples: updatedExamples,
        trend,
      },
    },
  };

  return updateStudentModel(updated);
}

/**
 * 直近のミスカウントをリセット (新しいセッション開始時)
 */
export async function resetRecentMistakeCounts(userId: string): Promise<StudentModel> {
  const model = await getOrCreateStudentModel(userId);

  const updated: StudentModel = {
    ...model,
    mistakePatterns: {
      transcription: { ...model.mistakePatterns.transcription, recentCount: 0 },
      alignment: { ...model.mistakePatterns.alignment, recentCount: 0 },
      strategy: { ...model.mistakePatterns.strategy, recentCount: 0 },
      calculation: { ...model.mistakePatterns.calculation, recentCount: 0 },
    },
  };

  return updateStudentModel(updated);
}

// ------------------------------------
// 自立度操作
// ------------------------------------

/**
 * 自力でエラーを検出した場合
 */
export async function recordSelfDetectedError(userId: string): Promise<StudentModel> {
  const model = await getOrCreateStudentModel(userId);
  const now = new Date().toISOString();

  const newSelfDetected = model.independenceMetrics.selfDetectedErrors + 1;
  const newScore = calculateIndependenceScore(
    newSelfDetected,
    model.independenceMetrics.aiAssistedErrors
  );
  const newLevel = calculateIndependenceLevel(newScore);

  const updated: StudentModel = {
    ...model,
    independenceMetrics: {
      ...model.independenceMetrics,
      selfDetectedErrors: newSelfDetected,
      independenceScore: newScore,
      independenceLevel: newLevel,
      lastUpdated: now,
    },
  };

  return updateStudentModel(updated);
}

/**
 * AI指摘後にエラーに気づいた場合
 */
export async function recordAIAssistedError(userId: string): Promise<StudentModel> {
  const model = await getOrCreateStudentModel(userId);
  const now = new Date().toISOString();

  const newAiAssisted = model.independenceMetrics.aiAssistedErrors + 1;
  const newScore = calculateIndependenceScore(
    model.independenceMetrics.selfDetectedErrors,
    newAiAssisted
  );
  const newLevel = calculateIndependenceLevel(newScore);

  const updated: StudentModel = {
    ...model,
    independenceMetrics: {
      ...model.independenceMetrics,
      aiAssistedErrors: newAiAssisted,
      independenceScore: newScore,
      independenceLevel: newLevel,
      lastUpdated: now,
    },
  };

  return updateStudentModel(updated);
}

/**
 * 自己発問リストを使用した場合
 */
export async function recordSelfQuestioningUsage(userId: string): Promise<StudentModel> {
  const model = await getOrCreateStudentModel(userId);
  const now = new Date().toISOString();

  const updated: StudentModel = {
    ...model,
    independenceMetrics: {
      ...model.independenceMetrics,
      selfQuestioningUsage: model.independenceMetrics.selfQuestioningUsage + 1,
      lastUpdated: now,
    },
  };

  return updateStudentModel(updated);
}

/**
 * 自己説明に成功した場合
 */
export async function recordSelfExplanationSuccess(userId: string): Promise<StudentModel> {
  const model = await getOrCreateStudentModel(userId);
  const now = new Date().toISOString();

  const updated: StudentModel = {
    ...model,
    independenceMetrics: {
      ...model.independenceMetrics,
      selfExplanationSuccess: model.independenceMetrics.selfExplanationSuccess + 1,
      lastUpdated: now,
    },
  };

  return updateStudentModel(updated);
}

// ------------------------------------
// 学習履歴操作
// ------------------------------------

/**
 * 学習セッションを追加
 */
export async function addLearningSession(
  userId: string,
  session: LearningSession
): Promise<StudentModel> {
  const model = await getOrCreateStudentModel(userId);

  const updated: StudentModel = {
    ...model,
    learningHistory: [...model.learningHistory, session],
  };

  return updateStudentModel(updated);
}

// ------------------------------------
// サマリー取得
// ------------------------------------

/**
 * 学習サマリーを取得 (ダッシュボード用)
 */
export async function getLearningSummary(userId: string): Promise<{
  totalSkills: number;
  masteredSkills: number;
  learningSkills: number;
  unlockedSkills: number;
  totalSessions: number;
  totalMinutes: number;
  recentMistakeTypes: MistakeType[];
  independenceLevel: number;
  lastActivity: string | null;
}> {
  const model = await getOrCreateStudentModel(userId);

  const skills = Object.values(model.skillMastery);

  const masteredSkills = skills.filter(
    (s) => s.status === "mastered" || s.status === "perfect"
  ).length;
  const learningSkills = skills.filter((s) => s.status === "learning").length;
  const unlockedSkills = skills.filter((s) => s.status === "unlocked").length;

  const totalMinutes = model.learningHistory.reduce(
    (sum, session) => sum + session.durationMinutes,
    0
  );

  // 最近のミスタイプを収集
  const recentMistakeTypes: MistakeType[] = [];
  const patterns = model.mistakePatterns;
  if (patterns.transcription.recentCount > 0) recentMistakeTypes.push("transcription");
  if (patterns.alignment.recentCount > 0) recentMistakeTypes.push("alignment");
  if (patterns.strategy.recentCount > 0) recentMistakeTypes.push("strategy");
  if (patterns.calculation.recentCount > 0) recentMistakeTypes.push("calculation");

  // 最後のアクティビティを取得
  let lastActivity: string | null = null;
  if (model.learningHistory.length > 0) {
    lastActivity = model.learningHistory[model.learningHistory.length - 1].endedAt
      || model.learningHistory[model.learningHistory.length - 1].startedAt;
  }

  return {
    totalSkills: skills.length,
    masteredSkills,
    learningSkills,
    unlockedSkills,
    totalSessions: model.learningHistory.length,
    totalMinutes,
    recentMistakeTypes,
    independenceLevel: model.independenceMetrics.independenceLevel,
    lastActivity,
  };
}
