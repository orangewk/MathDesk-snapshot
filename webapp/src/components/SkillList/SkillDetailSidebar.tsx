/**
 * スキル詳細サイドバーコンポーネント
 */

import React, { memo, useState, useEffect } from 'react';
import type { SkillDefinition } from '../../types/skill-tree';
import type { SkillMasteryStatus, SkillStatus } from '../../types/student-model';
import { getSkillTechniques, type TechniqueSummary } from '../../services/practice-service';
import { StatusIcon } from './StatusIcon';
import { ProgressBar } from './ProgressBar';
import { MathText } from '../MathDisplay';
import './SkillDetailSidebar.css';

// 判定モードの種類
export type AssessmentMode = 'ai_generated' | 'textbook_required';

interface SkillDetailSidebarProps {
  skill: SkillDefinition | null;
  mastery: SkillMasteryStatus | null;
  status: SkillStatus;
  cardRank?: number;
  prerequisites: SkillDefinition[];
  successors: SkillDefinition[];
  onClose: () => void;
  onNavigateToSkill: (skillId: string) => void;
  onStartLearning?: (skillId: string, skillName: string, skillDescription: string) => void;
  onStartAssessment?: (skillId: string, skillName: string, mode: AssessmentMode) => void;
  onStartPractice?: (skillId: string, skillName: string) => void;
}

const STATUS_LABELS: Record<SkillStatus, string> = {
  locked: '未解放',
  unlocked: '学習可能',
  learning: '学習中',
  mastered: '習得済み',
  perfect: '完全習得',
};

const IMPORTANCE_LABELS: Record<string, { label: string; stars: string }> = {
  core: { label: '重要', stars: '★★★' },
  standard: { label: '標準', stars: '★★' },
  advanced: { label: '発展', stars: '★' },
};

/**
 * スキルカテゴリから判定モードを決定
 * 基礎（小中範囲）はAI出題、高校範囲は参考書必須
 */
function getAssessmentMode(category: string): AssessmentMode {
  return category === '基礎' ? 'ai_generated' : 'textbook_required';
}

const SkillDetailSidebarComponent: React.FC<SkillDetailSidebarProps> = ({
  skill,
  mastery,
  status,
  cardRank,
  prerequisites,
  successors,
  onClose,
  onNavigateToSkill,
  onStartLearning,
  onStartAssessment,
  onStartPractice,
}) => {
  const [techniques, setTechniques] = useState<TechniqueSummary[]>([]);

  useEffect(() => {
    if (!skill) {
      setTechniques([]);
      return;
    }

    let cancelled = false;
    getSkillTechniques(skill.id)
      .then((data) => {
        if (!cancelled) setTechniques(data);
      })
      .catch(() => {
        if (!cancelled) setTechniques([]);
      });

    return () => { cancelled = true; };
  }, [skill?.id]);

  if (!skill) {
    return (
      <div className="skill-detail-sidebar skill-detail-sidebar--empty">
        <p className="skill-detail-sidebar__empty-message">
          スキルを選択すると詳細が表示されます
        </p>
      </div>
    );
  }

  const masteryLevel = mastery?.masteryLevel ?? 0;
  const importance = IMPORTANCE_LABELS[skill.importance] || IMPORTANCE_LABELS.standard;

  return (
    <div className="skill-detail-sidebar">
      {/* ヘッダー */}
      <div className="skill-detail-sidebar__header">
        <div className="skill-detail-sidebar__title-row">
          <StatusIcon status={status} size="lg" />
          <h3 className="skill-detail-sidebar__title">{skill.name}</h3>
        </div>
        <button
          className="skill-detail-sidebar__close"
          onClick={onClose}
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>

      {/* ステータス */}
      <div className="skill-detail-sidebar__status">
        <span className={`skill-detail-sidebar__badge skill-detail-sidebar__badge--${status}`}>
          {STATUS_LABELS[status]}
        </span>
        <span className="skill-detail-sidebar__mastery-value">{masteryLevel}%</span>
      </div>

      {/* 進捗バー */}
      <div className="skill-detail-sidebar__progress">
        <ProgressBar value={masteryLevel} size="lg" />
      </div>

      {/* Rank 進捗ガイド */}
      <div className="skill-detail-sidebar__rank-guide">
        {cardRank === undefined || cardRank === 0 ? (
          <span className="skill-detail-sidebar__rank-text">
            問題を解いて練習を始めましょう
          </span>
        ) : cardRank >= 3 ? (
          <span className="skill-detail-sidebar__rank-text skill-detail-sidebar__rank-text--master">
            ★ 習得済み（Rank {cardRank}）
          </span>
        ) : (
          <span className="skill-detail-sidebar__rank-text skill-detail-sidebar__rank-text--progress">
            Rank {cardRank}/3 — あと{3 - cardRank}回正解で習得！
          </span>
        )}
      </div>

      {/* メタ情報 */}
      <div className="skill-detail-sidebar__meta">
        <div className="skill-detail-sidebar__meta-item">
          <span className="skill-detail-sidebar__meta-label">カテゴリ</span>
          <span className="skill-detail-sidebar__meta-value">
            {skill.category} &gt; {skill.subcategory}
          </span>
        </div>
        <div className="skill-detail-sidebar__meta-item">
          <span className="skill-detail-sidebar__meta-label">重要度</span>
          <span className="skill-detail-sidebar__meta-value">
            {importance.stars} {importance.label}
          </span>
        </div>
      </div>

      {/* 説明 */}
      <div className="skill-detail-sidebar__description">
        <p>{skill.description}</p>
      </div>

      {/* アクション */}
      {(onStartLearning || onStartAssessment || onStartPractice) && (
        <div className="skill-detail-sidebar__actions">
          {/* locked スキルの場合は前提スキルへの誘導 */}
          {status === 'locked' && prerequisites.length > 0 && (
            <div className="skill-detail-sidebar__warning">
              前提スキルが未習得です。
              <span className="skill-detail-sidebar__warning-hint">
                基礎から順に学ぶと理解しやすくなります。
              </span>
            </div>
          )}

          {/* mastered の場合はアクション不要 */}
          {(status === 'mastered' || status === 'perfect') ? (
            <div className="skill-detail-sidebar__completed">
              習得済みです
            </div>
          ) : (
            <>
              {/* プライマリアクション: rank に基づく推奨 */}
              {(cardRank ?? 0) <= 1 ? (
                // rank 0-1: 学習する
                onStartLearning && (
                  <button
                    className="skill-detail-sidebar__primary-button"
                    onClick={() => onStartLearning(skill.id, skill.name, skill.description)}
                  >
                    学習する
                  </button>
                )
              ) : (
                // rank >= 2: 判定を受ける
                onStartAssessment && (
                  <button
                    className="skill-detail-sidebar__primary-button skill-detail-sidebar__primary-button--assess"
                    onClick={() => onStartAssessment(skill.id, skill.name, getAssessmentMode(skill.category))}
                  >
                    判定を受ける
                  </button>
                )
              )}

              {/* セカンダリリンク */}
              <div className="skill-detail-sidebar__secondary-actions">
                {(cardRank ?? 0) <= 1 && onStartAssessment && (
                  <button
                    className="skill-detail-sidebar__secondary-link"
                    onClick={() => onStartAssessment(skill.id, skill.name, getAssessmentMode(skill.category))}
                  >
                    判定を受ける
                  </button>
                )}
                {(cardRank ?? 0) >= 2 && onStartLearning && (
                  <button
                    className="skill-detail-sidebar__secondary-link"
                    onClick={() => onStartLearning(skill.id, skill.name, skill.description)}
                  >
                    学習する
                  </button>
                )}
                {onStartPractice && (
                  <button
                    className="skill-detail-sidebar__secondary-link"
                    onClick={() => onStartPractice(skill.id, skill.name)}
                  >
                    演習する
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* テクニック一覧 */}
      {techniques.length > 0 && (
        <div className="skill-detail-sidebar__section">
          <h4 className="skill-detail-sidebar__section-title">
            テクニック（{techniques.length}）
          </h4>
          <div className="skill-detail-sidebar__technique-list">
            {techniques.map((t) => (
              <div key={t.pattern} className="skill-detail-sidebar__technique-card">
                <div className="skill-detail-sidebar__technique-name"><MathText text={t.name} /></div>
                <div className="skill-detail-sidebar__technique-trigger"><MathText text={t.trigger} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 前提スキル */}
      {prerequisites.length > 0 && (
        <div className="skill-detail-sidebar__section">
          <h4 className="skill-detail-sidebar__section-title">📋 前提スキル</h4>
          <ul className="skill-detail-sidebar__skill-list">
            {prerequisites.map((prereq) => (
              <li key={prereq.id}>
                <button
                  className="skill-detail-sidebar__skill-link"
                  onClick={() => onNavigateToSkill(prereq.id)}
                >
                  {prereq.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 解放されるスキル */}
      {successors.length > 0 && (
        <div className="skill-detail-sidebar__section">
          <h4 className="skill-detail-sidebar__section-title">🔓 解放されるスキル</h4>
          <ul className="skill-detail-sidebar__skill-list">
            {successors.slice(0, 5).map((succ) => (
              <li key={succ.id}>
                <button
                  className="skill-detail-sidebar__skill-link"
                  onClick={() => onNavigateToSkill(succ.id)}
                >
                  {succ.name}
                </button>
              </li>
            ))}
            {successors.length > 5 && (
              <li className="skill-detail-sidebar__more">
                他 {successors.length - 5} スキル
              </li>
            )}
          </ul>
        </div>
      )}

      {/* 統計 */}
      {mastery && (
        <div className="skill-detail-sidebar__stats">
          {mastery.attempts > 0 && (
            <div className="skill-detail-sidebar__stat">
              <span className="skill-detail-sidebar__stat-label">挑戦回数</span>
              <span className="skill-detail-sidebar__stat-value">{mastery.attempts}回</span>
            </div>
          )}
          {mastery.lastPracticed && (
            <div className="skill-detail-sidebar__stat">
              <span className="skill-detail-sidebar__stat-label">最終練習</span>
              <span className="skill-detail-sidebar__stat-value">
                {new Date(mastery.lastPracticed).toLocaleDateString('ja-JP')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const SkillDetailSidebar = memo(SkillDetailSidebarComponent);
