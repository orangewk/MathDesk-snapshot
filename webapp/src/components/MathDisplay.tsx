import { useEffect, useRef } from 'react';
import katex from 'katex';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import './MathDisplay.css';

interface MathDisplayProps {
  latex: string;
  displayMode?: boolean; // true: ブロック数式, false: インライン数式
  className?: string;
}

/**
 * LaTeX数式を表示するコンポーネント (単独のLaTeX用)
 */
export function MathDisplay({ latex, displayMode = false, className = '' }: MathDisplayProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(latex, containerRef.current, {
          displayMode,
          throwOnError: false,
          errorColor: '#cc0000',
          trust: false,
        });
      } catch (error) {
        console.error('KaTeX rendering error:', error);
        if (containerRef.current) {
          containerRef.current.textContent = `[数式エラー: ${latex}]`;
        }
      }
    }
  }, [latex, displayMode]);

  return (
    <span
      ref={containerRef}
      className={`math-display ${displayMode ? 'block' : 'inline'} ${className}`}
    />
  );
}

/**
 * テキスト内のMarkdown記法とLaTeX記法を両方レンダリングするコンポーネント
 */
interface MathTextProps {
  text: string;
  className?: string;
}

export function MathText({ text, className = '' }: MathTextProps) {
  return (
    <div className={`math-text markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}