// FILE: webapp/src/components/ImageModal.tsx
// ==========================================
/**
 * 画像拡大モーダルコンポーネント
 * チャット内の画像をクリックして拡大表示
 */

import { useEffect, useCallback } from 'react';
import './ImageModal.css';

interface ImageModalProps {
  /** 表示する画像のsrc (data URL) */
  imageSrc: string | null;
  /** モーダルを閉じるコールバック */
  onClose: () => void;
}

export function ImageModal({ imageSrc, onClose }: ImageModalProps) {
  // ESCキーで閉じる
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (imageSrc) {
      document.addEventListener('keydown', handleKeyDown);
      // スクロールを無効化
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [imageSrc, handleKeyDown]);

  if (!imageSrc) return null;

  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <button className="image-modal-close" onClick={onClose} title="閉じる">
        ×
      </button>
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        <img
          src={imageSrc}
          alt="拡大画像"
          className="image-modal-image"
        />
      </div>
    </div>
  );
}
