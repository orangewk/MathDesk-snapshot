# 実装計画: チャット応答速度改善

> 雑談フィルタの応答速度改善
> 関連: OFF_TOPIC タグ実装、Gemini リダイレクト設計

## 問題の再定義

### Issue の表面的な問題
> 「天気はどう？」のような単純な雑談でも約19秒かかる

### 本質的な問題
**Gemini 3 Pro（thinkingLevel 未指定 = high）が全メッセージのデフォルトハンドラーになっている。**

現在のフロー:
```
ユーザーメッセージ
  → buildSystemPrompt()  // 巨大なシステムプロンプト構築
  → Gemini 3 Pro (high)  // thinking high: 全トークンの70%がthinking
  → タグ解析
  → レスポンス           // 15-20秒後
```

Pro High が本当に必要なのは「深い数学的推論・画像分析・マスタリー判定」だけなのに、以下すべてで Pro High を呼んでいる:

| メッセージ種別 | 必要なモデル | 現在の所要時間 |
|---|---|---|
| 雑談（OFF_TOPIC） | Flash | ~19秒 |
| 簡単な挨拶・相槌 | Flash | ~15秒 |
| 簡単な数学の概念説明 | Flash または Pro Low | ~15秒 |
| 標準的な数学チュータリング | Pro Low | ~15-20秒 |
| 参考書画像の分析 | **Pro High** | ~15-20秒 |
| 解答の検証・マスタリー判定 | **Pro High** | ~15-20秒 |
| 習得判定の6問試問 | **Pro High** | ~15-20秒 |

---

## 採用方針: Flash ゲートウェイ + 3段モデル階層

### 検討の経緯

| 案 | 概要 | 却下理由 |
|---|---|---|
| A: Flash 事前分類 | Flash を「分類器」として使い、ラベルを返す | 分類と応答を不自然に分離している |
| B: Flash + Pro function calling | Gemini function calling で Pro をツール化 | プロトコルの制約で API 3往復（+3-5秒） |
| C: ルールベース + Flash | サーバーサイドのルールで事前仕分け | ルール判定が本質ではない。Flash が直接判断すべき |
| **D: Flash ゲートウェイ + 3段階層** | **Flash が回答 or エスカレーション判断** | **採用** |

### 3段モデル階層

Gemini 3 Pro は `thinkingLevel` パラメータで thinking の深さを制御できる（完全無効化は不可）。
同一モデル + thinking レベル切替で Pro Low / Pro High を実現する。

> 参考: [Gemini thinking - Google AI for Developers](https://ai.google.dev/gemini-api/docs/thinking)
> - `thinkingLevel: "low"` — レイテンシとコストを最小化。シンプルな指示追従・チャット向き
> - `thinkingLevel: "high"`（デフォルト）— 推論深度を最大化。最初のトークンまで大幅に時間がかかる
> - Gemini 3 Pro は thinking を完全に無効化できない（`low` が最小）

| 階層 | モデル | thinkingLevel | 用途 | 推定レイテンシ |
|------|--------|:---:|------|------------|
| **Flash** | `gemini-3-flash-preview` | - | ゲートウェイ: 雑談弾き・挨拶・簡単な応答 | **~1-2秒** |
| **Pro Low** | `gemini-3-pro-preview` | **`low`** | 標準的な数学チュータリング | **~5-8秒** |
| **Pro High** | `gemini-3-pro-preview` | **`high`** | 深い推論・画像分析・マスタリー判定 | **~15-20秒** |

### 基本フロー（Phase 1）

```
assessmentMode?
  Yes → Pro High 直行（Flash スキップ）
  No  → Flash（軽量プロンプト + 会話履歴）
          Flash が回答できる      → そのまま返す
          [[NEEDS_PRO]] を返す    → Pro Low に回す
```

**Flash はゲートウェイ兼レスポンダー**。分類ラベルを返すのではなく、自分で回答できるなら回答し、できない場合だけエスカレーションタグを返す。

**Pro Low / Pro High の振り分けは Flash に任せない。** サーバーが `assessmentMode` を見て判定する。

---

## フロー詳細（mermaid シーケンス図）

### 現在のフロー（全メッセージ共通）

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant PH as Pro High

    C->>S: 「天気はどう？」
    S->>S: buildSystemPrompt()<br/>(巨大プロンプト構築)
    S->>PH: システムプロンプト + メッセージ
    Note over PH: thinking high... (5-10秒)<br/>生成... (5-10秒)
    PH-->>S: 「[[OFF_TOPIC]]面白い質問ですね...」
    S->>S: タグ解析 → offTopic: true
    S-->>C: レスポンス

    Note over C,PH: 合計: ~15-19秒（雑談でも数学でも同じ）
```

### 新フロー: Flash が回答する場合（雑談・挨拶）

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant F as Flash
    participant PL as Pro Low

    C->>S: 「天気はどう？」
    S->>S: assessmentMode? → No
    S->>F: 軽量プロンプト + 会話履歴
    Note over F: 数学じゃない→自分で回答 (~1秒)
    F-->>S: 「面白い質問ですね！ただ私は<br/>数学専門なので...」
    S-->>C: offTopic: true + Flash の回答

    Note over C,PL: 合計: ~1-2秒 ✅
    Note over C,PL: Pro 呼び出し: 0回
```

### 新フロー: Pro Low にエスカレーション（全ての数学メッセージ）

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant F as Flash
    participant PL as Pro Low
    participant PH as Pro High

    C->>S: 「因数分解のやり方を教えて」
    S->>F: 軽量プロンプト + 会話履歴
    Note over F: 数学→自分では回答しない (~1秒)
    F-->>S: "[[NEEDS_PRO]]"

    S->>S: assessmentMode? → No → Pro Low
    S->>S: buildSystemPrompt()
    S->>PL: フルプロンプト + メッセージ
    Note over PL: 生成 (~5-8秒)<br/>thinkingLevel: low
    PL-->>S: 応答 + タグ
    S->>S: タグ解析
    S-->>C: レスポンス

    Note over C,PH: 合計: ~6-9秒 ✅（現在の ~16秒 から大幅改善）
```

### 新フロー: Pro High（習得判定モード — Flash スキップ）

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant F as Flash
    participant PL as Pro Low
    participant PH as Pro High

    C->>S: 「準備できました」(assessmentMode=true)
    S->>S: assessmentMode → Pro High 直行
    S->>S: buildSystemPrompt()
    S->>PH: フルプロンプト + メッセージ
    Note over PH: thinking high + 生成<br/>(~15-18秒)
    PH-->>S: 応答 + タグ
    S->>S: タグ解析
    S-->>C: レスポンス

    Note over C,PH: 合計: ~15-18秒（Flash を経由しない分、現在と同等）
```

### フロー比較まとめ（Phase 1）

| シナリオ | 現在 | 新フロー | 改善 |
|---------|------|---------|------|
| 雑談「天気はどう？」 | Pro High = **~19秒** | Flash 直接回答 = **~1-2秒** | **-17秒** |
| 挨拶「ありがとう」 | Pro High = **~15秒** | Flash 直接回答 = **~1-2秒** | **-13秒** |
| 標準的な数学の質問 | Pro High = **~16秒** | Flash → Pro Low = **~6-9秒** | **-7〜10秒** |
| 画像付きの数学の質問 | Pro High = **~16秒** | Flash → Pro Low = **~6-9秒** | **-7〜10秒** |
| 解答チェック・スキルカード | Pro High = **~16秒** | Flash → Pro Low = **~6-9秒** | **-7〜10秒** |
| 習得判定（assessmentMode） | Pro High = **~16秒** | Pro High 直行 = **~15-18秒** | ±0 |

---

## ルーティング戦略

### 設計原則: 「難易度は内容で決まる。形式では決まらない」

当初、画像 → 常に Pro High、assessment → 常に Pro High のような **形式ベースのルール** を検討したが、
これは正しくない。画像であっても中1向けの簡単な問題なら深い推論は不要。
逆に、テキストだけでも証明問題なら深い推論が必要。

**Flash に「内容の難易度」を正確に判定させるのは本質的に難しい。**
Flash が難易度を正確に判定できるなら、そもそも Flash に解かせればいい。
Flash にできないから Pro に回すのに、その「できない」の境界線を Flash に判定させるのは矛盾している。

### 採用方針: 段階的アプローチ（Start Simple, Measure, Iterate）

完璧なルーティングを最初から設計するのではなく、**最小限のルーティングで始めて、データに基づいて改善する。**

#### Phase 1（MVP）: 2段ルーティング

Flash の判断を**「数学か否か」の1点に絞る**。
難易度判定（Low vs High）は Flash に任せず、**サーバーが確定できるもの以外は全て Pro Low をデフォルトにする。**

```
全メッセージ → Flash（軽量プロンプト + 会話履歴）
  数学に無関係        → Flash が直接回答（offTopic）
  挨拶・お礼          → Flash が直接回答
  数学関連            → Pro Low（デフォルト）

例外（サーバーが判定、Flash を経由しない）:
  assessmentMode=true → Pro High（直行）
```

**Flash に「Pro Low か Pro High か」の判断を求めない。** 数学関連は全て Pro Low に流す。

**assessmentMode だけがサーバーサイドで確定できる唯一の Pro High トリガー。**
6問試問は正確なスコアリング（ヒントの有無、部分点、合格判定）が必要で、
深い推論が確実に必要なケースだから。

| シナリオ | ルート | レイテンシ | 現在比 |
|---------|--------|-----------|-------|
| 雑談「天気はどう？」 | Flash 直接 | ~1-2秒 | **-17秒** |
| 挨拶「ありがとう」 | Flash 直接 | ~1-2秒 | **-13秒** |
| 標準数学「因数分解を教えて」 | Flash → Pro Low | ~6-9秒 | **-7〜10秒** |
| 解答提出「答えは x=5」 | Flash → Pro Low | ~6-9秒 | **-7〜10秒** |
| 画像「この問題を見て」 | Flash → Pro Low | ~6-9秒 | **-7〜10秒** |
| 習得判定モード | **Pro High（直行）** | ~15-20秒 | ±0 |

**Pro Low で品質は足りるのか？**
- Pro Low = Gemini 3 Pro + `thinkingLevel: low`。知識・能力は同一モデル。thinking が浅いだけ。
- 標準的なチュータリング（概念説明、簡単な問題のガイド、チェックリスト提示）は low で十分なはず。
- 解答チェック・画像分析も、中〜高レベルの問題なら low で対応可能と仮説を立てる。
- **仮説が外れたら Phase 2 で対処する。**

#### Phase 2（データ駆動）: Pro High ルーティングの追加

Phase 1 でログを収集し、**Pro Low の応答品質が不十分なパターン** を特定してから Pro High ルーティングを設計する。

収集するデータ:
- 各リクエストのルート（Flash直接 / Pro Low / Pro High）
- Pro Low の応答時間、`thoughtsTokenCount`
- ユーザーの follow-up パターン（「わかりました」vs「もう一度説明して」）← 品質の間接指標
- タグ出力の成否（CARD_MASTERY、PROBLEM_RESULT が正しく出力されたか）

品質問題が確認されたら、その時点で具体的なルーティング基準を設計する。
想定される追加トリガー候補:
- 特定の数学領域（証明、微積分の複雑な問題等）
- 会話中に Pro Low が不十分な応答をした場合のリトライ
- ユーザーのスキルレベルが高い場合（高度な問題を扱う可能性が高い）

**Phase 2 の設計は Phase 1 のデータが揃ってから行う。今は設計しない。**

### Flash の判断基準（Phase 1 版）

Phase 1 では Flash の判断は極めてシンプル: **「数学に関係するか否か」**

```
あなたは数学学習アプリのゲートウェイです。

## あなたの役割
ユーザーのメッセージを見て、数学の学習に関するものかどうかを判断します。

## 直接回答するケース
以下に該当する場合は、あなたが直接回答してください:
- 数学や学習に無関係な話題（天気、ゲーム、雑談、他教科の質問など）
  → やんわり断り、Geminiを案内する応答を返す
- 挨拶（「こんにちは」「はじめまして」）
  → 簡潔に挨拶し、数学の質問を促す
- 簡単なお礼・相槌（「ありがとう」「わかりました」「なるほど」）
  → 簡潔に応答し、次の質問を促す

## エスカレーションするケース
上記以外（数学に関するメッセージ）は、すべて [[NEEDS_PRO]] タグのみを返してください。
自分で数学の問題を解いたり、数学の概念を説明したりしないでください。

## 重要
- 数学の問題には一切回答しないこと
- エスカレーション時はタグのみ（余計なテキスト不要）
- 直接回答する場合は丁寧語で簡潔に
- 判断に迷ったらエスカレーション（タグを返す）
```

> **Note**: Phase 1 では `[[NEEDS_PRO_LOW]]` / `[[NEEDS_PRO_HIGH]]` の区別は不要。
> 単一の `[[NEEDS_PRO]]` タグのみ。サーバーが `assessmentMode` を見て Low/High を決定する。

### 判断例（Phase 1）

| メッセージ | 判断 | 理由 |
|-----------|------|------|
| 「天気はどう？」 | **Flash 直接回答**（offTopic） | 数学と無関係 |
| 「こんにちは」 | **Flash 直接回答**（挨拶） | 挨拶 |
| 「ありがとう」 | **Flash 直接回答**（相槌） | お礼 |
| 「因数分解を教えて」 | **`[[NEEDS_PRO]]`** → Pro Low | 数学 |
| 「この計算合ってる？ x=3」 | **`[[NEEDS_PRO]]`** → Pro Low | 数学（解答チェック） |
| 「解きました。答えは x=5 です」 | **`[[NEEDS_PRO]]`** → Pro Low | 数学（解答提出） |
| [画像] +「この問題を見て」 | **`[[NEEDS_PRO]]`** → Pro Low | 数学（画像含む） |
| assessmentMode=true のメッセージ | **Pro High（Flash 経由せず）** | サーバーが直接判定 |

---

## 実装計画

### Step 1: モデル階層の導入

**変更ファイル**: `prototype/src/api/google-genai.ts`

`sendMessage` にモデル階層（tier）の概念を導入:

```typescript
type ModelTier = 'flash' | 'pro_low' | 'pro_high';

// 各 tier のフォールバックチェーン
// Pro Low と Pro High は同一モデル、thinkingLevel で切替
const TIER_CHAINS: Record<ModelTier, GenAIConfig[]> = {
  flash: [
    { model: 'gemini-3-flash-preview', location: 'global' },
    { model: 'gemini-2.5-flash', location: 'asia-northeast1' },
  ],
  pro_low: [
    { model: 'gemini-3-pro-preview', location: 'global', thinkingLevel: 'low' },
    { model: 'gemini-2.5-pro', location: 'asia-northeast1' },  // fallback
  ],
  pro_high: [
    { model: 'gemini-3-pro-preview', location: 'global', thinkingLevel: 'high' },
    { model: 'gemini-2.5-pro', location: 'asia-northeast1' },  // fallback
  ],
};
```

- maxOutputTokens: **全 tier で `16384` に統一**（既存の統一基準に従う）
  - 全モデル（3-pro, 3-flash, 2.5-pro, 2.5-flash）の出力上限は 65,536
  - thinking model では maxOutputTokens に thinking トークンが含まれるため、低く設定すると空レスポンスになる
  - 16384 は上限キャップであり目標値ではない。実際の出力が短ければコストもその分だけ
  - 詳細: Gemini 3 maxOutputTokens 調査ドキュメント参照

### Step 2: Flash ゲートウェイサービス

**新規ファイル**: `prototype/src/services/flash-gateway.ts`

```typescript
type GatewayResult =
  | { type: 'direct'; content: string; offTopic?: boolean }
  | { type: 'escalate_pro' };

/**
 * Flash にメッセージを送り、直接回答 or エスカレーション判定を得る
 * Phase 1 では Pro Low / Pro High の区別は Flash に任せない
 */
async function processWithFlash(
  messages: ChatMessage[]
): Promise<GatewayResult>
```

- Flash 用の軽量システムプロンプトを使用（上記「Flash の判断基準」参照）
- 会話履歴を含めることで文脈を考慮した判断が可能
- Flash が `[[NEEDS_PRO]]` タグを返した → escalate_pro
- Flash がテキスト応答を返した → direct（offTopic or 挨拶）

### Step 3: `/api/chat` ルーティング統合

**変更ファイル**: `prototype/src/server.ts`

```typescript
// 1. assessmentMode → Pro High 直行（Flash をスキップ）
if (assessmentMode) {
  const response = await sendMessage({
    messages, system: systemPrompt, tier: 'pro_high',
  });
  // 既存のタグ解析 → レスポンス
  return;
}

// 2. それ以外 → Flash ゲートウェイ
const gatewayResult = await processWithFlash(messages);

switch (gatewayResult.type) {
  case 'direct':
    // Flash が直接回答 → そのまま返す
    return res.json({
      content: gatewayResult.content,
      model: 'gemini-3-flash-preview',
      offTopic: gatewayResult.offTopic,
    });

  case 'escalate_pro':
    // Pro Low に回す（Phase 1 では全数学 → Pro Low）
    const proResponse = await sendMessage({
      messages, system: systemPrompt, tier: 'pro_low',
    });
    // 既存のタグ解析 → レスポンス
    break;
}
```

**重要**: Pro Low パスは既存のタグ解析ロジック（CARD_MASTERY、PROBLEM_RESULT 等）をそのまま使用。

### Step 4: システムプロンプトの変更

**変更ファイル**: `prototype/src/prompts/system-prompt.ts`

- `[[OFF_TOPIC]]` タグの指示を**削除**（Flash ゲートウェイが担当するため）
- Pro 用のプロンプトはそのまま維持

### Step 5: ロギング・計測

各パスの応答時間をログに記録（Phase 2 のデータ収集を兼ねる）:
```
[GATEWAY] route=flash_direct reason=off_topic flash_ms=1100
[GATEWAY] route=flash_direct reason=greeting flash_ms=980
[GATEWAY] route=pro_low flash_ms=1050 pro_ms=6200 total_ms=7250
[GATEWAY] route=pro_high reason=assessment pro_ms=16500
```

Pro Low パスでは追加で記録:
- `thoughtsTokenCount`: thinking にどれだけ使ったか
- タグ出力の成否（CARD_MASTERY 等が正しく生成されたか）

### Step 6: テスト

| 入力 | 期待ルート | 期待時間 |
|------|-----------|---------|
| 「天気はどう？」 | Flash 直接回答 (offTopic) | ~1-2秒 |
| 「ありがとう」 | Flash 直接回答 | ~1-2秒 |
| 「因数分解を教えて」 | Flash → Pro Low | ~6-9秒 |
| 「この計算合ってる？ x=3」 | Flash → Pro Low | ~6-9秒 |
| [画像] +「この問題を見て」 | Flash → Pro Low | ~6-9秒 |
| assessmentMode=true | Pro High 直行 | ~15-18秒 |

---

## 変更ファイル一覧

| ファイル | 変更種別 | 内容 |
|---------|---------|------|
| `prototype/src/services/flash-gateway.ts` | **新規** | Flash ゲートウェイサービス |
| `prototype/src/server.ts` | **修正** | `/api/chat` にルーティング統合 |
| `prototype/src/api/google-genai.ts` | **修正** | ModelTier の導入、tier 別フォールバックチェーン、thinkingLevel 対応 |
| `prototype/src/api/gemini-fallback-strategy.ts` | **修正** | tier 別チェーン対応 |
| `prototype/src/prompts/system-prompt.ts` | **修正** | OFF_TOPIC 指示を削除 |

---

## リスク評価

| リスク | レベル | 対策 |
|--------|--------|------|
| Flash が数学の質問に直接回答してしまう | MEDIUM | Flash プロンプトで「数学の問題に自分で解答しないこと」を明示。迷ったらエスカレーション |
| Pro Low の品質が不十分（複雑な問題で浅い回答） | MEDIUM | Phase 1 では許容。ログで品質問題を検知し Phase 2 で Pro High ルーティングを追加 |
| Pro Low でタグ出力が不安定（CARD_MASTERY 等） | MEDIUM | thinkingLevel: low でもタグ出力の指示追従能力は十分なはず。テストで確認 |
| Flash 経由のレイテンシ追加（非assessment メッセージ +1秒） | LOW | 雑談・標準数学の大幅改善と比べてトレードオフとして許容。assessment は Flash スキップで影響なし |
| Flash が雑談を数学と誤判定（不要な Pro Low 呼び出し） | LOW | 性能影響のみ（遅くなるが壊れない）。逆方向（数学を雑談と誤判定）は危険 → Flash プロンプトで「迷ったらエスカレーション」を徹底 |

## 複雑度: 低〜中

- Flash の判断基準が「数学か否か」の1点に単純化されたため、Phase 1 のロジックはシンプル
- 既存の Pro パス（タグ解析等）は変更なし
- thinkingLevel の追加は API config への1フィールド追加

---

## 仮説検証テスト結果

> テストスクリプト: `scripts/test-model-tiers.ts`
> 問題プール 2,284問から L1×5 + L2×5 = 10問サンプル

### 仮説1: Flash の数学/非数学分類精度

**結果: 12/12 正解 (100%)**

| 入力 | 期待 | 結果 | 時間 |
|------|------|------|------|
| 天気はどう？ | direct | ✅ direct | 11s |
| 好きなゲームは？ | direct | ✅ direct | 10s |
| こんにちは | direct | ✅ direct | 9s |
| ありがとう | direct | ✅ direct | 9s |
| わかりました | direct | ✅ direct | 9s |
| 英語の勉強法を教えて | direct | ✅ direct | 10s |
| 因数分解のやり方を教えて | escalate | ✅ escalate | 9s |
| x^2+5x+6 を因数分解して | escalate | ✅ escalate | 9s |
| この計算合ってる？ 2x+3=7 だから x=2 | escalate | ✅ escalate | 10s |
| 二次方程式の解の公式って | escalate | ✅ escalate | 8s |
| 数学って将来役に立つの？ | escalate | ✅ escalate | 11s |
| テスト勉強のコツ教えて | escalate | ✅ escalate | 11s |

**結論**: Flash は「数学か否か」の判定を安定して行える。境界ケースもエスカレーション寄りに倒す。

### 仮説2&3: 正答率・速度比較

**結果: 全 tier 10/10 正解 (100%)**

| Tier | L1 正答 | L2 正答 | 平均レイテンシ | thinking トークン |
|------|---------|---------|-------------|----------------|
| **Flash** | 5/5 | 5/5 | **12,035ms** | 288〜6,593（変動大） |
| **Pro Low** | 5/5 | 5/5 | **13,592ms** | ~120（安定） |
| **Pro High** | 5/5 | 5/5 | **28,673ms** | 473〜2,644（変動大） |

**発見**:
- **Pro Low は Pro High の約半分のレイテンシで同じ正答率**
- Pro Low の thinking トークンは常に ~120 で安定（thinkingLevel: low の効果）
- **Flash も全問正解**（ただし L2 の難問で thinking 6,593 トークン消費 → 38秒かかるケースあり）
- Pro High は最大 74秒（thinking 2,644 トークン）かかるケースあり

### 仮説4: タグ出力

| テスト | Pro Low | Pro High |
|--------|---------|----------|
| PROBLEM_RESULT:correct | ✅ 正しく出力 | ✅ 正しく出力 |
| PROBLEM_RESULT:incorrect | ✅ 正しく出力 | ✅ 正しく出力 |
| CARD_MASTERY | ⚠️ PROBLEM_RESULT で代替出力 | ✅ 正しく出力 |

**CARD_MASTERY の注意点**: Pro Low はマスタリー判定の場面で `[[PROBLEM_RESULT:correct:card-factor-01]]` を返し、
期待される `[[CARD_MASTERY:card-factor-01:85]]` を出力しなかった。
ただしこのテストは**簡略化したシステムプロンプト**を使用しており、本番の詳細なプロンプトでは改善する可能性がある。

**Phase 1 への影響**: PROBLEM_RESULT は正しく出力できるため、通常の問題演習は Pro Low で問題なし。
CARD_MASTERY の出力安定性は本番プロンプトでの追加テストが必要。

---

## テスト結果に基づく判断

1. **Phase 1 の Pro Low デフォルト方針は妥当** — 正答率は Pro High と同等、レイテンシは半分
2. **Flash ゲートウェイの判定精度は十分** — 12/12 (100%)
3. **CARD_MASTERY タグ出力は要注意** — Phase 1 デプロイ後にモニタリング必須。問題があれば CARD_MASTERY 判定時のみ Pro High に切り替える対策を Phase 2 で検討

---

## 追加検証テスト結果（第2弾）

### 仮説5: Flash 直答コース — フルプロンプトでのチュータリング品質

> テストスクリプト: `scripts/test-flash-direct.ts`
> Flash に**本番相当のフルシステムプロンプト**を渡して、チュータリング品質・タグ出力を検証。

#### 5a: チュータリング品質

| テスト | Flash | Pro Low | Pro High |
|--------|:-----:|:-------:|:--------:|
| ヒントで導く（答えを直接教えない） | ✅ | ✅ | ✅ |
| LaTeX + 色分けルール | ✅ | ✅ | ✅ |
| OFF_TOPIC タグ出力 | ✅ | ✅ | ✅ |

**全 tier でチュータリング品質に差なし。** Flash も正しくヒントで導き、答えを教えず、LaTeX・色分け・丁寧語を使用。

#### 5b: タグ出力（フルプロンプト使用）

| テスト | Flash | Pro Low | Pro High |
|--------|:-----:|:-------:|:--------:|
| PROBLEM_RESULT:correct | ✅ | ❌ タグなし | ❌ タグなし |
| PROBLEM_RESULT:incorrect | ✅ | ❌ タグなし | ✅ |
| CARD_MASTERY | ✅ (90点) | ✅ (95点) | ✅ (95点) |

**驚きの結果: Flash がタグ出力で最も安定。** Pro Low はフルプロンプトで PROBLEM_RESULT タグを出力できなかった（2回とも失敗）。

#### 速度比較

| Tier | checks passed | 平均レイテンシ |
|------|:------------:|:-------------:|
| **Flash** | **9/9 (100%)** | **10.9秒** |
| Pro Low | 7/9 (78%) | 23.4秒 |
| Pro High | 8/9 (89%) | 23.1秒 |

### 仮説6: 共通テスト相当問題（≈L4）での正答率

> テストスクリプト: `scripts/test-common-exam.ts`
> `problem-bank/exams/` の共通テスト問題から5小問（計26空欄）をサンプルし、穴埋め正答率を比較。

#### 正答率

| Tier | 正答空欄 | 正答率 | 平均レイテンシ |
|------|:-------:|:------:|:------------:|
| **Flash** | **26/26** | **100%** | **15.6秒** |
| Pro Low | 26/26 | 100% | 20.2秒 |
| Pro High | 26/26 | 100% | **77.0秒** |

**全 tier が共通テスト問題を完答。** Flash と Pro で正答率に差なし。Pro High は平均77秒（Flash の5倍）。

#### 問題別詳細

| 問題 | テーマ | 空欄数 | Flash | Pro Low | Pro High |
|------|--------|:------:|:-----:|:-------:|:--------:|
| Year1 大問1 〔１〕 | 数と式 + 三角比 | 7 | 7/7 (17s) | 7/7 (17s) | 7/7 (130s) |
| Year1 大問2 〔1〕 | 二次関数 + データ | 7 | 7/7 (15s) | 7/7 (43s) | 7/7 (48s) |
| Year1 大問3 (1) | 場合の数・確率 | 6 | 6/6 (15s) | 6/6 (13s) | 6/6 (36s) |
| Year1 大問4 (1) | 整数の性質 | 2 | 2/2 (11s) | 2/2 (14s) | 2/2 (87s) |
| Year1 大問5 (1) | 図形の性質 | 4 | 4/4 (20s) | 4/4 (14s) | 4/4 (84s) |

---

## 全テスト結果のまとめと方針への影響

### テスト結果の総括

| 検証項目 | Flash | Pro Low | Pro High |
|---------|:-----:|:-------:|:--------:|
| L1 正答率 | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) |
| L2 正答率 | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) |
| 共通テスト正答率 (≈L4) | 26/26 (100%) | 26/26 (100%) | 26/26 (100%) |
| 数学/非数学 分類 | 12/12 (100%) | - | - |
| チュータリング品質 | ✅ | ✅ | ✅ |
| PROBLEM_RESULT タグ | ✅ (2/2) | ❌ (0/2) | △ (1/2) |
| CARD_MASTERY タグ | ✅ | ✅ | ✅ |
| OFF_TOPIC タグ | ✅ | ✅ | ✅ |
| 平均レイテンシ（数学） | ~12-16秒 | ~14-23秒 | ~23-77秒 |

### 方針への重大な影響

テスト結果は当初の「Flash = ゲートウェイのみ、数学は全て Pro Low」という方針に**大きな疑問を投げかける**。

**Flash が Pro Low・Pro High を全面的に上回っている:**
1. **正答率**: 全難度で同等（L1, L2, 共通テスト ≈L4 すべて100%）
2. **チュータリング品質**: 同等（ヒント誘導、丁寧語、LaTeX）
3. **タグ出力**: Flash が最良（9/9）、Pro Low が最悪（7/9）
4. **速度**: Flash が最速（Pro Low の半分、Pro High の1/5）

**Flash が Pro に劣る明確なケースがテストで一つも見つかっていない。**

### 確定方針: Flash 直答デフォルト ✅

> ユーザー承認済み

テスト結果を踏まえ、**Flash をチュータリングのデフォルトモデルにする。**

```
assessmentMode?
  Yes → Pro High 直行（6問試問のスコアリング精度を担保）
  No  → Flash（フルシステムプロンプト + 会話履歴）
          Flash が直接回答（数学含む）
          タグ出力も Flash が担当
```

**ゲートウェイ + エスカレーションの2段構成は不要。** Flash が全てのリアルタイム応答を担当。

#### 期待される効果

| シナリオ | 現在 (Pro High) | 新 (Flash) | 改善 |
|---------|:--------------:|:----------:|:----:|
| 雑談「天気はどう？」 | ~19秒 | ~1-2秒 | **-17秒** |
| 挨拶「ありがとう」 | ~15秒 | ~1-2秒 | **-13秒** |
| 数学チュータリング | ~16-20秒 | ~10-16秒 | **-4〜10秒** |
| 解答チェック・タグ出力 | ~16-20秒 | ~10-16秒 | **-4〜10秒** |
| 習得判定 (assessmentMode) | ~16-20秒 | ~16-20秒 | ±0 |

#### リスク・未検証事項（運用で確認）
- **マルチターン品質**: 5-10往復の長い対話での品質は未検証。実使用でモニタリング
- **画像分析**: 手書き画像でのFlash性能は未知。問題が出たら Pro へフォールバック検討
- **assessment 6問試問**: 当面 Pro High を維持。将来的に事前生成問題 + Flash 配信に移行の可能性あり

#### 将来の展望（#66 スコープ外）
- **作問の Pro Low / Flash 化**: 類題生成ワークフローなら Flash でも可能な可能性
- **Pro High リアルタイム完全撤廃**: assessment も事前生成 + Flash 配信に移行
- **Pro Low の位置づけ**: フォールバック専用。Flash で問題が出た場合の保険

---

## 確定版 実装計画

### Step 1: `google-genai.ts` — モデル切替対応

**変更ファイル**: `prototype/src/api/google-genai.ts`

`sendMessage` にモデル指定を追加。Flash / Pro High の切替を可能にする。

```typescript
// ChatRequest に tier を追加（or model 名を直接指定）
// Flash: gemini-3-flash-preview
// Pro High: gemini-3-pro-preview + thinkingLevel: high
// フォールバックチェーンも tier に応じて切替
```

- maxOutputTokens: **全モデルで `16384` に統一**（既存方針に従う）
- Pro High 使用時のみ `thinkingConfig: { thinkingLevel: 'HIGH' }` を付与

### Step 2: `server.ts` — ルーティング

**変更ファイル**: `prototype/src/server.ts`

```typescript
// assessmentMode → Pro High
// それ以外 → Flash（フルシステムプロンプトをそのまま渡す）
const model = assessmentMode
  ? 'gemini-3-pro-preview'   // Pro High
  : 'gemini-3-flash-preview'; // Flash
```

既存のシステムプロンプト構築・タグ解析ロジックは変更なし。モデルが変わるだけ。

### Step 3: ロギング

各リクエストのモデル・レイテンシをログ出力:
```
[CHAT] model=flash ms=11200 tokens_in=850 tokens_out=120
[CHAT] model=pro_high ms=18500 tokens_in=1200 tokens_out=300 assessment=true
```

### Step 4: 動作確認

ブラウザで手動テスト:
1. 雑談 → Flash で ~1-2秒で応答
2. 数学の質問 → Flash で ~10-16秒で応答、タグ正常
3. assessment モード → Pro High で応答
4. 画像付き質問 → Flash で応答（品質確認）

---

## 変更ファイル一覧（確定版）

| ファイル | 変更種別 | 内容 |
|---------|---------|------|
| `prototype/src/api/google-genai.ts` | **修正** | Flash/Pro High 切替、thinkingLevel 対応 |
| `prototype/src/server.ts` | **修正** | assessmentMode による分岐、モデル指定 |

**当初計画から大幅にシンプル化。** Flash ゲートウェイサービス（新規ファイル）は不要。
プロンプト変更も不要（Flash にフルプロンプトをそのまま渡す）。
