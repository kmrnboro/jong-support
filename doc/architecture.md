# Mahjong Tournament Support System Architecture

- Version: 0.1.0
- Status: Draft
- Last Updated: 2026-07-20
- Related Document: `requirements.md`

---

## 1. Purpose

本書は、リアル麻雀大会支援Webアプリケーションのシステムアーキテクチャを定義する。

本システムは、以下の2つの異なる運用状態を1つのWebアプリケーションで扱う。

1. 大会開催中  
   複数端末から結果を入力し、Supabaseを用いてリアルタイムに順位を共有する。

2. 大会終了後  
   Supabaseへ依存せず、GitHub Pages上の暗号化済み大会アーカイブをブラウザ内で復号し、過去結果と統計を閲覧する。

本書では、コンポーネント責務、データの正本、データフロー、セキュリティ境界、障害時の挙動、および将来拡張時の設計原則を明確にする。

---

## 2. Architecture Goals

本アーキテクチャは以下を満たすことを目的とする。

1. 複数スマートフォンから同時に結果入力できる
2. 結果登録後、順位が即時に近い形で更新される
3. 大会終了後は常時稼働DBを必要としない
4. 過去大会を長期間、低コストで閲覧できる
5. 過去Excelから移行したデータと次回以降のオンライン入力データを同一形式で扱える
6. 得点・順位・統計ロジックを開催中モードとアーカイブモードで共有できる
7. Supabaseプロジェクトが休止・削除されても過去大会閲覧へ影響しない
8. Codexが局所タスクを実装しやすい責務分離を維持する
9. React未経験者でも構造を追跡しやすい単純な構成にする
10. 初期版を無償枠中心で運用できる

---

## 3. Architectural Style

本システムは、以下を組み合わせた構成とする。

- Static Web Application
- Backend as a Service
- Data-Oriented Architecture
- Immutable Archive
- Shared Domain Logic
- Local Administration Tools

アプリケーション本体はReact/Viteで構築し、GitHub Pagesへ静的配信する。

大会開催中のみSupabaseをバックエンドとして使用する。大会終了後は大会データをJSONへ固定し、暗号化したうえでGitHub Pagesから配信する。

大会後のアーカイブは読み取り専用とし、変更を必要とする場合は新しい改訂版アーカイブを生成する。

---

## 4. High-Level System Context

```text
                         ┌──────────────────────┐
                         │      GitHub Repo     │
                         │                      │
                         │  - Web source        │
                         │  - Docs              │
                         │  - SQL migrations    │
                         │  - Encrypted archive │
                         └──────────┬───────────┘
                                    │
                                    │ GitHub Actions
                                    ▼
                         ┌──────────────────────┐
                         │    GitHub Pages      │
                         │                      │
                         │ React / TypeScript   │
                         │ Static assets        │
                         │ Encrypted archives   │
                         └──────────┬───────────┘
                                    │
                          Browser application
                                    │
                 ┌──────────────────┴──────────────────┐
                 │                                     │
                 ▼                                     ▼
      Tournament Mode                       Archive Mode
      Supabase connection                   Static file fetch
                 │                                     │
                 ▼                                     ▼
      ┌──────────────────────┐             ┌──────────────────────┐
      │      Supabase        │             │ Encrypted JSON       │
      │                      │             │                      │
      │ PostgreSQL           │             │ AES-256-GCM          │
      │ Auth                 │             │ PBKDF2 metadata      │
      │ RLS                  │             └──────────┬───────────┘
      │ Realtime             │                        │
      │ RPC                  │                        ▼
      └──────────────────────┘             Browser-side decryption
```

---

## 5. Operating Modes

### 5.1 Tournament Mode

大会開催中に使用する更新可能モード。

#### Main Functions

- 大会設定取得
- 参加者取得
- 卓結果入力
- サブゲーム得点入力
- 得点自動計算
- DB整合性検証
- 順位集計
- Realtime更新
- 結果訂正
- 同卓履歴
- 次卓候補

#### Source of Truth

大会開催中の正本はSupabase PostgreSQLとする。

ブラウザ側の状態は表示・入力補助用の一時状態であり、正本ではない。

#### Connectivity

インターネット接続を前提とする。

完全オフラインでの複数端末同期は初期対象外とする。

### 5.2 Archive Mode

大会終了後に使用する読み取り専用モード。

#### Main Functions

- 過去大会一覧
- 暗号化ファイル取得
- パスワード入力
- ブラウザ内復号
- JSON検証
- 順位表示
- 個人成績表示
- 統計表示
- 年度横断集計

#### Weekend MVP Display Policy

週末MVPでは麻雀とサブゲームを独立した部門として扱い、総合ptは持たない。
`officialResults`の部門別順位を確定表示に利用し、各回の保存済みptから純粋関数で
累積推移を生成する。統計画面では全参加者を同じグラフと比較表に表示し、
Reactのローカル状態だけで参加者ごとの線をon/offする。

サブゲーム仮データは`subgame.dataStatus: "sample"`で識別し、画面上にも明示する。
実データへの差し替え時は`subgame.results`と部門別公式結果を更新してArchiveを
再暗号化する。パスワードや復号済みArchiveは永続化しない。

#### Source of Truth

大会終了後の正本は、暗号化済み大会アーカイブ内の確定データとする。

#### Connectivity

初回アクセス時はGitHub PagesからWebアプリと暗号化ファイルを取得するため通信が必要である。

将来PWA対応を行う場合はオフライン閲覧を追加できる。

---

## 6. Source of Truth and Data Lifecycle

### 6.1 Source of Truth by State

```text
preparing / active / closed:
    Supabase PostgreSQL

archived:
    Encrypted tournament archive
```

### 6.2 Tournament Data Lifecycle

```text
過去Excel
   │
   ▼
Python Importer
   │
   ▼
Canonical Tournament JSON
   │
   ├──────────────┐
   │              │
   ▼              ▼
Archive Viewer    Validation / Comparison
                  with official Excel result
```

```text
次回大会
   │
   ▼
Supabase
   │
   ▼
Tournament closed
   │
   ▼
Canonical Tournament JSON export
   │
   ▼
Schema validation
   │
   ▼
AES-256-GCM encryption
   │
   ▼
Decryption verification
   │
   ▼
Git commit
   │
   ▼
GitHub Pages archive
```

### 6.3 Immutable Archive Rule

一度公開した大会アーカイブは原則変更しない。

訂正が必要な場合は、以下のいずれかで新しい版を作成する。

```text
tournament-2026-v1.enc
tournament-2026-v2.enc
```

または、

```text
archiveId: tournament-2026
revision: 2
```

旧版の扱いは運用手順で定義する。

---

## 7. Component Architecture

### 7.1 Web Application

責務:

- UI表示
- 入力フォーム
- クライアント側プレビュー計算
- Supabase呼び出し
- Realtime購読
- 暗号化ファイル取得
- ブラウザ内復号
- 共通ドメインロジック実行
- 統計表示

非責務:

- service role権限操作
- GitHubへの秘密情報を用いた直接コミット
- 重要な整合性検証の最終判断
- 平文大会データの永続保存

### 7.2 Domain Layer

責務:

- 得点計算
- 着順計算
- 順位集計
- 統計集計
- 同卓履歴生成
- 次卓候補スコアリング
- アーカイブモデル定義

Domain LayerはReact、Supabase、Web Cryptoへ依存しない純粋なTypeScriptとして実装する。

推奨モジュール:

```text
domain/
  scoring/
  ranking/
  statistics/
  matchup/
  table-suggestion/
  archive-model/
```

### 7.3 Online Adapter

責務:

- Supabaseクライアント初期化
- Query実行
- RPC呼び出し
- Realtime購読
- 認証状態取得
- DBデータからドメインモデルへの変換

推奨モジュール:

```text
online/
  client.ts
  repositories/
  realtime/
  auth/
  mappers/
```

### 7.4 Archive Adapter

責務:

- アーカイブ一覧取得
- 暗号化ファイル取得
- パスワードから鍵導出
- AES-GCM復号
- JSON parse
- Schema validation
- ドメインモデルへの変換

推奨モジュール:

```text
archive/
  archive-index.ts
  fetch-encrypted.ts
  decrypt.ts
  validate.ts
  load.ts
```

### 7.5 Python Administration Tools

責務:

- Excel解析
- 年度別Excel変換
- Canonical JSON生成
- JSON Schema検証
- 公式結果比較
- 暗号化
- 復号検証
- テストデータ生成

推奨構成:

```text
tools/
  import_excel.py
  validate_archive.py
  compare_official_results.py
  publish_archive.py
  encrypt_archive.py
  decrypt_archive.py
  importers/
    base.py
    tournament_2023.py
    tournament_2024.py
    tournament_2025.py
    tournament_2026.py
```

### 7.6 Supabase

責務:

- 大会中データ保存
- 認証
- 認可
- DB制約
- トランザクション
- 得点計算のサーバ側再検証
- 結果登録RPC
- 訂正履歴
- Realtimeイベント配信

非責務:

- 過去大会の長期保管保証
- GitHub Pagesの配信
- アーカイブ暗号化
- 過去年度横断表示の唯一の保存先

---

## 8. Frontend Architecture

### 8.1 Recommended Structure

```text
apps/web/
  src/
    app/
      router/
      providers/
    pages/
      tournaments/
      ranking/
      results/
      archive/
      admin/
    components/
      common/
      tournament/
      ranking/
      results/
      statistics/
    domain/
      scoring/
      ranking/
      statistics/
      matchup/
      table-suggestion/
      archive-model/
    online/
      auth/
      repositories/
      realtime/
      mappers/
    archive/
      crypto/
      loaders/
      validators/
    lib/
      errors/
      logging/
      formatting/
    types/
    tests/
```

### 8.2 State Management

初期版では専用の大規模状態管理ライブラリを必須としない。

以下を基本とする。

- ローカルUI状態: React `useState`
- 非同期データ: TanStack Queryを候補とする
- 認証状態: ContextまたはSupabase標準機構
- ドメイン計算結果: 純粋関数で導出
- 復号済みアーカイブ: 現在表示中の1大会だけをメモリ内状態に保持
- 年度横断統計: 復号時に生成した大会別集計値だけをメモリ内状態に保持

グローバル状態を安易に増やさない。

### 8.3 Routing

最低限以下の画面経路を持つ。

```text
/
  大会一覧

/statistics
  開いた大会の年度横断統計

/archive/:archiveId
  暗号化アーカイブ読込・結果表示

/archive/:archiveId/statistics
  大会内の参加者比較統計

/archive/:archiveId/matches
  ラウンド・卓ごとの対局履歴

/live/:tournamentId
  大会中ダッシュボード

/live/:tournamentId/input
  麻雀結果入力

/live/:tournamentId/subgames
  サブゲーム入力

/live/:tournamentId/admin
  運営者画面

/player/:playerId
  個人成績
```

GitHub Pages上のSPAルーティング制約を考慮し、Hash Routerを候補とする。

例:

```text
/#/archive/2026
```

または404フォールバック方式を採用する。

初期版では設定が単純なHash Routerを推奨する。

---

## 9. Supabase Architecture

### 9.1 Core Tables

```text
tournaments
rule_sets
players
tournament_players
mahjong_games
mahjong_results
subgame_definitions
subgame_results
user_profiles
audit_logs
submission_requests
```

### 9.2 Key Relationships

```text
tournaments
  1 ── 1 rule_sets
  1 ── N tournament_players
  1 ── N mahjong_games
  1 ── N subgame_definitions

players
  1 ── N tournament_players

mahjong_games
  1 ── 4 mahjong_results

subgame_definitions
  1 ── N subgame_results
```

### 9.3 Result Registration RPC

対局登録はクライアントから複数INSERTせず、1つのRPCで行う。

例:

```text
register_mahjong_game(
  tournament_id,
  round_no,
  table_no,
  submission_id,
  results[]
)
```

RPC内部責務:

1. 呼び出し権限確認
2. 大会状態確認
3. 参加者数確認
4. 参加者重複確認
5. 大会参加者確認
6. 素点合計確認
7. 着順決定
8. 得点計算
9. 同一卓重複確認
10. 同一ラウンド参加重複確認
11. 送信ID確認
12. `mahjong_games` INSERT
13. `mahjong_results` 4件 INSERT
14. `audit_logs` INSERT
15. コミット

### 9.4 Database Constraints

最低限以下をDB制約として持つ。

```text
UNIQUE(tournament_id, round_no, table_no)
UNIQUE(submission_id)
CHECK(raw_score is valid numeric range)
CHECK(rank between 1 and 4)
CHECK(game has exactly four active results)
```

同一参加者が同一ラウンドで複数卓に参加しない制約は、単純なUNIQUE制約だけで難しい場合があるためRPC内検証を併用する。

### 9.5 RLS Policy Concept

#### Participant

- active大会を閲覧可能
- active大会へ結果登録可能
- 任意結果の更新・削除不可
- 順位表示用データを閲覧可能

#### Organizer

- 大会作成・更新可能
- 結果訂正可能
- 大会終了可能
- アーカイブ用データ取得可能

RLSポリシーはSQL migrationとして管理する。

### 9.6 Realtime

Realtime購読対象は必要最小限とする。

候補:

- `mahjong_games`
- `mahjong_results`
- `subgame_results`

イベント受信時は差分だけを盲目的に適用せず、必要に応じてランキングQueryを再取得する。

理由:

- 訂正や取消を含むと差分計算が複雑になる
- 小規模データであるため再取得コストが小さい
- 正確性を優先できる

---

## 10. Authentication and Authorization

### 10.1 Organizer Authentication

運営者はSupabase Authで正式ログインする。

候補:

- Magic Link
- Google OAuth
- Email + Password

初期実装の容易性と運用者数の少なさから、Magic LinkまたはGoogle OAuthを推奨する。

### 10.2 Participant Authentication

参加者全員への事前アカウント登録は運用負荷が高い。

初期候補:

- Supabase Anonymous Sign-In
- 大会参加コード
- 表示名選択

匿名UIDを入力者追跡に利用する。

### 10.3 Tournament Join Code

大会コードは認証そのものではなく、大会参加の簡易ゲートとして扱う。

大会コードを知るだけで管理者権限を得られないようにする。

### 10.4 Archive Access

大会後はSupabase Authを利用しない。

暗号化アーカイブを共有パスフレーズで復号する。

これは正式なユーザー別認可ではなく、仲間内への限定共有を目的とする。

---

## 11. Archive Architecture

### 11.1 Canonical Archive

大会アーカイブは、DBダンプではなくアプリケーション上の意味を持つCanonical JSONとする。

```json
{
  "schemaVersion": "1.0.0",
  "exportedAt": "2026-07-14T00:00:00Z",
  "tournament": {},
  "players": [
    {
      "playerId": "player_0123456789abcdef0123456789abcdef",
      "nickname": "大会開催時の表示名",
      "rankingEligibility": {
        "mahjong": "official",
        "subgame": "reference"
      }
    }
  ],
  "mahjong": {
    "scoring": {
      "ruleId": "stored-final-points",
      "ruleVersion": "1.0.0",
      "parameters": {}
    },
    "games": [],
    "officialResults": []
  },
  "subgame": null,
  "exportMetadata": {}
}
```

正式な構造は`schemas/tournament-archive.schema.json`を正本とし、
`additionalProperties: false`を基本として意図しない項目を拒否する。

### 11.2 Cross-Year Player Identity

`playerId`は年度内の連番ではなく、全年度を通じた安定識別子とする。
ニックネームは変更可能な表示情報であるため、各Archiveへ大会開催時点の値を保存する。

管理CLIはGit管理外のプレイヤー台帳を参照し、未登録ID、別人へのID再利用、
ニックネームを主キーとした自動統合を拒否する。年度横断統計は`playerId`で結合する。

### 11.3 Ranking Eligibility

参加資格は麻雀・サブゲームごとに次の値を持つ。

- `official`: 公式順位対象
- `reference`: 記録と統計には含めるが公式順位対象外
- `notParticipating`: その部門に不参加

途中参加者の対局結果は削除せず、推移・統計へ含める。`officialResults`は
`official`の参加者だけを参照し、validatorが不一致を拒否する。

### 11.4 Scoring Rule Reference

Archiveは実行可能コードではなく、`ruleId`、`ruleVersion`、検証可能な
パラメータだけを保存する。得点計算関数はアプリケーション側のルールレジストリへ
純粋関数として登録する。

既存の`ruleId`で表現できる大会はJSONのパラメータ変更だけで扱える。
新しい計算方式はコード、テストベクトル、version追加を必要とする。
Archive Viewerは保存済み`finalPoint`と公式順位を表示し、閲覧時に再計算しない。

### 11.5 Why Not Database Dump

DBダンプを公式アーカイブにしない理由:

- Supabase内部構造へ依存する
- 将来のDB migrationで扱いにくい
- ブラウザで直接利用できない
- 不要な認証情報や内部列を含み得る
- 長期可読性が低い

DBダンプは障害復旧用の補助バックアップとして別途保管してよい。

### 11.6 Archive Index

GitHub Pages上の大会一覧用に非機密なインデックスを持つ。

```json
{
  "archives": [
    {
      "archiveId": "2026-summer",
      "title": "2026年度大会",
      "date": "2026-07-01",
      "revision": 1,
      "file": "archives/2026-summer-v1.enc",
      "formatVersion": 1
    }
  ]
}
```

大会名・開催日も秘匿したい場合は将来インデックスも暗号化できる。

Webアプリは起動時にindexを取得し、`archiveId`から対象ファイルを解決する。
大会情報をTypeScriptへハードコードしない。

### 11.7 Archive Publication Flow

```text
data/plain/<archiveId>.json（Git管理外）
    ↓ publish CLI
JSON Schema・参照整合性・公式順位対象を検証
    ↓
public/archives/<archiveId>.enc
public/archives/index.json
    ↓ commit / push
Webコード変更なしで大会一覧へ追加
```

平文JSONをGitHub Actions内で暗号化する方式は採用しない。パスワードと平文を
GitHubへ渡さず、暗号化と復号照合は運営者のローカル環境で完了させる。

---

## 12. Encryption Architecture

### 12.1 Encryption Flow

```text
Canonical JSON
   │
   ▼
UTF-8 encode
   │
   ▼
PBKDF2-HMAC-SHA-256
   │
   ▼
AES-256 key
   │
   ▼
AES-GCM encrypt
   │
   ▼
Encrypted archive envelope
```

### 12.2 Decryption Flow

```text
Encrypted archive fetch
   │
   ▼
Password input
   │
   ▼
PBKDF2 key derivation
   │
   ▼
AES-GCM decrypt
   │
   ▼
UTF-8 decode
   │
   ▼
JSON parse
   │
   ▼
Schema validation
   │
   ▼
Render
```

### 12.3 File Envelope

```json
{
  "format": "mahjong-archive-encrypted",
  "version": 1,
  "kdf": {
    "name": "PBKDF2",
    "hash": "SHA-256",
    "iterations": 600000,
    "salt": "base64..."
  },
  "cipher": {
    "name": "AES-GCM",
    "keyLength": 256,
    "iv": "base64...",
    "ciphertext": "base64..."
  }
}
```

### 12.4 Key Management

- パスワードはアプリへ保存しない
- パスワードはGitHubへ保存しない
- パスワードはブラウザメモリ上のみ保持する
- 大会ごとに異なるパスフレーズを推奨する
- 平文原本は運営者が別途バックアップする

### 12.5 Browser Security Boundary

利用者はGitHub Pagesから配信されるJavaScriptを信用する必要がある。

対策:

- mainブランチ保護
- GitHub MFA
- 依存関係最小化
- 外部CDNスクリプト禁止
- Web Crypto APIを直接利用
- 不要なアクセス解析を導入しない
- Content Security Policyを将来検討

---

## 13. Shared Domain Logic

### 13.1 Need for Shared Logic

開催中順位とアーカイブ順位で異なる計算実装を持つと、不一致が発生する。

そのため以下を共通化する。

- 得点計算
- 着順処理
- 順位集計
- 個人成績
- 統計
- 同卓履歴
- 次卓候補評価

### 13.2 Scoring Rule Registry

得点方式は`ruleId`と`ruleVersion`で純粋関数を選択する。JSONのパラメータは
対応するルール固有Schemaで検証し、未知のruleId、未対応version、余分な項目を拒否する。

任意コードをJSONから動的に評価するプラグイン方式や、汎用数式DSLは初期版では採用しない。

### 13.3 Server-Side Revalidation

共通TypeScriptロジックだけではDB改ざんや直接API呼び出しを防げない。

重要な得点登録ではPostgreSQL RPCでも再計算・検証する。

TypeScriptとSQLにロジック重複が発生するが、役割は異なる。

- TypeScript: UIプレビュー、閲覧、統計
- SQL/RPC: 正本登録時の防御

計算仕様はテストベクトルを共通SSOTとして両実装へ適用する。

### 13.4 Test Vector Example

```json
{
  "ruleSet": {},
  "rawScores": [42100, 28700, 19300, 9900],
  "expectedRanks": [1, 2, 3, 4],
  "expectedPoints": [32.1, 8.7, -20.7, -20.1]
}
```

実際の期待値は大会ルール確定後に定義する。

---

## 14. Excel Import Architecture

### 14.1 Adapter Pattern

年度ごとにExcel形式が異なることを前提とする。

```text
Excel file
   │
   ▼
Year-specific adapter
   │
   ▼
Normalized intermediate model
   │
   ▼
Canonical archive model
   │
   ▼
Validation
```

### 14.2 Responsibilities

#### Base Importer

- ファイル読込
- 共通エラー処理
- 日付・数値正規化
- 出力
- 検証呼び出し

#### Year Adapter

- シート名
- セル位置
- 列名
- 年度固有ルール
- 表記揺れ
- 欠損解釈

### 14.3 Human Review Boundary

以下は自動推測しない。

- 列の意味
- 同一人物判定
- 特殊ルール
- 誤記か例外か
- 公式順位の正誤

不確実な項目は変換レポートへ出力する。

---

## 15. Error Handling

### 15.1 Error Categories

- Validation Error
- Authentication Error
- Authorization Error
- Conflict Error
- Network Error
- Archive Decryption Error
- Archive Format Error
- Internal Error

### 15.2 User-Facing Error Principles

- 技術詳細をそのまま表示しない
- 次に取るべき操作を示す
- 入力内容を可能な限り保持する
- 二重送信を誘発しない
- 運営者向け詳細ログと参加者向け表示を分離する

### 15.3 Logging

初期版では外部ログサービスを必須としない。

- ブラウザ: 開発時console、必要最小限
- Supabase: DBログ、audit_logs
- Python tools: 標準ログと変換レポート

個人情報をログへ出力しない。

---

## 16. Reliability and Recovery

### 16.1 Network Failure

- 送信前入力を保持する
- 送信IDを再利用する
- 再送時に二重登録しない
- Realtime切断時に再購読する
- 再接続後に全データ再取得する

### 16.2 Supabase Pause or Loss

Supabaseは大会開催中の一時的な正本である。

対策:

- DB schemaをmigration管理
- seedデータを管理
- 大会前に再構築試験
- 大会終了後にCanonical JSONを保存
- 過去大会表示をSupabaseへ依存させない

### 16.3 Archive Corruption

- AES-GCM認証失敗で改ざんを検知
- 暗号化直後に復号試験
- 平文原本を別媒体へ保存
- GitHub履歴で暗号化ファイル版を保持

### 16.4 Operational Fallback

大会当日にサービス継続不能となった場合:

1. 運営PCまたはExcelへ一時記録
2. 紙で卓結果を保持
3. 復旧後にまとめて登録
4. 送信済み結果との重複を確認

完全な無停止運用は要求しない。

---

## 17. Deployment Architecture

### 17.1 GitHub Pages

GitHub ActionsでReact/Viteをビルドし、静的成果物をPagesへ配置する。

```text
push to main
   │
   ▼
GitHub Actions
   │
   ├─ install
   ├─ lint
   ├─ typecheck
   ├─ test
   ├─ build
   └─ deploy
```

### 17.2 Environment Variables

GitHub Pagesへ埋め込まれる値は公開可能なものに限定する。

許容:

- Supabase URL
- Supabase publishable/anon key
- アプリバージョン

禁止:

- service role key
- GitHub Personal Access Token
- アーカイブパスワード
- 管理者秘密鍵

### 17.3 Supabase Deployment

以下をGitで管理する。

```text
supabase/
  migrations/
  seed.sql
  config.toml
```

ダッシュボード上の手作業だけで構築しない。

---

## 18. Repository Architecture

```text
mahjong-tournament/
├── apps/
│   └── web/
│       ├── src/
│       ├── public/
│       │   └── archives/
│       └── package.json
├── tools/
│   ├── importers/
│   ├── import_excel.py
│   ├── validate_archive.py
│   ├── compare_official_results.py
│   ├── publish_archive.py
│   ├── encrypt_archive.py
│   └── decrypt_archive.py
├── schemas/
│   ├── tournament-archive.schema.json
│   └── archive-index.schema.json
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── config.toml
├── tests/
│   ├── fixtures/
│   ├── scoring/
│   ├── archive/
│   └── importers/
├── data/
│   ├── raw/
│   ├── plain/
│   └── samples/
├── docs/
│   ├── requirements.md
│   ├── architecture.md
│   ├── development-plan.md
│   ├── onboarding.md
│   ├── operation.md
│   └── decisions/
├── .github/
│   └── workflows/
├── .gitignore
└── README.md
```

`data/raw`および`data/plain`はGit管理外とする。

---

## 19. Architectural Decisions

### ADR-001 React + TypeScript

採用理由:

- スマートフォン向けインタラクティブUIに適する
- GitHub Pagesへ静的配信可能
- Supabase SDKとの親和性が高い
- Codexの支援効果が高い
- 将来の他Webツールへ知見を再利用できる

却下案:

- Python Web UI
- Streamlit
- サーバサイドテンプレート中心構成

### ADR-002 GitHub Pages

採用理由:

- 無料
- GitHubとの統合
- 静的アーカイブに適する
- 長期運用が単純

制約:

- サーバ処理不可
- サイト自体は公開
- アーカイブ暗号化が必要

### ADR-003 Supabase for Tournament Mode

採用理由:

- PostgreSQL
- Auth
- RLS
- Realtime
- RPC
- 小規模アプリに十分

制約:

- 無料プロジェクト休止
- 長期保存先として不安
- 大会前の稼働確認が必要

### ADR-004 Encrypted Canonical JSON

採用理由:

- GitHub Pagesだけで過去大会閲覧可能
- Supabase非依存
- 可搬性が高い
- 長期可読性が高い

### ADR-005 Python for Administration Tools

採用理由:

- Excel処理に適する
- プロジェクト所有者の既存知識を活用できる
- CLI処理に適する
- Webアプリから責務を分離できる

---

## 20. Known Risks

### Risk-001 Weak Shared Password

暗号文は公開されるため、弱いパスワードはオフライン解析され得る。

対策:

- 長いパスフレーズ
- 高コストKDF
- 大会別パスワード

### Risk-002 Frontend Supply Chain

悪意あるJavaScriptが配信されるとパスワードが漏れる可能性がある。

対策:

- GitHub MFA
- ブランチ保護
- 依存最小化
- 外部CDN禁止

### Risk-003 Rule Ambiguity

過去Excelや大会ルールの曖昧さにより、公式順位と再計算が一致しない可能性がある。

対策:

- テストベクトル
- 差分レポート
- 人手レビュー
- calculationVersion

### Risk-004 Realtime Misunderstanding

Realtimeイベントだけで状態を組み立てると訂正時に不整合が発生する可能性がある。

対策:

- イベントを更新トリガーとして利用
- 正式状態を再Query

### Risk-005 Overengineering

初期段階で認証、最適化、PWA、複雑な状態管理を導入すると開発が遅延する。

対策:

- Phase分割
- Must要件優先
- 単純な実装を選択

---

## 21. Quality Attributes

### Maintainability

- ドメインロジックを純粋関数化
- Adapter分離
- migration管理
- Schema versioning
- 小さなComponent

### Security

- RLS
- RPC検証
- AES-GCM
- 秘密情報非配置
- 平文非コミット

### Reliability

- DB transaction
- idempotency
- archive verification
- immutable record

### Portability

- Canonical JSON
- static hosting
- reconstructable Supabase
- local Python tools

### Usability

- mobile first
- simple input flow
- explicit feedback
- minimal login friction

---

## 22. Open Architectural Issues

以下は詳細設計またはExcel調査後に決定する。

1. 参加者認証方式
2. Supabaseの匿名認証採用可否
3. Google OAuth採用可否
4. 同点時順位計算
5. SQLとTypeScriptの計算仕様共有方法
6. JSON SchemaからTypeScript型を生成するか
7. PBKDF2反復回数
8. Archive revision命名規則
9. GitHub Pages routing方式
10. 次卓候補アルゴリズム
11. Realtime購読テーブル
12. 平文バックアップ保存場所
13. 大会終了時のDBバックアップ要否
14. Archive indexを公開平文にする範囲

---

## 23. Architecture Acceptance Criteria

本アーキテクチャは以下を満たした時点で成立とみなす。

- 1つのReactアプリでTournament ModeとArchive Modeを切り替えられる
- 大会中の正本がSupabaseに限定されている
- 大会後の閲覧がSupabaseなしで成立する
- 得点・順位・統計ロジックを両モードで共有できる
- 4名分の結果を1トランザクションで登録できる
- 二重登録をDBで防止できる
- アーカイブ全体を暗号化・復号できる
- GitHubへ平文大会データを置かずに運用できる
- 過去ExcelをCanonical JSONへ変換できる
- Supabaseをmigrationから再構築できる
- GitHub Pages以外の静的ホスティングへ移行可能である

---

## 24. Summary

本システムは、以下の責務分離を中核とする。

```text
React / TypeScript
    UI・閲覧・入力・共通ドメインロジック

Supabase
    大会中の同時更新・認証・整合性・Realtime

Python Tools
    Excel変換・検証・暗号化・管理作業

Encrypted JSON Archive
    大会終了後の長期保存正本

GitHub Pages
    Webアプリと暗号化アーカイブの静的配信
```

この構成により、年1回程度の低頻度イベントに対して、開催中のリアルタイム性と大会後の低コスト長期閲覧を両立する。
