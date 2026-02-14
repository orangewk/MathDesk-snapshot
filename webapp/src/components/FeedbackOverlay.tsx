import React, { useEffect, useState } from 'react';
import { pickGuideImage } from '../utils/guide-images';
import './FeedbackOverlay.css';

interface FeedbackOverlayProps {
    isVisible: boolean;
    onAnimationEnd?: () => void;
    message?: string;
    type?: 'correct' | 'incorrect'; // 将来の拡張用
}

export const FeedbackOverlay: React.FC<FeedbackOverlayProps> = ({
    isVisible,
    onAnimationEnd,
    message = '正解！',
    type = 'correct'
}) => {
    const [shouldRender, setShouldRender] = useState(isVisible);
    const [guideImg, setGuideImg] = useState('');

    useEffect(() => {
        if (isVisible) {
            setGuideImg(pickGuideImage(type === 'correct' ? 'feedbackCorrect' : 'feedbackIncorrect'));
            setShouldRender(true);
            // アニメーション時間に合わせて自動で非表示リクエストを送ることも可能だが
            // CSSアニメーション終了イベント(onAnimationEnd)に任せるのが安全
            const timer = setTimeout(() => {
                onAnimationEnd?.();
            }, 2000); // 2秒後にコールバック呼び出し（安全策）
            return () => clearTimeout(timer);
        } else {
            const timer = setTimeout(() => setShouldRender(false), 500); // フェードアウト待ち
            return () => clearTimeout(timer);
        }
    }, [isVisible, onAnimationEnd]);

    if (!shouldRender && !isVisible) return null;

    return (
        <div className={`feedback-overlay ${isVisible ? 'visible' : ''} ${type}`}>
            <div className="feedback-content">
                <img
                    src={guideImg}
                    alt={type === 'correct' ? '正解' : '不正解'}
                    className="feedback-expression"
                />
                <div className="feedback-text">{message}</div>
            </div>
        </div>
    );
};
