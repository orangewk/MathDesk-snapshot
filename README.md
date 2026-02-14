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

## このスナップショットについて

本リポジトリは、開発中のプライベートプロジェクトの公開スナップショットです。アーキテクチャと設計アプローチの公開を目的としており、以下の公開用修正を加えています。

### 公開用に省略したファイル（6件）

関数シグネチャ・型定義・エクスポートはそのまま残し、プロンプト本文や詳細データを省略しています。

| ファイル | 残っているもの | 省略したもの |
|---------|-------------|------------|
| `prompts/system-prompt.ts` | 役割定義・キャラクター特性 | 対話パターン詳細、色分けルール、マスタリー判定プロトコル |
| `prompts/few-shot-examples.ts` | スコアリング基準表・型定義 | PASS/FAIL/LEARNING_ONLY の会話例（全例） |
| `prompts/problem-generation.ts` | Level 1 の出題指示・関数シグネチャ | Level 2〜4 の出題指示、図生成プロンプト |
| `prompts/intervention-strategies.ts` | レベル名・説明（1行ずつ） | 各レベルのコーチング戦略・フレーズ例 |
| `prompts/technique-extraction.ts` | 型定義・パーサー・スキルID一覧生成 | 抽出プロンプト本文・Few-shot 例 |
| `data/backtrack-rules.ts` | 型定義・ヘルパー関数・サンプル3件 | 残り 27 件の遡りルール |

### その他

- **スタンドアロン動作は非対応**: 動作には GCP プロジェクト・Gemini API・Firebase のセットアップが必要です
- **設計ドキュメント**: 有用と思われる4件を公開。内部 Issue 番号・日付は除去済み
- **BGM ファイルは省略**: 容量のため BGM 音源（`webapp/public/bgm/`）は含まれていません。BGM プレイヤーの UI・コードはそのまま残っています

## ライセンス

[MIT](LICENSE)
