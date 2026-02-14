/**
 * ツタ先生ボイス再生ユーティリティ
 * VOICEVOX 東北ずん子の事前生成音声を再生する
 *
 * wav ファイルは {event}--{id}.wav の命名規則で配置。
 * import.meta.glob で自動検出するため、台詞追加時にこのファイルの変更は不要。
 */

import type { VoiceEvent } from '../config/voice-lines';

// assets/sounds/tsuta/ 内の全 wav ファイルを Vite 経由で一括取得
const wavModules = import.meta.glob<{ default: string }>(
    '../assets/sounds/tsuta/*.wav',
    { eager: true },
);

// イベント別にURLをマッピング
// ファイル名 "correct--yoku-dekimashita.wav" → event="correct"
const VOICE_MAP: Record<string, string[]> = {};

for (const [filePath, mod] of Object.entries(wavModules)) {
    const filename = filePath.split('/').pop()?.replace('.wav', '') ?? '';
    const event = filename.split('--')[0];
    if (!VOICE_MAP[event]) {
        VOICE_MAP[event] = [];
    }
    VOICE_MAP[event].push(mod.default);
}

/**
 * ツタ先生のボイスを再生する
 * イベントに対応する台詞をランダムに1つ選んで再生
 */
export const playTsutaVoice = (event: VoiceEvent): void => {
    try {
        const lines = VOICE_MAP[event];
        if (!lines || lines.length === 0) return;

        const src = lines[Math.floor(Math.random() * lines.length)];
        const audio = new Audio(src);
        audio.play().catch(() => {
            // autoplay policy でブロックされた場合はサイレントに失敗
        });
    } catch {
        // 音声ファイルが見つからない等のエラーはサイレントに無視
    }
};
