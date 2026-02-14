// ==========================================
// FILE: webapp/src/utils/image-utils.ts
// ==========================================
/**
 * 画像処理ユーティリティ
 */

import type { ImageSource } from '../types/chat-types';

// サポートするMIMEタイプ
export type SupportedMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

const SUPPORTED_TYPES: SupportedMediaType[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

// 最大画像サイズ (ピクセル)
const MAX_IMAGE_SIZE = 1920;

// 最大ファイルサイズ (バイト) - 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * ファイルがサポートされている画像形式かチェック
 */
export function isSupportedImageType(file: File): boolean {
  return SUPPORTED_TYPES.includes(file.type as SupportedMediaType);
}

/**
 * ファイルサイズが許容範囲内かチェック
 */
export function isFileSizeValid(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * 画像をリサイズしてBase64に変換
 */
export async function processImage(file: File): Promise<ImageSource> {
  return new Promise((resolve, reject) => {
    if (!isSupportedImageType(file)) {
      reject(new Error(`非対応の画像形式です: ${file.type}`));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // リサイズが必要かチェック
        let { width, height } = img;

        if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
          const ratio = Math.min(MAX_IMAGE_SIZE / width, MAX_IMAGE_SIZE / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Canvasでリサイズ
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context の取得に失敗しました'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // 出力形式を決定 (GIFはPNGに変換)
        let outputType: SupportedMediaType = file.type as SupportedMediaType;
        if (file.type === 'image/gif') {
          outputType = 'image/png';
        }

        // JPEG/WebPの場合は品質を指定
        const quality = (outputType === 'image/jpeg' || outputType === 'image/webp') ? 0.85 : undefined;

        // Base64に変換
        const dataUrl = canvas.toDataURL(outputType, quality);
        const base64Data = dataUrl.split(',')[1];

        resolve({
          type: 'base64',
          media_type: outputType,
          data: base64Data,
        });
      };

      img.onerror = () => {
        reject(new Error('画像の読み込みに失敗しました'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('ファイルの読み込みに失敗しました'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 複数の画像を処理
 */
export async function processImages(files: FileList | File[]): Promise<ImageSource[]> {
  const fileArray = Array.from(files);
  const results: ImageSource[] = [];

  for (const file of fileArray) {
    try {
      const processed = await processImage(file);
      results.push(processed);
    } catch (error) {
      console.error(`画像処理エラー (${file.name}):`, error);
      // 処理に失敗した画像はスキップ
    }
  }

  return results;
}

/**
 * Base64画像のサイズを取得 (バイト単位の概算)
 */
export function getBase64Size(base64Data: string): number {
  // Base64は約33%大きくなるため、元のサイズを概算
  return Math.round((base64Data.length * 3) / 4);
}

/**
 * 画像のプレビューURLを生成
 */
export function createPreviewUrl(source: ImageSource): string {
  return `data:${source.media_type};base64,${source.data}`;
}