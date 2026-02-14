/**
 * 開発用デバッグパネル
 * 本番環境では表示されない
 */

import { useState } from 'react';
import './DebugPanel.css';

const ONBOARDING_KEY = 'learnmath_onboarding_completed';

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem(ONBOARDING_KEY) !== 'true'
  );

  // 本番環境では表示しない
  if (import.meta.env.PROD) {
    return null;
  }

  const toggleOnboarding = () => {
    const newValue = !showOnboarding;
    if (newValue) {
      // オンボーディングを表示 = 完了フラグを消す
      localStorage.removeItem(ONBOARDING_KEY);
    } else {
      // オンボーディングを非表示 = 完了フラグを立てる
      localStorage.setItem(ONBOARDING_KEY, 'true');
    }
    setShowOnboarding(newValue);
  };

  const reload = () => {
    window.location.reload();
  };

  return (
    <div className="debug-panel">
      <button
        className="debug-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="デバッグパネル"
      >
        🛠️
      </button>

      {isOpen && (
        <div className="debug-content">
          <div className="debug-header">
            <span>Debug Panel</span>
            <button onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className="debug-section">
            <label className="debug-row">
              <span>オンボーディング表示</span>
              <input
                type="checkbox"
                checked={showOnboarding}
                onChange={toggleOnboarding}
              />
            </label>
            <p className="debug-hint">
              {showOnboarding ? 'リロード → 新しいチャットで確認' : 'オンにしてリロード'}
            </p>
          </div>

          <button className="debug-reload" onClick={reload}>
            🔄 リロード⇒新しいチャット
          </button>
        </div>
      )}
    </div>
  );
}
