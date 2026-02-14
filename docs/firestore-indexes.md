# 計画: Firestore Composite Index の宣言的管理

> Firestore 移行後の 500 エラー対応

## 背景と問題

### 何が起きたか

SQLite → Firestore 移行で、**composite index の定義を完全に欠落**させた。
その結果、E2E テストで `advisor/daily` と `conversations` エンドポイントが 500 エラー（`FAILED_PRECONDITION`）を返した。

### 何が間違っていたか

インデックスをトライアンドエラー（動かす → エラーを見る → 1 つずつ作成）で対応していた。
これをユーザーがアンチパターンとして指摘した。本番環境では即座にダウンタイムを引き起こす。

### 正しいアプローチ

1. コードの全 Firestore クエリを**静的分析**し、必要なインデックスを洗い出す
2. `firestore.indexes.json` に**宣言的に**定義する
3. `firebase deploy --only firestore:indexes` または `gcloud` で**一括デプロイ**する
4. インデックスは**コードと一緒にバージョン管理**される

---

## 現状の棚卸し

### 既存インデックス（gcloud で手動作成済み、5 つ）

| ID | コレクション | フィールド | 状態 |
|----|-------------|-----------|------|
| CICAgJj7z4EJ | conversations | userId, updatedAt | **不要** — 使うクエリなし |
| CICAgOjXh4EK | problemPool | level, skillId, usedCount, createdAt | **不要** — 旧クエリ用。現コードに usedCount orderBy なし |
| CICAgJiUpoMK | conversations | userId, skillId, status, updatedAt | **必要** ✅ |
| CICAgJjF9oIJ | skillCards | parentSkillId, pattern, status | **必要** ✅ |
| CICAgJim14AL | skillCards | parentSkillId, status, updatedAt | **必要** ✅ |

**不要な 2 つは削除し、正しいインデックスに置き換える。**

---

## 全クエリの静的分析結果

`prototype/src/data/firestore/` の全リポジトリファイルを分析。

### conversations（トップレベルコレクション）

| # | 関数 | ファイル:行 | クエリパターン | 必要なインデックス | 現状 |
|---|------|-----------|---------------|-------------------|------|
| 1 | findConversationsByUserId() | conversation-repository.ts:164-188 | `userId == X` + `orderBy(lastActivityAt DESC)` | userId, lastActivityAt↓ | **不足** |
| 2 | 同上（status フィルタ） | 同上 | `userId == X, status == Y` + `orderBy(lastActivityAt DESC)` | userId, status, lastActivityAt↓ | **不足** |
| 3 | 同上（skillId フィルタ） | 同上 | `userId == X, skillId == Y` + `orderBy(lastActivityAt DESC)` | userId, skillId, lastActivityAt↓ | **不足** |
| 4 | 同上（両方フィルタ） | 同上 | `userId == X, status == Y, skillId == Z` + `orderBy(lastActivityAt DESC)` | userId, status, skillId, lastActivityAt↓ | **不足** |
| 5 | findActiveConversationBySkillId() | conversation-repository.ts:259-269 | `userId == X, skillId == Y, status == 'active'` + `orderBy(updatedAt DESC)` | userId, skillId, status, updatedAt↓ | ✅ 既存 |

### problemPool（トップレベルコレクション）

| # | 関数 | ファイル:行 | クエリパターン | 必要なインデックス | 現状 |
|---|------|-----------|---------------|-------------------|------|
| 6 | getPoolProblems() | problem-pool-repository.ts:86-90 | `skillId == X, level == Y` + `orderBy(createdAt ASC)` | skillId, level, createdAt↑ | **不足** |

※ `getPoolCount()` は同じフィールドの equality フィルタ + `count()` のため、#6 のインデックスでカバーされる。

### cardClearLog（トップレベルコレクション）

| # | 関数 | ファイル:行 | クエリパターン | 必要なインデックス | 現状 |
|---|------|-----------|---------------|-------------------|------|
| 7 | findCardClearLogsByCardId() | skill-card-repository.ts:382-386 | `cardId == X` + `orderBy(clearedAt DESC)` | cardId, clearedAt↓ | **不足** |

### skillCards（サブコレクション: `users/{userId}/skillCards`）

| # | 関数 | ファイル:行 | クエリパターン | 必要なインデックス | 現状 |
|---|------|-----------|---------------|-------------------|------|
| 8 | findSkillCardByPattern() | skill-card-repository.ts:323-328 | `parentSkillId == X, pattern == Y, status != 'discarded'` | parentSkillId, pattern, status | ✅ 既存 |
| 9 | findSkillCardsByParentSkill() | skill-card-repository.ts:340-344 | `parentSkillId == X, status != 'discarded'` + `orderBy(updatedAt DESC)` | parentSkillId, status, updatedAt↓ | ✅ 既存 |
| 10 | findSkillCardsByUserId(parentSkillId) | skill-card-repository.ts:185-203 | `parentSkillId == X` + `orderBy(updatedAt DESC)` | parentSkillId, updatedAt↓ | **不足** |
| 11 | findSkillCardsByUserId(status) | skill-card-repository.ts:185-203 | `status == X` + `orderBy(updatedAt DESC)` | status, updatedAt↓ | **不足** |

### problemAttempts（サブコレクション: `users/{userId}/problemAttempts`）

| # | 関数 | ファイル:行 | クエリパターン | 必要なインデックス | 現状 |
|---|------|-----------|---------------|-------------------|------|
| 12 | getAttemptedProblemIds() | problem-attempt-repository.ts:112-121 | `skillId == X, isCorrect == Y` | skillId, isCorrect | **不足** |
| 13 | getRecentProblemAttempts() | problem-attempt-repository.ts:166-170 | `skillId == X` + `orderBy(createdAt DESC)` | skillId, createdAt↓ | **不足** |

### インデックス不要（単一フィールドフィルタのみ）

| 関数 | コレクション | クエリ |
|------|-------------|--------|
| findUserByAccessCode() | users | `where(accessCode == X)` |
| findUserByFirebaseUid() | users | `where(firebaseUid == X)` |
| deleteExpiredSessions() | sessions | `where(expiresAt < X)` |
| deleteUserSessions() | sessions | `where(userId == X)` |
| getProblemAttemptStats() | problemAttempts | `where(skillId == X)` |
| cleanupOldLogs() | clientLogs | `where(createdAt < X)` |
| getPoolStats() | problemPool | 全件取得（フィルタなし） |

---

## 作成する `firestore.indexes.json`

```json
{
  "indexes": [
    {
      "collectionGroup": "conversations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "lastActivityAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "conversations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "lastActivityAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "conversations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "skillId", "order": "ASCENDING" },
        { "fieldPath": "lastActivityAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "conversations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "skillId", "order": "ASCENDING" },
        { "fieldPath": "lastActivityAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "conversations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "skillId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "problemPool",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "skillId", "order": "ASCENDING" },
        { "fieldPath": "level", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "cardClearLog",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "cardId", "order": "ASCENDING" },
        { "fieldPath": "clearedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "skillCards",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "parentSkillId", "order": "ASCENDING" },
        { "fieldPath": "pattern", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "skillCards",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "parentSkillId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "skillCards",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "parentSkillId", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "skillCards",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "problemAttempts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "skillId", "order": "ASCENDING" },
        { "fieldPath": "isCorrect", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "problemAttempts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "skillId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

## 実施手順

### Step 1: `firestore.indexes.json` をリポジトリに追加

ファイルパス: `prototype/firestore.indexes.json`

### Step 2: 不要な既存インデックスを削除

```bash
gcloud firestore indexes composite delete CICAgJj7z4EJ --project=YOUR_PROJECT_ID
gcloud firestore indexes composite delete CICAgOjXh4EK --project=YOUR_PROJECT_ID
```

- `CICAgJj7z4EJ` — conversations: (userId, updatedAt) — 使用クエリなし
- `CICAgOjXh4EK` — problemPool: (level, skillId, usedCount, createdAt) — 旧クエリ用

### Step 3: 不足インデックスを一括作成

Firebase CLI 使用:
```bash
cd prototype && firebase deploy --only firestore:indexes
```

または gcloud で個別作成（Firebase CLI 未設定の場合）:
```bash
# conversations 4 つ
gcloud firestore indexes composite create \
  --collection-group=conversations \
  --field-config=field-path=userId,order=ascending \
  --field-config=field-path=lastActivityAt,order=descending \
  --project=YOUR_PROJECT_ID

# ... 残り 7 つ（同様のパターン）
```

### Step 4: インデックス構築完了を確認

```bash
gcloud firestore indexes composite list --project=YOUR_PROJECT_ID --format="table(name.basename(), state, fields)"
```

全インデックスが `READY` になるまで待つ（通常 5〜10 分）。

### Step 5: E2E テスト

1. curl で全 API エンドポイントを叩いて 500 エラーがないことを確認
2. ブラウザでログイン → スキルツリー → 出題 → 会話一覧 を確認

---

## 実施結果

### 最終インデックス数

| 項目 | 数 |
|------|---|
| 必要なインデックス合計 | **14** |
| 既存で正しかったもの（維持） | 3 |
| 既存で不要だったもの（削除） | 2 |
| 計画時に作成 | 10 |
| 実施中に追加発見 | **1**（下記参照） |

### 実施中に発見した問題: `!=` フィルタのインデックス順序

**問題**: `findSkillCardsByParentSkill()` が `status != 'discarded'` + `orderBy('updatedAt', 'desc')` を使うが、
計画時のインデックス `(parentSkillId, status, updatedAt DESC)` ではこのクエリをサーブできなかった。

**原因**: Firestore の `!=` 演算子は range filter として扱われ、`orderBy` との組み合わせでフィールド順序が変わる:
- `status == X` （equality）→ `(parentSkillId, status, updatedAt DESC)` ← 計画通り
- `status != X` （inequality）→ `(parentSkillId, updatedAt DESC, status DESC)` ← **追加が必要**

**教訓**: `!=` フィルタは `==` と異なるインデックスが必要。同じフィールドでも `==` 用と `!=` 用は別のインデックスになる。

### curl テスト結果

| エンドポイント | ステータス |
|---------------|----------|
| `GET /api/health` | 200 ✅ |
| `POST /api/auth/bypass-login` | 200 ✅ |
| `GET /api/advisor/daily` | 200 ✅ （以前は 500） |
| `GET /api/conversations?limit=50` | 200 ✅ （以前は 500） |
| `POST /api/practice/generate` | 200 ✅ |

---

## 今後の運用ルール

- Firestore クエリを追加・変更したら、**同じ PR で `firestore.indexes.json` も更新**する
- `!=` フィルタを使う場合は、`==` 用と別のインデックスが必要になることに注意
- デプロイ前にインデックス差分を確認する習慣をつける
- `firebase.json` で Firestore の設定を管理し、CI/CD パイプラインに組み込む
