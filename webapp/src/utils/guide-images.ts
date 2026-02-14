/**
 * ガイド（津田マセマ先生）の表情画像をシチュエーション別に管理
 *
 * 同じシチュエーションで複数の表情をランダムに表示することで、
 * キャラクターに生き生きとした印象を与える。
 *
 * 画像を追加する場合:
 *   1. webapp/src/assets/images/guide-<name>.png に画像を配置
 *   2. 下の import に追加
 *   3. 該当する Scene の配列に追加
 */

import guideHappyImg from '../assets/images/guide-happy.png';
import guideSmileImg from '../assets/images/guide-smile.png';
import guideNervousImg from '../assets/images/guide-nervous.png';
import guideWorriedImg from '../assets/images/guide-worried.png';
import guideThinkingImg from '../assets/images/guide-thinking.png';
import guideTeacherImg from '../assets/images/guide-teacher.png';
import guidePonderImg from '../assets/images/guide-ponder.png';
import guideConfusedImg from '../assets/images/guide-confused.png';
import guideComposedImg from '../assets/images/guide-composed.png';
import guideGratefulImg from '../assets/images/guide-grateful.png';

/**
 * シチュエーション別の表情候補
 * 画像追加時はここに足すだけでOK
 */
export const guideImages = {
  /** ホーム画面 - 初回訪問 */
  homeFirstVisit: [guideHappyImg, guideComposedImg],
  /** ホーム画面 - 再訪問（おかえりなさい） */
  homeReturn: [guideSmileImg, guideHappyImg, guideComposedImg, guidePonderImg],
  /** 正解フィードバック */
  feedbackCorrect: [guideSmileImg, guideHappyImg, guideGratefulImg],
  /** 不正解フィードバック */
  feedbackIncorrect: [guideWorriedImg, guideNervousImg, guideConfusedImg],
  /** スキル習得おめでとう */
  masteryCelebration: [guideSmileImg, guideHappyImg, guideGratefulImg],
  /** AI思考中 */
  thinking: [guideThinkingImg, guidePonderImg],
  /** エラー・心配 */
  worried: [guideWorriedImg, guideConfusedImg],
  /** 初回の問題提出前 */
  nervous: [guideNervousImg],
  /** プロフィール・オンボーディング */
  teacher: [guideTeacherImg],
} as const;

export type GuideScene = keyof typeof guideImages;

/** 配列からランダムに1つ選ぶ */
function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * シチュエーションに応じたガイド画像をランダムに1つ返す
 */
export function pickGuideImage(scene: GuideScene): string {
  return pickRandom(guideImages[scene]);
}
