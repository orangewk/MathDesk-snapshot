// ==========================================
// FILE: webapp/src/data/learning-topics.ts
// ==========================================
/**
 * 学習トピックデータ
 * 高校1年生程度までの数学トピック
 */

export interface LearningTopic {
  id: string;
  title: string;
  description: string;
  prompt: string; // AIに送る初期プロンプト
}

export interface TopicCategory {
  category: string;
  icon: string;
  topics: LearningTopic[];
}

export const learningTopics: TopicCategory[] = [
  {
    category: '基礎',
    icon: '📐',
    topics: [
      {
        id: 'positive-negative',
        title: '正負の数',
        description: 'プラスとマイナスの計算',
        prompt: '正負の数について学びたいです。基本から教えてください。'
      },
      {
        id: 'algebraic-expressions',
        title: '文字式',
        description: 'xやyを使った式',
        prompt: '文字式について学びたいです。xやyを使った計算を教えてください。'
      },
      {
        id: 'linear-equations',
        title: '1次方程式',
        description: 'x + 3 = 5 のような式を解く',
        prompt: '1次方程式の解き方を教えてください。'
      },
      {
        id: 'simultaneous-equations',
        title: '連立方程式',
        description: '2つの式を同時に解く',
        prompt: '連立方程式の解き方を学びたいです。'
      }
    ]
  },
  {
    category: '関数',
    icon: '📈',
    topics: [
      {
        id: 'proportional',
        title: '比例と反比例',
        description: 'y = ax, y = a/x',
        prompt: '比例と反比例について教えてください。'
      },
      {
        id: 'linear-function',
        title: '1次関数',
        description: 'y = ax + b のグラフ',
        prompt: '1次関数とそのグラフについて学びたいです。'
      },
      {
        id: 'quadratic-function',
        title: '2次関数',
        description: 'y = x² のグラフと最大・最小',
        prompt: '2次関数について教えてください。グラフの書き方も知りたいです。'
      }
    ]
  },
  {
    category: '図形',
    icon: '🔺',
    topics: [
      {
        id: 'plane-figures',
        title: '平面図形',
        description: '三角形、四角形、円の性質',
        prompt: '平面図形の性質について学びたいです。'
      },
      {
        id: 'triangle-properties',
        title: '三角形の性質',
        description: '合同・相似・三平方の定理',
        prompt: '三角形の性質について教えてください。特に三平方の定理を知りたいです。'
      },
      {
        id: 'circle-properties',
        title: '円の性質',
        description: '円周角・接線',
        prompt: '円の性質について学びたいです。円周角の定理を教えてください。'
      }
    ]
  },
  {
    category: '確率・統計',
    icon: '🎲',
    topics: [
      {
        id: 'probability',
        title: '確率',
        description: 'サイコロやコインの確率',
        prompt: '確率の基本について教えてください。'
      },
      {
        id: 'statistics',
        title: 'データの分析',
        description: '平均・中央値・最頻値',
        prompt: 'データの分析方法を学びたいです。平均や中央値について教えてください。'
      }
    ]
  },
  {
    category: '数と計算',
    icon: '🔢',
    topics: [
      {
        id: 'fractions',
        title: '分数',
        description: '分数の計算',
        prompt: '分数の計算が苦手です。基本から教えてください。'
      },
      {
        id: 'decimals',
        title: '小数',
        description: '小数の計算',
        prompt: '小数の計算について学びたいです。'
      },
      {
        id: 'percentage',
        title: '割合・パーセント',
        description: 'パーセントの計算',
        prompt: '割合とパーセントの計算を教えてください。'
      },
      {
        id: 'square-root',
        title: '平方根',
        description: '√の計算',
        prompt: '平方根（ルート）について学びたいです。'
      }
    ]
  }
];

/**
 * トピックIDからトピック情報を取得
 */
export function getTopicById(id: string): LearningTopic | undefined {
  for (const category of learningTopics) {
    const topic = category.topics.find(t => t.id === id);
    if (topic) return topic;
  }
  return undefined;
}