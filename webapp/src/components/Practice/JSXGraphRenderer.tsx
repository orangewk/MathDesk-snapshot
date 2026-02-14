/**
 * JSXGraph レンダラーコンポーネント
 * AI 生成の JSXGraph コードをインタラクティブな図として描画する
 */

import { useEffect, useRef, useState, memo } from 'react';
import JXG from 'jsxgraph';
import './JSXGraphRenderer.css';

interface JSXGraphRendererProps {
  /** JSXGraph 関数本体コード（board を引数に受け取る） */
  code: string;
  /** 図の説明（alt text / フォールバック表示） */
  description: string;
  /** 描画領域の幅 (px) */
  width?: number;
  /** 描画領域の高さ (px) */
  height?: number;
  /** 座標範囲 [xMin, yMax, xMax, yMin] */
  boundingBox?: [number, number, number, number];
}

const DEFAULT_BOUNDING_BOX: [number, number, number, number] = [-5, 5, 5, -5];

const JSXGraphRendererComponent: React.FC<JSXGraphRendererProps> = ({
  code,
  description,
  width = 320,
  height = 320,
  boundingBox = DEFAULT_BOUNDING_BOX,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<JXG.Board | null>(null);
  const idRef = useRef(`jxg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 前回の board を破棄
    if (boardRef.current) {
      JXG.JSXGraph.freeBoard(boardRef.current);
      boardRef.current = null;
    }

    setError(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const board = JXG.JSXGraph.initBoard(idRef.current, {
        boundingBox,
        axis: true,
        showCopyright: false,
        showNavigation: false,
        pan: { enabled: false },
        zoom: { enabled: false },
        keepAspectRatio: true,
      } as any);

      boardRef.current = board;

      // AI 生成コードを実行（LLM がリテラル \n を出力することがあるため変換）
      const normalizedCode = code.replace(/\\n/g, '\n');
      const fn = new Function('board', normalizedCode);
      fn(board);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error('JSXGraph code execution failed:', err);
    }

    return () => {
      if (boardRef.current) {
        JXG.JSXGraph.freeBoard(boardRef.current);
        boardRef.current = null;
      }
    };
  }, [code, boundingBox]);

  return (
    <div className="jsxgraph-renderer" role="img" aria-label={description}>
      <div
        ref={containerRef}
        id={idRef.current}
        style={{ width, height }}
        className="jsxgraph-renderer__board"
      />
      {error && (
        <div className="jsxgraph-renderer__fallback">
          {description}
        </div>
      )}
      {!error && description && (
        <p className="jsxgraph-renderer__description">{description}</p>
      )}
    </div>
  );
};

export const JSXGraphRenderer = memo(JSXGraphRendererComponent);
