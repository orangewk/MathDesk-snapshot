// FILE: prototype/src/prompts/prompt-builder.ts
// ==========================================

/**
 * プロンプトビルダー（統合モジュール）
 * Phase 2A - システムプロンプト設計・実装
 * * 設計書: plans/task2-system-prompt-design.md
 */

import type { StudentContext, PromptBuildOptions, PromptSectionType } from './types.js';
import type { SelfAssessment, GradeLevel, StudyGoal } from '../types/student-model.js';
import { CORE_SYSTEM_PROMPT, FULL_SYSTEM_PROMPT, IMAGE_PROTOCOL } from './system-prompt.js';
import { getInterventionStrategy } from './intervention-strategies.js';
import { buildSkillRecommendationSection } from './skill-section-builder.js';
import { buildMistakePatternSection } from './mistake-section-builder.js';
import { buildAssessmentSection } from './assessment-prompt.js';

// ==========================================
// メインビルダー関数
// ==========================================

/**
 * 学習者コンテキストを含むシステムプロンプトを生成
 */
export function buildSystemPrompt(
  context: StudentContext,
  options?: PromptBuildOptions
): string {
  // コンテキストがない場合はベースプロンプト + Lv1戦略
  if (!context) {
    return buildMinimalPrompt();
  }

  const includeSections = options?.includeSections ?? ['base', 'intervention', 'onboarding', 'mistakes', 'skills'];
  const debugMode = options?.debugMode ?? false;

  let prompt = '';

  // ベースプロンプト（通常時はコア版、判定時はFew-shot付き完全版）
  if (includeSections.includes('base')) {
    prompt += debugMode ? '\n' : '';
    if (options?.assessmentMode) {
      prompt += FULL_SYSTEM_PROMPT;  // 判定時: Few-shot例を含む完全版
    } else {
      prompt += CORE_SYSTEM_PROMPT;  // 通常時: コアのみ（スリム版）
    }
    prompt += debugMode ? '\n' : '';
  }

  // 学習者プロフィール（学年・目標）
  const profileSection = buildProfileSection(context);
  if (profileSection) {
    prompt += profileSection;
  }

  // 自立度レベル別の介入戦略
  if (includeSections.includes('intervention')) {
    prompt += debugMode ? `\n` : '';
    prompt += getInterventionStrategy(context.independenceLevel);
    prompt += debugMode ? '\n' : '';
  }

  // オンボーディング状態に応じたセクション
  if (includeSections.includes('onboarding') && !context.onboardingCompleted) {
    prompt += debugMode ? '\n' : '';
    prompt += buildOnboardingSection(context);
    prompt += debugMode ? '\n' : '';
  }

  // ミスパターンセクション
  if (includeSections.includes('mistakes')) {
    const mistakeSection = buildMistakePatternSection(context);
    if (mistakeSection) {
      prompt += debugMode ? '\n' : '';
      prompt += mistakeSection;
      prompt += debugMode ? '\n' : '';
    }
  }

  // スキル推薦セクション
  if (includeSections.includes('skills')) {
    const skillSection = buildSkillRecommendationSection(context);
    if (skillSection) {
      prompt += debugMode ? '\n' : '';
      prompt += skillSection;
      prompt += debugMode ? '\n' : '';
    }
  }

  // 画像プロトコル（画像アップロード検出時のみ、かつ判定モードでない場合）
  if (options?.includeImageProtocol && !options?.assessmentMode) {
    prompt += IMAGE_PROTOCOL;
  }

  // 習得判定モードセクション（末尾に追加して優先度を上げる）
  if (options?.assessmentMode) {
    prompt += debugMode ? '\n' : '';
    prompt += buildAssessmentSection(options.assessmentMode, context.currentSkillName);
    prompt += debugMode ? '\n' : '';
  }

  return prompt;
}

/**
 * 最小限のシステムプロンプト（コンテキストなし）
 */
export function buildMinimalPrompt(): string {
  return CORE_SYSTEM_PROMPT + getInterventionStrategy(1);
}

// ==========================================
// オンボーディングセクション
// ==========================================

/**
 * オンボーディングセクションを生成
 */
function buildOnboardingSection(context: StudentContext): string {
  if (context.selfAssessment === null) {
    return `
## オンボーディング

この学習者はまだ自己分析を完了していません。
最初に「数学について、今どんな状態ですか？」と聞いてみてください。

選択肢として以下を提示できます：
1. 何が分からないかも分からない状態
2. 計算はできるけど応用問題が苦手
3. そこそこできるけど、もっと点数を取りたい

回答に応じて学習の進め方をロジカルに決めましょう。
どの回答でも「分からないところから始めるのは正しいことです」と伝えてください。
`;
  }

  const assessmentMessages: Record<SelfAssessment & string, string> = {
    'struggling': `
## 学習者の自己評価

この学習者は「何が分からないかも分からない」状態です。

### 対応方針
- **基礎の基礎から丁寧に確認**: 中学数学レベルから確認してOK
- **小さな成功体験を重視**: 1問でも解けたら静かに認める
- **「分からなくて当然」という安心感**: 焦らせない、急がせない
- **具体例と視覚化を多用**: 抽象的な説明は避ける

### 使えるフレーズ
- 「分からないところから始めるのは、正しい判断です」
- 「焦らず、一つずつ確認しましょう」
- 「いいですね、美しく解けました」
`,
    'basic-ok': `
## 学習者の自己評価

この学習者は「計算はできるけど応用が苦手」という自己評価です。

### 対応方針
- **基礎計算は信頼**: 計算力はあるので、認める
- **応用問題の読み解き方にフォーカス**: 「何を求める問題か」を意識させる
- **スキーマ（問題パターン）の識別練習**: 問題を分類する力を育てる
- **「なぜそうなるか」の理解を深める**: 公式の暗記から意味理解へ

### 使えるフレーズ
- 「計算は問題ないですね。あとは問題の読み方です」
- 「この問題、どのパターンに当てはまります？」
- 「なぜこの公式を使うのか、論理的に考えてみましょう」
`,
    'want-more': `
## 学習者の自己評価

この学習者は「もっと点数を取りたい」という意欲があります。

### 対応方針
- **効率的な解法パターンの習得**: 時間短縮のテクニックも共有
- **タイムマネジメント**: 時間配分の意義を育てる
- **チャレンジングな問題も積極的に**: 難問への挑戦を歓迎
- **ミスを減らす**: ケアレスミス対策を強化

### 使えるフレーズ
- 「いい調子です。もう少し難しい問題に挑戦しますか？」
- 「この問題、よりエレガントに解く方法もあります」
- 「最後の確認を習慣にすると、得点が上がるでしょう」
`
  };

  return assessmentMessages[context.selfAssessment] ?? '';
}

// ==========================================
// 学習者プロフィールセクション
// ==========================================

const GRADE_LABELS: Record<GradeLevel, string> = {
  '中1': '中学1年',
  '中2': '中学2年',
  '中3': '中学3年',
  '高1': '高校1年',
  '高2': '高校2年',
  '高3': '高校3年',
  '既卒': '既卒・社会人',
};

const GOAL_LABELS: Record<StudyGoal, string> = {
  'regular-exam': '定期テスト対策',
  'common-test': '共通テスト対策',
  'university-exam': '受験対策（二次・私大）',
  'relearning': '学び直し',
};

/**
 * 学習者プロフィールセクションを生成
 * 学年と目標が設定されている場合のみ出力
 */
function buildProfileSection(context: StudentContext): string {
  if (!context.gradeLevel && !context.studyGoal) {
    return '';
  }

  let section = '\n## 学習者プロフィール\n\n';

  if (context.gradeLevel) {
    section += `- **学年**: ${GRADE_LABELS[context.gradeLevel]}\n`;
  }

  if (context.studyGoal) {
    section += `- **目標**: ${GOAL_LABELS[context.studyGoal]}\n`;
  }

  return section;
}