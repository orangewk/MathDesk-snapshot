// FILE: prototype/src/prompts/jsxgraph-examples.ts
// ==========================================

/**
 * JSXGraph コード生成用の few-shot 例
 *
 * AI が問題生成時に figure.code として出力する JSXGraph コードの参考例。
 * コードは `board` パラメータを受け取る関数本体として記述する。
 * （boardの初期化・破棄はフロントエンド側が行う）
 */

// ==========================================
// 図形カテゴリごとの例
// ==========================================

export interface JSXGraphExample {
  /** 対象subcategory */
  subcategory: string;
  /** 例の説明 */
  label: string;
  /** 推奨 boundingBox [xMin, yMax, xMax, yMin] */
  boundingBox: [number, number, number, number];
  /** JSXGraph 関数本体コード */
  code: string;
}

export const JSXGRAPH_EXAMPLES: JSXGraphExample[] = [
  // ==========================================
  // 図形と計量: 三角形 + 辺・角度ラベル
  // ==========================================
  {
    subcategory: '図形と計量',
    label: '三角形 ABC と角度ラベル',
    boundingBox: [-1, 6, 8, -1],
    code: `\
var A = board.create('point', [0, 0], {name: 'A', fixed: true, size: 2});
var B = board.create('point', [6, 0], {name: 'B', fixed: true, size: 2});
var C = board.create('point', [2, 4], {name: 'C', fixed: true, size: 2});
board.create('polygon', [A, B, C], {
  borders: {strokeColor: '#333', strokeWidth: 2},
  fillColor: '#e8f4fd', fillOpacity: 0.3,
  hasInnerPoints: false
});
board.create('text', [3, -0.6, '6'], {fontSize: 14, anchorX: 'middle'});
board.create('text', [0.5, 2.3, '5'], {fontSize: 14, anchorX: 'middle'});
board.create('text', [4.5, 2.3, '7'], {fontSize: 14, anchorX: 'middle'});`,
  },

  // ==========================================
  // 図形の性質: 円と内接四角形
  // ==========================================
  {
    subcategory: '図形の性質',
    label: '円に内接する四角形',
    boundingBox: [-4.5, 4.5, 4.5, -4.5],
    code: `\
var O = board.create('point', [0, 0], {name: 'O', fixed: true, size: 2});
var circle = board.create('circle', [O, 3], {strokeColor: '#333', strokeWidth: 2});
var A = board.create('point', [3, 0], {name: 'A', fixed: true, size: 2});
var B = board.create('point', [0, 3], {name: 'B', fixed: true, size: 2});
var C = board.create('point', [-3, 0], {name: 'C', fixed: true, size: 2});
var D = board.create('point', [1, -2.83], {name: 'D', fixed: true, size: 2});
board.create('polygon', [A, B, C, D], {
  borders: {strokeColor: '#2980b9', strokeWidth: 2},
  fillColor: '#d5e8f0', fillOpacity: 0.2,
  hasInnerPoints: false
});`,
  },

  // ==========================================
  // 図形と方程式: 座標平面上の円と直線
  // ==========================================
  {
    subcategory: '図形と方程式',
    label: '円と直線の交点',
    boundingBox: [-2, 6, 8, -2],
    code: `\
board.create('circle', [[3, 2], 2], {
  strokeColor: '#2980b9', strokeWidth: 2
});
board.create('functiongraph', [function(x){ return x - 1; }, -2, 8], {
  strokeColor: '#e74c3c', strokeWidth: 2
});
board.create('point', [3, 2], {name: 'C(3, 2)', fixed: true, size: 2});
board.create('text', [5.5, 4.5, 'y = x - 1'], {fontSize: 13, color: '#e74c3c'});`,
  },

  // ==========================================
  // 2次関数: 放物線のグラフ
  // ==========================================
  {
    subcategory: '2次関数',
    label: '2次関数のグラフと頂点',
    boundingBox: [-2, 8, 6, -2],
    code: `\
board.create('functiongraph', [function(x){ return (x - 2) * (x - 2) - 1; }, -1, 5], {
  strokeColor: '#e74c3c', strokeWidth: 2
});
board.create('point', [2, -1], {
  name: '頂点 (2, -1)', fixed: true, size: 3, color: '#e74c3c'
});
board.create('point', [1, 0], {name: '', fixed: true, size: 2, color: '#333'});
board.create('point', [3, 0], {name: '', fixed: true, size: 2, color: '#333'});`,
  },

  // ==========================================
  // 三角関数: 単位円と角度
  // ==========================================
  {
    subcategory: '三角関数',
    label: '単位円と角度',
    boundingBox: [-1.8, 1.8, 1.8, -1.8],
    code: `\
board.create('circle', [[0, 0], 1], {strokeColor: '#333', strokeWidth: 1.5});
var theta = Math.PI / 3;
var P = board.create('point', [Math.cos(theta), Math.sin(theta)], {
  name: 'P', fixed: true, size: 2
});
board.create('segment', [[0, 0], P], {strokeColor: '#e74c3c', strokeWidth: 2});
board.create('segment', [[Math.cos(theta), 0], P], {
  strokeColor: '#2980b9', strokeWidth: 1.5, dash: 2
});
board.create('point', [Math.cos(theta), 0], {name: '', fixed: true, size: 1.5, color: '#2980b9'});
board.create('text', [0.15, 0.12, '\\u03B8'], {fontSize: 16});`,
  },

  // ==========================================
  // ベクトル: 矢印ベクトル
  // ==========================================
  {
    subcategory: 'ベクトル',
    label: 'ベクトルの加法',
    boundingBox: [-1, 6, 7, -1],
    code: `\
var O = board.create('point', [0, 0], {name: 'O', fixed: true, size: 2});
var A = board.create('point', [4, 1], {name: 'A', fixed: true, size: 2});
var B = board.create('point', [2, 4], {name: 'B', fixed: true, size: 2});
var C = board.create('point', [6, 5], {name: 'C', fixed: true, size: 2});
board.create('arrow', [O, A], {strokeColor: '#e74c3c', strokeWidth: 2.5});
board.create('arrow', [O, B], {strokeColor: '#2980b9', strokeWidth: 2.5});
board.create('arrow', [O, C], {strokeColor: '#27ae60', strokeWidth: 2.5, dash: 2});
board.create('segment', [A, C], {strokeColor: '#aaa', strokeWidth: 1, dash: 3});
board.create('segment', [B, C], {strokeColor: '#aaa', strokeWidth: 1, dash: 3});`,
  },

  // ==========================================
  // データの分析: 散布図
  // ==========================================
  {
    subcategory: 'データの分析',
    label: '散布図',
    boundingBox: [-1, 12, 12, -1],
    code: `\
var data = [[1, 3], [2, 4], [3, 5], [4, 4.5], [5, 7], [6, 6], [7, 8], [8, 9], [9, 8.5], [10, 10]];
for (var i = 0; i < data.length; i++) {
  board.create('point', data[i], {
    size: 3, color: '#3498db', name: '', fixed: true
  });
}
board.create('functiongraph', [function(x){ return 0.75 * x + 2; }, 0, 11], {
  strokeColor: '#e74c3c', strokeWidth: 1.5, dash: 2
});`,
  },

  // ==========================================
  // 微分・積分: 接線と面積
  // ==========================================
  {
    subcategory: '微分・積分の考え',
    label: '曲線と接線',
    boundingBox: [-1, 10, 5, -2],
    code: `\
board.create('functiongraph', [function(x){ return x * x; }, -0.5, 4], {
  strokeColor: '#2980b9', strokeWidth: 2
});
var a = 2;
board.create('point', [a, a * a], {name: 'P(2, 4)', fixed: true, size: 2, color: '#e74c3c'});
board.create('functiongraph', [function(x){ return 4 * x - 4; }, -0.5, 4], {
  strokeColor: '#e74c3c', strokeWidth: 1.5, dash: 2
});
board.create('text', [3.2, 8.5, 'y = x\\u00B2'], {fontSize: 14, color: '#2980b9'});`,
  },
];

// ==========================================
// subcategory → 図の必要性マップ
// ==========================================

export type FigureRequirement = 'required' | 'recommended' | 'none';

/**
 * subcategory に基づいて図の必要性を判定する
 */
const FIGURE_REQUIREMENT_MAP: Record<string, FigureRequirement> = {
  '図形と計量': 'required',
  '図形の性質': 'required',
  '図形と方程式': 'required',
  '２次曲線': 'required',
  'ベクトル': 'recommended',
  '2次関数': 'recommended',
  '三角関数': 'recommended',
  'データの分析': 'recommended',
  '微分・積分の考え': 'recommended',
  '指数関数・対数関数': 'recommended',
  '複素数平面': 'recommended',
  '平面上の曲線と複素数平面': 'recommended',
  '統計的な推測': 'recommended',
};

/**
 * subcategory から図の必要性を返す
 */
export function getFigureRequirement(subcategory: string): FigureRequirement {
  return FIGURE_REQUIREMENT_MAP[subcategory] ?? 'none';
}

/**
 * subcategory に一致する JSXGraph 例を返す（最大2つ）
 */
export function getExamplesForSubcategory(subcategory: string): JSXGraphExample[] {
  return JSXGRAPH_EXAMPLES.filter(e => e.subcategory === subcategory).slice(0, 2);
}
