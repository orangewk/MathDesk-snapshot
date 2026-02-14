/**
 * Web Audio APIを使用した効果音ユーティリティ
 */

// AudioContextのシングルトンインスタンス（遅延初期化）
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
    if (!audioContext) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContext = new AudioContextClass();
    }
    return audioContext;
};

/**
 * 正解時の効果音（ピンポン♪）を再生
 */
export const playCorrectSound = () => {
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const now = ctx.currentTime;

        // 1つ目の音（ピン）
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(660, now); // ミ (High)

        gain1.gain.setValueAtTime(0.1, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.5);

        // 2つ目の音（ポン）
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.1); // ラ (High) - 少し高めの音で明るく

        gain2.gain.setValueAtTime(0.1, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc2.start(now + 0.1);
        osc2.stop(now + 0.8);

    } catch (err) {
        console.error('Failed to play sound:', err);
    }
};
