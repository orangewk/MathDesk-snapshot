/**
 * ツタ先生ボイス台詞定義
 *
 * ボイス追加手順:
 *   1. このファイルに台詞を追加
 *   2. VOICEVOX を起動（localhost:50021）
 *   3. npx tsx scripts/generate-voices.ts を実行
 *   4. 完了（voice.ts が自動検出するのでコード変更不要）
 *
 * ファイル命名規則: {event}--{id}.wav
 *   例: correct--yoku-dekimashita.wav
 *   voice.ts が "--" の左側でイベント分類する
 */

/** ボイス再生イベント */
export type VoiceEvent = 'onboarding' | 'start' | 'correct' | 'mastery';

/** 台詞定義 */
export interface VoiceLine {
    /** 再生イベント */
    event: VoiceEvent;
    /** VOICEVOX に渡すテキスト */
    text: string;
    /** ファイル名（拡張子なし）。{event}--{id} 形式 */
    file: string;
}

/** VOICEVOX 音声パラメータ */
export const VOICEVOX_CONFIG = {
    /** VOICEVOX Engine のURL */
    engineUrl: 'http://localhost:50021',
    /** スピーカーID（generate-voices.ts が自動検索するので通常は変更不要） */
    speakerId: null as number | null,
    /** キャラクター名（スピーカー自動検索用） */
    characterName: '東北きりたん',
    /** 話速（0.5〜2.0、デフォルト1.0） */
    speedScale: 1.0,
    /** 音高（-0.15〜0.15、デフォルト0.0） */
    pitchScale: 0.0,
    /** 抑揚（0.0〜2.0、デフォルト1.0） */
    intonationScale: 1.2,
    /** 音量（0.0〜2.0、デフォルト1.0） */
    volumeScale: 1.0,
} as const;

/** 出力先ディレクトリ（プロジェクトルートからの相対パス） */
export const OUTPUT_DIR = 'webapp/src/assets/sounds/tsuta';

/**
 * 台詞一覧
 * ここに追加するだけで新しいボイスが使えるようになる
 */
export const VOICE_LINES: VoiceLine[] = [
    // オンボーディング（初回訪問時・固定）
    { event: 'onboarding', text: 'はじめましょう', file: 'onboarding--hajimemashou' },

    // 会話・問題の開始時
    { event: 'start', text: '一緒に考えていきましょう', file: 'start--issho-ni-kangaete' },
    { event: 'start', text: 'どこから確認しましょうか', file: 'start--doko-kara-kakunin' },
    { event: 'start', text: '見ていきましょう', file: 'start--mite-ikimashou' },
    { event: 'start', text: '始めましょうか', file: 'start--hajimemashouka' },

    // 正解時（最も頻度が高いのでバリエーション多め）
    { event: 'correct', text: 'よくできました', file: 'correct--yoku-dekimashita' },
    { event: 'correct', text: 'その調子です', file: 'correct--sono-choushi' },
    { event: 'correct', text: 'いい考え方です', file: 'correct--ii-kangaekata' },
    { event: 'correct', text: 'いいですね', file: 'correct--ii-desu-ne' },
    { event: 'correct', text: 'その通りです', file: 'correct--sono-toori' },
    { event: 'correct', text: '合っています', file: 'correct--atte-imasu' },
    { event: 'correct', text: 'よく考えましたね', file: 'correct--yoku-kangaemashita' },
    { event: 'correct', text: '正解です', file: 'correct--seikai-desu' },

    // スキル習得時
    { event: 'mastery', text: 'おめでとうございます', file: 'mastery--omedetou-gozaimasu' },
    { event: 'mastery', text: 'よく頑張りましたね', file: 'mastery--yoku-ganbarimashita' },
    { event: 'mastery', text: 'しっかり身につきましたね', file: 'mastery--shikkari-mi-ni-tsukimashita' },
];
