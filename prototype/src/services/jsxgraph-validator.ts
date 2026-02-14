// FILE: prototype/src/services/jsxgraph-validator.ts
// ==========================================

/**
 * JSXGraph コードのセキュリティバリデーション
 * AI が生成した JSXGraph コードを実行前に検査する
 */

import type { GeneratedProblem } from '../types/practice.js';
import { logger } from '../utils/logger.js';

type FigureField = GeneratedProblem['figure'];

/** 禁止パターン（セキュリティ上危険な API 呼び出し） */
const FORBIDDEN_PATTERNS: readonly RegExp[] = [
  /\bdocument\b/,
  /\bwindow\b/,
  /\bfetch\b/,
  /\bXMLHttpRequest\b/,
  /\beval\b/,
  /\bFunction\b/,
  /\bimport\b/,
  /\brequire\b/,
  /\bprocess\b/,
  /\bglobalThis\b/,
  /\bsetTimeout\b/,
  /\bsetInterval\b/,
  /\bconstructor\b/,
  /\b__proto__\b/,
  /\bprototype\b/,
  /\binitBoard\b/,
  /\bfreeBoard\b/,
  /\binnerHTML\b/,
  /\bouterHTML\b/,
  /\bcookie\b/,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
];

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * JSXGraph コードをセキュリティ検証する
 *
 * @param code AI が生成した JSXGraph 関数本体コード
 * @returns バリデーション結果
 */
export function validateJsxGraphCode(code: string): ValidationResult {
  if (!code || code.trim().length === 0) {
    return { valid: false, reason: 'Empty code' };
  }

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      return { valid: false, reason: `Forbidden pattern: ${pattern.source}` };
    }
  }

  // 最低限 board.create が含まれているか
  if (!code.includes('board.create')) {
    return { valid: false, reason: 'No board.create() calls found' };
  }

  return { valid: true };
}

/**
 * figure フィールドをバリデーションし、無効なら除去する
 * problem-generation-service.ts から呼ばれる
 */
export function sanitizeFigure(figure: FigureField): FigureField {
  if (!figure) return undefined;
  if (figure.type !== 'jsxgraph') return figure;

  const result = validateJsxGraphCode(figure.code);
  if (!result.valid) {
    logger.warn(`JSXGraph code validation failed: ${result.reason}`);
    return {
      type: 'none' as const,
      code: '',
      description: figure.description,
    };
  }

  return figure;
}
