/**
 * 初回オンボーディング問診票モーダル
 * 名前・学年・履修科目・自己評価・目標を収集
 */

import { useState } from 'react';
import guideTeacherImg from '../assets/images/guide-teacher.png';
import './AboutModal.css';
import './OnboardingModal.css';

type GradeLevel = '中1' | '中2' | '中3' | '高1' | '高2' | '高3' | '既卒';
type StudiedSubject = '基礎' | '数学I' | '数学A' | '数学II' | '数学B' | '数学C';
type SelfAssessment = 'struggling' | 'basic-ok' | 'want-more';
type StudyGoal = 'regular-exam' | 'common-test' | 'university-exam' | 'relearning';

export interface OnboardingFormData {
  nickname: string;
  gradeLevel: GradeLevel | null;
  studiedSubjects: StudiedSubject[];
  selfAssessment: SelfAssessment | null;
  studyGoal: StudyGoal | null;
}

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (data: OnboardingFormData) => void;
}

const GRADE_OPTIONS: { value: GradeLevel; label: string }[] = [
  { value: '中1', label: '中1' },
  { value: '中2', label: '中2' },
  { value: '中3', label: '中3' },
  { value: '高1', label: '高1' },
  { value: '高2', label: '高2' },
  { value: '高3', label: '高3' },
  { value: '既卒', label: '既卒・社会人' },
];

const SUBJECT_OPTIONS: { value: StudiedSubject; label: string }[] = [
  { value: '基礎', label: '中学まで' },
  { value: '数学I', label: '数学I' },
  { value: '数学A', label: '数学A' },
  { value: '数学II', label: '数学II' },
  { value: '数学B', label: '数学B' },
  { value: '数学C', label: '数学C' },
];

const ASSESSMENT_OPTIONS: { value: SelfAssessment; label: string }[] = [
  { value: 'struggling', label: '何が分からないかも分からない' },
  { value: 'basic-ok', label: '計算はできるけど応用が苦手' },
  { value: 'want-more', label: 'そこそこできるけど、もっと伸ばしたい' },
];

const GOAL_OPTIONS: { value: StudyGoal; label: string }[] = [
  { value: 'regular-exam', label: '定期テスト対策' },
  { value: 'common-test', label: '共通テスト対策' },
  { value: 'university-exam', label: '受験対策（二次・私大）' },
  { value: 'relearning', label: '学び直し' },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [nickname, setNickname] = useState('');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel | null>(null);
  const [studiedSubjects, setStudiedSubjects] = useState<StudiedSubject[]>([]);
  const [selfAssessment, setSelfAssessment] = useState<SelfAssessment | null>(null);
  const [studyGoal, setStudyGoal] = useState<StudyGoal | null>(null);

  if (!isOpen) return null;

  const isValid = nickname.trim().length > 0;

  const toggleSubject = (subject: StudiedSubject) => {
    setStudiedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleSubmit = () => {
    if (!isValid) return;
    onComplete({
      nickname: nickname.trim(),
      gradeLevel,
      studiedSubjects,
      selfAssessment,
      studyGoal,
    });
  };

  return (
    <div className="about-overlay">
      <div className="about-modal onboarding-modal" onClick={(e) => e.stopPropagation()}>
        <div className="about-hero">
          <img src={guideTeacherImg} alt="津田マセマ先生" />
        </div>
        <h2>MathDesk</h2>
        <p className="about-subtitle">はじめに少しだけ教えてください</p>

        <div className="onboarding-form">
          {/* Q1: 名前 */}
          <div className="onboarding-question">
            <label className="onboarding-label">名前 <span className="onboarding-required">*</span></label>
            <input
              type="text"
              className="onboarding-input"
              placeholder="ニックネームでOK"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              autoFocus
            />
          </div>

          {/* Q2: 学年 */}
          <div className="onboarding-question">
            <label className="onboarding-label">学年</label>
            <div className="onboarding-chips">
              {GRADE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`onboarding-chip ${gradeLevel === opt.value ? 'selected' : ''}`}
                  onClick={() => setGradeLevel(gradeLevel === opt.value ? null : opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q3: 履修科目 */}
          <div className="onboarding-question">
            <label className="onboarding-label">習ったことがある範囲</label>
            <div className="onboarding-chips">
              {SUBJECT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`onboarding-chip ${studiedSubjects.includes(opt.value) ? 'selected' : ''}`}
                  onClick={() => toggleSubject(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q4: 自己評価 */}
          <div className="onboarding-question">
            <label className="onboarding-label">数学について</label>
            <div className="onboarding-options">
              {ASSESSMENT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`onboarding-option ${selfAssessment === opt.value ? 'selected' : ''}`}
                  onClick={() => setSelfAssessment(selfAssessment === opt.value ? null : opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q5: 目標 */}
          <div className="onboarding-question">
            <label className="onboarding-label">目標</label>
            <div className="onboarding-options">
              {GOAL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`onboarding-option ${studyGoal === opt.value ? 'selected' : ''}`}
                  onClick={() => setStudyGoal(studyGoal === opt.value ? null : opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          className="about-close-button"
          onClick={handleSubmit}
          disabled={!isValid}
        >
          はじめる
        </button>
      </div>
    </div>
  );
};
