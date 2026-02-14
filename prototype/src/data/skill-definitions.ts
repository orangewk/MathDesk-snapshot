// FILE: prototype/src/data/skill-definitions.ts
// ==========================================

/**
 * スキル定義マスターデータ
 * Phase 2A - スキルマスター
 *
 * 基準: 高等学校学習指導要領（平成30年告示）解説 数学編
 * https://www.mext.go.jp/a_menu/shotou/new-cs/1407074.htm
 */

// ==========================================
// 型定義
// ==========================================

/**
 * スキルカテゴリ（科目）
 */
export type SkillCategory =
  | "基礎"    // F: Foundation (算数・中学)
  | "数学I"   // I
  | "数学A"   // A
  | "数学II"  // II
  | "数学B"   // B
  | "数学C";  // C

/**
 * スキルの重要度（共通テストでの重要性）
 */
export type SkillImportance = "core" | "standard" | "advanced";

/**
 * スキル定義
 */
export interface SkillDefinition {
  id: string;              // スキルID
  name: string;            // スキル名
  category: SkillCategory; // カテゴリ
  subcategory: string;     // サブカテゴリ (単元名)
  description: string;     // 説明
  prerequisites: string[]; // 前提スキルID
  importance: SkillImportance; // 重要度
  keywords: string[];      // 検索用キーワード
}

// ==========================================
// スキル定義データ
// ==========================================

export const SKILL_DEFINITIONS: SkillDefinition[] = [
  {
    "id": "F-FRAC-01",
    "name": "分数の加減乗除",
    "category": "基礎",
    "subcategory": "算数復習",
    "description": "分数の四則演算、通分、約分、帯分数と仮分数の変換",
    "prerequisites": [],
    "importance": "core",
    "keywords": [
      "分数",
      "通分",
      "約分",
      "帯分数",
      "仮分数"
    ]
  },
  {
    "id": "F-NEG-01",
    "name": "正負の数の計算",
    "category": "基礎",
    "subcategory": "中学1年",
    "description": "正負の数の加減乗除、符号のルール",
    "prerequisites": [],
    "importance": "core",
    "keywords": [
      "正負の数",
      "マイナス",
      "符号",
      "負の数"
    ]
  },
  {
    "id": "F-NEG-02",
    "name": "絶対値と符号処理",
    "category": "基礎",
    "subcategory": "中学1年",
    "description": "絶対値の意味、場合分け、数直線上の距離",
    "prerequisites": [
      "F-NEG-01"
    ],
    "importance": "core",
    "keywords": [
      "絶対値",
      "数直線",
      "距離"
    ]
  },
  {
    "id": "F-POLY-01",
    "name": "文字式の計算",
    "category": "基礎",
    "subcategory": "中学1-2年",
    "description": "文字式の展開、同類項の整理、分配法則",
    "prerequisites": [
      "F-NEG-01"
    ],
    "importance": "core",
    "keywords": [
      "文字式",
      "展開",
      "同類項",
      "分配法則"
    ]
  },
  {
    "id": "F-EQ-01",
    "name": "一次方程式",
    "category": "基礎",
    "subcategory": "中学1年",
    "description": "一次方程式の解法、等式の性質",
    "prerequisites": [
      "F-POLY-01"
    ],
    "importance": "core",
    "keywords": [
      "一次方程式",
      "移項",
      "等式"
    ]
  },
  {
    "id": "F-FUNC-01",
    "name": "一次関数とグラフ",
    "category": "基礎",
    "subcategory": "中学2年",
    "description": "一次関数の式とグラフ、傾き、切片",
    "prerequisites": [
      "F-EQ-01"
    ],
    "importance": "core",
    "keywords": [
      "一次関数",
      "グラフ",
      "傾き",
      "切片",
      "y=ax+b"
    ]
  },
  {
    "id": "F-FIGR-01",
    "name": "三平方の定理",
    "category": "基礎",
    "subcategory": "中学3年",
    "description": "直角三角形の辺の関係、斜辺の計算",
    "prerequisites": [],
    "importance": "core",
    "keywords": [
      "三平方の定理",
      "ピタゴラス",
      "直角三角形"
    ]
  },
  {
    "id": "F-PROB-01",
    "name": "確率の基礎",
    "category": "基礎",
    "subcategory": "中学2年",
    "description": "同様に確からしい、場合の数、樹形図",
    "prerequisites": [],
    "importance": "standard",
    "keywords": [
      "確率",
      "場合の数",
      "樹形図"
    ]
  },
  {
    "id": "I-GEN-01",
    "name": "単項式の次数と係数",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: 単項式の次数と係数",
    "prerequisites": [
      "F-FUNC-01"
    ],
    "importance": "standard",
    "keywords": [
      "単項式の次数と係数"
    ]
  },
  {
    "id": "I-GEN-02",
    "name": "多項式の次数と定数項",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: 多項式の次数と定数項",
    "prerequisites": [
      "I-GEN-01"
    ],
    "importance": "standard",
    "keywords": [
      "多項式の次数と定数項"
    ]
  },
  {
    "id": "I-GEN-03",
    "name": "多項式の計算",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: 多項式の計算",
    "prerequisites": [
      "I-GEN-02"
    ],
    "importance": "standard",
    "keywords": [
      "多項式の計算"
    ]
  },
  {
    "id": "I-GEN-04",
    "name": "累乗の計算",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: 累乗の計算",
    "prerequisites": [
      "I-GEN-03"
    ],
    "importance": "standard",
    "keywords": [
      "累乗の計算"
    ]
  },
  {
    "id": "I-GEN-05",
    "name": "分配法則と展開",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: 分配法則と展開",
    "prerequisites": [
      "I-GEN-04"
    ],
    "importance": "standard",
    "keywords": [
      "分配法則と展開"
    ]
  },
  {
    "id": "I-GEN-06",
    "name": "２次式の展開と乗法公式",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: ２次式の展開と乗法公式",
    "prerequisites": [
      "I-GEN-05"
    ],
    "importance": "standard",
    "keywords": [
      "２次式の展開と乗法公式"
    ]
  },
  {
    "id": "I-GEN-07",
    "name": "３次式の展開",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: ３次式の展開",
    "prerequisites": [
      "I-GEN-06"
    ],
    "importance": "standard",
    "keywords": [
      "３次式の展開"
    ]
  },
  {
    "id": "I-GEN-08",
    "name": "式の展開の工夫",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: 式の展開の工夫",
    "prerequisites": [
      "I-GEN-07"
    ],
    "importance": "standard",
    "keywords": [
      "式の展開の工夫"
    ]
  },
  {
    "id": "I-GEN-09",
    "name": "２次式の因数分解",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: ２次式の因数分解",
    "prerequisites": [
      "I-GEN-08"
    ],
    "importance": "standard",
    "keywords": [
      "２次式の因数分解"
    ]
  },
  {
    "id": "I-GEN-10",
    "name": "因数分解（たすき掛け）",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: 因数分解（たすき掛け）",
    "prerequisites": [
      "I-GEN-09"
    ],
    "importance": "standard",
    "keywords": [
      "因数分解",
      "たすき掛け"
    ]
  },
  {
    "id": "I-GEN-11",
    "name": "３次式の因数分解",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: ３次式の因数分解",
    "prerequisites": [
      "I-GEN-10"
    ],
    "importance": "standard",
    "keywords": [
      "３次式の因数分解"
    ]
  },
  {
    "id": "I-GEN-12",
    "name": "因数分解の工夫",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: 因数分解の工夫",
    "prerequisites": [
      "I-GEN-11"
    ],
    "importance": "standard",
    "keywords": [
      "因数分解の工夫"
    ]
  },
  {
    "id": "I-GEN-13",
    "name": "文字式のたすき掛け",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: 文字式のたすき掛け",
    "prerequisites": [
      "I-GEN-12"
    ],
    "importance": "standard",
    "keywords": [
      "文字式のたすき掛け"
    ]
  },
  {
    "id": "I-GEN-14",
    "name": "２種類以上の文字を含む式の因数分解",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: ２種類以上の文字を含む式の因数分解①（１次式）",
    "prerequisites": [
      "I-GEN-13"
    ],
    "importance": "standard",
    "keywords": [
      "２種類以上の文字を含む式の因数分解①",
      "１次式"
    ]
  },
  {
    "id": "I-GEN-16",
    "name": "複２次式の因数分解",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: 複２次式の因数分解",
    "prerequisites": [
      "I-GEN-15"
    ],
    "importance": "standard",
    "keywords": [
      "複２次式の因数分解"
    ]
  },
  {
    "id": "I-GEN-17",
    "name": "循環小数と分数",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: 循環小数と分数",
    "prerequisites": [
      "I-GEN-16"
    ],
    "importance": "standard",
    "keywords": [
      "循環小数と分数"
    ]
  },
  {
    "id": "I-GEN-18",
    "name": "絶対値の計算",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: 絶対値の計算",
    "prerequisites": [
      "I-GEN-17"
    ],
    "importance": "standard",
    "keywords": [
      "絶対値の計算"
    ]
  },
  {
    "id": "I-GEN-19",
    "name": "平方根の計算",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: 平方根の計算",
    "prerequisites": [
      "I-GEN-18"
    ],
    "importance": "standard",
    "keywords": [
      "平方根の計算"
    ]
  },
  {
    "id": "I-GEN-20",
    "name": "分母の有理化",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: 分母の有理化",
    "prerequisites": [
      "I-GEN-19"
    ],
    "importance": "standard",
    "keywords": [
      "分母の有理化"
    ]
  },
  {
    "id": "I-GEN-21",
    "name": "対称式",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: 対称式",
    "prerequisites": [
      "I-GEN-20"
    ],
    "importance": "standard",
    "keywords": [
      "対称式"
    ]
  },
  {
    "id": "I-GEN-22",
    "name": "整数部分と小数部分",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: 整数部分と小数部分",
    "prerequisites": [
      "I-GEN-21"
    ],
    "importance": "standard",
    "keywords": [
      "整数部分と小数部分"
    ]
  },
  {
    "id": "I-GEN-23",
    "name": "二重根号",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: 二重根号",
    "prerequisites": [
      "I-GEN-22"
    ],
    "importance": "standard",
    "keywords": [
      "二重根号"
    ]
  },
  {
    "id": "I-GEN-24",
    "name": "１次不等式の解",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: １次不等式の解",
    "prerequisites": [
      "I-GEN-23"
    ],
    "importance": "standard",
    "keywords": [
      "１次不等式の解"
    ]
  },
  {
    "id": "I-GEN-25",
    "name": "連立不等式の解",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: 連立不等式の解",
    "prerequisites": [
      "I-GEN-24"
    ],
    "importance": "standard",
    "keywords": [
      "連立不等式の解"
    ]
  },
  {
    "id": "I-GEN-26",
    "name": "不等式を満たす整数の解",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: 不等式を満たす整数の解",
    "prerequisites": [
      "I-GEN-25"
    ],
    "importance": "standard",
    "keywords": [
      "不等式を満たす整数の解"
    ]
  },
  {
    "id": "I-GEN-27",
    "name": "１次不等式の文章問題",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: １次不等式の文章問題",
    "prerequisites": [
      "I-GEN-26"
    ],
    "importance": "standard",
    "keywords": [
      "１次不等式の文章問題"
    ]
  },
  {
    "id": "I-GEN-28",
    "name": "場合分けの必要な絶対値を含む方程式と不等式",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: 場合分けの必要な絶対値を含む方程式と不等式",
    "prerequisites": [
      "I-GEN-27"
    ],
    "importance": "standard",
    "keywords": [
      "場合分けの必要な絶対値を含む方程式と不等式"
    ]
  },
  {
    "id": "I-GEN-29",
    "name": "集合の表し方と要素",
    "category": "数学I",
    "subcategory": "集合と命題",
    "description": "数学Iの学習項目: 集合の表し方と要素",
    "prerequisites": [
      "I-GEN-28"
    ],
    "importance": "standard",
    "keywords": [
      "集合の表し方と要素"
    ]
  },
  {
    "id": "I-GEN-30",
    "name": "集合の包含関係と部分集合",
    "category": "数学I",
    "subcategory": "集合と命題",
    "description": "数学Iの学習項目: 集合の包含関係と部分集合",
    "prerequisites": [
      "I-GEN-29"
    ],
    "importance": "standard",
    "keywords": [
      "集合の包含関係と部分集合"
    ]
  },
  {
    "id": "I-GEN-31",
    "name": "共通部分と和集合",
    "category": "数学I",
    "subcategory": "集合と命題",
    "description": "数学Iの学習項目: 共通部分と和集合",
    "prerequisites": [
      "I-GEN-30"
    ],
    "importance": "standard",
    "keywords": [
      "共通部分と和集合"
    ]
  },
  {
    "id": "I-GEN-32",
    "name": "補集合とド・モルガンの法則",
    "category": "数学I",
    "subcategory": "集合と命題",
    "description": "数学Iの学習項目: 補集合とド・モルガンの法則",
    "prerequisites": [
      "I-GEN-31"
    ],
    "importance": "standard",
    "keywords": [
      "補集合とド・モルガンの法則"
    ]
  },
  {
    "id": "I-GEN-33",
    "name": "数直線と集合",
    "category": "数学I",
    "subcategory": "集合と命題",
    "description": "数学Iの学習項目: 数直線と集合",
    "prerequisites": [
      "I-GEN-32"
    ],
    "importance": "standard",
    "keywords": [
      "数直線と集合"
    ]
  },
  {
    "id": "I-GEN-34",
    "name": "命題の真偽",
    "category": "数学I",
    "subcategory": "集合と命題",
    "description": "数学Iの学習項目: 命題の真偽",
    "prerequisites": [
      "I-GEN-33"
    ],
    "importance": "standard",
    "keywords": [
      "命題の真偽"
    ]
  },
  {
    "id": "I-GEN-35",
    "name": "条件の真偽",
    "category": "数学I",
    "subcategory": "集合と命題",
    "description": "数学Iの学習項目: 条件の真偽",
    "prerequisites": [
      "I-GEN-34"
    ],
    "importance": "standard",
    "keywords": [
      "条件の真偽"
    ]
  },
  {
    "id": "I-GEN-36",
    "name": "条件の否定",
    "category": "数学I",
    "subcategory": "集合と命題",
    "description": "数学Iの学習項目: 条件の否定①（かつ・または）",
    "prerequisites": [
      "I-GEN-35"
    ],
    "importance": "standard",
    "keywords": [
      "条件の否定①",
      "かつ・または"
    ]
  },
  {
    "id": "I-GEN-38",
    "name": "必要条件と十分条件",
    "category": "数学I",
    "subcategory": "集合と命題",
    "description": "数学Iの学習項目: 必要条件と十分条件",
    "prerequisites": [
      "I-GEN-37"
    ],
    "importance": "standard",
    "keywords": [
      "必要条件と十分条件"
    ]
  },
  {
    "id": "I-GEN-39",
    "name": "逆・裏・対偶",
    "category": "数学I",
    "subcategory": "集合と命題",
    "description": "数学Iの学習項目: 逆・裏・対偶",
    "prerequisites": [
      "I-GEN-38"
    ],
    "importance": "standard",
    "keywords": [
      "逆・裏・対偶"
    ]
  },
  {
    "id": "I-GEN-40",
    "name": "対偶法",
    "category": "数学I",
    "subcategory": "集合と命題",
    "description": "数学Iの学習項目: 対偶法",
    "prerequisites": [
      "I-GEN-39"
    ],
    "importance": "standard",
    "keywords": [
      "対偶法"
    ]
  },
  {
    "id": "I-GEN-41",
    "name": "背理法",
    "category": "数学I",
    "subcategory": "集合と命題",
    "description": "数学Iの学習項目: 背理法",
    "prerequisites": [
      "I-GEN-40"
    ],
    "importance": "standard",
    "keywords": [
      "背理法"
    ]
  },
  {
    "id": "I-GEN-42",
    "name": "関数の値と象限",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学Iの学習項目: 関数の値と象限",
    "prerequisites": [
      "I-GEN-41"
    ],
    "importance": "standard",
    "keywords": [
      "関数の値と象限"
    ]
  },
  {
    "id": "I-GEN-43",
    "name": "関数の値域と最大値・最小値",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学Iの学習項目: 関数の値域と最大値・最小値",
    "prerequisites": [
      "I-GEN-42"
    ],
    "importance": "standard",
    "keywords": [
      "関数の値域と最大値・最小値"
    ]
  },
  {
    "id": "I-GEN-44",
    "name": "２次関数のグラフ",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学Iの学習項目: ２次関数のグラフ",
    "prerequisites": [
      "I-GEN-43"
    ],
    "importance": "standard",
    "keywords": [
      "２次関数のグラフ"
    ]
  },
  {
    "id": "I-GEN-45",
    "name": "２次関数の平方完成",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学Iの学習項目: ２次関数の平方完成",
    "prerequisites": [
      "I-GEN-44"
    ],
    "importance": "standard",
    "keywords": [
      "２次関数の平方完成"
    ]
  },
  {
    "id": "I-GEN-46",
    "name": "２次関数のグラフの平行移動",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学Iの学習項目: ２次関数のグラフの平行移動",
    "prerequisites": [
      "I-GEN-45"
    ],
    "importance": "standard",
    "keywords": [
      "２次関数のグラフの平行移動"
    ]
  },
  {
    "id": "I-GEN-47",
    "name": "平行移動後のグラフ",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学Iの学習項目: 平行移動後のグラフ",
    "prerequisites": [
      "I-GEN-46"
    ],
    "importance": "standard",
    "keywords": [
      "平行移動後のグラフ"
    ]
  },
  {
    "id": "I-GEN-48",
    "name": "グラフの対称移動",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学Iの学習項目: グラフの対称移動",
    "prerequisites": [
      "I-GEN-47"
    ],
    "importance": "standard",
    "keywords": [
      "グラフの対称移動"
    ]
  },
  {
    "id": "I-GEN-49",
    "name": "２次関数の決定",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学Iの学習項目: ２次関数の決定①（頂点）",
    "prerequisites": [
      "I-GEN-48"
    ],
    "importance": "standard",
    "keywords": [
      "２次関数の決定①",
      "頂点"
    ]
  },
  {
    "id": "I-GEN-51",
    "name": "２次関数の最大値・最小値",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学Iの学習項目: ２次関数の最大値・最小値",
    "prerequisites": [
      "I-GEN-50"
    ],
    "importance": "standard",
    "keywords": [
      "２次関数の最大値・最小値"
    ]
  },
  {
    "id": "I-GEN-53",
    "name": "最大値・最小値の文章問題",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学Iの学習項目: 最大値・最小値の文章問題",
    "prerequisites": [
      "I-GEN-52"
    ],
    "importance": "standard",
    "keywords": [
      "最大値・最小値の文章問題"
    ]
  },
  {
    "id": "I-GEN-54",
    "name": "文字係数を含む２次関数の最大値・最小値",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学Iの学習項目: 文字係数を含む２次関数の最大値・最小値",
    "prerequisites": [
      "I-GEN-53"
    ],
    "importance": "standard",
    "keywords": [
      "文字係数を含む２次関数の最大値・最小値"
    ]
  },
  {
    "id": "I-GEN-55",
    "name": "定義域が変化する２次関数の最大値・最小値",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学Iの学習項目: 定義域が変化する２次関数の最大値・最小値",
    "prerequisites": [
      "I-GEN-54"
    ],
    "importance": "standard",
    "keywords": [
      "定義域が変化する２次関数の最大値・最小値"
    ]
  },
  {
    "id": "I-GEN-56",
    "name": "２次方程式の解",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学Iの学習項目: ２次方程式の解",
    "prerequisites": [
      "I-GEN-55"
    ],
    "importance": "standard",
    "keywords": [
      "２次方程式の解"
    ]
  },
  {
    "id": "I-GEN-57",
    "name": "２次方程式の解の個数",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学Iの学習項目: ２次方程式の解の個数",
    "prerequisites": [
      "I-GEN-56"
    ],
    "importance": "standard",
    "keywords": [
      "２次方程式の解の個数"
    ]
  },
  {
    "id": "I-GEN-58",
    "name": "２次方程式の解の条件",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学Iの学習項目: ２次方程式の解の条件",
    "prerequisites": [
      "I-GEN-57"
    ],
    "importance": "standard",
    "keywords": [
      "２次方程式の解の条件"
    ]
  },
  {
    "id": "I-GEN-59",
    "name": "解が与えられた２次方程式",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学Iの学習項目: 解が与えられた２次方程式",
    "prerequisites": [
      "I-GEN-58"
    ],
    "importance": "standard",
    "keywords": [
      "解が与えられた２次方程式"
    ]
  },
  {
    "id": "I-GEN-60",
    "name": "２次方程式の文章問題",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学Iの学習項目: ２次方程式の文章問題",
    "prerequisites": [
      "I-GEN-59"
    ],
    "importance": "standard",
    "keywords": [
      "２次方程式の文章問題"
    ]
  },
  {
    "id": "I-GEN-61",
    "name": "２次方程式の共通解",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学Iの学習項目: ２次方程式の共通解",
    "prerequisites": [
      "I-GEN-60"
    ],
    "importance": "standard",
    "keywords": [
      "２次方程式の共通解"
    ]
  },
  {
    "id": "I-GEN-62",
    "name": "２次関数とx軸との交点",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学Iの学習項目: ２次関数とx軸との交点",
    "prerequisites": [
      "I-GEN-61"
    ],
    "importance": "standard",
    "keywords": [
      "２次関数とx軸との交点"
    ]
  },
  {
    "id": "I-GEN-63",
    "name": "２次関数とx軸との交点の条件",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学Iの学習項目: ２次関数とx軸との交点の条件",
    "prerequisites": [
      "I-GEN-62"
    ],
    "importance": "standard",
    "keywords": [
      "２次関数とx軸との交点の条件"
    ]
  },
  {
    "id": "I-GEN-64",
    "name": "放物線と直線の交点",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学Iの学習項目: 放物線と直線の交点",
    "prerequisites": [
      "I-GEN-63"
    ],
    "importance": "standard",
    "keywords": [
      "放物線と直線の交点"
    ]
  },
  {
    "id": "I-GEN-65",
    "name": "２次不等式の解法",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学Iの学習項目: ２次不等式の解①（因数分解）",
    "prerequisites": [
      "I-GEN-64"
    ],
    "importance": "standard",
    "keywords": [
      "２次不等式の解①",
      "因数分解"
    ]
  },
  {
    "id": "I-GEN-69",
    "name": "連立２次不等式の解",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学Iの学習項目: 連立２次不等式の解",
    "prerequisites": [
      "I-GEN-68"
    ],
    "importance": "standard",
    "keywords": [
      "連立２次不等式の解"
    ]
  },
  {
    "id": "I-GEN-70",
    "name": "絶対不等式",
    "category": "数学I",
    "subcategory": "数と式",
    "description": "数学Iの学習項目: 絶対不等式",
    "prerequisites": [
      "I-GEN-69"
    ],
    "importance": "standard",
    "keywords": [
      "絶対不等式"
    ]
  },
  {
    "id": "I-GEN-71",
    "name": "２次不等式の文章問題",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学Iの学習項目: ２次不等式の文章問題",
    "prerequisites": [
      "I-GEN-70"
    ],
    "importance": "standard",
    "keywords": [
      "２次不等式の文章問題"
    ]
  },
  {
    "id": "I-GEN-72",
    "name": "２次方程式の解の符号",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学Iの学習項目: ２次方程式の解の符号",
    "prerequisites": [
      "I-GEN-71"
    ],
    "importance": "standard",
    "keywords": [
      "２次方程式の解の符号"
    ]
  },
  {
    "id": "I-GEN-73",
    "name": "直角三角形と三角比",
    "category": "数学I",
    "subcategory": "図形と計量",
    "description": "数学Iの学習項目: 直角三角形と三角比",
    "prerequisites": [
      "I-GEN-72"
    ],
    "importance": "standard",
    "keywords": [
      "直角三角形と三角比"
    ]
  },
  {
    "id": "I-GEN-74",
    "name": "三角比の値（鋭角）",
    "category": "数学I",
    "subcategory": "図形と計量",
    "description": "数学Iの学習項目: 三角比の値（鋭角）",
    "prerequisites": [
      "I-GEN-73"
    ],
    "importance": "standard",
    "keywords": [
      "三角比の値",
      "鋭角"
    ]
  },
  {
    "id": "I-GEN-75",
    "name": "余角の公式",
    "category": "数学I",
    "subcategory": "図形と計量",
    "description": "数学Iの学習項目: 余角の公式",
    "prerequisites": [
      "I-GEN-74"
    ],
    "importance": "standard",
    "keywords": [
      "余角の公式"
    ]
  },
  {
    "id": "I-GEN-76",
    "name": "三角比の相互関係の公式（鋭角）",
    "category": "数学I",
    "subcategory": "図形と計量",
    "description": "数学Iの学習項目: 三角比の相互関係の公式（鋭角）",
    "prerequisites": [
      "I-GEN-75"
    ],
    "importance": "standard",
    "keywords": [
      "三角比の相互関係の公式",
      "鋭角"
    ]
  },
  {
    "id": "I-GEN-77",
    "name": "三角比の拡張",
    "category": "数学I",
    "subcategory": "図形と計量",
    "description": "数学Iの学習項目: 三角比の拡張",
    "prerequisites": [
      "I-GEN-76"
    ],
    "importance": "standard",
    "keywords": [
      "三角比の拡張"
    ]
  },
  {
    "id": "I-GEN-78",
    "name": "三角比と方程式",
    "category": "数学I",
    "subcategory": "図形と計量",
    "description": "数学Iの学習項目: 三角比と方程式",
    "prerequisites": [
      "I-GEN-77"
    ],
    "importance": "standard",
    "keywords": [
      "三角比と方程式"
    ]
  },
  {
    "id": "I-GEN-79",
    "name": "三角比と不等式",
    "category": "数学I",
    "subcategory": "図形と計量",
    "description": "数学Iの学習項目: 三角比と不等式",
    "prerequisites": [
      "I-GEN-78"
    ],
    "importance": "standard",
    "keywords": [
      "三角比と不等式"
    ]
  },
  {
    "id": "I-GEN-80",
    "name": "補角の公式",
    "category": "数学I",
    "subcategory": "図形と計量",
    "description": "数学Iの学習項目: 補角の公式",
    "prerequisites": [
      "I-GEN-79"
    ],
    "importance": "standard",
    "keywords": [
      "補角の公式"
    ]
  },
  {
    "id": "I-GEN-81",
    "name": "三角比の相互関係の公式（鈍角）",
    "category": "数学I",
    "subcategory": "図形と計量",
    "description": "数学Iの学習項目: 三角比の相互関係の公式（鈍角）",
    "prerequisites": [
      "I-GEN-80"
    ],
    "importance": "standard",
    "keywords": [
      "三角比の相互関係の公式",
      "鈍角"
    ]
  },
  {
    "id": "I-GEN-82",
    "name": "三角比の等式証明",
    "category": "数学I",
    "subcategory": "図形と計量",
    "description": "数学Iの学習項目: 三角比の等式証明",
    "prerequisites": [
      "I-GEN-81"
    ],
    "importance": "standard",
    "keywords": [
      "三角比の等式証明"
    ]
  },
  {
    "id": "I-GEN-83",
    "name": "直線の傾きと正接",
    "category": "数学I",
    "subcategory": "図形と計量",
    "description": "数学Iの学習項目: 直線の傾きと正接",
    "prerequisites": [
      "I-GEN-82"
    ],
    "importance": "standard",
    "keywords": [
      "直線の傾きと正接"
    ]
  },
  {
    "id": "I-GEN-84",
    "name": "三角比と２次方程式",
    "category": "数学I",
    "subcategory": "図形と計量",
    "description": "数学Iの学習項目: 三角比と２次方程式",
    "prerequisites": [
      "I-GEN-83"
    ],
    "importance": "standard",
    "keywords": [
      "三角比と２次方程式"
    ]
  },
  {
    "id": "I-GEN-85",
    "name": "三角比の式と値",
    "category": "数学I",
    "subcategory": "図形と計量",
    "description": "数学Iの学習項目: 三角比の式と値",
    "prerequisites": [
      "I-GEN-84"
    ],
    "importance": "standard",
    "keywords": [
      "三角比の式と値"
    ]
  },
  {
    "id": "I-GEN-86",
    "name": "正弦定理",
    "category": "数学I",
    "subcategory": "図形と計量",
    "description": "数学Iの学習項目: 正弦定理",
    "prerequisites": [
      "I-GEN-85"
    ],
    "importance": "standard",
    "keywords": [
      "正弦定理"
    ]
  },
  {
    "id": "I-GEN-87",
    "name": "余弦定理",
    "category": "数学I",
    "subcategory": "図形と計量",
    "description": "数学Iの学習項目: 余弦定理",
    "prerequisites": [
      "I-GEN-86"
    ],
    "importance": "standard",
    "keywords": [
      "余弦定理"
    ]
  },
  {
    "id": "I-GEN-88",
    "name": "余弦定理と２次方程式",
    "category": "数学I",
    "subcategory": "図形と計量",
    "description": "数学Iの学習項目: 余弦定理と２次方程式",
    "prerequisites": [
      "I-GEN-87"
    ],
    "importance": "standard",
    "keywords": [
      "余弦定理と２次方程式"
    ]
  },
  {
    "id": "I-GEN-89",
    "name": "三角形の辺と角の条件",
    "category": "数学I",
    "subcategory": "図形と計量",
    "description": "数学Iの学習項目: 三角形の辺と角の条件",
    "prerequisites": [
      "I-GEN-88"
    ],
    "importance": "standard",
    "keywords": [
      "三角形の辺と角の条件"
    ]
  },
  {
    "id": "I-GEN-90",
    "name": "三角形の面積（三角比）",
    "category": "数学I",
    "subcategory": "図形と計量",
    "description": "数学Iの学習項目: 三角形の面積（三角比）",
    "prerequisites": [
      "I-GEN-89"
    ],
    "importance": "standard",
    "keywords": [
      "三角形の面積",
      "三角比"
    ]
  },
  {
    "id": "I-GEN-91",
    "name": "内接円の半径",
    "category": "数学I",
    "subcategory": "図形と計量",
    "description": "数学Iの学習項目: 内接円の半径",
    "prerequisites": [
      "I-GEN-90"
    ],
    "importance": "standard",
    "keywords": [
      "内接円の半径"
    ]
  },
  {
    "id": "I-GEN-92",
    "name": "角の二等分線の長さ",
    "category": "数学I",
    "subcategory": "図形と計量",
    "description": "数学Iの学習項目: 角の二等分線の長さ",
    "prerequisites": [
      "I-GEN-91"
    ],
    "importance": "standard",
    "keywords": [
      "角の二等分線の長さ"
    ]
  },
  {
    "id": "I-GEN-93",
    "name": "円に内接する四角形",
    "category": "数学I",
    "subcategory": "図形と計量",
    "description": "数学Iの学習項目: 円に内接する四角形",
    "prerequisites": [
      "I-GEN-92"
    ],
    "importance": "standard",
    "keywords": [
      "円に内接する四角形"
    ]
  },
  {
    "id": "I-GEN-94",
    "name": "直方体の計量",
    "category": "数学I",
    "subcategory": "図形と計量",
    "description": "数学Iの学習項目: 直方体の計量",
    "prerequisites": [
      "I-GEN-93"
    ],
    "importance": "standard",
    "keywords": [
      "直方体の計量"
    ]
  },
  {
    "id": "I-GEN-95",
    "name": "正四面体の計量",
    "category": "数学I",
    "subcategory": "図形と計量",
    "description": "数学Iの学習項目: 正四面体の計量",
    "prerequisites": [
      "I-GEN-94"
    ],
    "importance": "standard",
    "keywords": [
      "正四面体の計量"
    ]
  },
  {
    "id": "I-GEN-96",
    "name": "平均値・中央値・最頻値",
    "category": "数学I",
    "subcategory": "データの分析",
    "description": "数学Iの学習項目: 平均値・中央値・最頻値",
    "prerequisites": [
      "I-GEN-95"
    ],
    "importance": "standard",
    "keywords": [
      "平均値・中央値・最頻値"
    ]
  },
  {
    "id": "I-GEN-97",
    "name": "度数分布表",
    "category": "数学I",
    "subcategory": "データの分析",
    "description": "数学Iの学習項目: 度数分布表",
    "prerequisites": [
      "I-GEN-96"
    ],
    "importance": "standard",
    "keywords": [
      "度数分布表"
    ]
  },
  {
    "id": "I-GEN-98",
    "name": "箱ひげ図",
    "category": "数学I",
    "subcategory": "データの分析",
    "description": "数学Iの学習項目: 箱ひげ図",
    "prerequisites": [
      "I-GEN-97"
    ],
    "importance": "standard",
    "keywords": [
      "箱ひげ図"
    ]
  },
  {
    "id": "I-GEN-99",
    "name": "分散と標準偏差",
    "category": "数学I",
    "subcategory": "データの分析",
    "description": "数学Iの学習項目: 分散と標準偏差",
    "prerequisites": [
      "I-GEN-98"
    ],
    "importance": "standard",
    "keywords": [
      "分散と標準偏差"
    ]
  },
  {
    "id": "I-GEN-100",
    "name": "度数分布表と分散",
    "category": "数学I",
    "subcategory": "データの分析",
    "description": "数学Iの学習項目: 度数分布表と分散",
    "prerequisites": [
      "I-GEN-99"
    ],
    "importance": "standard",
    "keywords": [
      "度数分布表と分散"
    ]
  },
  {
    "id": "I-GEN-101",
    "name": "散布図と相関",
    "category": "数学I",
    "subcategory": "データの分析",
    "description": "数学Iの学習項目: 散布図と相関",
    "prerequisites": [
      "I-GEN-100"
    ],
    "importance": "standard",
    "keywords": [
      "散布図と相関"
    ]
  },
  {
    "id": "I-GEN-102",
    "name": "相関係数",
    "category": "数学I",
    "subcategory": "データの分析",
    "description": "数学Iの学習項目: 相関係数",
    "prerequisites": [
      "I-GEN-101"
    ],
    "importance": "standard",
    "keywords": [
      "相関係数"
    ]
  },
  {
    "id": "I-QF-01",
    "name": "２次方程式の解の符号（２次関数）",
    "category": "数学I",
    "subcategory": "2次関数",
    "description": "数学I「２次関数」の学習項目: ２次方程式の解の符号（２次関数）",
    "prerequisites": [
      "I-GEN-102"
    ],
    "importance": "standard",
    "keywords": [
      "２次方程式の解の符号",
      "２次関数"
    ]
  },
  {
    "id": "A-GEN-01",
    "name": "集合の要素の個数",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 集合の要素の個数",
    "prerequisites": [
      "F-PROB-01"
    ],
    "importance": "standard",
    "keywords": [
      "集合の要素の個数"
    ]
  },
  {
    "id": "A-GEN-02",
    "name": "補集合の要素の個数",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 補集合の要素の個数",
    "prerequisites": [
      "A-GEN-01"
    ],
    "importance": "standard",
    "keywords": [
      "補集合の要素の個数"
    ]
  },
  {
    "id": "A-GEN-03",
    "name": "３つの集合の要素の個数",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: ３つの集合の要素の個数",
    "prerequisites": [
      "A-GEN-02"
    ],
    "importance": "standard",
    "keywords": [
      "３つの集合の要素の個数"
    ]
  },
  {
    "id": "A-GEN-04",
    "name": "和の法則と積の法則",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 和の法則と積の法則",
    "prerequisites": [
      "A-GEN-03"
    ],
    "importance": "standard",
    "keywords": [
      "和の法則と積の法則"
    ]
  },
  {
    "id": "A-GEN-05",
    "name": "約数の個数と展開式の項の個数",
    "category": "数学A",
    "subcategory": "整数の性質",
    "description": "数学Aの学習項目: 約数の個数と展開式の項の個数",
    "prerequisites": [
      "A-GEN-04"
    ],
    "importance": "standard",
    "keywords": [
      "約数の個数と展開式の項の個数"
    ]
  },
  {
    "id": "A-GEN-06",
    "name": "順列と階乗の記号",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 順列と階乗の記号",
    "prerequisites": [
      "A-GEN-05"
    ],
    "importance": "standard",
    "keywords": [
      "順列と階乗の記号"
    ]
  },
  {
    "id": "A-GEN-07",
    "name": "文字の順列",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 文字の順列",
    "prerequisites": [
      "A-GEN-06"
    ],
    "importance": "standard",
    "keywords": [
      "文字の順列"
    ]
  },
  {
    "id": "A-GEN-08",
    "name": "数字の順列",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 数字の順列",
    "prerequisites": [
      "A-GEN-07"
    ],
    "importance": "standard",
    "keywords": [
      "数字の順列"
    ]
  },
  {
    "id": "A-GEN-09",
    "name": "円順列とじゅず順列",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 円順列とじゅず順列",
    "prerequisites": [
      "A-GEN-08"
    ],
    "importance": "standard",
    "keywords": [
      "円順列とじゅず順列"
    ]
  },
  {
    "id": "A-GEN-10",
    "name": "条件付き円順列",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 条件付き円順列",
    "prerequisites": [
      "A-GEN-09"
    ],
    "importance": "standard",
    "keywords": [
      "条件付き円順列"
    ]
  },
  {
    "id": "A-GEN-11",
    "name": "重複を許す順列",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 重複を許す順列",
    "prerequisites": [
      "A-GEN-10"
    ],
    "importance": "standard",
    "keywords": [
      "重複を許す順列"
    ]
  },
  {
    "id": "A-GEN-12",
    "name": "２つのグループに分ける",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: ２つのグループに分ける",
    "prerequisites": [
      "A-GEN-11"
    ],
    "importance": "standard",
    "keywords": [
      "２つのグループに分ける"
    ]
  },
  {
    "id": "A-GEN-13",
    "name": "組合せの記号",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 組合せの記号",
    "prerequisites": [
      "A-GEN-12"
    ],
    "importance": "standard",
    "keywords": [
      "組合せの記号"
    ]
  },
  {
    "id": "A-GEN-14",
    "name": "順列と組合せ",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 順列と組合せ",
    "prerequisites": [
      "A-GEN-13"
    ],
    "importance": "standard",
    "keywords": [
      "順列と組合せ"
    ]
  },
  {
    "id": "A-GEN-15",
    "name": "図形と組合せ",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 図形と組合せ",
    "prerequisites": [
      "A-GEN-14"
    ],
    "importance": "standard",
    "keywords": [
      "図形と組合せ"
    ]
  },
  {
    "id": "A-GEN-16",
    "name": "代表を選ぶ",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 代表を選ぶ",
    "prerequisites": [
      "A-GEN-15"
    ],
    "importance": "standard",
    "keywords": [
      "代表を選ぶ"
    ]
  },
  {
    "id": "A-GEN-17",
    "name": "３つのグループに分ける",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: ３つのグループに分ける",
    "prerequisites": [
      "A-GEN-16"
    ],
    "importance": "standard",
    "keywords": [
      "３つのグループに分ける"
    ]
  },
  {
    "id": "A-GEN-18",
    "name": "同じものを含む順列",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 同じものを含む順列",
    "prerequisites": [
      "A-GEN-17"
    ],
    "importance": "standard",
    "keywords": [
      "同じものを含む順列"
    ]
  },
  {
    "id": "A-GEN-19",
    "name": "最短経路問題",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 最短経路問題",
    "prerequisites": [
      "A-GEN-18"
    ],
    "importance": "standard",
    "keywords": [
      "最短経路問題"
    ]
  },
  {
    "id": "A-GEN-20",
    "name": "重複組合せ",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 重複組合せ",
    "prerequisites": [
      "A-GEN-19"
    ],
    "importance": "standard",
    "keywords": [
      "重複組合せ"
    ]
  },
  {
    "id": "A-GEN-21",
    "name": "等式を満たす自然数の組合せ",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 等式を満たす自然数の組合せ",
    "prerequisites": [
      "A-GEN-20"
    ],
    "importance": "standard",
    "keywords": [
      "等式を満たす自然数の組合せ"
    ]
  },
  {
    "id": "A-GEN-22",
    "name": "確率の基本",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 確率の基本",
    "prerequisites": [
      "A-GEN-21"
    ],
    "importance": "standard",
    "keywords": [
      "確率の基本"
    ]
  },
  {
    "id": "A-GEN-23",
    "name": "さいころの確率",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: さいころの確率",
    "prerequisites": [
      "A-GEN-22"
    ],
    "importance": "standard",
    "keywords": [
      "さいころの確率"
    ]
  },
  {
    "id": "A-GEN-24",
    "name": "ボールを取り出す確率",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: ボールを取り出す確率",
    "prerequisites": [
      "A-GEN-23"
    ],
    "importance": "standard",
    "keywords": [
      "ボールを取り出す確率"
    ]
  },
  {
    "id": "A-GEN-25",
    "name": "一列に並べる確率",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 一列に並べる確率",
    "prerequisites": [
      "A-GEN-24"
    ],
    "importance": "standard",
    "keywords": [
      "一列に並べる確率"
    ]
  },
  {
    "id": "A-GEN-26",
    "name": "円形に並べる確率",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 円形に並べる確率",
    "prerequisites": [
      "A-GEN-25"
    ],
    "importance": "standard",
    "keywords": [
      "円形に並べる確率"
    ]
  },
  {
    "id": "A-GEN-27",
    "name": "和事象と排反事象",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 和事象と排反事象",
    "prerequisites": [
      "A-GEN-26"
    ],
    "importance": "standard",
    "keywords": [
      "和事象と排反事象"
    ]
  },
  {
    "id": "A-GEN-28",
    "name": "余事象の確率",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 余事象の確率",
    "prerequisites": [
      "A-GEN-27"
    ],
    "importance": "standard",
    "keywords": [
      "余事象の確率"
    ]
  },
  {
    "id": "A-GEN-29",
    "name": "独立試行の確率",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 独立試行の確率",
    "prerequisites": [
      "A-GEN-28"
    ],
    "importance": "standard",
    "keywords": [
      "独立試行の確率"
    ]
  },
  {
    "id": "A-GEN-30",
    "name": "反復試行の確率",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 反復試行の確率①（コイン）",
    "prerequisites": [
      "A-GEN-29"
    ],
    "importance": "standard",
    "keywords": [
      "反復試行の確率①",
      "コイン"
    ]
  },
  {
    "id": "A-GEN-32",
    "name": "○勝先取の確率",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: ○勝先取の確率",
    "prerequisites": [
      "A-GEN-31"
    ],
    "importance": "standard",
    "keywords": [
      "○勝先取の確率"
    ]
  },
  {
    "id": "A-GEN-33",
    "name": "点が動く確率",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 点が動く確率",
    "prerequisites": [
      "A-GEN-32"
    ],
    "importance": "standard",
    "keywords": [
      "点が動く確率"
    ]
  },
  {
    "id": "A-GEN-34",
    "name": "条件付き確率",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 条件付き確率",
    "prerequisites": [
      "A-GEN-33"
    ],
    "importance": "standard",
    "keywords": [
      "条件付き確率"
    ]
  },
  {
    "id": "A-GEN-35",
    "name": "確率の乗法定理",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "数学Aの学習項目: 確率の乗法定理",
    "prerequisites": [
      "A-GEN-34"
    ],
    "importance": "standard",
    "keywords": [
      "確率の乗法定理"
    ]
  },
  {
    "id": "A-GEN-36",
    "name": "除法の性質",
    "category": "数学A",
    "subcategory": "整数の性質",
    "description": "数学Aの学習項目: 除法の性質",
    "prerequisites": [
      "A-GEN-35"
    ],
    "importance": "standard",
    "keywords": [
      "除法の性質"
    ]
  },
  {
    "id": "A-GEN-37",
    "name": "整数の分類と証明",
    "category": "数学A",
    "subcategory": "整数の性質",
    "description": "数学Aの学習項目: 整数の分類と証明",
    "prerequisites": [
      "A-GEN-36"
    ],
    "importance": "standard",
    "keywords": [
      "整数の分類と証明"
    ]
  },
  {
    "id": "A-GEN-38",
    "name": "約数と倍数",
    "category": "数学A",
    "subcategory": "整数の性質",
    "description": "数学Aの学習項目: 約数と倍数",
    "prerequisites": [
      "A-GEN-37"
    ],
    "importance": "standard",
    "keywords": [
      "約数と倍数"
    ]
  },
  {
    "id": "A-GEN-39",
    "name": "倍数判別法",
    "category": "数学A",
    "subcategory": "整数の性質",
    "description": "数学Aの学習項目: 倍数判別法",
    "prerequisites": [
      "A-GEN-38"
    ],
    "importance": "standard",
    "keywords": [
      "倍数判別法"
    ]
  },
  {
    "id": "A-GEN-40",
    "name": "素因数分解",
    "category": "数学A",
    "subcategory": "整数の性質",
    "description": "数学Aの学習項目: 素因数分解",
    "prerequisites": [
      "A-GEN-39"
    ],
    "importance": "standard",
    "keywords": [
      "素因数分解"
    ]
  },
  {
    "id": "A-GEN-41",
    "name": "約数の個数・平方数",
    "category": "数学A",
    "subcategory": "整数の性質",
    "description": "数学Aの学習項目: 約数の個数・平方数",
    "prerequisites": [
      "A-GEN-40"
    ],
    "importance": "standard",
    "keywords": [
      "約数の個数・平方数"
    ]
  },
  {
    "id": "A-GEN-42",
    "name": "等式を満たす整数の組",
    "category": "数学A",
    "subcategory": "整数の性質",
    "description": "数学Aの学習項目: 等式を満たす整数の組",
    "prerequisites": [
      "A-GEN-41"
    ],
    "importance": "standard",
    "keywords": [
      "等式を満たす整数の組"
    ]
  },
  {
    "id": "A-GEN-43",
    "name": "最大公約数と最小公倍数",
    "category": "数学A",
    "subcategory": "整数の性質",
    "description": "数学Aの学習項目: 最大公約数と最小公倍数",
    "prerequisites": [
      "A-GEN-42"
    ],
    "importance": "standard",
    "keywords": [
      "最大公約数と最小公倍数"
    ]
  },
  {
    "id": "A-GEN-44",
    "name": "最大公約数と最小公倍数の関係式",
    "category": "数学A",
    "subcategory": "整数の性質",
    "description": "数学Aの学習項目: 最大公約数と最小公倍数の関係式",
    "prerequisites": [
      "A-GEN-43"
    ],
    "importance": "standard",
    "keywords": [
      "最大公約数と最小公倍数の関係式"
    ]
  },
  {
    "id": "A-GEN-45",
    "name": "ユークリッドの互除法",
    "category": "数学A",
    "subcategory": "整数の性質",
    "description": "数学Aの学習項目: ユークリッドの互除法",
    "prerequisites": [
      "A-GEN-44"
    ],
    "importance": "standard",
    "keywords": [
      "ユークリッドの互除法"
    ]
  },
  {
    "id": "A-GEN-46",
    "name": "不定方程式",
    "category": "数学A",
    "subcategory": "整数の性質",
    "description": "数学Aの学習項目: 不定方程式①",
    "prerequisites": [
      "A-GEN-45"
    ],
    "importance": "standard",
    "keywords": [
      "不定方程式①"
    ]
  },
  {
    "id": "A-GEN-48",
    "name": "不定方程式の利用",
    "category": "数学A",
    "subcategory": "整数の性質",
    "description": "数学Aの学習項目: 不定方程式の利用",
    "prerequisites": [
      "A-GEN-47"
    ],
    "importance": "standard",
    "keywords": [
      "不定方程式の利用"
    ]
  },
  {
    "id": "A-GEN-49",
    "name": "n進法",
    "category": "数学A",
    "subcategory": "整数の性質",
    "description": "数学Aの学習項目: n進法①（10進法で表す）",
    "prerequisites": [
      "A-GEN-48"
    ],
    "importance": "standard",
    "keywords": [
      "n進法①",
      "10進法で表す"
    ]
  },
  {
    "id": "A-GEN-51",
    "name": "n進法と小数",
    "category": "数学A",
    "subcategory": "整数の性質",
    "description": "数学Aの学習項目: n進法と小数",
    "prerequisites": [
      "A-GEN-50"
    ],
    "importance": "standard",
    "keywords": [
      "n進法と小数"
    ]
  },
  {
    "id": "A-GEN-52",
    "name": "n進法のたし算",
    "category": "数学A",
    "subcategory": "整数の性質",
    "description": "数学Aの学習項目: n進法のたし算",
    "prerequisites": [
      "A-GEN-51"
    ],
    "importance": "standard",
    "keywords": [
      "n進法のたし算"
    ]
  },
  {
    "id": "A-GEN-53",
    "name": "n進法のひき算",
    "category": "数学A",
    "subcategory": "整数の性質",
    "description": "数学Aの学習項目: n進法のひき算",
    "prerequisites": [
      "A-GEN-52"
    ],
    "importance": "standard",
    "keywords": [
      "n進法のひき算"
    ]
  },
  {
    "id": "A-GEN-54",
    "name": "n進法のかけ算",
    "category": "数学A",
    "subcategory": "整数の性質",
    "description": "数学Aの学習項目: n進法のかけ算",
    "prerequisites": [
      "A-GEN-53"
    ],
    "importance": "standard",
    "keywords": [
      "n進法のかけ算"
    ]
  },
  {
    "id": "A-GEN-55",
    "name": "分数と小数",
    "category": "数学A",
    "subcategory": "整数の性質",
    "description": "数学Aの学習項目: 分数と小数",
    "prerequisites": [
      "A-GEN-54"
    ],
    "importance": "standard",
    "keywords": [
      "分数と小数"
    ]
  },
  {
    "id": "A-GEN-56",
    "name": "内分点と外分点の位置",
    "category": "数学A",
    "subcategory": "図形の性質",
    "description": "数学Aの学習項目: 内分点と外分点の位置",
    "prerequisites": [
      "A-GEN-55"
    ],
    "importance": "standard",
    "keywords": [
      "内分点と外分点の位置"
    ]
  },
  {
    "id": "A-GEN-57",
    "name": "中点連結定理と平行線と比",
    "category": "数学A",
    "subcategory": "図形の性質",
    "description": "数学Aの学習項目: 中点連結定理と平行線と比",
    "prerequisites": [
      "A-GEN-56"
    ],
    "importance": "standard",
    "keywords": [
      "中点連結定理と平行線と比"
    ]
  },
  {
    "id": "A-GEN-58",
    "name": "角の二等分線と比",
    "category": "数学A",
    "subcategory": "図形の性質",
    "description": "数学Aの学習項目: 角の二等分線と比",
    "prerequisites": [
      "A-GEN-57"
    ],
    "importance": "standard",
    "keywords": [
      "角の二等分線と比"
    ]
  },
  {
    "id": "A-GEN-59",
    "name": "三角形の外心",
    "category": "数学A",
    "subcategory": "図形の性質",
    "description": "数学Aの学習項目: 三角形の外心",
    "prerequisites": [
      "A-GEN-58"
    ],
    "importance": "standard",
    "keywords": [
      "三角形の外心"
    ]
  },
  {
    "id": "A-GEN-60",
    "name": "三角形の内心",
    "category": "数学A",
    "subcategory": "図形の性質",
    "description": "数学Aの学習項目: 三角形の内心",
    "prerequisites": [
      "A-GEN-59"
    ],
    "importance": "standard",
    "keywords": [
      "三角形の内心"
    ]
  },
  {
    "id": "A-GEN-61",
    "name": "三角形の垂心",
    "category": "数学A",
    "subcategory": "図形の性質",
    "description": "数学Aの学習項目: 三角形の垂心",
    "prerequisites": [
      "A-GEN-60"
    ],
    "importance": "standard",
    "keywords": [
      "三角形の垂心"
    ]
  },
  {
    "id": "A-GEN-62",
    "name": "三角形の重心",
    "category": "数学A",
    "subcategory": "図形の性質",
    "description": "数学Aの学習項目: 三角形の重心",
    "prerequisites": [
      "A-GEN-61"
    ],
    "importance": "standard",
    "keywords": [
      "三角形の重心"
    ]
  },
  {
    "id": "A-GEN-63",
    "name": "チェバの定理",
    "category": "数学A",
    "subcategory": "図形の性質",
    "description": "数学Aの学習項目: チェバの定理",
    "prerequisites": [
      "A-GEN-62"
    ],
    "importance": "standard",
    "keywords": [
      "チェバの定理"
    ]
  },
  {
    "id": "A-GEN-64",
    "name": "メネラウスの定理",
    "category": "数学A",
    "subcategory": "図形の性質",
    "description": "数学Aの学習項目: メネラウスの定理",
    "prerequisites": [
      "A-GEN-63"
    ],
    "importance": "standard",
    "keywords": [
      "メネラウスの定理"
    ]
  },
  {
    "id": "A-GEN-65",
    "name": "三角形の辺と角の大小比較",
    "category": "数学A",
    "subcategory": "図形の性質",
    "description": "数学Aの学習項目: 三角形の辺と角の大小比較",
    "prerequisites": [
      "A-GEN-64"
    ],
    "importance": "standard",
    "keywords": [
      "三角形の辺と角の大小比較"
    ]
  },
  {
    "id": "A-GEN-66",
    "name": "三角形になるための条件",
    "category": "数学A",
    "subcategory": "図形の性質",
    "description": "数学Aの学習項目: 三角形になるための条件",
    "prerequisites": [
      "A-GEN-65"
    ],
    "importance": "standard",
    "keywords": [
      "三角形になるための条件"
    ]
  },
  {
    "id": "A-GEN-67",
    "name": "円周角と中心角",
    "category": "数学A",
    "subcategory": "図形の性質",
    "description": "数学Aの学習項目: 円周角と中心角",
    "prerequisites": [
      "A-GEN-66"
    ],
    "importance": "standard",
    "keywords": [
      "円周角と中心角"
    ]
  },
  {
    "id": "A-GEN-68",
    "name": "円に内接する四角形と角",
    "category": "数学A",
    "subcategory": "図形の性質",
    "description": "数学Aの学習項目: 円に内接する四角形と角",
    "prerequisites": [
      "A-GEN-67"
    ],
    "importance": "standard",
    "keywords": [
      "円に内接する四角形と角"
    ]
  },
  {
    "id": "A-GEN-69",
    "name": "接弦定理",
    "category": "数学A",
    "subcategory": "図形の性質",
    "description": "数学Aの学習項目: 接弦定理",
    "prerequisites": [
      "A-GEN-68"
    ],
    "importance": "standard",
    "keywords": [
      "接弦定理"
    ]
  },
  {
    "id": "A-GEN-70",
    "name": "内接円と接線の条件",
    "category": "数学A",
    "subcategory": "図形の性質",
    "description": "数学Aの学習項目: 内接円と接線の条件",
    "prerequisites": [
      "A-GEN-69"
    ],
    "importance": "standard",
    "keywords": [
      "内接円と接線の条件"
    ]
  },
  {
    "id": "A-GEN-71",
    "name": "方べきの定理",
    "category": "数学A",
    "subcategory": "図形の性質",
    "description": "数学Aの学習項目: 方べきの定理",
    "prerequisites": [
      "A-GEN-70"
    ],
    "importance": "standard",
    "keywords": [
      "方べきの定理"
    ]
  },
  {
    "id": "A-GEN-72",
    "name": "２つの円の位置関係と共通接線",
    "category": "数学A",
    "subcategory": "図形の性質",
    "description": "数学Aの学習項目: ２つの円の位置関係と共通接線",
    "prerequisites": [
      "A-GEN-71"
    ],
    "importance": "standard",
    "keywords": [
      "２つの円の位置関係と共通接線"
    ]
  },
  {
    "id": "A-GEN-73",
    "name": "共通接線の長さ",
    "category": "数学A",
    "subcategory": "図形の性質",
    "description": "数学Aの学習項目: 共通接線の長さ",
    "prerequisites": [
      "A-GEN-72"
    ],
    "importance": "standard",
    "keywords": [
      "共通接線の長さ"
    ]
  },
  {
    "id": "A-GEN-74",
    "name": "作図の基本",
    "category": "数学A",
    "subcategory": "図形の性質",
    "description": "数学Aの学習項目: 作図の基本",
    "prerequisites": [
      "A-GEN-73"
    ],
    "importance": "standard",
    "keywords": [
      "作図の基本"
    ]
  },
  {
    "id": "A-GEN-75",
    "name": "内分点と外分点の作図",
    "category": "数学A",
    "subcategory": "図形の性質",
    "description": "数学Aの学習項目: 内分点と外分点の作図",
    "prerequisites": [
      "A-GEN-74"
    ],
    "importance": "standard",
    "keywords": [
      "内分点と外分点の作図"
    ]
  },
  {
    "id": "A-GEN-76",
    "name": "分数倍の作図",
    "category": "数学A",
    "subcategory": "図形の性質",
    "description": "数学Aの学習項目: 分数倍の作図",
    "prerequisites": [
      "A-GEN-75"
    ],
    "importance": "standard",
    "keywords": [
      "分数倍の作図"
    ]
  },
  {
    "id": "A-GEN-77",
    "name": "平方根の値の作図",
    "category": "数学A",
    "subcategory": "図形の性質",
    "description": "数学Aの学習項目: 平方根の値の作図",
    "prerequisites": [
      "A-GEN-76"
    ],
    "importance": "standard",
    "keywords": [
      "平方根の値の作図"
    ]
  },
  {
    "id": "A-GEN-78",
    "name": "空間図形の位置関係",
    "category": "数学A",
    "subcategory": "図形の性質",
    "description": "数学Aの学習項目: 空間図形の位置関係",
    "prerequisites": [
      "A-GEN-77"
    ],
    "importance": "standard",
    "keywords": [
      "空間図形の位置関係"
    ]
  },
  {
    "id": "A-GEO-02",
    "name": "【公式一覧】数学Ａ：図形の性質",
    "category": "数学A",
    "subcategory": "図形の性質",
    "description": "数学A「図形の性質」の学習項目: 【公式一覧】数学Ａ：図形の性質",
    "prerequisites": [
      "A-GEN-78"
    ],
    "importance": "standard",
    "keywords": [
      "公式一覧",
      "数学Ａ：図形の性質"
    ]
  },
  {
    "id": "II-GEN-01",
    "name": "３次式の展開（数学Ⅰ）",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: ３次式の展開（数学Ⅰ）",
    "prerequisites": [
      "I-GEN-102"
    ],
    "importance": "standard",
    "keywords": [
      "３次式の展開",
      "数学Ⅰ"
    ]
  },
  {
    "id": "II-GEN-02",
    "name": "３次式の因数分解（数学Ⅰ）",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: ３次式の因数分解（数学Ⅰ）",
    "prerequisites": [
      "II-GEN-01"
    ],
    "importance": "standard",
    "keywords": [
      "３次式の因数分解",
      "数学Ⅰ"
    ]
  },
  {
    "id": "II-GEN-03",
    "name": "６次式の因数分解",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: ６次式の因数分解",
    "prerequisites": [
      "II-GEN-02"
    ],
    "importance": "standard",
    "keywords": [
      "６次式の因数分解"
    ]
  },
  {
    "id": "II-GEN-04",
    "name": "二項定理",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 二項定理",
    "prerequisites": [
      "II-GEN-03"
    ],
    "importance": "standard",
    "keywords": [
      "二項定理"
    ]
  },
  {
    "id": "II-GEN-05",
    "name": "多項定理",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 多項定理",
    "prerequisites": [
      "II-GEN-04"
    ],
    "importance": "standard",
    "keywords": [
      "多項定理"
    ]
  },
  {
    "id": "II-GEN-06",
    "name": "二項定理の利用",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 二項定理の利用",
    "prerequisites": [
      "II-GEN-05"
    ],
    "importance": "standard",
    "keywords": [
      "二項定理の利用"
    ]
  },
  {
    "id": "II-GEN-07",
    "name": "整式の割り算",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 整式の割り算",
    "prerequisites": [
      "II-GEN-06"
    ],
    "importance": "standard",
    "keywords": [
      "整式の割り算"
    ]
  },
  {
    "id": "II-GEN-08",
    "name": "分数式の計算",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 分数式の計算",
    "prerequisites": [
      "II-GEN-07"
    ],
    "importance": "standard",
    "keywords": [
      "分数式の計算"
    ]
  },
  {
    "id": "II-GEN-09",
    "name": "通分を用いる分数式の計算",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 通分を用いる分数式の計算",
    "prerequisites": [
      "II-GEN-08"
    ],
    "importance": "standard",
    "keywords": [
      "通分を用いる分数式の計算"
    ]
  },
  {
    "id": "II-GEN-10",
    "name": "分母や分子に分数式を含む式",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 分母や分子に分数式を含む式",
    "prerequisites": [
      "II-GEN-09"
    ],
    "importance": "standard",
    "keywords": [
      "分母や分子に分数式を含む式"
    ]
  },
  {
    "id": "II-GEN-11",
    "name": "恒等式",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 恒等式",
    "prerequisites": [
      "II-GEN-10"
    ],
    "importance": "standard",
    "keywords": [
      "恒等式"
    ]
  },
  {
    "id": "II-GEN-12",
    "name": "等式の証明",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 等式の証明",
    "prerequisites": [
      "II-GEN-11"
    ],
    "importance": "standard",
    "keywords": [
      "等式の証明"
    ]
  },
  {
    "id": "II-GEN-13",
    "name": "条件付き等式の証明",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 条件付き等式の証明",
    "prerequisites": [
      "II-GEN-12"
    ],
    "importance": "standard",
    "keywords": [
      "条件付き等式の証明"
    ]
  },
  {
    "id": "II-GEN-14",
    "name": "比例式と等式の証明",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 比例式と等式の証明",
    "prerequisites": [
      "II-GEN-13"
    ],
    "importance": "standard",
    "keywords": [
      "比例式と等式の証明"
    ]
  },
  {
    "id": "II-GEN-15",
    "name": "不等式の証明",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 不等式の証明①（条件付き）",
    "prerequisites": [
      "II-GEN-14"
    ],
    "importance": "standard",
    "keywords": [
      "不等式の証明①",
      "条件付き"
    ]
  },
  {
    "id": "II-GEN-18",
    "name": "不等式の証明④（絶対値）",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 不等式の証明④（絶対値）",
    "prerequisites": [
      "II-GEN-17"
    ],
    "importance": "standard",
    "keywords": [
      "不等式の証明④",
      "絶対値"
    ]
  },
  {
    "id": "II-GEN-19",
    "name": "相加平均と相乗平均",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 相加平均と相乗平均",
    "prerequisites": [
      "II-GEN-18"
    ],
    "importance": "standard",
    "keywords": [
      "相加平均と相乗平均"
    ]
  },
  {
    "id": "II-GEN-20",
    "name": "複素数の相等",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 複素数の相等",
    "prerequisites": [
      "II-GEN-19"
    ],
    "importance": "standard",
    "keywords": [
      "複素数の相等"
    ]
  },
  {
    "id": "II-GEN-21",
    "name": "複素数の計算",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 複素数の計算",
    "prerequisites": [
      "II-GEN-20"
    ],
    "importance": "standard",
    "keywords": [
      "複素数の計算"
    ]
  },
  {
    "id": "II-GEN-22",
    "name": "共役な複素数と式の値",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 共役な複素数と式の値",
    "prerequisites": [
      "II-GEN-21"
    ],
    "importance": "standard",
    "keywords": [
      "共役な複素数と式の値"
    ]
  },
  {
    "id": "II-GEN-23",
    "name": "分数と複素数",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 分数と複素数",
    "prerequisites": [
      "II-GEN-22"
    ],
    "importance": "standard",
    "keywords": [
      "分数と複素数"
    ]
  },
  {
    "id": "II-GEN-24",
    "name": "負の数の平方根",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 負の数の平方根",
    "prerequisites": [
      "II-GEN-23"
    ],
    "importance": "standard",
    "keywords": [
      "負の数の平方根"
    ]
  },
  {
    "id": "II-GEN-25",
    "name": "２次方程式の虚数解",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: ２次方程式の虚数解",
    "prerequisites": [
      "II-GEN-24"
    ],
    "importance": "standard",
    "keywords": [
      "２次方程式の虚数解"
    ]
  },
  {
    "id": "II-GEN-26",
    "name": "複素数範囲での２次方程式の解の条件",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 複素数範囲での２次方程式の解の条件",
    "prerequisites": [
      "II-GEN-25"
    ],
    "importance": "standard",
    "keywords": [
      "複素数範囲での２次方程式の解の条件"
    ]
  },
  {
    "id": "II-GEN-27",
    "name": "２次方程式の解と係数の関係",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: ２次方程式の解と係数の関係",
    "prerequisites": [
      "II-GEN-26"
    ],
    "importance": "standard",
    "keywords": [
      "２次方程式の解と係数の関係"
    ]
  },
  {
    "id": "II-GEN-28",
    "name": "２つの解の条件と解と係数の関係",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: ２つの解の条件と解と係数の関係",
    "prerequisites": [
      "II-GEN-27"
    ],
    "importance": "standard",
    "keywords": [
      "２つの解の条件と解と係数の関係"
    ]
  },
  {
    "id": "II-GEN-29",
    "name": "複素数範囲での因数分解",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 複素数範囲での因数分解",
    "prerequisites": [
      "II-GEN-28"
    ],
    "importance": "standard",
    "keywords": [
      "複素数範囲での因数分解"
    ]
  },
  {
    "id": "II-GEN-30",
    "name": "解が与えられた２次方程式",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 解が与えられた２次方程式",
    "prerequisites": [
      "II-GEN-29"
    ],
    "importance": "standard",
    "keywords": [
      "解が与えられた２次方程式"
    ]
  },
  {
    "id": "II-GEN-31",
    "name": "２次方程式の解の符号",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: ２次方程式の解の符号",
    "prerequisites": [
      "II-GEN-30"
    ],
    "importance": "standard",
    "keywords": [
      "２次方程式の解の符号"
    ]
  },
  {
    "id": "II-GEN-32",
    "name": "剰余の定理",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 剰余の定理",
    "prerequisites": [
      "II-GEN-31"
    ],
    "importance": "standard",
    "keywords": [
      "剰余の定理"
    ]
  },
  {
    "id": "II-GEN-33",
    "name": "剰余の定理と余りの決定",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 剰余の定理と余りの決定",
    "prerequisites": [
      "II-GEN-32"
    ],
    "importance": "standard",
    "keywords": [
      "剰余の定理と余りの決定"
    ]
  },
  {
    "id": "II-GEN-34",
    "name": "因数定理を用いる因数分解",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 因数定理を用いる因数分解",
    "prerequisites": [
      "II-GEN-33"
    ],
    "importance": "standard",
    "keywords": [
      "因数定理を用いる因数分解"
    ]
  },
  {
    "id": "II-GEN-35",
    "name": "高次方程式の解",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: 高次方程式の解①（３次方程式）",
    "prerequisites": [
      "II-GEN-34"
    ],
    "importance": "standard",
    "keywords": [
      "高次方程式の解①",
      "３次方程式"
    ]
  },
  {
    "id": "II-GEN-37",
    "name": "３次方程式の虚数解",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: ３次方程式の虚数解",
    "prerequisites": [
      "II-GEN-36"
    ],
    "importance": "standard",
    "keywords": [
      "３次方程式の虚数解"
    ]
  },
  {
    "id": "II-GEN-38",
    "name": "１の３乗根",
    "category": "数学II",
    "subcategory": "いろいろな式",
    "description": "数学IIの学習項目: １の３乗根",
    "prerequisites": [
      "II-GEN-37"
    ],
    "importance": "standard",
    "keywords": [
      "１の３乗根"
    ]
  },
  {
    "id": "II-GEN-39",
    "name": "直線上の線分の長さ・内分点・外分点",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 直線上の線分の長さ・内分点・外分点",
    "prerequisites": [
      "II-GEN-38"
    ],
    "importance": "standard",
    "keywords": [
      "直線上の線分の長さ・内分点・外分点"
    ]
  },
  {
    "id": "II-GEN-40",
    "name": "平面上の線分の長さ",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 平面上の線分の長さ",
    "prerequisites": [
      "II-GEN-39"
    ],
    "importance": "standard",
    "keywords": [
      "平面上の線分の長さ"
    ]
  },
  {
    "id": "II-GEN-41",
    "name": "平面上の三角形の形状",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 平面上の三角形の形状",
    "prerequisites": [
      "II-GEN-40"
    ],
    "importance": "standard",
    "keywords": [
      "平面上の三角形の形状"
    ]
  },
  {
    "id": "II-GEN-42",
    "name": "線分の長さの条件",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 線分の長さの条件",
    "prerequisites": [
      "II-GEN-41"
    ],
    "importance": "standard",
    "keywords": [
      "線分の長さの条件"
    ]
  },
  {
    "id": "II-GEN-43",
    "name": "平面上の内分点・外分点・重心",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 平面上の内分点・外分点・重心",
    "prerequisites": [
      "II-GEN-42"
    ],
    "importance": "standard",
    "keywords": [
      "平面上の内分点・外分点・重心"
    ]
  },
  {
    "id": "II-GEN-44",
    "name": "点に対して対称な点",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 点に対して対称な点",
    "prerequisites": [
      "II-GEN-43"
    ],
    "importance": "standard",
    "keywords": [
      "点に対して対称な点"
    ]
  },
  {
    "id": "II-GEN-45",
    "name": "平行四辺形を作る点の座標",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 平行四辺形を作る点の座標",
    "prerequisites": [
      "II-GEN-44"
    ],
    "importance": "standard",
    "keywords": [
      "平行四辺形を作る点の座標"
    ]
  },
  {
    "id": "II-GEN-46",
    "name": "座標を利用した等式の証明",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 座標を利用した等式の証明",
    "prerequisites": [
      "II-GEN-45"
    ],
    "importance": "standard",
    "keywords": [
      "座標を利用した等式の証明"
    ]
  },
  {
    "id": "II-GEN-47",
    "name": "直線の方程式",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 直線の方程式",
    "prerequisites": [
      "II-GEN-46"
    ],
    "importance": "standard",
    "keywords": [
      "直線の方程式"
    ]
  },
  {
    "id": "II-GEN-48",
    "name": "２点を通る直線の方程式",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: ２点を通る直線の方程式",
    "prerequisites": [
      "II-GEN-47"
    ],
    "importance": "standard",
    "keywords": [
      "２点を通る直線の方程式"
    ]
  },
  {
    "id": "II-GEN-49",
    "name": "平行な直線と垂直な直線",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 平行な直線と垂直な直線",
    "prerequisites": [
      "II-GEN-48"
    ],
    "importance": "standard",
    "keywords": [
      "平行な直線と垂直な直線"
    ]
  },
  {
    "id": "II-GEN-50",
    "name": "直線に対して対称な点",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 直線に対して対称な点",
    "prerequisites": [
      "II-GEN-49"
    ],
    "importance": "standard",
    "keywords": [
      "直線に対して対称な点"
    ]
  },
  {
    "id": "II-GEN-51",
    "name": "垂直二等分線の方程式",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 垂直二等分線の方程式",
    "prerequisites": [
      "II-GEN-50"
    ],
    "importance": "standard",
    "keywords": [
      "垂直二等分線の方程式"
    ]
  },
  {
    "id": "II-GEN-52",
    "name": "３直線が１点で交わる",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: ３直線が１点で交わる",
    "prerequisites": [
      "II-GEN-51"
    ],
    "importance": "standard",
    "keywords": [
      "３直線が１点で交わる"
    ]
  },
  {
    "id": "II-GEN-53",
    "name": "２直線の交点を通る直線",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: ２直線の交点を通る直線",
    "prerequisites": [
      "II-GEN-52"
    ],
    "importance": "standard",
    "keywords": [
      "２直線の交点を通る直線"
    ]
  },
  {
    "id": "II-GEN-54",
    "name": "点と直線との距離",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 点と直線との距離",
    "prerequisites": [
      "II-GEN-53"
    ],
    "importance": "standard",
    "keywords": [
      "点と直線との距離"
    ]
  },
  {
    "id": "II-GEN-55",
    "name": "定点を通る直線の方程式",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 定点を通る直線の方程式",
    "prerequisites": [
      "II-GEN-54"
    ],
    "importance": "standard",
    "keywords": [
      "定点を通る直線の方程式"
    ]
  },
  {
    "id": "II-GEN-56",
    "name": "円の方程式",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 円の方程式",
    "prerequisites": [
      "II-GEN-55"
    ],
    "importance": "standard",
    "keywords": [
      "円の方程式"
    ]
  },
  {
    "id": "II-GEN-57",
    "name": "円の方程式の決定",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 円の方程式の決定①（点の条件）",
    "prerequisites": [
      "II-GEN-56"
    ],
    "importance": "standard",
    "keywords": [
      "円の方程式の決定①",
      "点の条件"
    ]
  },
  {
    "id": "II-GEN-59",
    "name": "円の方程式を表す条件",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 円の方程式を表す条件",
    "prerequisites": [
      "II-GEN-58"
    ],
    "importance": "standard",
    "keywords": [
      "円の方程式を表す条件"
    ]
  },
  {
    "id": "II-GEN-60",
    "name": "円と直線との共有点",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 円と直線との共有点",
    "prerequisites": [
      "II-GEN-59"
    ],
    "importance": "standard",
    "keywords": [
      "円と直線との共有点"
    ]
  },
  {
    "id": "II-GEN-61",
    "name": "円と直線との位置関係",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 円と直線との位置関係",
    "prerequisites": [
      "II-GEN-60"
    ],
    "importance": "standard",
    "keywords": [
      "円と直線との位置関係"
    ]
  },
  {
    "id": "II-GEN-62",
    "name": "円によって切り取られる線分",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 円によって切り取られる線分",
    "prerequisites": [
      "II-GEN-61"
    ],
    "importance": "standard",
    "keywords": [
      "円によって切り取られる線分"
    ]
  },
  {
    "id": "II-GEN-63",
    "name": "円の接線の方程式",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 円の接線の方程式",
    "prerequisites": [
      "II-GEN-62"
    ],
    "importance": "standard",
    "keywords": [
      "円の接線の方程式"
    ]
  },
  {
    "id": "II-GEN-64",
    "name": "２つの円の位置関係",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: ２つの円の位置関係",
    "prerequisites": [
      "II-GEN-63"
    ],
    "importance": "standard",
    "keywords": [
      "２つの円の位置関係"
    ]
  },
  {
    "id": "II-GEN-65",
    "name": "２つの円の共有点の座標",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: ２つの円の共有点の座標",
    "prerequisites": [
      "II-GEN-64"
    ],
    "importance": "standard",
    "keywords": [
      "２つの円の共有点の座標"
    ]
  },
  {
    "id": "II-GEN-66",
    "name": "２つの円の交点を通る円・直線",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: ２つの円の交点を通る円・直線",
    "prerequisites": [
      "II-GEN-65"
    ],
    "importance": "standard",
    "keywords": [
      "２つの円の交点を通る円・直線"
    ]
  },
  {
    "id": "II-GEN-67",
    "name": "軌跡",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 軌跡①",
    "prerequisites": [
      "II-GEN-66"
    ],
    "importance": "standard",
    "keywords": [
      "軌跡①"
    ]
  },
  {
    "id": "II-GEN-69",
    "name": "不等式の表す領域",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 不等式の表す領域",
    "prerequisites": [
      "II-GEN-68"
    ],
    "importance": "standard",
    "keywords": [
      "不等式の表す領域"
    ]
  },
  {
    "id": "II-GEN-70",
    "name": "連立不等式の表す領域",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 連立不等式の表す領域①",
    "prerequisites": [
      "II-GEN-69"
    ],
    "importance": "standard",
    "keywords": [
      "連立不等式の表す領域①"
    ]
  },
  {
    "id": "II-GEN-72",
    "name": "線形計画法",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 線形計画法",
    "prerequisites": [
      "II-GEN-71"
    ],
    "importance": "standard",
    "keywords": [
      "線形計画法"
    ]
  },
  {
    "id": "II-GEN-73",
    "name": "領域を用いた証明",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: 領域を用いた証明",
    "prerequisites": [
      "II-GEN-72"
    ],
    "importance": "standard",
    "keywords": [
      "領域を用いた証明"
    ]
  },
  {
    "id": "II-GEN-74",
    "name": "動径と一般角",
    "category": "数学II",
    "subcategory": "三角関数",
    "description": "数学IIの学習項目: 動径と一般角",
    "prerequisites": [
      "II-GEN-73"
    ],
    "importance": "standard",
    "keywords": [
      "動径と一般角"
    ]
  },
  {
    "id": "II-GEN-75",
    "name": "弧度法と扇形",
    "category": "数学II",
    "subcategory": "三角関数",
    "description": "数学IIの学習項目: 弧度法と扇形",
    "prerequisites": [
      "II-GEN-74"
    ],
    "importance": "standard",
    "keywords": [
      "弧度法と扇形"
    ]
  },
  {
    "id": "II-GEN-76",
    "name": "三角関数の値（単位円）",
    "category": "数学II",
    "subcategory": "三角関数",
    "description": "数学IIの学習項目: 三角関数の値（単位円）",
    "prerequisites": [
      "II-GEN-75"
    ],
    "importance": "standard",
    "keywords": [
      "三角関数の値",
      "単位円"
    ]
  },
  {
    "id": "II-GEN-77",
    "name": "三角関数の相互関係の公式",
    "category": "数学II",
    "subcategory": "三角関数",
    "description": "数学IIの学習項目: 三角関数の相互関係の公式",
    "prerequisites": [
      "II-GEN-76"
    ],
    "importance": "standard",
    "keywords": [
      "三角関数の相互関係の公式"
    ]
  },
  {
    "id": "II-GEN-78",
    "name": "三角関数の式の値",
    "category": "数学II",
    "subcategory": "三角関数",
    "description": "数学IIの学習項目: 三角関数の式の値",
    "prerequisites": [
      "II-GEN-77"
    ],
    "importance": "standard",
    "keywords": [
      "三角関数の式の値"
    ]
  },
  {
    "id": "II-GEN-79",
    "name": "三角関数の等式の証明",
    "category": "数学II",
    "subcategory": "三角関数",
    "description": "数学IIの学習項目: 三角関数の等式の証明",
    "prerequisites": [
      "II-GEN-78"
    ],
    "importance": "standard",
    "keywords": [
      "三角関数の等式の証明"
    ]
  },
  {
    "id": "II-GEN-80",
    "name": "三角関数の性質",
    "category": "数学II",
    "subcategory": "三角関数",
    "description": "数学IIの学習項目: 三角関数の性質①",
    "prerequisites": [
      "II-GEN-79"
    ],
    "importance": "standard",
    "keywords": [
      "三角関数の性質①"
    ]
  },
  {
    "id": "II-GEN-82",
    "name": "三角関数のグラフ",
    "category": "数学II",
    "subcategory": "三角関数",
    "description": "数学IIの学習項目: 三角関数のグラフ①",
    "prerequisites": [
      "II-GEN-81"
    ],
    "importance": "standard",
    "keywords": [
      "三角関数のグラフ①"
    ]
  },
  {
    "id": "II-GEN-85",
    "name": "三角関数のグラフ④（平行移動）",
    "category": "数学II",
    "subcategory": "三角関数",
    "description": "数学IIの学習項目: 三角関数のグラフ④（平行移動）",
    "prerequisites": [
      "II-GEN-84"
    ],
    "importance": "standard",
    "keywords": [
      "三角関数のグラフ④",
      "平行移動"
    ]
  },
  {
    "id": "II-GEN-86",
    "name": "三角関数のグラフ⑤（式変形）",
    "category": "数学II",
    "subcategory": "三角関数",
    "description": "数学IIの学習項目: 三角関数のグラフ⑤（式変形）",
    "prerequisites": [
      "II-GEN-85"
    ],
    "importance": "standard",
    "keywords": [
      "三角関数のグラフ⑤",
      "式変形"
    ]
  },
  {
    "id": "II-GEN-87",
    "name": "三角関数を含む方程式",
    "category": "数学II",
    "subcategory": "三角関数",
    "description": "数学IIの学習項目: 三角関数を含む方程式①",
    "prerequisites": [
      "II-GEN-86"
    ],
    "importance": "standard",
    "keywords": [
      "三角関数を含む方程式①"
    ]
  },
  {
    "id": "II-GEN-89",
    "name": "三角関数を含む不等式",
    "category": "数学II",
    "subcategory": "三角関数",
    "description": "数学IIの学習項目: 三角関数を含む不等式①",
    "prerequisites": [
      "II-GEN-88"
    ],
    "importance": "standard",
    "keywords": [
      "三角関数を含む不等式①"
    ]
  },
  {
    "id": "II-GEN-91",
    "name": "三角関数を含む２次方程式",
    "category": "数学II",
    "subcategory": "三角関数",
    "description": "数学IIの学習項目: 三角関数を含む２次方程式",
    "prerequisites": [
      "II-GEN-90"
    ],
    "importance": "standard",
    "keywords": [
      "三角関数を含む２次方程式"
    ]
  },
  {
    "id": "II-GEN-92",
    "name": "三角関数を含む２次不等式",
    "category": "数学II",
    "subcategory": "三角関数",
    "description": "数学IIの学習項目: 三角関数を含む２次不等式",
    "prerequisites": [
      "II-GEN-91"
    ],
    "importance": "standard",
    "keywords": [
      "三角関数を含む２次不等式"
    ]
  },
  {
    "id": "II-GEN-93",
    "name": "三角関数を含む２次関数",
    "category": "数学II",
    "subcategory": "三角関数",
    "description": "数学IIの学習項目: 三角関数を含む２次関数",
    "prerequisites": [
      "II-GEN-92"
    ],
    "importance": "standard",
    "keywords": [
      "三角関数を含む２次関数"
    ]
  },
  {
    "id": "II-GEN-94",
    "name": "加法定理",
    "category": "数学II",
    "subcategory": "三角関数",
    "description": "数学IIの学習項目: 加法定理",
    "prerequisites": [
      "II-GEN-93"
    ],
    "importance": "standard",
    "keywords": [
      "加法定理"
    ]
  },
  {
    "id": "II-GEN-95",
    "name": "加法定理と式の値",
    "category": "数学II",
    "subcategory": "三角関数",
    "description": "数学IIの学習項目: 加法定理と式の値",
    "prerequisites": [
      "II-GEN-94"
    ],
    "importance": "standard",
    "keywords": [
      "加法定理と式の値"
    ]
  },
  {
    "id": "II-GEN-96",
    "name": "２直線のなす角",
    "category": "数学II",
    "subcategory": "図形と方程式",
    "description": "数学IIの学習項目: ２直線のなす角",
    "prerequisites": [
      "II-GEN-95"
    ],
    "importance": "standard",
    "keywords": [
      "２直線のなす角"
    ]
  },
  {
    "id": "II-GEN-97",
    "name": "２倍角の公式",
    "category": "数学II",
    "subcategory": "三角関数",
    "description": "数学IIの学習項目: ２倍角の公式",
    "prerequisites": [
      "II-GEN-96"
    ],
    "importance": "standard",
    "keywords": [
      "２倍角の公式"
    ]
  },
  {
    "id": "II-GEN-98",
    "name": "半角の公式",
    "category": "数学II",
    "subcategory": "三角関数",
    "description": "数学IIの学習項目: 半角の公式",
    "prerequisites": [
      "II-GEN-97"
    ],
    "importance": "standard",
    "keywords": [
      "半角の公式"
    ]
  },
  {
    "id": "II-GEN-99",
    "name": "２倍角を含む方程式・不等式",
    "category": "数学II",
    "subcategory": "三角関数",
    "description": "数学IIの学習項目: ２倍角を含む方程式・不等式",
    "prerequisites": [
      "II-GEN-98"
    ],
    "importance": "standard",
    "keywords": [
      "２倍角を含む方程式・不等式"
    ]
  },
  {
    "id": "II-GEN-100",
    "name": "三角関数の合成",
    "category": "数学II",
    "subcategory": "三角関数",
    "description": "数学IIの学習項目: 三角関数の合成",
    "prerequisites": [
      "II-GEN-99"
    ],
    "importance": "standard",
    "keywords": [
      "三角関数の合成"
    ]
  },
  {
    "id": "II-GEN-101",
    "name": "合成を用いる方程式と不等式",
    "category": "数学II",
    "subcategory": "三角関数",
    "description": "数学IIの学習項目: 合成を用いる方程式と不等式",
    "prerequisites": [
      "II-GEN-100"
    ],
    "importance": "standard",
    "keywords": [
      "合成を用いる方程式と不等式"
    ]
  },
  {
    "id": "II-GEN-102",
    "name": "三角関数の最大値・最小値",
    "category": "数学II",
    "subcategory": "三角関数",
    "description": "数学IIの学習項目: 三角関数の最大値・最小値",
    "prerequisites": [
      "II-GEN-101"
    ],
    "importance": "standard",
    "keywords": [
      "三角関数の最大値・最小値"
    ]
  },
  {
    "id": "II-GEN-103",
    "name": "指数法則の基本",
    "category": "数学II",
    "subcategory": "指数関数・対数関数",
    "description": "数学IIの学習項目: 指数法則の基本",
    "prerequisites": [
      "II-GEN-102"
    ],
    "importance": "standard",
    "keywords": [
      "指数法則の基本"
    ]
  },
  {
    "id": "II-GEN-104",
    "name": "累乗根",
    "category": "数学II",
    "subcategory": "指数関数・対数関数",
    "description": "数学IIの学習項目: 累乗根",
    "prerequisites": [
      "II-GEN-103"
    ],
    "importance": "standard",
    "keywords": [
      "累乗根"
    ]
  },
  {
    "id": "II-GEN-105",
    "name": "指数法則の拡張",
    "category": "数学II",
    "subcategory": "指数関数・対数関数",
    "description": "数学IIの学習項目: 指数法則の拡張",
    "prerequisites": [
      "II-GEN-104"
    ],
    "importance": "standard",
    "keywords": [
      "指数法則の拡張"
    ]
  },
  {
    "id": "II-GEN-106",
    "name": "指数法則を用いた計算",
    "category": "数学II",
    "subcategory": "指数関数・対数関数",
    "description": "数学IIの学習項目: 指数法則を用いた計算",
    "prerequisites": [
      "II-GEN-105"
    ],
    "importance": "standard",
    "keywords": [
      "指数法則を用いた計算"
    ]
  },
  {
    "id": "II-GEN-107",
    "name": "指数関数のグラフ",
    "category": "数学II",
    "subcategory": "指数関数・対数関数",
    "description": "数学IIの学習項目: 指数関数のグラフ",
    "prerequisites": [
      "II-GEN-106"
    ],
    "importance": "standard",
    "keywords": [
      "指数関数のグラフ"
    ]
  },
  {
    "id": "II-GEN-108",
    "name": "指数の大小比較",
    "category": "数学II",
    "subcategory": "指数関数・対数関数",
    "description": "数学IIの学習項目: 指数の大小比較",
    "prerequisites": [
      "II-GEN-107"
    ],
    "importance": "standard",
    "keywords": [
      "指数の大小比較"
    ]
  },
  {
    "id": "II-GEN-109",
    "name": "指数方程式",
    "category": "数学II",
    "subcategory": "指数関数・対数関数",
    "description": "数学IIの学習項目: 指数方程式",
    "prerequisites": [
      "II-GEN-108"
    ],
    "importance": "standard",
    "keywords": [
      "指数方程式"
    ]
  },
  {
    "id": "II-GEN-110",
    "name": "指数不等式",
    "category": "数学II",
    "subcategory": "指数関数・対数関数",
    "description": "数学IIの学習項目: 指数不等式",
    "prerequisites": [
      "II-GEN-109"
    ],
    "importance": "standard",
    "keywords": [
      "指数不等式"
    ]
  },
  {
    "id": "II-GEN-111",
    "name": "指数関数を含む２次方程式",
    "category": "数学II",
    "subcategory": "指数関数・対数関数",
    "description": "数学IIの学習項目: 指数関数を含む２次方程式",
    "prerequisites": [
      "II-GEN-110"
    ],
    "importance": "standard",
    "keywords": [
      "指数関数を含む２次方程式"
    ]
  },
  {
    "id": "II-GEN-112",
    "name": "指数関数を含む２次不等式",
    "category": "数学II",
    "subcategory": "指数関数・対数関数",
    "description": "数学IIの学習項目: 指数関数を含む２次不等式",
    "prerequisites": [
      "II-GEN-111"
    ],
    "importance": "standard",
    "keywords": [
      "指数関数を含む２次不等式"
    ]
  },
  {
    "id": "II-GEN-113",
    "name": "指数関数の最大値・最小値",
    "category": "数学II",
    "subcategory": "指数関数・対数関数",
    "description": "数学IIの学習項目: 指数関数の最大値・最小値",
    "prerequisites": [
      "II-GEN-112"
    ],
    "importance": "standard",
    "keywords": [
      "指数関数の最大値・最小値"
    ]
  },
  {
    "id": "II-GEN-114",
    "name": "指数と対数",
    "category": "数学II",
    "subcategory": "指数関数・対数関数",
    "description": "数学IIの学習項目: 指数と対数",
    "prerequisites": [
      "II-GEN-113"
    ],
    "importance": "standard",
    "keywords": [
      "指数と対数"
    ]
  },
  {
    "id": "II-GEN-115",
    "name": "対数の値",
    "category": "数学II",
    "subcategory": "指数関数・対数関数",
    "description": "数学IIの学習項目: 対数の値",
    "prerequisites": [
      "II-GEN-114"
    ],
    "importance": "standard",
    "keywords": [
      "対数の値"
    ]
  },
  {
    "id": "II-GEN-116",
    "name": "対数の計算",
    "category": "数学II",
    "subcategory": "指数関数・対数関数",
    "description": "数学IIの学習項目: 対数の計算",
    "prerequisites": [
      "II-GEN-115"
    ],
    "importance": "standard",
    "keywords": [
      "対数の計算"
    ]
  },
  {
    "id": "II-GEN-117",
    "name": "底の変換公式",
    "category": "数学II",
    "subcategory": "指数関数・対数関数",
    "description": "数学IIの学習項目: 底の変換公式",
    "prerequisites": [
      "II-GEN-116"
    ],
    "importance": "standard",
    "keywords": [
      "底の変換公式"
    ]
  },
  {
    "id": "II-GEN-118",
    "name": "対数関数の式の値",
    "category": "数学II",
    "subcategory": "指数関数・対数関数",
    "description": "数学IIの学習項目: 対数関数の式の値",
    "prerequisites": [
      "II-GEN-117"
    ],
    "importance": "standard",
    "keywords": [
      "対数関数の式の値"
    ]
  },
  {
    "id": "II-GEN-119",
    "name": "対数関数のグラフ",
    "category": "数学II",
    "subcategory": "指数関数・対数関数",
    "description": "数学IIの学習項目: 対数関数のグラフ",
    "prerequisites": [
      "II-GEN-118"
    ],
    "importance": "standard",
    "keywords": [
      "対数関数のグラフ"
    ]
  },
  {
    "id": "II-GEN-120",
    "name": "指数関数と対数関数のグラフの位置関係",
    "category": "数学II",
    "subcategory": "指数関数・対数関数",
    "description": "数学IIの学習項目: 指数関数と対数関数のグラフの位置関係",
    "prerequisites": [
      "II-GEN-119"
    ],
    "importance": "standard",
    "keywords": [
      "指数関数と対数関数のグラフの位置関係"
    ]
  },
  {
    "id": "II-GEN-121",
    "name": "対数の大小比較",
    "category": "数学II",
    "subcategory": "指数関数・対数関数",
    "description": "数学IIの学習項目: 対数の大小比較",
    "prerequisites": [
      "II-GEN-120"
    ],
    "importance": "standard",
    "keywords": [
      "対数の大小比較"
    ]
  },
  {
    "id": "II-GEN-122",
    "name": "対数方程式",
    "category": "数学II",
    "subcategory": "指数関数・対数関数",
    "description": "数学IIの学習項目: 対数方程式",
    "prerequisites": [
      "II-GEN-121"
    ],
    "importance": "standard",
    "keywords": [
      "対数方程式"
    ]
  },
  {
    "id": "II-GEN-123",
    "name": "対数不等式",
    "category": "数学II",
    "subcategory": "指数関数・対数関数",
    "description": "数学IIの学習項目: 対数不等式",
    "prerequisites": [
      "II-GEN-122"
    ],
    "importance": "standard",
    "keywords": [
      "対数不等式"
    ]
  },
  {
    "id": "II-GEN-124",
    "name": "対数を含む２次式",
    "category": "数学II",
    "subcategory": "指数関数・対数関数",
    "description": "数学IIの学習項目: 対数を含む２次式",
    "prerequisites": [
      "II-GEN-123"
    ],
    "importance": "standard",
    "keywords": [
      "対数を含む２次式"
    ]
  },
  {
    "id": "II-GEN-125",
    "name": "対数含む関数の最大値・最小値",
    "category": "数学II",
    "subcategory": "指数関数・対数関数",
    "description": "数学IIの学習項目: 対数含む関数の最大値・最小値",
    "prerequisites": [
      "II-GEN-124"
    ],
    "importance": "standard",
    "keywords": [
      "対数含む関数の最大値・最小値"
    ]
  },
  {
    "id": "II-GEN-126",
    "name": "常用対数（桁数問題・小数第何位）",
    "category": "数学II",
    "subcategory": "指数関数・対数関数",
    "description": "数学IIの学習項目: 常用対数（桁数問題・小数第何位）",
    "prerequisites": [
      "II-GEN-125"
    ],
    "importance": "standard",
    "keywords": [
      "常用対数",
      "桁数問題・小数第何位"
    ]
  },
  {
    "id": "II-GEN-127",
    "name": "平均変化率",
    "category": "数学II",
    "subcategory": "微分・積分の考え",
    "description": "数学IIの学習項目: 平均変化率",
    "prerequisites": [
      "II-GEN-126"
    ],
    "importance": "standard",
    "keywords": [
      "平均変化率"
    ]
  },
  {
    "id": "II-GEN-128",
    "name": "極限値",
    "category": "数学II",
    "subcategory": "微分・積分の考え",
    "description": "数学IIの学習項目: 極限値",
    "prerequisites": [
      "II-GEN-127"
    ],
    "importance": "standard",
    "keywords": [
      "極限値"
    ]
  },
  {
    "id": "II-GEN-129",
    "name": "微分係数",
    "category": "数学II",
    "subcategory": "微分・積分の考え",
    "description": "数学IIの学習項目: 微分係数",
    "prerequisites": [
      "II-GEN-128"
    ],
    "importance": "standard",
    "keywords": [
      "微分係数"
    ]
  },
  {
    "id": "II-GEN-130",
    "name": "導関数",
    "category": "数学II",
    "subcategory": "微分・積分の考え",
    "description": "数学IIの学習項目: 導関数",
    "prerequisites": [
      "II-GEN-129"
    ],
    "importance": "standard",
    "keywords": [
      "導関数"
    ]
  },
  {
    "id": "II-GEN-131",
    "name": "微分の計算",
    "category": "数学II",
    "subcategory": "微分・積分の考え",
    "description": "数学IIの学習項目: 微分の計算",
    "prerequisites": [
      "II-GEN-130"
    ],
    "importance": "standard",
    "keywords": [
      "微分の計算"
    ]
  },
  {
    "id": "II-GEN-132",
    "name": "２次関数の決定（微分係数の利用）",
    "category": "数学II",
    "subcategory": "微分・積分の考え",
    "description": "数学IIの学習項目: ２次関数の決定（微分係数の利用）",
    "prerequisites": [
      "II-GEN-131"
    ],
    "importance": "standard",
    "keywords": [
      "２次関数の決定",
      "微分係数の利用"
    ]
  },
  {
    "id": "II-GEN-133",
    "name": "接線の方程式",
    "category": "数学II",
    "subcategory": "微分・積分の考え",
    "description": "数学IIの学習項目: 接線の方程式①",
    "prerequisites": [
      "II-GEN-132"
    ],
    "importance": "standard",
    "keywords": [
      "接線の方程式①"
    ]
  },
  {
    "id": "II-GEN-135",
    "name": "３次関数のグラフと増減表",
    "category": "数学II",
    "subcategory": "微分・積分の考え",
    "description": "数学IIの学習項目: ３次関数のグラフと増減表",
    "prerequisites": [
      "II-GEN-134"
    ],
    "importance": "standard",
    "keywords": [
      "３次関数のグラフと増減表"
    ]
  },
  {
    "id": "II-GEN-136",
    "name": "３次関数の最大値・最小値",
    "category": "数学II",
    "subcategory": "微分・積分の考え",
    "description": "数学IIの学習項目: ３次関数の最大値・最小値",
    "prerequisites": [
      "II-GEN-135"
    ],
    "importance": "standard",
    "keywords": [
      "３次関数の最大値・最小値"
    ]
  },
  {
    "id": "II-GEN-137",
    "name": "極値の条件と関数の決定",
    "category": "数学II",
    "subcategory": "微分・積分の考え",
    "description": "数学IIの学習項目: 極値の条件と関数の決定",
    "prerequisites": [
      "II-GEN-136"
    ],
    "importance": "standard",
    "keywords": [
      "極値の条件と関数の決定"
    ]
  },
  {
    "id": "II-GEN-138",
    "name": "３次方程式の解の個数",
    "category": "数学II",
    "subcategory": "微分・積分の考え",
    "description": "数学IIの学習項目: ３次方程式の解の個数①",
    "prerequisites": [
      "II-GEN-137"
    ],
    "importance": "standard",
    "keywords": [
      "３次方程式の解の個数①"
    ]
  },
  {
    "id": "II-GEN-140",
    "name": "３次不等式の証明",
    "category": "数学II",
    "subcategory": "微分・積分の考え",
    "description": "数学IIの学習項目: ３次不等式の証明",
    "prerequisites": [
      "II-GEN-139"
    ],
    "importance": "standard",
    "keywords": [
      "３次不等式の証明"
    ]
  },
  {
    "id": "II-GEN-141",
    "name": "４次関数のグラフと増減表",
    "category": "数学II",
    "subcategory": "微分・積分の考え",
    "description": "数学IIの学習項目: ４次関数のグラフと増減表",
    "prerequisites": [
      "II-GEN-140"
    ],
    "importance": "standard",
    "keywords": [
      "４次関数のグラフと増減表"
    ]
  },
  {
    "id": "II-GEN-142",
    "name": "不定積分",
    "category": "数学II",
    "subcategory": "微分・積分の考え",
    "description": "数学IIの学習項目: 不定積分",
    "prerequisites": [
      "II-GEN-141"
    ],
    "importance": "standard",
    "keywords": [
      "不定積分"
    ]
  },
  {
    "id": "II-GEN-143",
    "name": "不定積分と関数の決定",
    "category": "数学II",
    "subcategory": "微分・積分の考え",
    "description": "数学IIの学習項目: 不定積分と関数の決定",
    "prerequisites": [
      "II-GEN-142"
    ],
    "importance": "standard",
    "keywords": [
      "不定積分と関数の決定"
    ]
  },
  {
    "id": "II-GEN-144",
    "name": "接線の傾きの条件と関数の決定",
    "category": "数学II",
    "subcategory": "微分・積分の考え",
    "description": "数学IIの学習項目: 接線の傾きの条件と関数の決定",
    "prerequisites": [
      "II-GEN-143"
    ],
    "importance": "standard",
    "keywords": [
      "接線の傾きの条件と関数の決定"
    ]
  },
  {
    "id": "II-GEN-145",
    "name": "定積分の計算",
    "category": "数学II",
    "subcategory": "微分・積分の考え",
    "description": "数学IIの学習項目: 定積分の計算",
    "prerequisites": [
      "II-GEN-144"
    ],
    "importance": "standard",
    "keywords": [
      "定積分の計算"
    ]
  },
  {
    "id": "II-GEN-146",
    "name": "定積分を含む式",
    "category": "数学II",
    "subcategory": "微分・積分の考え",
    "description": "数学IIの学習項目: 定積分を含む式",
    "prerequisites": [
      "II-GEN-145"
    ],
    "importance": "standard",
    "keywords": [
      "定積分を含む式"
    ]
  },
  {
    "id": "II-GEN-147",
    "name": "定積分で表された関数",
    "category": "数学II",
    "subcategory": "微分・積分の考え",
    "description": "数学IIの学習項目: 定積分で表された関数",
    "prerequisites": [
      "II-GEN-146"
    ],
    "importance": "standard",
    "keywords": [
      "定積分で表された関数"
    ]
  },
  {
    "id": "II-GEN-148",
    "name": "定積分と面積",
    "category": "数学II",
    "subcategory": "微分・積分の考え",
    "description": "数学IIの学習項目: 定積分と面積①（x軸と囲まれた面積）",
    "prerequisites": [
      "II-GEN-147"
    ],
    "importance": "standard",
    "keywords": [
      "定積分と面積①",
      "x軸と囲まれた面積"
    ]
  },
  {
    "id": "II-GEN-151",
    "name": "絶対値を含む関数の定積分",
    "category": "数学II",
    "subcategory": "微分・積分の考え",
    "description": "数学IIの学習項目: 絶対値を含む関数の定積分",
    "prerequisites": [
      "II-GEN-150"
    ],
    "importance": "standard",
    "keywords": [
      "絶対値を含む関数の定積分"
    ]
  },
  {
    "id": "B-GEN-01",
    "name": "数列の基本と一般項",
    "category": "数学B",
    "subcategory": "数列",
    "description": "数学Bの学習項目: 数列の基本と一般項",
    "prerequisites": [
      "I-GEN-102"
    ],
    "importance": "standard",
    "keywords": [
      "数列の基本と一般項"
    ]
  },
  {
    "id": "B-GEN-02",
    "name": "等差数列",
    "category": "数学B",
    "subcategory": "数列",
    "description": "数学Bの学習項目: 等差数列",
    "prerequisites": [
      "B-GEN-01"
    ],
    "importance": "standard",
    "keywords": [
      "等差数列"
    ]
  },
  {
    "id": "B-GEN-03",
    "name": "等差数列の性質",
    "category": "数学B",
    "subcategory": "数列",
    "description": "数学Bの学習項目: 等差数列の性質",
    "prerequisites": [
      "B-GEN-02"
    ],
    "importance": "standard",
    "keywords": [
      "等差数列の性質"
    ]
  },
  {
    "id": "B-GEN-04",
    "name": "等差数列の和",
    "category": "数学B",
    "subcategory": "数列",
    "description": "数学Bの学習項目: 等差数列の和",
    "prerequisites": [
      "B-GEN-03"
    ],
    "importance": "standard",
    "keywords": [
      "等差数列の和"
    ]
  },
  {
    "id": "B-GEN-05",
    "name": "等差数列の和の最大値",
    "category": "数学B",
    "subcategory": "数列",
    "description": "数学Bの学習項目: 等差数列の和の最大値",
    "prerequisites": [
      "B-GEN-04"
    ],
    "importance": "standard",
    "keywords": [
      "等差数列の和の最大値"
    ]
  },
  {
    "id": "B-GEN-06",
    "name": "自然数の数列",
    "category": "数学B",
    "subcategory": "数列",
    "description": "数学Bの学習項目: 自然数の数列",
    "prerequisites": [
      "B-GEN-05"
    ],
    "importance": "standard",
    "keywords": [
      "自然数の数列"
    ]
  },
  {
    "id": "B-GEN-07",
    "name": "等比数列",
    "category": "数学B",
    "subcategory": "数列",
    "description": "数学Bの学習項目: 等比数列",
    "prerequisites": [
      "B-GEN-06"
    ],
    "importance": "standard",
    "keywords": [
      "等比数列"
    ]
  },
  {
    "id": "B-GEN-08",
    "name": "等比数列になる条件",
    "category": "数学B",
    "subcategory": "数列",
    "description": "数学Bの学習項目: 等比数列になる条件",
    "prerequisites": [
      "B-GEN-07"
    ],
    "importance": "standard",
    "keywords": [
      "等比数列になる条件"
    ]
  },
  {
    "id": "B-GEN-09",
    "name": "等比数列の和",
    "category": "数学B",
    "subcategory": "数列",
    "description": "数学Bの学習項目: 等比数列の和",
    "prerequisites": [
      "B-GEN-08"
    ],
    "importance": "standard",
    "keywords": [
      "等比数列の和"
    ]
  },
  {
    "id": "B-GEN-10",
    "name": "和が与えれた等比数列",
    "category": "数学B",
    "subcategory": "数列",
    "description": "数学Bの学習項目: 和が与えれた等比数列",
    "prerequisites": [
      "B-GEN-09"
    ],
    "importance": "standard",
    "keywords": [
      "和が与えれた等比数列"
    ]
  },
  {
    "id": "B-GEN-11",
    "name": "和の記号シグマと累乗の和",
    "category": "数学B",
    "subcategory": "数列",
    "description": "数学Bの学習項目: 和の記号シグマと累乗の和",
    "prerequisites": [
      "B-GEN-10"
    ],
    "importance": "standard",
    "keywords": [
      "和の記号シグマと累乗の和"
    ]
  },
  {
    "id": "B-GEN-12",
    "name": "シグマ記号の計算",
    "category": "数学B",
    "subcategory": "数列",
    "description": "数学Bの学習項目: シグマ記号の計算",
    "prerequisites": [
      "B-GEN-11"
    ],
    "importance": "standard",
    "keywords": [
      "シグマ記号の計算"
    ]
  },
  {
    "id": "B-GEN-13",
    "name": "分数数列の和",
    "category": "数学B",
    "subcategory": "数列",
    "description": "数学Bの学習項目: 分数数列の和",
    "prerequisites": [
      "B-GEN-12"
    ],
    "importance": "standard",
    "keywords": [
      "分数数列の和"
    ]
  },
  {
    "id": "B-GEN-14",
    "name": "等差数列×等比数列の和",
    "category": "数学B",
    "subcategory": "数列",
    "description": "数学Bの学習項目: 等差数列×等比数列の和",
    "prerequisites": [
      "B-GEN-13"
    ],
    "importance": "standard",
    "keywords": [
      "等差数列×等比数列の和"
    ]
  },
  {
    "id": "B-GEN-15",
    "name": "一般項が数列の和になる数列",
    "category": "数学B",
    "subcategory": "数列",
    "description": "数学Bの学習項目: 一般項が数列の和になる数列",
    "prerequisites": [
      "B-GEN-14"
    ],
    "importance": "standard",
    "keywords": [
      "一般項が数列の和になる数列"
    ]
  },
  {
    "id": "B-GEN-16",
    "name": "数列の和と一般項の関係",
    "category": "数学B",
    "subcategory": "数列",
    "description": "数学Bの学習項目: 数列の和と一般項の関係",
    "prerequisites": [
      "B-GEN-15"
    ],
    "importance": "standard",
    "keywords": [
      "数列の和と一般項の関係"
    ]
  },
  {
    "id": "B-GEN-17",
    "name": "階差数列",
    "category": "数学B",
    "subcategory": "数列",
    "description": "数学Bの学習項目: 階差数列",
    "prerequisites": [
      "B-GEN-16"
    ],
    "importance": "standard",
    "keywords": [
      "階差数列"
    ]
  },
  {
    "id": "B-GEN-18",
    "name": "群数列",
    "category": "数学B",
    "subcategory": "数列",
    "description": "数学Bの学習項目: 群数列",
    "prerequisites": [
      "B-GEN-17"
    ],
    "importance": "standard",
    "keywords": [
      "群数列"
    ]
  },
  {
    "id": "B-GEN-19",
    "name": "漸化式",
    "category": "数学B",
    "subcategory": "数列",
    "description": "数学Bの学習項目: 漸化式①（基本解法）",
    "prerequisites": [
      "B-GEN-18"
    ],
    "importance": "standard",
    "keywords": [
      "漸化式①",
      "基本解法"
    ]
  },
  {
    "id": "B-GEN-21",
    "name": "図形と漸化式",
    "category": "数学B",
    "subcategory": "数列",
    "description": "数学Bの学習項目: 図形と漸化式",
    "prerequisites": [
      "B-GEN-20"
    ],
    "importance": "standard",
    "keywords": [
      "図形と漸化式"
    ]
  },
  {
    "id": "B-GEN-22",
    "name": "数学的帰納法",
    "category": "数学B",
    "subcategory": "数列",
    "description": "数学Bの学習項目: 数学的帰納法①（等式）",
    "prerequisites": [
      "B-GEN-21"
    ],
    "importance": "standard",
    "keywords": [
      "数学的帰納法①",
      "等式"
    ]
  },
  {
    "id": "B-GEN-25",
    "name": "数学的帰納法④（漸化式）",
    "category": "数学B",
    "subcategory": "数列",
    "description": "数学Bの学習項目: 数学的帰納法④（漸化式）",
    "prerequisites": [
      "B-GEN-24"
    ],
    "importance": "standard",
    "keywords": [
      "数学的帰納法④",
      "漸化式"
    ]
  },
  {
    "id": "B-GEN-26",
    "name": "ベクトルの基本",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: ベクトルの基本",
    "prerequisites": [
      "B-GEN-25"
    ],
    "importance": "standard",
    "keywords": [
      "ベクトルの基本"
    ]
  },
  {
    "id": "B-GEN-27",
    "name": "ベクトルの実数倍・加法・減法",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: ベクトルの実数倍・加法・減法",
    "prerequisites": [
      "B-GEN-26"
    ],
    "importance": "standard",
    "keywords": [
      "ベクトルの実数倍・加法・減法"
    ]
  },
  {
    "id": "B-GEN-28",
    "name": "ベクトルの等式証明",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: ベクトルの等式証明",
    "prerequisites": [
      "B-GEN-27"
    ],
    "importance": "standard",
    "keywords": [
      "ベクトルの等式証明"
    ]
  },
  {
    "id": "B-GEN-29",
    "name": "ベクトルの演算",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: ベクトルの演算",
    "prerequisites": [
      "B-GEN-28"
    ],
    "importance": "standard",
    "keywords": [
      "ベクトルの演算"
    ]
  },
  {
    "id": "B-GEN-30",
    "name": "ベクトルの分解（正六角形のベクトル）",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: ベクトルの分解（正六角形のベクトル）",
    "prerequisites": [
      "B-GEN-29"
    ],
    "importance": "standard",
    "keywords": [
      "ベクトルの分解",
      "正六角形のベクトル"
    ]
  },
  {
    "id": "B-GEN-31",
    "name": "ベクトルの成分と大きさ",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: ベクトルの成分と大きさ",
    "prerequisites": [
      "B-GEN-30"
    ],
    "importance": "standard",
    "keywords": [
      "ベクトルの成分と大きさ"
    ]
  },
  {
    "id": "B-GEN-32",
    "name": "ベクトルの成分と式変形",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: ベクトルの成分と式変形",
    "prerequisites": [
      "B-GEN-31"
    ],
    "importance": "standard",
    "keywords": [
      "ベクトルの成分と式変形"
    ]
  },
  {
    "id": "B-GEN-33",
    "name": "ベクトルの成分と平行条件",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: ベクトルの成分と平行条件",
    "prerequisites": [
      "B-GEN-32"
    ],
    "importance": "standard",
    "keywords": [
      "ベクトルの成分と平行条件"
    ]
  },
  {
    "id": "B-GEN-34",
    "name": "点の座標とベクトルの成分",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: 点の座標とベクトルの成分",
    "prerequisites": [
      "B-GEN-33"
    ],
    "importance": "standard",
    "keywords": [
      "点の座標とベクトルの成分"
    ]
  },
  {
    "id": "B-GEN-35",
    "name": "平行四辺形とベクトル",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: 平行四辺形とベクトル",
    "prerequisites": [
      "B-GEN-34"
    ],
    "importance": "standard",
    "keywords": [
      "平行四辺形とベクトル"
    ]
  },
  {
    "id": "B-GEN-36",
    "name": "ベクトルの内積",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: ベクトルの内積①（基本）",
    "prerequisites": [
      "B-GEN-35"
    ],
    "importance": "standard",
    "keywords": [
      "ベクトルの内積①",
      "基本"
    ]
  },
  {
    "id": "B-GEN-38",
    "name": "ベクトルのなす角",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: ベクトルのなす角",
    "prerequisites": [
      "B-GEN-37"
    ],
    "importance": "standard",
    "keywords": [
      "ベクトルのなす角"
    ]
  },
  {
    "id": "B-GEN-39",
    "name": "ベクトルの垂直条件",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: ベクトルの垂直条件",
    "prerequisites": [
      "B-GEN-38"
    ],
    "importance": "standard",
    "keywords": [
      "ベクトルの垂直条件"
    ]
  },
  {
    "id": "B-GEN-40",
    "name": "内積を用いた等式証明",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: 内積を用いた等式証明",
    "prerequisites": [
      "B-GEN-39"
    ],
    "importance": "standard",
    "keywords": [
      "内積を用いた等式証明"
    ]
  },
  {
    "id": "B-GEN-41",
    "name": "内積の性質の利用（ベクトルの大きさと内積）",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: 内積の性質の利用（ベクトルの大きさと内積）",
    "prerequisites": [
      "B-GEN-40"
    ],
    "importance": "standard",
    "keywords": [
      "内積の性質の利用",
      "ベクトルの大きさと内積"
    ]
  },
  {
    "id": "B-GEN-42",
    "name": "内分点・外分点の位置ベクトル",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: 内分点・外分点の位置ベクトル",
    "prerequisites": [
      "B-GEN-41"
    ],
    "importance": "standard",
    "keywords": [
      "内分点・外分点の位置ベクトル"
    ]
  },
  {
    "id": "B-GEN-43",
    "name": "重心の位置ベクトル",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: 重心の位置ベクトル",
    "prerequisites": [
      "B-GEN-42"
    ],
    "importance": "standard",
    "keywords": [
      "重心の位置ベクトル"
    ]
  },
  {
    "id": "B-GEN-44",
    "name": "３点が同一直線上にある条件",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: ３点が同一直線上にある条件",
    "prerequisites": [
      "B-GEN-43"
    ],
    "importance": "standard",
    "keywords": [
      "３点が同一直線上にある条件"
    ]
  },
  {
    "id": "B-GEN-45",
    "name": "２直線の交点とベクトル",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: ２直線の交点とベクトル",
    "prerequisites": [
      "B-GEN-44"
    ],
    "importance": "standard",
    "keywords": [
      "２直線の交点とベクトル"
    ]
  },
  {
    "id": "B-GEN-46",
    "name": "ベクトルと三角形の面積",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: ベクトルと三角形の面積",
    "prerequisites": [
      "B-GEN-45"
    ],
    "importance": "standard",
    "keywords": [
      "ベクトルと三角形の面積"
    ]
  },
  {
    "id": "B-GEN-47",
    "name": "直線のベクトル方程式",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: 直線のベクトル方程式",
    "prerequisites": [
      "B-GEN-46"
    ],
    "importance": "standard",
    "keywords": [
      "直線のベクトル方程式"
    ]
  },
  {
    "id": "B-GEN-48",
    "name": "ベクトルと点の存在範囲",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: ベクトルと点の存在範囲",
    "prerequisites": [
      "B-GEN-47"
    ],
    "importance": "standard",
    "keywords": [
      "ベクトルと点の存在範囲"
    ]
  },
  {
    "id": "B-GEN-49",
    "name": "法線ベクトル",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: 法線ベクトル",
    "prerequisites": [
      "B-GEN-48"
    ],
    "importance": "standard",
    "keywords": [
      "法線ベクトル"
    ]
  },
  {
    "id": "B-GEN-50",
    "name": "円のベクトル方程式",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: 円のベクトル方程式",
    "prerequisites": [
      "B-GEN-49"
    ],
    "importance": "standard",
    "keywords": [
      "円のベクトル方程式"
    ]
  },
  {
    "id": "B-GEN-51",
    "name": "空間の点の座標",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: 空間の点の座標",
    "prerequisites": [
      "B-GEN-50"
    ],
    "importance": "standard",
    "keywords": [
      "空間の点の座標"
    ]
  },
  {
    "id": "B-GEN-52",
    "name": "空間ベクトルの基本と分解",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: 空間ベクトルの基本と分解",
    "prerequisites": [
      "B-GEN-51"
    ],
    "importance": "standard",
    "keywords": [
      "空間ベクトルの基本と分解"
    ]
  },
  {
    "id": "B-GEN-53",
    "name": "空間ベクトルの成分と大きさ",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: 空間ベクトルの成分と大きさ",
    "prerequisites": [
      "B-GEN-52"
    ],
    "importance": "standard",
    "keywords": [
      "空間ベクトルの成分と大きさ"
    ]
  },
  {
    "id": "B-GEN-54",
    "name": "空間ベクトルの成分と式変形",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: 空間ベクトルの成分と式変形",
    "prerequisites": [
      "B-GEN-53"
    ],
    "importance": "standard",
    "keywords": [
      "空間ベクトルの成分と式変形"
    ]
  },
  {
    "id": "B-GEN-55",
    "name": "空間の点とベクトルの成分",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: 空間の点とベクトルの成分",
    "prerequisites": [
      "B-GEN-54"
    ],
    "importance": "standard",
    "keywords": [
      "空間の点とベクトルの成分"
    ]
  },
  {
    "id": "B-GEN-56",
    "name": "空間ベクトルの内積",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: 空間ベクトルの内積①（基本）",
    "prerequisites": [
      "B-GEN-55"
    ],
    "importance": "standard",
    "keywords": [
      "空間ベクトルの内積①",
      "基本"
    ]
  },
  {
    "id": "B-GEN-58",
    "name": "空間ベクトルの垂直条件",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: 空間ベクトルの垂直条件",
    "prerequisites": [
      "B-GEN-57"
    ],
    "importance": "standard",
    "keywords": [
      "空間ベクトルの垂直条件"
    ]
  },
  {
    "id": "B-GEN-59",
    "name": "空間の位置ベクトル",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: 空間の位置ベクトル",
    "prerequisites": [
      "B-GEN-58"
    ],
    "importance": "standard",
    "keywords": [
      "空間の位置ベクトル"
    ]
  },
  {
    "id": "B-GEN-60",
    "name": "空間の３点が同一直線上にある条件",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: 空間の３点が同一直線上にある条件",
    "prerequisites": [
      "B-GEN-59"
    ],
    "importance": "standard",
    "keywords": [
      "空間の３点が同一直線上にある条件"
    ]
  },
  {
    "id": "B-GEN-61",
    "name": "空間の４点が同一平面上にある条件",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: 空間の４点が同一平面上にある条件",
    "prerequisites": [
      "B-GEN-60"
    ],
    "importance": "standard",
    "keywords": [
      "空間の４点が同一平面上にある条件"
    ]
  },
  {
    "id": "B-GEN-62",
    "name": "延長線が平面上にある条件",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: 延長線が平面上にある条件",
    "prerequisites": [
      "B-GEN-61"
    ],
    "importance": "standard",
    "keywords": [
      "延長線が平面上にある条件"
    ]
  },
  {
    "id": "B-GEN-63",
    "name": "空間ベクトルの内積と証明",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: 空間ベクトルの内積と証明",
    "prerequisites": [
      "B-GEN-62"
    ],
    "importance": "standard",
    "keywords": [
      "空間ベクトルの内積と証明"
    ]
  },
  {
    "id": "B-GEN-64",
    "name": "球面の方程式",
    "category": "数学B",
    "subcategory": "ベクトル",
    "description": "数学Bの学習項目: 球面の方程式",
    "prerequisites": [
      "B-GEN-63"
    ],
    "importance": "standard",
    "keywords": [
      "球面の方程式"
    ]
  },
  {
    "id": "C-CRV-01",
    "name": "２次曲線の極方程式",
    "category": "数学C",
    "subcategory": "２次曲線",
    "description": "数学C「２次曲線」の学習項目: ２次曲線の極方程式",
    "prerequisites": [
      "II-GEN-151"
    ],
    "importance": "standard",
    "keywords": [
      "２次曲線の極方程式"
    ]
  },
  {
    "id": "C-CPX-01",
    "name": "複素数平面上の三角形の形状",
    "category": "数学C",
    "subcategory": "複素数平面",
    "description": "数学C「複素数平面」の学習項目: 複素数平面上の三角形の形状",
    "prerequisites": [
      "II-GEN-151"
    ],
    "importance": "standard",
    "keywords": [
      "複素数平面上の三角形の形状"
    ]
  },
  {
    "id": "A-PROB-EXP",
    "name": "期待値",
    "category": "数学A",
    "subcategory": "場合の数と確率",
    "description": "確率変数の期待値の定義と計算、期待値の性質と応用",
    "prerequisites": [
      "F-PROB-01"
    ],
    "importance": "standard",
    "keywords": [
      "期待値",
      "確率変数",
      "平均値",
      "期待値の線形性"
    ]
  },
  {
    "id": "I-DATA-HYP",
    "name": "仮説検定の考え方",
    "category": "数学I",
    "subcategory": "データの分析",
    "description": "仮説検定の基本的な考え方、帰無仮説と対立仮説の設定",
    "prerequisites": [
      "F-PROB-01"
    ],
    "importance": "standard",
    "keywords": [
      "仮説検定",
      "帰無仮説",
      "対立仮説",
      "有意水準"
    ]
  },
  {
    "id": "B-STAT-CI",
    "name": "区間推定",
    "category": "数学B",
    "subcategory": "統計的な推測",
    "description": "母平均の区間推定、信頼区間の計算と解釈",
    "prerequisites": [
      "F-PROB-01"
    ],
    "importance": "standard",
    "keywords": [
      "区間推定",
      "信頼区間",
      "信頼度",
      "標本平均"
    ]
  },
  {
    "id": "B-STAT-HT",
    "name": "仮説検定の方法",
    "category": "数学B",
    "subcategory": "統計的な推測",
    "description": "母平均・母比率の仮説検定、検定統計量と棄却域",
    "prerequisites": [
      "B-STAT-CI"
    ],
    "importance": "standard",
    "keywords": [
      "仮説検定",
      "検定統計量",
      "棄却域",
      "p値",
      "第一種の過誤"
    ]
  },
  {
    "id": "C-CURVE-PARAM",
    "name": "媒介変数表示と曲線",
    "category": "数学C",
    "subcategory": "平面上の曲線と複素数平面",
    "description": "媒介変数による曲線の表示、サイクロイド・アステロイド等",
    "prerequisites": [],
    "importance": "standard",
    "keywords": [
      "媒介変数",
      "パラメータ",
      "サイクロイド",
      "アステロイド",
      "極座標"
    ]
  }
];

// ==========================================
// ヘルパー関数
// ==========================================

/**
 * スキルIDからスキル定義を取得
 */
export function getSkillById(id: string): SkillDefinition | undefined {
  return SKILL_DEFINITIONS.find(skill => skill.id === id);
}

/**
 * カテゴリでスキルをフィルタ
 */
export function getSkillsByCategory(category: SkillCategory): SkillDefinition[] {
  return SKILL_DEFINITIONS.filter(skill => skill.category === category);
}

/**
 * 前提スキルがないスキル（学習開始点）を取得
 */
export function getRootSkills(): SkillDefinition[] {
  return SKILL_DEFINITIONS.filter(skill => skill.prerequisites.length === 0);
}

/**
 * 指定スキルを前提とするスキル（後続スキル）を取得
 */
export function getSuccessorSkills(skillId: string): SkillDefinition[] {
  return SKILL_DEFINITIONS.filter(skill => 
    skill.prerequisites.includes(skillId)
  );
}

/**
 * スキルIDの検証（存在チェック）
 */
export function isValidSkillId(id: string): boolean {
  return SKILL_DEFINITIONS.some(skill => skill.id === id);
}
