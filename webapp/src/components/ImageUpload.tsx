import { useRef, useCallback, useState } from 'react';
import type { ImageSource } from '../types/chat-types';
import { processImage, isSupportedImageType, createPreviewUrl } from '../utils/image-utils';
import './ImageUpload.css';

interface ImageUploadProps {
    /** 選択された画像 (プレビュー表示用) */
    selectedImage: ImageSource | null;
    /** 画像選択時のコールバック */
    onImageSelect: (image: ImageSource | null) => void;
    /** 無効化フラグ */
    disabled?: boolean;
}

export function ImageUpload({ selectedImage, onImageSelect, disabled }: ImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = useCallback(async (file: File) => {
        setError(null);

        if (!isSupportedImageType(file)) {
            setError('対応形式: JPEG, PNG, GIF, WebP');
            return;
        }

        setIsProcessing(true);

        try {
            const processed = await processImage(file);
            onImageSelect(processed);
        } catch (err: any) {
            setError(err.message || '画像の処理に失敗しました');
            console.error('Image processing error:', err);
        } finally {
            setIsProcessing(false);
        }
    }, [onImageSelect]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
        // 同じファイルを再選択可能にするためリセット
        e.target.value = '';
    }, [handleFileSelect]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (disabled) return;

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    }, [handleFileSelect, disabled]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleButtonClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleRemoveImage = useCallback(() => {
        onImageSelect(null);
        setError(null);
    }, [onImageSelect]);

    return (
        <div className="image-upload">
            {/* ファイル選択input (非表示) */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleInputChange}
                disabled={disabled || isProcessing}
                className="file-input-hidden"
            />

            {/* 画像がある場合はプレビュー表示 */}
            {selectedImage && (
                <div className="image-preview-container">
                    <img
                        src={createPreviewUrl(selectedImage)}
                        alt="添付画像プレビュー"
                        className="image-preview"
                    />
                    <button
                        onClick={handleRemoveImage}
                        className="remove-image-button"
                        title="画像を削除"
                        disabled={disabled}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* アップロードボタン */}
            <button
                onClick={handleButtonClick}
                disabled={disabled || isProcessing}
                className="upload-button"
                title="画像を添付 (カメラまたはファイルから選択)"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                {isProcessing ? '処理中...' : '📷'}
            </button>

            {/* エラー表示 */}
            {error && (
                <div className="upload-error" title={error}>
                    ⚠️
                </div>
            )}
        </div>
    );
}
