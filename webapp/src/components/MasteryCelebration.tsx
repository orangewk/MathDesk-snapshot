/**
 * スキル習得時の祝福演出コンポーネント
 * フルスクリーンオーバーレイで表示
 */

import React, { useEffect, useState } from 'react';
import { pickGuideImage } from '../utils/guide-images';
import './MasteryCelebration.css';

interface MasteryCelebrationProps {
    isVisible: boolean;
    skillName?: string;
    nextSkillName?: string;
    onClose: () => void;
    onNextSkill?: () => void;
}

export const MasteryCelebration: React.FC<MasteryCelebrationProps> = ({
    isVisible,
    skillName,
    nextSkillName,
    onClose,
    onNextSkill,
}) => {
    const [showButton, setShowButton] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const [guideImg, setGuideImg] = useState('');

    useEffect(() => {
        if (isVisible) {
            setGuideImg(pickGuideImage('masteryCelebration'));
            setShouldRender(true);
            // 2秒後にボタンを表示
            const timer = setTimeout(() => {
                setShowButton(true);
            }, 2000);
            return () => clearTimeout(timer);
        } else {
            setShowButton(false);
            const timer = setTimeout(() => setShouldRender(false), 500);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    if (!shouldRender && !isVisible) return null;

    return (
        <div className={`mastery-celebration ${isVisible ? 'visible' : ''}`}>
            <div className="celebration-content">
                <div className="celebration-confetti">
                    <span className="confetti">🎉</span>
                    <span className="confetti">🎊</span>
                    <span className="confetti">✨</span>
                    <span className="confetti">🌟</span>
                    <span className="confetti">🎉</span>
                </div>

                <img src={guideImg} alt="おめでとう" className="celebration-expression" />

                <h2 className="celebration-title">
                    おめでとうございます！
                </h2>

                {skillName && (
                    <p className="celebration-skill">
                        「{skillName}」を習得しました！
                    </p>
                )}

                <p className="celebration-message">
                    素晴らしい成果です。この調子で頑張りましょう！
                </p>

                {nextSkillName && onNextSkill ? (
                    <div className={`celebration-actions ${showButton ? 'visible' : ''}`}>
                        <button
                            className="celebration-button celebration-button--primary"
                            onClick={onNextSkill}
                        >
                            次のスキルへ: {nextSkillName}
                        </button>
                        <button
                            className="celebration-button celebration-button--secondary"
                            onClick={onClose}
                        >
                            スキル一覧へ戻る
                        </button>
                    </div>
                ) : (
                    <button
                        className={`celebration-button ${showButton ? 'visible' : ''}`}
                        onClick={onClose}
                    >
                        スキル一覧へ戻る
                    </button>
                )}
            </div>
        </div>
    );
};

export default MasteryCelebration;
