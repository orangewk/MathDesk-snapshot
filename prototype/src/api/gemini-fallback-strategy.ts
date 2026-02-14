
import { logger } from '../utils/logger.js';

export interface GenAIConfig {
    model: string;
    location: string;
    isPreview: boolean; // Preview models are typically global
    thinkingLevel?: 'LOW' | 'HIGH';
}

// Pro High チェーン（assessmentMode 用: thinkingLevel HIGH で深い推論）
const PRO_CHAIN: GenAIConfig[] = [
    { model: 'gemini-3-pro-preview', location: 'global', isPreview: true, thinkingLevel: 'HIGH' },
    { model: 'gemini-3-flash-preview', location: 'global', isPreview: true },
    { model: 'gemini-2.5-pro', location: 'asia-northeast1', isPreview: false },
    { model: 'gemini-2.5-pro', location: 'us-central1', isPreview: false },
    { model: 'gemini-2.5-pro', location: 'us-east4', isPreview: false },
];

// Flash チェーン（デフォルト: チュータリング・図の生成など全般）
const FLASH_CHAIN: GenAIConfig[] = [
    { model: 'gemini-3-flash-preview', location: 'global', isPreview: true },
    { model: 'gemini-2.5-flash', location: 'asia-northeast1', isPreview: false },
    { model: 'gemini-2.5-flash', location: 'us-central1', isPreview: false },
];

/**
 * フォールバック戦略を管理するクラス
 * 指定された順序でモデルとリージョンを切り替える
 */
export class GeminiFallbackStrategy {
    private attempts: number = 0;
    private readonly chain: GenAIConfig[];

    /**
     * @param preferFlash true の場合 Flash 優先チェーンを使用
     */
    constructor(preferFlash: boolean = false) {
        this.chain = preferFlash ? FLASH_CHAIN : PRO_CHAIN;
    }

    /**
     * 現在の試行回数に基づいて次の設定を返す
     * これ以上候補がない場合は null を返す
     */
    public getNextConfig(): GenAIConfig | null {
        if (this.attempts >= this.chain.length) {
            return null;
        }

        const config = this.chain[this.attempts];
        this.attempts++;
        return config;
    }

    /**
     * 現在の試行回数を取得
     */
    public getAttemptCount(): number {
        return this.attempts;
    }

    /**
     * リセット（新規リクエスト用）
     */
    public reset(): void {
        this.attempts = 0;
    }
}
