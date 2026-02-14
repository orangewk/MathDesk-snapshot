/**
 * スキル状態アイコンコンポーネント
 */

import React, { memo } from 'react';
import { SkillStatus } from '../../types/student-model';
import './StatusIcon.css';

interface StatusIconProps {
  status: SkillStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const STATUS_CONFIG: Record<SkillStatus, { icon: string; label: string; className: string }> = {
  locked: { icon: '🔒', label: '未解放', className: 'status-icon--locked' },
  unlocked: { icon: '☆', label: '学習可能', className: 'status-icon--unlocked' },
  learning: { icon: '🌱', label: '学習中', className: 'status-icon--learning' },
  mastered: { icon: '✅', label: '習得済み', className: 'status-icon--mastered' },
  perfect: { icon: '🏆', label: '完全習得', className: 'status-icon--perfect' },
};

const StatusIconComponent: React.FC<StatusIconProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`status-icon status-icon--${size} ${config.className} ${className}`}
      title={config.label}
      role="img"
      aria-label={config.label}
    >
      {config.icon}
    </span>
  );
};

export const StatusIcon = memo(StatusIconComponent);
