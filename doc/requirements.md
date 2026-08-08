# Mahjong Tournament Support System Requirements

- Version: 0.1.0
- Status: Draft
- Last Updated: 2026-07-20

## 1. Project Overview

### Purpose

本システムは、リアル麻雀大会の運営を支援するWebアプリケーションである。

目的は以下のとおり。

-   スマートフォンから複数人が同時に結果入力できること
-   素点からウマ・オカを自動計算すること
-   リアルタイム順位を表示すること
-   大会終了後はGitHub Pagesのみで過去大会を閲覧できること
-   Excel運用を置き換えること

## 2. Development Principles

-   データモデルを最優先に設計する
-   GitHub Pagesを大会後の公開基盤とする
-   大会中のみSupabaseを利用する
-   Archiveを長期保存の正本とする
-   React + TypeScriptをフロントエンドの標準とする
-   Pythonは運営ツール（Excel変換・暗号化等）に利用する
-   Codexとの協調開発を前提とする

## 3. System Overview

### Tournament Mode

-   GitHub Pages
-   React
-   Supabase
-   Realtime
-   PostgreSQL

### Archive Mode

-   GitHub Pages
-   暗号化JSON
-   Browser Decryption
-   Statistics

## 4. Scope

### Weekend MVP Archive Viewer

週末MVPはArchive Modeのみを対象とし、Supabase関連機能は実装しない。

- 麻雀ptとサブゲームptを別部門として管理し、総合ptは表示・集計しない
- 各部門は保存済みの公式順位を表示する
- 各部門の回別累積ptを、全参加者を重ねたグラフで表示する
- グラフは参加者ごとに表示を切り替えられる
- 麻雀統計は個人ページではなく、全参加者の比較ページを基本とする
- ラウンド・卓ごとの対局履歴に順位、素点、ptを表示する
- 複数大会を`playerId`で結合し、麻雀統計と部門別優勝回数を年度横断表示する
- 復号済みArchive本体は現在表示中の1大会だけを保持し、年度横断用の集計値だけをメモリ内に保持する
- 実データ受領前のサブゲーム結果は、仮データと明示した場合に限り利用できる

### Archive 1.0 and Multi-Year Requirements

- `playerId`は大会・年度をまたいで同一人物に同じ値を使用する
- ニックネームは大会開催時点の表示名として各Archiveへ保存する
- 麻雀・サブゲームの参加資格を部門別に保持する
- 途中参加者は対局・統計・推移へ残し、参考記録として公式順位から除外できる
- サブゲームが存在しない年度を欠損として表現できる
- 得点方式は`ruleId`、`ruleVersion`、パラメータで指定する
- Archiveへ実行可能なJavaScript・Pythonコードを埋め込まない
- 既知の得点方式はUI・外部サービスに依存しない純粋関数として登録する
- 共通JSON Schemaに適合する年度は、Webコードを変更せず追加できる
- 平文JSONはGitへ追加せず、管理CLIが暗号Archiveと公開indexを生成する

### In Scope

-   大会管理
-   参加者管理
-   麻雀結果入力
-   サブゲーム入力
-   リアルタイム順位
-   統計表示
-   個人成績
-   同卓履歴
-   次卓候補
-   JSON Archive
-   暗号化
-   GitHub Pages公開

### Out of Scope

-   オンライン麻雀
-   会計
-   SNS連携
-   Push通知
-   高度なユーザー別認可

## 5. Technology Stack

### Frontend

-   React
-   TypeScript
-   Vite

### Backend

-   Supabase
-   PostgreSQL
-   Realtime
-   RLS

### Tools

-   Python
-   Excel Importer
-   Archive Encryptor
-   JSON Validator

## 6. Functional Requirements（概要）

FR-001 大会作成

FR-002 参加者登録

FR-003 麻雀ルール設定

FR-004 卓結果入力

FR-005 得点自動計算

FR-006 リアルタイム順位

FR-007 サブゲーム入力

FR-008 結果訂正

FR-009 アーカイブ生成

FR-010 過去大会閲覧

## 7. Archive Policy

-   大会終了後はJSONへエクスポートする
-   AES-256-GCMで暗号化する
-   GitHubには暗号化ファイルのみ配置する
-   復号はブラウザ内で実施する
-   平文JSONはGitへコミットしない
-   正式なJSON SchemaをArchive形式の正本とする
-   公開対象の追加は管理CLIを経由し、暗号Archiveとindexの整合性を検証する

## 8. Design Principles

-   Player IDと表示名を分離
-   Player IDを年度横断の安定した識別子とする
-   公式順位対象と参考記録を分離
-   得点計算ロジックをUIから分離
-   得点ルールを識別子・バージョン・パラメータで選択
-   オンライン・アーカイブで同じ集計ロジックを利用
-   JSON SchemaをSingle Source of Truthとする

## 9. Success Criteria

-   Excel運用を廃止できる
-   次回大会で実運用できる
-   GitHub Pagesで過去大会を閲覧できる
-   複数人同時入力できる
-   リアルタイム順位表示できる

------------------------------------------------------------------------

> 本書は初版であり、今後 architecture.md および development-plan.md
> にて詳細設計・実装計画を定義する。
