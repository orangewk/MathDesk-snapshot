// FILE: prototype/src/utils/tag-filter.ts
// ---------------------------------------------------------
// SSE ストリーミング用のタグフィルター
// Gemini のレスポンスから [[SKILL_MASTERY:...]] 等のタグを
// バッファリングしてサーバー側で消化し、クライアントには送らない。

export interface DetectedTag {
  raw: string;       // 生のタグ文字列（例: "[[SKILL_MASTERY:I-QF-01:85]]"）
  type: string;      // タグ種別（例: "SKILL_MASTERY"）
  params: string[];  // パラメータ（例: ["I-QF-01", "85"]）
}

const KNOWN_TAG_TYPES = [
  'SKILL_MASTERY',
  'CARD_MASTERY',
  'MASTERY_SCORE',
  'PROBLEM_RESULT',
  'OFF_TOPIC',
];

// タグの最大長（これを超えたらタグではないと判断して flush）
const MAX_TAG_LENGTH = 200;

/**
 * SSE ストリーミング用タグフィルター
 *
 * Gemini のチャンクを受け取り、[[...]] タグをバッファリングして検出。
 * タグ以外のテキストは onText コールバックで即座に flush する。
 */
export class TagFilter {
  private buffer = '';
  private detectedTags: DetectedTag[] = [];
  private readonly onText: (text: string) => void;

  constructor(onText: (text: string) => void) {
    this.onText = onText;
  }

  /**
   * チャンクを処理する。タグ以外のテキストは即座に onText で flush。
   */
  process(chunk: string): void {
    this.buffer += chunk;
    this.drain();
  }

  /**
   * ストリーム終了。バッファに残ったテキストを全て flush。
   */
  end(): void {
    if (this.buffer.length > 0) {
      this.onText(this.buffer);
      this.buffer = '';
    }
  }

  /**
   * 検出されたタグのリストを取得
   */
  getDetectedTags(): DetectedTag[] {
    return [...this.detectedTags];
  }

  private drain(): void {
    while (this.buffer.length > 0) {
      const tagStart = this.buffer.indexOf('[[');

      // [[ がなければ全部 flush
      if (tagStart === -1) {
        this.onText(this.buffer);
        this.buffer = '';
        return;
      }

      // [[ より前のテキストは安全に flush
      if (tagStart > 0) {
        this.onText(this.buffer.slice(0, tagStart));
        this.buffer = this.buffer.slice(tagStart);
      }

      // ]] を探す
      const tagEnd = this.buffer.indexOf(']]');
      if (tagEnd === -1) {
        // ]] がまだない → バッファが長すぎたらタグではないので flush
        if (this.buffer.length > MAX_TAG_LENGTH) {
          this.onText(this.buffer);
          this.buffer = '';
        }
        // それ以外は次の chunk を待つ
        return;
      }

      // タグ候補を抽出
      const tag = this.buffer.slice(0, tagEnd + 2);
      this.buffer = this.buffer.slice(tagEnd + 2);

      const parsed = this.parseTag(tag);
      if (parsed) {
        // 既知のタグ → サーバーで消化（クライアントに送らない）
        this.detectedTags.push(parsed);
      } else {
        // 未知のパターン → そのまま flush
        this.onText(tag);
      }
    }
  }

  private parseTag(tag: string): DetectedTag | null {
    // [[TYPE]] or [[TYPE:param1:param2...]]
    const match = tag.match(/^\[\[([A-Z_]+)(?::([^\]]*))?\]\]$/);
    if (!match) return null;

    const type = match[1];
    if (!KNOWN_TAG_TYPES.includes(type)) return null;

    const params = match[2] ? match[2].split(':') : [];
    return { raw: tag, type, params };
  }
}

/**
 * 完成した文字列から既知のタグを除去する（Firestore 永続化用）。
 * タグ除去後の末尾空白もトリムする。
 */
export function stripTags(text: string): string {
  const tagPattern = KNOWN_TAG_TYPES.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`\\[\\[(${tagPattern})(?::[^\\]]*)?\\]\\]`, 'g');
  return text.replace(regex, '').trimEnd();
}
