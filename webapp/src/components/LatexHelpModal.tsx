import { useEffect } from 'react';
import { MathText } from './MathDisplay';
import './LatexHelpModal.css';

interface LatexHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LatexHelpModal({ isOpen, onClose }: LatexHelpModalProps) {
    // ESCキーでモーダルを閉じる
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="latex-help-overlay" onClick={onClose}>
            <div className="latex-help-modal" onClick={(e) => e.stopPropagation()}>
                <div className="latex-help-header">
                    <h2>📝 数式の入力方法</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="latex-help-content">
                    <section>
                        <h3>✨ 基本的な使い方</h3>
                        <div className="help-item">
                            <div className="help-label">インライン数式 (行内)</div>
                            <div className="help-example">
                                <code>$x^2 + 1$</code>
                                <span className="arrow">→</span>
                                <MathText text="$x^2 + 1$" />
                            </div>
                        </div>
                        <div className="help-item">
                            <div className="help-label">ブロック数式 (独立行)</div>
                            <div className="help-example">
                                <code>{'$$x = \\frac{-b \\pm \\sqrt{b ^ 2 - 4ac}}{2a}$$'}</code>
                                <span className="arrow">→</span>
                                <MathText text="$$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$$" />
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3>📖 よく使う記法</h3>

                        <div className="help-category">
                            <h4>上付き・下付き</h4>
                            <div className="help-item">
                                <code>x^2</code>
                                <span className="arrow">→</span>
                                <MathText text="$x^2$" />
                            </div>
                            <div className="help-item">
                                <code>x_1</code>
                                <span className="arrow">→</span>
                                <MathText text="$x_1$" />
                            </div>
                        </div>

                        <div className="help-category">
                            <h4>分数</h4>
                            <div className="help-item">
                                <code>\frac{'{'}a{'}'}{'{'}b{'}'}</code>
                                <span className="arrow">→</span>
                                <MathText text="$\frac{a}{b}$" />
                            </div>
                        </div>

                        <div className="help-category">
                            <h4>ルート</h4>
                            <div className="help-item">
                                <code>\sqrt{'{'}x{'}'}</code>
                                <span className="arrow">→</span>
                                <MathText text="$\sqrt{x}$" />
                            </div>
                            <div className="help-item">
                                <code>\sqrt[3]{'{'}x{'}'}</code>
                                <span className="arrow">→</span>
                                <MathText text="$\sqrt[3]{x}$" />
                            </div>
                        </div>

                        <div className="help-category">
                            <h4>ギリシャ文字</h4>
                            <div className="help-item">
                                <code>\alpha, \beta, \gamma</code>
                                <span className="arrow">→</span>
                                <MathText text="$\alpha, \beta, \gamma$" />
                            </div>
                            <div className="help-item">
                                <code>\pi, \theta, \omega</code>
                                <span className="arrow">→</span>
                                <MathText text="$\pi, \theta, \omega$" />
                            </div>
                        </div>

                        <div className="help-category">
                            <h4>演算子</h4>
                            <div className="help-item">
                                <code>\times</code>
                                <span className="arrow">→</span>
                                <MathText text="$\times$" />
                                <span className="description"> (掛ける)</span>
                            </div>
                            <div className="help-item">
                                <code>\div</code>
                                <span className="arrow">→</span>
                                <MathText text="$\div$" />
                                <span className="description"> (割る)</span>
                            </div>
                            <div className="help-item">
                                <code>\pm</code>
                                <span className="arrow">→</span>
                                <MathText text="$\pm$" />
                                <span className="description"> (プラスマイナス)</span>
                            </div>
                            <div className="help-item">
                                <code>\leq, \geq</code>
                                <span className="arrow">→</span>
                                <MathText text="$\leq, \geq$" />
                                <span className="description"> (以下、以上)</span>
                            </div>
                        </div>

                        <div className="help-category">
                            <h4>三角関数</h4>
                            <div className="help-item">
                                <code>\sin x, \cos x, \tan x</code>
                                <span className="arrow">→</span>
                                <MathText text="$\sin x, \cos x, \tan x$" />
                            </div>
                        </div>

                        <div className="help-category">
                            <h4>括弧 (自動サイズ調整)</h4>
                            <div className="help-item">
                                <code>\left( \frac{'{'}a{'}'}{'{'}b{'}'} \right)</code>
                                <span className="arrow">→</span>
                                <MathText text="$\left( \frac{a}{b} \right)$" />
                            </div>
                        </div>
                    </section>

                    <section className="help-tips">
                        <h3>💡 ヒント</h3>
                        <ul>
                            <li>数式は <code>$</code>...<code>$</code> または <code>$$</code>...<code>$$</code> で囲んで入力します</li>
                            <li>バックスラッシュ <code>\</code> の後にコマンド名を入力します</li>
                            <li>中括弧 <code>{'{'}{'}'}</code> でグループ化できます</li>
                            <li>わからない記法があれば、「〇〇をLaTeXで書きたい」と質問してください</li>
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
}
