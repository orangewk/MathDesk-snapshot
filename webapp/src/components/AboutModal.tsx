/**
 * About モーダル
 * ツタ先生の紹介とアプリ情報を表示
 */

import guideTeacherImg from '../assets/images/guide-teacher.png';
import './AboutModal.css';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="about-overlay" onClick={onClose}>
            <div className="about-modal" onClick={(e) => e.stopPropagation()}>
                <div className="about-hero">
                    <img src={guideTeacherImg} alt="津田マセマ先生" />
                </div>
                <h2>MathDesk</h2>
                <p className="about-subtitle">数学学習AIアプリ</p>

                <div className="about-intro">
                    <p>ガイド: <strong>津田マセマ</strong></p>
                    <p>私がやることは：</p>
                    <ul className="about-features">
                        <li>分からない問題を一緒に確認する</li>
                        <li>苦手な単元を基礎から説明する</li>
                        <li>あなたのペースで質問に答える</li>
                    </ul>
                    <p className="about-note">答えをそのまま教えるのではなく、考え方をアドバイスするのが私のポリシーです。</p>
                </div>

                <div className="about-credits">
                    <p>音声: VOICEVOX 東北きりたん</p>
                </div>

                <button className="about-close-button" onClick={onClose}>
                    閉じる
                </button>
            </div>
        </div>
    );
};
