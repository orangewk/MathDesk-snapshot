/**
 * 進捗バーコンポーネント
 */

import React, { memo } from 'react';
import './ProgressBar.css';

interface ProgressBarProps {
  value: number;      // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const ProgressBarComponent: React.FC<ProgressBarProps> = ({
  value,
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const normalizedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`progress-bar progress-bar--${size} ${className}`}>
      <div
        className="progress-bar__fill"
        style={{ width: `${normalizedValue}%` }}
      />
      {showLabel && (
        <span className="progress-bar__label">{Math.round(normalizedValue)}%</span>
      )}
    </div>
  );
};

export const ProgressBar = memo(ProgressBarComponent);
