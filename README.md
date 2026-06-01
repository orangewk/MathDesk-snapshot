# MathDesk

数学が苦手な高校生のための AI チュータリングシステム。共通テスト（数学 I/A/II/B/C）対策。

> [English version](README.en.md)

## 概要

MathDesk は、答えを教えるのではなく **ソクラテス式の対話** で生徒を導く AI 家庭教師です。AI キャラクター「**津田マセマ先生**」がヒントを出し、質問を投げかけ、段階的に理解を積み上げます。

### 主な機能

- **適応型チュータリング** — 生徒の自立度（5段階）に応じて AI のコーチングスタイルを動的に切替
- **スキルツリー** — 高校数学全範囲 382 スキルの前提関係追跡とマスタリー進行
- **エラー遡り** — つまずきの根本原因を特定し、復習すべき前提スキルを提示
- **問題生成** — スキルごとに4段階の難易度で AI が練習問題を生成
- **図表示** — JSXGraph によるネタバレ防止付き数学図形
- **参考書連携** — 参考書の問題を撮影して AI に分析させる

## 技術スタック

- **フロントエンド**: React, TypeScript, Vite, TailwindCSS
- **バックエンド**: Node.js, Express, TypeScript
- **AI**: Google Gemini（Pro: 習得判定 / Flash: チュータリング）
- **データベース**: Firestore
- **認証**: Firebase Authentication
- **デプロイ**: Docker, Cloud Run

## セットアップ

### 前提条件

- Node.js v18+
- Gemini API が有効な Google Cloud プロジェクト
- Firebase プロジェクト（認証・データベース用）

### 起動

```bash
git clone https://github.com/orangewk/MathDesk-snapshot.git
cd MathDesk-snapshot

# 依存関係インストール
npm run install:all

# 環境変数を設定
cp prototype/.env.example prototype/.env
cp webapp/.env.example webapp/.env
# 両方の .env を自分の認証情報で編集

# 開発サーバー起動
npm run dev
```

フロントエンド: http://localhost:5173
バックエンド: http://localhost:8000

### Docker

```bash
docker compose up
```

http://localhost:8080 でアクセス

## アーキテクチャ

```
MathDesk-snapshot/
├── prototype/          # バックエンド (Express + Gemini API)
│   └── src/
│       ├── api/        # ルートハンドラ (SSE ストリーミング)
│       ├── data/       # スキル定義、遡りルール
│       ├── models/     # TypeScript 型定義
│       ├── prompts/    # AI プロンプトテンプレート
│       └── services/   # ビジネスロジック
├── webapp/             # フロントエンド (React + Vite)
│   └── src/
│       ├── components/ # React コンポーネント
│       ├── services/   # API クライアント
│       ├── hooks/      # カスタムフック
│       └── types/      # TypeScript 型定義
└── docs/               # 設計ドキュメント (抜粋)
```

## 設計ドキュメント

プライベートリポジトリには開発中に作成した 150 以上のドキュメント（設計書・調査・テスト・ナレッジベース）があります。以下の4つを設計プロセスのサンプルとして公開しています。

- [Firestore インデックス設計](docs/firestore-indexes.md) — 全 Firestore クエリの静的分析によるインデックスの宣言的管理
- [チャット応答速度改善](docs/chat-speed-improvement.md) — Flash / Pro Low / Pro High の3段モデル階層ルーティングと A/B テスト結果
- [コンテキストウィンドウ設計](docs/context-window-design.md) — システムプロンプトを 12K → 3.5K トークンに圧縮し、Turn 9 でのコンテキスト喪失を解消
- [デプロイアーキテクチャ](docs/external-deployment.md) — Firebase Hosting + Auth vs Cloud Run モノリスの比較検討

## Public OSS Edition

本リポジトリは、MathDesk の公開 OSS 版です。開発中のプライベートリポジトリから、安全に公開できるコード・設計ドキュメント・実行手順を切り出し、教育 AI チュータリングの実装例として継続的に保守します。

公開版の保守対象は以下です。

- ローカル開発環境と Docker 起動手順の維持
- React / TypeScript / Node.js によるチュータリング UI・API 実装
- スキルツリー、マスタリー判定、図表示、チャット応答設計の公開可能な範囲
- 公開ドキュメント、セットアップ手順、設計メモの改善
- Issue / Pull Request による再現報告、ドキュメント修正、移植性改善の受け入れ

フルデータセット、詳細プロンプト、運用中の評価ログは含みません。これは安全性・ライセンス・未公開研究資産を守るための境界であり、公開版のコードと設計ドキュメントは MIT ライセンスで利用できます。

関連する研究資料は [mathdesk-paper](https://github.com/orangewk/mathdesk-paper) で公開しています。

## 公開範囲と省略内容

以下のファイルは、公開可能な API 境界・型定義・サンプル構造を残しつつ、プロンプト本文や詳細データを省略しています。

### 省略したファイル（6件）

| ファイル | 残っているもの | 省略したもの |
|---------|-------------|------------|
| `prompts/system-prompt.ts` | 役割定義・キャラクター特性 | 対話パターン詳細、色分けルール、マスタリー判定プロトコル |
| `prompts/few-shot-examples.ts` | スコアリング基準表・型定義 | PASS/FAIL/LEARNING_ONLY の会話例（全例） |
| `prompts/problem-generation.ts` | Level 1 の出題指示・関数シグネチャ | Level 2〜4 の出題指示、図生成プロンプト |
| `prompts/intervention-strategies.ts` | レベル名・説明（1行ずつ） | 各レベルのコーチング戦略・フレーズ例 |
| `prompts/technique-extraction.ts` | 型定義・パーサー・スキルID一覧生成 | 抽出プロンプト本文・Few-shot 例 |
| `data/backtrack-rules.ts` | 型定義・ヘルパー関数・サンプル3件 | 残り 27 件の遡りルール |

### 現在の制限

- **クラウド依存あり**: 動作には GCP プロジェクト・Gemini API・Firebase のセットアップが必要です
- **設計ドキュメント**: 有用と思われる4件を公開。内部 Issue 番号・日付は除去済み
- **BGM ファイルは省略**: 容量のため BGM 音源（`webapp/public/bgm/`）は含まれていません。BGM プレイヤーの UI・コードはそのまま残っています

## Contributing

Issue と Pull Request を歓迎します。特に以下の貢献は公開版の保守範囲に入ります。

- セットアップ手順・Docker 起動・環境変数説明の改善
- Firebase / GCP / Gemini API 周辺の再現性改善
- TypeScript 型、テスト、lint、CI の整備
- 数学チュータリング UI、図表示、アクセシビリティの改善
- ドキュメント、設計メモ、英日翻訳の修正

未公開プロンプト、非公開データセット、商用利用前提の概念グラフ全体に関するリクエストは、個別相談扱いです。

## ライセンス

[MIT](LICENSE)
