# Mahjong Tournament Support System Development Plan

- Version: 0.1.0
- Status: Draft
- Last Updated: 2026-08-08
- Related Documents:
  - `requirements.md`
  - `architecture.md`

---

## 1. Purpose

本書は、リアル麻雀大会支援Webアプリケーションの開発計画を定義する。

目的は以下のとおり。

1. Codexへ依頼可能な粒度で作業を分割する
2. 各タスクの入力、出力、制約、完成条件を明確化する
3. 過去Excelを活用して早期に実用価値を確認する
4. 大会後閲覧機能を先行し、次回大会向けリアルタイム入力機能を段階的に追加する
5. React/TypeScript未経験者でも設計とレビューを主導できる進め方にする
6. 途中で中断しても価値のある成果が残る計画とする

---

## 2. Development Strategy

開発順序は次のとおりとする。

```text
過去Excel調査
    ↓
Canonical JSON仕様
    ↓
得点・順位・統計ロジック
    ↓
過去大会ビューワー
    ↓
暗号化アーカイブ
    ↓
GitHub Pages公開
    ↓
Supabaseスキーマ
    ↓
大会入力MVP
    ↓
複数端末・Realtime
    ↓
サブゲーム・訂正
    ↓
同卓履歴・次卓候補
    ↓
模擬大会・運用確立
```

この順序を採用する理由:

- 過去Excelを正解データとして利用できる
- 最初に最も不確実なルール差・データ差を確認できる
- Supabase実装前に共通データモデルを固められる
- 早期に過去大会閲覧サイトとして価値を提供できる
- UIとバックエンドを同時に複雑化しない
- Codexへ小さな依頼単位を渡しやすい

---

## 3. Project Phases

| Phase | 名称 | 主目的 | 主要成果物 |
|---|---|---|---|
| 0 | Project Bootstrap | 開発基盤の初期化 | リポジトリ、CI、基本設定 |
| 1 | Historical Data Analysis | 過去Excelとルールの把握 | 調査結果、変換仕様 |
| 2 | Canonical Data Model | 共通データ形式の確立 | JSON Schema、TS型、サンプル |
| 3 | Domain Logic | 得点・順位・統計の確立 | 純粋関数、テスト |
| 4 | Archive Viewer MVP | 過去大会閲覧 | React画面、ローカルJSON読込 |
| 5 | Secure Archive | 暗号化とGitHub Pages公開 | 暗号化CLI、Web復号 |
| 6 | Supabase Foundation | 大会中DB基盤 | migration、RLS、RPC |
| 7 | Tournament Input MVP | スマホ結果入力 | 入力UI、登録、訂正 |
| 8 | Realtime Multi-Device | 複数端末運用 | Realtime、再同期、競合対策 |
| 9 | Operational Features | サブゲーム・同卓支援 | サブゲーム、次卓候補 |
| 10 | Production Readiness | 本番準備 | 模擬大会、運用手順、改善 |

---

## 4. Overall Schedule

週5〜10時間程度の個人開発を想定する。

| Phase | 目安 |
|---|---:|
| Phase 0 | 1週間 |
| Phase 1 | 1〜2週間 |
| Phase 2 | 1〜2週間 |
| Phase 3 | 1〜2週間 |
| Phase 4 | 2〜3週間 |
| Phase 5 | 1〜2週間 |
| Phase 6 | 2〜3週間 |
| Phase 7 | 2〜3週間 |
| Phase 8 | 1〜2週間 |
| Phase 9 | 2〜4週間 |
| Phase 10 | 次回大会の1〜2か月前 |

Codexを適切に活用した場合、主要MVPまで7〜10週間程度を目安とする。

---

## 5. Task Definition Template

Codexへ依頼する各タスクは、以下の形式で管理する。

```text
Task ID:
Task Name:

目的:
背景:
入力:
出力:
対象ファイル:
制約:
非対象:
完成条件:
テスト:
レビュー観点:
依存タスク:
```

1タスクは原則として以下を満たす粒度とする。

- 1つの明確な責務
- 変更ファイルが追跡可能
- 1回のレビューで理解可能
- 自動テストまたは確認手順を持つ
- 他機能を同時に大規模変更しない

---

# 6. Phase 0: Project Bootstrap

## Goal

React/TypeScript、Python、Supabase、GitHub Actionsを扱える最小のリポジトリ基盤を作る。

## Task 0-1 Repository Initialization

### Purpose

GitHubリポジトリの基本構造を作成する。

### Inputs

- `requirements.md`
- `architecture.md`

### Outputs

```text
apps/
tools/
schemas/
supabase/
tests/
docs/
data/
.github/
```

### Constraints

- `data/raw` と `data/plain` はGit管理外
- 過剰なモノレポ管理ツールを導入しない
- 初期版ではnpm workspacesを必須としない

### Acceptance Criteria

- リポジトリ構成がarchitecture.mdと一致する
- `.gitignore` が存在する
- READMEから各文書へ移動できる
- 平文Excelや平文JSONを誤コミットしにくい

### Review Points

- ディレクトリが過剰に複雑でないか
- 実データとサンプルデータが分離されているか

## Task 0-2 React/Vite/TypeScript Setup

### Purpose

Webアプリの最小起動環境を作る。

### Outputs

- React/Vite/TypeScriptアプリ
- 開発サーバ
- production build
- 基本ルーティング

### Constraints

- GitHub Pagesを考慮する
- 初期版はHash Routerを推奨
- UIライブラリは最小限
- 不要な状態管理ライブラリを導入しない

### Acceptance Criteria

- `npm run dev` で起動する
- `npm run build` が成功する
- スマートフォン幅で基本画面が崩れない
- ルート画面とダミー大会画面を切り替えられる

## Task 0-3 Python Tooling Setup

### Purpose

Excel変換・検証・暗号化用Python環境を整備する。

### Outputs

- `pyproject.toml`
- 依存管理
- formatter/linter
- test runner

### Candidate Libraries

- `openpyxl`
- `pydantic`
- `cryptography`
- `pytest`

### Acceptance Criteria

- Python仮想環境を構築できる
- `pytest` が実行できる
- サンプルCLIが動作する

## Task 0-4 CI Setup

### Purpose

GitHub Actionsで品質確認とPagesビルドを行う。

### Pipeline

```text
TypeScript:
  install
  lint
  typecheck
  test
  build

Python:
  install
  lint
  test
```

### Acceptance Criteria

- Pull Request時にCIが動く
- mainへの破壊的変更を防げる
- GitHub Pagesへのデプロイジョブが存在する

---

# 7. Phase 1: Historical Data Analysis

## Goal

過去数年分のExcel構造、麻雀ルール、欠損、表記揺れを把握する。

## Task 1-1 Excel Inventory

### Purpose

利用可能なExcelを一覧化する。

### Inputs

- 過去数年分のExcel

### Outputs

`docs/data-inventory.md`

### Record Items

- 年度
- ファイル名
- シート名
- 参加者数
- 半荘単位データ有無
- 素点有無
- pt有無
- 同卓情報有無
- サブゲーム有無
- 公式順位有無
- 既知の手修正
- 欠損項目

### Acceptance Criteria

- 対象Excelすべてが一覧化される
- 各年度の利用可能な統計範囲が分かる

## Task 1-2 Rule Extraction

### Purpose

年度ごとの麻雀得点ルールを明文化する。

### Outputs

`docs/scoring-rules.md`

### Required Items

- 持ち点
- 返し点
- ウマ
- オカ
- 丸め
- 同点処理
- 箱下
- pt合計の扱い
- サブゲーム加点

### Acceptance Criteria

- 各年度の公式順位を再現するために必要なルールが明記される
- 不明点がOpen Issueとして残る
- 推測と確認済み事実が区別される

## Task 1-3 Player Identity Mapping

### Purpose

年度をまたぐ同一人物対応を整理する。

### Outputs

Git管理外の年度横断プレイヤー台帳と、そのバックアップ手順。

### Constraints

- 本名を使用しない
- ニックネームを主キーにしない
- 不確実な同一人物判定を自動化しない
- playerIdへ年度を含めない
- Archiveには大会開催時点のニックネームを保存する

### Acceptance Criteria

- 通算集計用playerId方針が確定する
- 表記揺れが列挙される
- 2年度のサンプルで同一人物が同じplayerIdを持つ
- 未登録IDとID再利用を管理CLIが拒否できる

## Task 1-4 Representative Dataset Selection

### Purpose

実装・テストに使用する代表年度を選ぶ。

### Selection Criteria

- 素点が存在する
- 卓構成が存在する
- サブゲームが存在する
- 公式順位が明確
- 比較的データ品質が高い

### Acceptance Criteria

- 主テスト用1大会
- 差異確認用1〜2大会
- 匿名化サンプルデータ

が選定される。

---

# 8. Phase 2: Canonical Data Model

## Goal

オンライン・アーカイブ・Excel移行で共通利用する大会データモデルを確立する。

## Task 2-1 Domain Entity Definition

### Purpose

主要エンティティと関係を定義する。

### Outputs

`docs/data-model.md`

### Entities

- Tournament
- RuleSet
- Player
- MahjongGame
- MahjongResult
- SubgameDefinition
- SubgameResult
- OfficialResult
- RankingEligibility
- ScoringRuleReference
- ArchiveMetadata

### Acceptance Criteria

- ID方針が統一される
- ニックネームとplayerIdが分離される
- 参加資格を麻雀・サブゲーム別に表現できる
- サブゲームが存在しない年度を`null`で表現できる
- DB固有情報をCanonicalモデルに含めない

## Task 2-2 JSON Schema

### Purpose

大会アーカイブの構造を機械検証可能にする。

### Outputs

- `schemas/tournament-archive.schema.json`
- `schemas/archive-index.schema.json`

### Acceptance Criteria

- 必須項目と任意項目が明確
- `schemaVersion: 1.0.0`を持つ
- 欠損状態を表現できる
- `additionalProperties: false`を基本とする
- `official`、`reference`、`notParticipating`を部門別に表現できる
- 得点方式を`ruleId`、`ruleVersion`、パラメータで表現できる
- 実行可能コードを格納できない
- サンプルJSONがvalidateされる
- 不正JSONがrejectされる

## Task 2-3 TypeScript Types

### Purpose

Webアプリで使用する型を定義する。

### Outputs

`apps/web/src/domain/archive-model/`

### Decision

JSON Schemaから自動生成するか、手動同期するかをTask内で比較する。

初期推奨:

- JSON Schemaを正本
- TS型を生成または同期検証

### Acceptance Criteria

- `any`を使わず主要モデルを表現できる
- Schemaと型の不一致を検出できる

## Task 2-4 Python Models

### Purpose

PythonツールでCanonicalモデルを検証する。

### Outputs

PydanticモデルまたはJSON Schema validator。

### Acceptance Criteria

- Excel変換結果をvalidateできる
- エラー箇所を理解可能な形で表示できる

## Task 2-5 Sample Archive

### Purpose

全機能開発に使用する小さなサンプル大会を作る。

### Required Data

- 8名以上
- 2卓以上
- 複数ラウンド
- 同点ケース
- 負点
- サブゲーム
- 公式順位

### Acceptance Criteria

- 主要な境界条件を含む
- Git公開可能
- 全テストで再利用可能

---

# 9. Phase 3: Domain Logic

## Goal

UI・DBから独立した得点・順位・統計ロジックを実装する。

## Task 3-1 Mahjong Scoring Function

### Purpose

素点とルールから獲得ポイントを計算する。

### Inputs

- RuleSet
- ruleId / ruleVersion / parameters
- 4名の素点
- 必要に応じて席順または順位指定

### Outputs

- rank
- basePoint
- uma
- oka
- finalPoint

### Constraints

- 純粋関数
- ReactやSupabaseへ依存しない
- ルールレジストリから既知の純粋関数を選択する
- JSON内のコードを評価しない
- 汎用数式DSLを初期実装へ含めない
- 浮動小数誤差を考慮
- 丸め規則を明示

### Tests

- 通常ケース
- 同点
- 箱下
- 端数
- 最高・最低値
- pt合計

### Acceptance Criteria

- 代表Excelの公式結果を再現する
- 順位と素点帯の組み合わせで変動するルールを表現できる
- 未知のruleIdと未対応versionを拒否する
- 全テストが通る

## Task 3-2 Ranking Calculation

### Purpose

保存済みの公式結果から、部門別順位を表示用に生成する。

### Outputs

- 麻雀順位
- サブゲーム順位

### Tests

- 同ポイント
- 対局数差
- サブゲームなし
- 欠損データ
- 公式順位固定値との比較

## Task 3-3 Statistics Calculation

### Purpose

個人成績・大会統計を生成する。

### Metrics

- 対局数
- 平均順位
- トップ率
- 連対率
- ラス率
- 平均素点
- 最高・最低素点
- 最大獲得・損失
- 順位推移

### Acceptance Criteria

- サンプル大会から期待統計を生成できる
- 欠損項目が誤って0扱いされない

## Task 3-4 Matchup Statistics

### Purpose

同卓履歴と対戦相手別統計を生成する。

### Outputs

- ペアごとの同卓回数
- 同卓ラウンド
- 対戦時pt
- 平均pt

### Acceptance Criteria

- 全ペアを重複なく生成できる
- 同一ゲーム内の組合せを正しく扱う

## Task 3-5 Domain Test Vectors

### Purpose

TypeScriptと将来のSQL/RPC実装で共有する正解データを作る。

### Outputs

`tests/fixtures/scoring-vectors.json`

### Acceptance Criteria

- 主要ルール境界を含む
- 期待値が人手確認済み
- SQL実装テストにも利用可能

---

# 10. Phase 4: Archive Viewer MVP

## Goal

暗号化Archiveをブラウザ内で復号し、過去大会の部門別順位と比較統計を表示する。

## Tasks

### Task 4-1 Archive Loader

- Canonical JSONを読込
- Schema version確認
- 不正JSONで明確なエラー

### Task 4-2 Tournament List Page

- 大会名
- 開催日
- 参加者数
- アーカイブ状態
- `public/archives/index.json`を実行時に取得
- TypeScriptへ大会情報をハードコードしない
- indexへの追加だけで大会カードが増える

### Task 4-3 Ranking Page

- 麻雀順位
- サブゲーム順位
- スマホ優先表示

### Task 4-4 Comparison Statistics Page

- 全参加者の基本統計比較
- 麻雀・サブゲーム別pt推移
- グラフの参加者別表示切替

### Task 4-5 Match History Page

Status: Complete (2026-08-08)

- ラウンド・卓ごとに4名、素点、順位、ptを表示

### Task 4-6 Statistics Visualization

候補:

- 順位推移
- 累積pt推移
- 着順分布

グラフライブラリは1つに限定する。

### Task 4-7 Responsive Review

対象:

- iPhone Safari
- Android Chrome
- PC Chrome/Edge

---

# 11. Phase 5: Secure Archive and GitHub Pages

## Goal

大会アーカイブ全体を暗号化し、GitHub Pagesで閲覧できるようにする。

## Task 5-1 Python Archive Encryptor

### Requirements

- AES-256-GCM
- PBKDF2-HMAC-SHA-256
- random salt
- random IV
- password confirmation
- overwrite protection
- decryption verification

### Acceptance Criteria

- 正しいパスワードで復号可能
- 誤パスワードで失敗
- 改ざんで失敗
- 平文を上書きしない

## Task 5-2 Browser Decryptor

### Constraints

- Web Crypto API
- パスワードを送信しない
- localStorageへ保存しない
- 外部暗号ライブラリを原則使わない

### Acceptance Criteria

- Python暗号化ファイルを復号できる
- iPhone Safariで動作する
- 誤パスワード時に適切なメッセージ

## Task 5-3 Archive Index

`public/archives/index.json` を作成し、管理CLIから更新する。

### Acceptance Criteria

- Archive本体のメタデータからindex entryを生成する
- archiveId重複と参照先ファイル欠損を拒否する
- Webがindexを実行時に読み込む
- index追加時にWebコード変更を必要としない

## Task 5-4 GitHub Pages Deployment

### Acceptance Criteria

- main更新で自動デプロイ
- Hash Routerが動作
- `.enc` を取得可能
- 平文JSONが成果物に含まれない

## Task 5-5 Plaintext Leak Check

### Measures

- `.gitignore`
- CI検索
- Review checklist
- public配下検査

---

# 12. Phase 6: Supabase Foundation

## Goal

大会開催中の正本DB、認証、認可、RPCを構築する。

## Task 6-1 Local Supabase Setup

- Supabase CLIで起動
- migration適用
- seed適用
- reset可能

## Task 6-2 Database Schema

### Tables

- tournaments
- rule_sets
- players
- tournament_players
- mahjong_games
- mahjong_results
- subgame_definitions
- subgame_results
- user_profiles
- audit_logs
- submission_requests

### Acceptance Criteria

- PK/FK/UNIQUE/CHECKが定義
- DB resetで再現可能

## Task 6-3 RLS Policies

### Tests

- 未認証閲覧
- 参加者登録
- 参加者更新拒否
- 管理者訂正
- 他大会アクセス

### Acceptance Criteria

- RLS無効テーブルが残らない
- service role不要で通常機能が動く

## Task 6-4 Authentication

初期案:

- Organizer: Magic LinkまたはGoogle
- Participant: Anonymous Auth + join code

## Task 6-5 Register Game RPC

### Acceptance Criteria

- 4人分一括登録
- 得点再計算
- 二重卓拒否
- 同一ラウンド重複拒否
- submission_id冪等
- audit log記録

## Task 6-6 RPC Test Vectors

TypeScriptと同一のテストベクトルでSQL結果を検証する。

---

# 13. Phase 7: Tournament Input MVP

## Goal

スマートフォンから大会結果を登録し、順位を表示できる状態にする。

## Task 7-1 Live Tournament Dashboard

表示:

- 大会名
- 状態
- 現在ラウンド
- 順位
- 最近の登録

## Task 7-2 Mahjong Result Input Form

### UX Requirements

- 数値キーボード
- プレイヤー検索
- 重複選択防止
- 合計点即時表示
- 得点プレビュー
- 送信確認
- 二重タップ防止

## Task 7-3 Submission Integration

### Acceptance Criteria

- 成功時にフォームクリア
- 失敗時に入力保持
- conflictを分かりやすく表示
- submission_idを再利用

## Task 7-4 Result Correction

### Constraints

- 物理削除しない
- 理由必須
- 元結果保持
- audit log

## Task 7-5 Live Ranking

初期版はDBから結果を取得し、共通TypeScriptロジックで集計する。

---

# 14. Phase 8: Realtime Multi-Device

## Goal

複数端末からの同時利用と再同期を安定させる。

## Task 8-1 Realtime Subscription

Realtimeイベントは再取得トリガーとして使用する。

## Task 8-2 Reconnection Handling

### Acceptance Criteria

- 再接続
- 再購読
- 全件再取得
- 重複イベントで不整合しない

## Task 8-3 Concurrency Test

### Test Cases

- 異なる卓を同時登録
- 同じ卓を同時登録
- 同じsubmission_id再送
- 途中通信断
- 訂正と閲覧の同時実行

## Task 8-4 Failure UX

### Acceptance Criteria

- 登録成否が明確
- 不明状態を放置しない
- 再送前に登録済み確認
- 入力を失わない

---

# 15. Phase 9: Operational Features

## Task 9-1 Subgame Management

- サブゲーム定義
- 得点入力
- 訂正
- 総合順位反映

## Task 9-2 Matchup History

- ペア単位同卓回数
- ラウンド一覧
- 休憩回数
- 連続出場

## Task 9-3 Table Suggestion Model

候補ペナルティ:

```text
sameOpponentPenalty
restImbalancePenalty
consecutiveRestPenalty
consecutivePlayPenalty
rankingDifferencePenalty
constraintViolationPenalty
```

## Task 9-4 Table Candidate Generator

### Constraints

- 初期版は最適解保証不要
- 参加者40名程度で実用時間
- 上位3〜5候補を提示

## Task 9-5 Cross-Year Statistics

Status: Complete (2026-08-08)

### Acceptance Criteria

- playerIdで統合
- 年度別と通算を切替
- 参加年度数を表示
- 欠損年度を適切に扱う
- 年度ごとのニックネーム変更を同一人物として扱う
- `reference`記録を公式通算順位と分けて表示する

---

# 16. Phase 10: Production Readiness

## Task 10-1 Full Simulation

規模:

- 20〜40名
- 4〜8卓
- 複数ラウンド
- サブゲーム
- 訂正
- 通信断
- 二重登録

## Task 10-2 Device Test

- 複数iPhone
- Android
- PC
- 会場表示用画面

## Task 10-3 Performance and Load Check

### Acceptance Criteria

- 結果登録後数秒以内に反映
- 50端末程度の閲覧想定で問題なし
- アーカイブ復号が実用時間内

## Task 10-4 Security Review

確認項目:

- service role漏洩なし
- RLS
- 平文漏洩なし
- パスワード保存なし
- GitHub権限
- 依存関係
- ログ内容

## Task 10-5 Operation Manual

`docs/operation.md` を完成させる。

---

# 17. Codex Operating Rules

## 17.1 Request Size

Codexへは原則1タスクずつ依頼する。

悪い例:

```text
アプリ全体を作ってください
```

良い例:

```text
Task 3-1の麻雀得点計算純粋関数とテストだけを実装してください。
```

## 17.2 Required Prompt Content

各依頼には以下を含める。

- 参照文書
- Task ID
- 対象範囲
- 非対象
- 変更可能ファイル
- 完成条件
- 必須テスト
- 禁止事項

## 17.3 Codex Must Not Decide

Codexへ最終判断させない項目:

- 麻雀ルール
- Excel列の意味
- 同一人物判定
- セキュリティ要件緩和
- 本番リリース可否
- 欠損値の補完
- 公式順位修正

## 17.4 Review Sequence

```text
1. diff確認
2. 設計との整合
3. テスト確認
4. 実行
5. 境界条件確認
6. ドキュメント更新
7. commit
```

## 17.5 Commit Policy

- 1タスク1コミットを推奨
- commit messageにTask ID
- 生成物をまとめて無検証でcommitしない
- 大規模refactorと機能追加を同時に行わない

---

# 18. Definition of Done

各タスクは以下を満たして完了とする。

- 要件を満たす
- 対象外へ変更を広げていない
- 型チェック成功
- lint成功
- 自動テスト成功
- 必要な手動確認実施
- セキュリティ違反なし
- ドキュメント更新
- 未解決事項を記録
- レビュー可能な差分量

---

# 19. Review Checklist

## Architecture

- 責務分離が守られているか
- Domain LayerがUI/DBへ依存していないか
- Supabase依存がonline adapterへ閉じているか
- アーカイブ閲覧がSupabase非依存か

## Data

- playerIdを使用しているか
- nicknameをキーにしていないか
- schemaVersionがあるか
- 欠損を0扱いしていないか

## Security

- secretをブラウザへ置いていないか
- RLSがあるか
- service roleを使っていないか
- 平文データをcommitしていないか
- passwordを保存していないか

## Reliability

- DB transactionか
- idempotencyがあるか
- 二重登録を防げるか
- 再接続で復帰できるか

## Frontend

- スマホ操作可能か
- エラーが理解可能か
- 長大Componentでないか
- 不要な状態管理がないか

## Testing

- 正常系だけでないか
- 同点、端数、負点があるか
- 誤パスワード、改ざんを試しているか
- Excel公式結果と比較しているか

---

# 20. Milestones

## Milestone A: Historical Viewer PoC

完了条件:

- 2年分以上のExcel変換
- 公式順位再現
- 順位・個人成績表示

対象Phase: 0〜4

## Milestone B: Secure Archive Release

完了条件:

- 暗号化
- GitHub Pages公開
- iPhone閲覧
- 平文非公開

対象Phase: 5

## Milestone C: Tournament Input MVP

完了条件:

- Supabase
- スマホ入力
- 得点自動計算
- 訂正
- ランキング

対象Phase: 6〜7

## Milestone D: Multi-Device Ready

完了条件:

- 複数端末
- Realtime
- 再接続
- 二重登録防止

対象Phase: 8

## Milestone E: Production Ready

完了条件:

- サブゲーム
- 同卓履歴
- 模擬大会
- 運用手順

対象Phase: 9〜10

---

# 21. Initial Four-Week Plan

## Week 1

- Task 0-1 Repository Initialization
- Task 0-2 React/Vite Setup
- Task 0-3 Python Setup
- Task 1-1 Excel Inventory

## Week 2

- Task 1-2 Rule Extraction
- Task 1-3 Player Mapping
- Task 2-1 Domain Entity Definition
- Task 2-2 JSON Schema

## Week 3

- Task 2-3 TypeScript Types
- Task 2-4 Python Models
- Task 2-5 Sample Archive
- Task 3-1 Mahjong Scoring

## Week 4

- Task 3-2 Ranking
- Task 3-3 Statistics
- Task 4-1 Archive Loader
- Task 4-2 Tournament List
- Task 4-3 Ranking Page

4週間終了時点の期待成果:

- 代表Excelの構造が理解されている
- Canonical JSONが存在する
- 得点と順位を再現できる
- ブラウザで過去大会順位を閲覧できる

---

# 22. Risks and Mitigations

## Excel format differences

- 年度別adapter
- 人手確認
- 変換レポート

## React learning overhead

- UIを小タスク化
- Codex活用
- onboarding.md
- 高度な状態管理を避ける

## Codex-generated complexity

- 変更範囲指定
- ライブラリ追加制限
- diffレビュー
- 1タスク1責務

## Rule ambiguity

- scoring-rules.md
- test vectors
- Excel公式結果比較

## Free service changes

- Canonical JSON
- migration
- static archive
- Supabase再構築可能性

## Schedule loss of momentum

- Milestone Aを最優先
- 各Phaseに独立成果
- Could機能を後回し

---

# 23. Immediate Next Actions

2026年度の公式Excel受領を待つ間に、実データへ依存しないArchive追加基盤を完成させる。

## W-07A Cross-Year Player Registry

Status: Complete (2026-07-20)

### Outputs

- Git管理外の`data/private/player-registry.json`
- 台帳のSchemaまたはvalidator
- 新規playerId発行・既存playerId選択手順

### Acceptance Criteria

- playerIdは年度を含まない安定識別子である
- ニックネーム変更後も同一playerIdを利用できる
- ニックネームだけで人物を自動統合しない
- 未登録IDと別人へのID再利用を拒否する

## W-07B Tournament Archive Schema 1.0

Status: Complete (2026-07-28)

### Outputs

- `schemas/tournament-archive.schema.json`
- `schemas/archive-index.schema.json`

### Required Decisions

- 麻雀とサブゲームを独立部門にする
- サブゲームなしは`null`で表す
- 参加資格は`official`、`reference`、`notParticipating`とする
- 得点方式は`ruleId`、`ruleVersion`、パラメータで参照する
- Archiveへ実行可能コードを含めない

### Acceptance Criteria

- SchemaをArchive形式のSingle Source of Truthとする
- 途中参加者の対局を保持したまま公式順位から除外できる
- 公式順位が`official`以外を参照した場合にrejectする
- サブゲームあり・なしの両fixtureがvalidateされる

## W-07C Schema Validation and Sample Migration

Status: Complete (2026-07-28)

- TypeScriptとPythonで同じJSON Schemaを検証する
- 現在のArchive 0.2 fixtureを1.0へ移行する
- 暗号fixtureを再生成する
- Schema、型、実行時validatorの不一致をテストで検出する

## W-07D Scoring Rule Registry Contract

Status: Complete (2026-07-28)

このTaskではインターフェースと検証境界だけを定義し、大会運営用の得点計算は実装しない。

### Acceptance Criteria

- ruleIdとversionから純粋関数を選択できる契約がある
- ルール固有パラメータを検証できる
- 未知のruleIdと未対応versionを拒否できる
- 任意コード評価や汎用数式DSLを含まない

## W-07E Archive Publish CLI

Status: Complete (2026-07-28)

想定コマンド:

```bash
python tools/publish_archive.py data/plain/<archiveId>.json
```

### Responsibilities

- Archive Schema検証
- playerId台帳との照合
- 参加資格と公式順位の整合性検証
- パスワード対話入力
- 暗号化と復号一致確認
- `public/archives/<archiveId>.enc`生成
- `public/archives/index.json`更新
- 重複・意図しない上書きの拒否

平文JSON、パスワード、年度横断プレイヤー台帳はGitへ追加しない。

## W-08 Dynamic Archive Index

Status: Complete (2026-07-28)

- 起動時に`public/archives/index.json`を取得する
- 全大会を一覧表示する
- archiveIdから対象entryと暗号Archiveを解決する
- 復号済みArchiveは現在表示中の1大会だけメモリ保持する
- ハードコードされた`sampleArchiveEntry`を削除する

### Acceptance Criteria

- index entryと`.enc`追加後にWebコードを変更せず大会が表示される
- 不正index、未知archiveId、取得失敗を利用者向けに表示する
- 状態管理ライブラリを追加しない

## W-09 Multi-Year Addition Proof

Status: Complete (2026-07-28)

- 2年度分の匿名化fixtureを管理CLIで公開する
- 異なる大会をそれぞれ復号・閲覧できることを確認する
- 片方はサブゲームなし、片方は参考記録ありとする
- GitHub Pages production成果物に平文がないことを確認する

年度横断の集計画面はPhase 9のTask 9-5で実装する。W-09ではplayerIdが
複数Archive間で一貫することだけを検証する。

## Deferred Until Official Data Arrives

- 2026年度公式Excelの取り込み
- 実データの公式順位照合
- 2026年度Archiveの公開

Supabase、本番Tournament Mode、実際の得点計算関数はこの作業列に含めない。
実データに依存しないフロントエンド限定Tournament Modeプロトタイプは、
`tournament-mode-spec.md`と`tournament-mode-development-plan.md`に従って別ブランチで進める。

---

## 24. Summary

本計画は、過去大会データを用いたアーカイブ閲覧機能を先行し、その成果を基盤として次回大会のリアルタイム入力機能を追加する。

Codexは主として以下を担当する。

- 定型コード生成
- React画面
- TypeScript型
- Python変換ツール
- SQL migration
- テスト
- CI

プロジェクト所有者は以下を担当する。

- 要件
- 麻雀ルール
- Excel解釈
- データモデル判断
- セキュリティ判断
- コードレビュー
- 公式結果確認
- 本番運用判断

この分担により、Web開発未経験でも設計品質を維持しながら、実用アプリを段階的に構築する。
