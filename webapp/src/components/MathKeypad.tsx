import { useState } from 'react';
import { MathText } from './MathDisplay';
import './MathKeypad.css';

interface MathKeypadProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (latex: string, cursorOffset?: number) => void;
    inputValue: string; // プレビュー用の入力値
}

type CategoryKey = 'basic' | 'superSub' | 'fracRoot' | 'greek' | 'trig' | 'bracket' | 'advanced';

interface KeypadButton {
    display: string;
    latex: string;
    description: string;
    cursorOffset?: number; // カーソルをlatex挿入後に戻す位置 (負の値)
}

const categories: { key: CategoryKey; label: string; icon: string }[] = [
    { key: 'basic', label: '基本', icon: '±' },
    { key: 'superSub', label: '指数', icon: 'xⁿ' },
    { key: 'fracRoot', label: '分数・ルート', icon: '√' },
    { key: 'greek', label: 'ギリシャ', icon: 'π' },
    { key: 'trig', label: '関数', icon: 'sin' },
    { key: 'bracket', label: '括弧', icon: '( )' },
    { key: 'advanced', label: '高度', icon: '∫' },
];

const keypadButtons: Record<CategoryKey, KeypadButton[]> = {
    basic: [
        { display: '×', latex: '\\times', description: '掛ける' },
        { display: '÷', latex: '\\div', description: '割る' },
        { display: '±', latex: '\\pm', description: 'プラスマイナス' },
        { display: '≦', latex: '\\leq', description: '以下' },
        { display: '≧', latex: '\\geq', description: '以上' },
        { display: '≠', latex: '\\neq', description: '等しくない' },
        { display: '=', latex: '=', description: 'イコール' },
        { display: '+', latex: '+', description: '足す' },
        { display: '-', latex: '-', description: '引く' },
    ],
    superSub: [
        { display: '□²', latex: '^{2}', description: '2乗 (直前の文字を2乗にする)' },
        { display: '□³', latex: '^{3}', description: '3乗 (直前の文字を3乗にする)' },
        { display: '□ⁿ', latex: '^{}', description: 'n乗 ({ }内に数字を入力)', cursorOffset: -1 },
        { display: '□_1', latex: '_{}', description: '添字 (下付き文字)', cursorOffset: -1 },
        { display: '□₁', latex: '_1', description: '添字1' },
        { display: '□₂', latex: '_2', description: '添字2' },
    ],
    fracRoot: [
        { display: 'a/b', latex: '\\frac{}{}', description: '分数', cursorOffset: -3 },
        { display: '√', latex: '\\sqrt{}', description: '平方根', cursorOffset: -1 },
        { display: '³√', latex: '\\sqrt[3]{}', description: '立方根', cursorOffset: -1 },
        { display: 'ⁿ√', latex: '\\sqrt[]{}', description: 'n乗根', cursorOffset: -3 },
    ],
    greek: [
        { display: 'π', latex: '\\pi', description: 'パイ' },
        { display: 'θ', latex: '\\theta', description: 'シータ' },
        { display: 'α', latex: '\\alpha', description: 'アルファ' },
        { display: 'β', latex: '\\beta', description: 'ベータ' },
        { display: 'γ', latex: '\\gamma', description: 'ガンマ' },
        { display: 'Σ', latex: '\\sum', description: 'シグマ (総和)' },
        { display: 'ω', latex: '\\omega', description: 'オメガ' },
        { display: 'φ', latex: '\\phi', description: 'ファイ' },
    ],
    trig: [
        { display: 'sin', latex: '\\sin', description: 'サイン' },
        { display: 'cos', latex: '\\cos', description: 'コサイン' },
        { display: 'tan', latex: '\\tan', description: 'タンジェント' },
        { display: 'log', latex: '\\log', description: '対数' },
        { display: 'ln', latex: '\\ln', description: '自然対数' },
        { display: 'exp', latex: '\\exp', description: '指数関数' },
    ],
    bracket: [
        { display: '( )', latex: '\\left( \\right)', description: '丸括弧', cursorOffset: -8 },
        { display: '{ }', latex: '\\{ \\}', description: '波括弧', cursorOffset: -4 },
        { display: '[ ]', latex: '\\left[ \\right]', description: '角括弧', cursorOffset: -8 },
        { display: '| |', latex: '\\left| \\right|', description: '絶対値', cursorOffset: -8 },
    ],
    advanced: [
        { display: '∫', latex: '\\int', description: '積分' },
        { display: '∫ₐᵇ', latex: '\\int_{}^{}', description: '定積分', cursorOffset: -4 },
        { display: 'lim', latex: '\\lim', description: '極限' },
        { display: '→', latex: '\\to', description: '矢印' },
        { display: '∞', latex: '\\infty', description: '無限大' },
        { display: 'vec', latex: '\\vec{}', description: 'ベクトル', cursorOffset: -1 },
        { display: 'd/dx', latex: '\\frac{d}{dx}', description: '微分' },
    ],
};

export function MathKeypad({ isOpen, onClose, onInsert, inputValue }: MathKeypadProps) {
    const [activeCategory, setActiveCategory] = useState<CategoryKey>('basic');

    if (!isOpen) return null;

    const handleButtonClick = (button: KeypadButton) => {
        onInsert(button.latex, button.cursorOffset);
    };

    // 数式プレビュー用：$で囲まれていない場合は囲む
    const getPreviewText = () => {
        const trimmed = inputValue.trim();
        if (!trimmed) return '';
        // 既に$で囲まれている場合はそのまま
        if (trimmed.startsWith('$') || trimmed.startsWith('$$')) {
            return trimmed;
        }
        // LaTeX記法が含まれている場合は$で囲む
        if (trimmed.includes('\\') || trimmed.includes('^') || trimmed.includes('_') || trimmed.includes('{')) {
            return `$${trimmed}$`;
        }
        return trimmed;
    };

    const previewText = getPreviewText();

    return (
        <div className="math-keypad">
            <div className="keypad-header">
                <span className="keypad-title">数式キーパッド</span>
                <button className="keypad-close" onClick={onClose} aria-label="閉じる">
                    ×
                </button>
            </div>

            {/* プレビューエリア */}
            {inputValue.trim() && (
                <div className="keypad-preview">
                    <span className="preview-label">プレビュー:</span>
                    <div className="preview-content">
                        <MathText text={previewText} />
                    </div>
                </div>
            )}

            <div className="keypad-categories">
                {categories.map((cat) => (
                    <button
                        key={cat.key}
                        className={`category-button ${activeCategory === cat.key ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat.key)}
                        title={cat.label}
                    >
                        <span className="category-icon">{cat.icon}</span>
                        <span className="category-label">{cat.label}</span>
                    </button>
                ))}
            </div>

            <div className="keypad-buttons">
                {keypadButtons[activeCategory].map((button, index) => (
                    <button
                        key={index}
                        className="math-button"
                        onClick={() => handleButtonClick(button)}
                        title={`${button.description}\n挿入: ${button.latex}`}
                    >
                        <span className="button-display">{button.display}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
