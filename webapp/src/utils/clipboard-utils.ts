// ==========================================
// FILE: webapp/src/utils/clipboard-utils.ts
// ==========================================
/**
 * クリップボード操作ユーティリティ
 */

/**
 * テキストをクリップボードにコピー
 * @param text コピーするテキスト
 * @returns コピーが成功したかどうか
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Clipboard API が利用可能な場合
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // フォールバック: 古いブラウザ向け
    return fallbackCopyToClipboard(text);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * フォールバック: 古いブラウザでのコピー処理
 */
function fallbackCopyToClipboard(text: string): boolean {
  try {
    // 一時的なテキストエリアを作成
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);

    // テキストを選択してコピー
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');

    // 一時要素を削除
    document.body.removeChild(textArea);

    return successful;
  } catch (error) {
    console.error('Fallback copy failed:', error);
    return false;
  }
}