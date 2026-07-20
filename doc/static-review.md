# W-01〜W-06 静的レビュー

- 実施日: 2026-07-19
- 対象: 週末MVP Archive Viewer
- 方法: 文書とソースコードの静的比較
- 非対象: コード修正、実機確認、GitHub Pages上の動作確認

## 1. 結論

現行実装は、週末MVPの中心設計には概ね適合している。

- React / Vite / TypeScriptとHash Routerを使用している
- Archive ViewerはSupabaseへ依存していない
- DomainはReact、Web Crypto、外部サービスへ依存しない純粋関数である
- `officialResults`を公式順位の正本としている
- 暗号化はPython CLI、復号はブラウザ内という責務分離になっている
- パスワードと復号済みArchiveはブラウザメモリ上だけに保持される
- UI、状態管理、暗号処理の不要なライブラリを追加していない
- production成果物にはArchive本体の平文JSONを含めない構成である

なお、レビュー時点ではW-01〜W-06の実装ファイルがまだ未追跡である。したがって、本書のGitHub Actions／Pages評価はローカルの構成に対する静的評価であり、GitHub上のdeploy成功を意味しない。

一方、リリース前に判断または修正したい事項が3件ある。

1. 合成fixtureとテスト用パスワードの扱いが文書間で矛盾している
2. 復号後の最小構造検証が参照整合性を保証せず、表示時例外が起こり得る
3. CIがPython暗号化CLIのテストを実行していない

保守性の最大の改善余地はCSSとGitHub Actionsにある。Domain、暗号処理、画面のファイル分割は、おおむね妥当であり、単純にファイル数だけを減らすための統合は推奨しない。

## 2. 判断基準

主に以下を基準とした。

- `requirements.md` 7章: 暗号化、ブラウザ復号、平文非公開
- `architecture.md` 5.2、7章、8章、11章、12章、17章、20章
- `development-plan.md` Phase 0、2、4、5、Review Checklist
- `onboarding.md` Application Layer Boundaries、Coding Guidelines、Archive Tests
- `operation.md` Archive Encryption、GitHub Publication、Password Sharing
- `weekend-sprint-plan.md` Scope Cut、W-01〜W-06、Stop Rules

週末MVPでは、長期構想の全体設計よりも `weekend-sprint-plan.md` のScope Cutを優先した。

## 3. 規模の概況

| 区分 | ファイル数 | 行数 | 評価 |
|---|---:|---:|---|
| Web production TypeScript / TSX | 16 | 996 | 妥当 |
| Webテスト | 7 | 311 | 妥当 |
| CSS | 1 | 638 | MVPとして大きい |
| Pythonツール | 4 | 373 | 暗号処理として妥当 |
| Pythonテスト | 1 | 153 | 妥当 |

production TypeScriptのファイル数は多すぎない。`pages`、`components`、`domain`、`archive`の4境界も、文書と一致している。

CSSは1ファイルだが638行あり、production TypeScript全体の約64%に相当する。ファイル数よりも、この1ファイルの変更コストが保守上の問題になりやすい。

## 4. 指摘事項

### R-01 高: 平文fixtureとパスワード方針が文書内で矛盾している

対象:

- `requirements.md:120-122`
- `development-plan.md` Task 2-5 Sample Archive
- `operation.md:838-843`
- `tests/fixtures/archive.json`
- `README.md:40-41`

`requirements.md` と `operation.md` は、平文大会JSONおよびArchiveパスワードをGitHubへ置かないとしている。一方、`development-plan.md` はGit公開可能なサンプルArchiveを要求しており、現行実装は完全合成の平文fixtureと、その非機密テスト用パスワードをGit管理対象にしようとしている。

現状のfixtureは `Player A`〜`Player J` の合成データなので、実データ漏洩ではない。しかし、文書上は「合成fixtureは許可」という例外が定義されていない。CIも `public` とproduction成果物だけを検査し、リポジトリ全体のArchive形式JSONは拒否しない。

推奨:

- 方針を「実大会由来の平文JSONは禁止。完全合成かつ非機密のfixtureは `tests/fixtures` に限り許可」と明記する
- 本番パスワード禁止と、非機密のdemo credentialを文書上で区別する
- 文字列検索による本番ニックネーム確認は、引き続き公開前の人手確認に残す

完全合成fixtureを削除するとPython／Web Crypto互換試験が複雑になるため、fixtureを維持して文書の矛盾を解消する方が短く保守しやすい。

### R-02 高: 復号後検証と表示層の前提が一致していない

対象:

- `apps/web/src/archive/loadArchive.ts:76-93`
- `apps/web/src/domain/ranking.ts:18-21`
- `tools/archive_crypto.py` の `_validate_plain_archive`

`isTournamentArchive` は各フィールドの型を確認するが、次は確認しない。

- `officialResults.playerId` が `players` に存在すること
- `games.results.playerId` が `players` に存在すること
- playerIdや公式順位の重複

そのため、暗号化・復号に成功して最小構造検証も通過した後、`createOfficialRanking` が未知のplayerIdで例外を投げる可能性がある。Python CLIも入力がJSON objectであることしか確認しないため、この状態のArchiveを生成できる。

推奨:

- `loadArchive.ts` 内の最小検証へ、表示に必要な参照整合性だけを追加する
- 新しいvalidatorファイルやJSON Schemaライブラリは追加しない
- 完全なSchema検証、得点整合性、4人卓検証は週末MVP外として維持する

これは抽象化追加ではなく、AdapterがDomainへ渡す値の前提を揃える小さな修正である。

### R-03 高: CIがPython暗号化CLIを検証していない

対象:

- `development-plan.md` Task 0-4 CI Setup
- `.github/workflows/pages.yml:82-99`

設計文書のCI PipelineはTypeScriptとPythonの両方を含むが、現行workflowの`test`はVitestだけである。ブラウザ側の互換fixture試験は既存fixtureを復号するため、Python CLIが将来壊れても検出できない。

推奨:

- CIへPythonセットアップ、`pip install -e ".[dev]"`、`python -m pytest`を追加する
- Python linterは現在未選定なので、W-06へ新しい依存を追加せず後続タスクにする

暗号化CLIは公開Archiveの生成経路なので、pytestだけはdeploy前に実行する価値が高い。

### R-04 中: 対局数を「卓」と表示している

対象:

- `apps/web/src/pages/HomePage.tsx:45`
- `apps/web/public/archives/index.json:11`

`gameCount`はArchive内のゲーム数4件を表すが、画面では「4卓」と表示する。サンプルは2卓を2ラウンド実施したデータなので、卓数と対局数は一致しない。

推奨:

- 表示単位を「対局」または「半荘」に変更する
- `gameCount`の意味を対局レコード数に固定する

### R-05 中: CSSが週末MVPとして過剰

対象:

- `apps/web/src/styles.css` 全638行

スマホ対応、表の横スクロール、フォーム状態、フォーカス表示は必要である。一方、次は「単純なCSS」「高度なUIデザインはしない」というScopeより厚い。

- stickyかつblur付きヘッダー
- radial gradient背景
- 多段階のカード、影、バッジ装飾
- ページごとに細分化されたタイポグラフィ
- 1〜3位専用の装飾
- motion media query

推奨:

- 色、余白、カード、表、フォーム、2段階のレスポンシブだけへ絞る
- 見た目を変えるだけのselectorから削る
- CSS ModulesやCSS-in-JSなど新しい仕組みは追加しない
- まず300〜400行程度を目安にし、行数達成そのものは目的にしない

アクセシビリティ用のfocus、`visually-hidden`、reduced-motion対応は削減対象にしない。

### R-06 中: CI内に重複検査がある

対象:

- `apps/web/package.json:8`
- `.github/workflows/pages.yml:89-99`
- `.github/workflows/pages.yml` の公開index用inline Node検証

workflowは`npm run typecheck`を実行した後、内部でもtypecheckする`npm run build`を実行するため、型検査が2回走る。

また、公開indexの内容は`archiveIndex.test.ts`で、暗号化fixtureの存在と形式は`decrypt.test.ts`で検証される。一方、workflowにも約40行のinline Node検証があり、同じ前提を複数箇所で保守する状態になっている。

推奨:

- `build` scriptを`vite build`だけにし、CIとREADMEでは`typecheck`を明示的に先行させる
- workflowには漏洩防止のshell検査を残す
- indexの構造・`.enc`互換性は自動テストを正本にし、inline Node検証は削除する

セキュリティ境界である「余分なpublic JSON」「成果物内のraw/plain」「追跡Excel」の検査は削除しない。

### R-07 低: Archive indexを実行時に利用していない

対象:

- `apps/web/public/archives/index.json`
- `apps/web/src/archive/archiveIndex.ts`
- `apps/web/src/archive/archiveIndex.test.ts`

公開indexと画面表示用`sampleArchiveEntry`が二重管理され、テストで一致を保証している。`architecture.md`の通常フローはArchive listからindexを取得する想定だが、週末MVPは1大会のみで、複数大会一覧はCould要件である。

判定:

- 現在は許容する
- indexをfetchするためだけにloading state、取得エラー、追加loaderを増やす方がMVPには過剰
- 2大会目を追加する時点で、公開indexを実行時の正本へ変更する

現時点でbuild時生成スクリプトや追加ライブラリを導入しない。

### R-08 低: 小さいファイルの整理余地は限定的

候補:

- `apps/web/src/domain/README.md`: 上位文書と重複するため削除可能
- `apps/web/src/archive/routes.ts`: 7行だが、安全なURL生成を一箇所へ集めている
- `apps/web/src/archive/routes.test.ts`: 13行だが、URL encodeの退行を防ぐ
- `NotFoundPage.tsx`: 15行だが、route単位のpage分割に合う

推奨:

- `domain/README.md`は削除候補
- `routes.ts`、route test、route単位pageは維持する
- `RankingTable`と`ArchivePage`も責務が明確なので統合しない

数行の削減だけを目的に画面、Domain、暗号Adapterを結合すると、文書が求める責務分離を損なう。

## 5. 過剰機能の確認

### 実装されておらず、適切

- Supabase、Auth、RLS、Realtime
- 状態管理ライブラリ、TanStack Query
- UIライブラリ、グラフライブラリ
- PWA、キャッシュ、分析SDK
- 得点再計算
- 対局履歴、年度横断集計、複数大会UI
- 完全なJSON Schema

### Could要件だが、依頼によって実装されており妥当

- 平均順位
- トップ率
- ラス率

これらは当初Couldだが、W-02で明示的に要求されたため過剰機能ではない。

### 見た目として過剰

- CSS上の装飾量

機能面の過剰実装は見当たらない。削減対象は主に装飾とCI内の重複である。

## 6. 適合性一覧

| 項目 | 判定 | 補足 |
|---|---|---|
| React + Vite + TypeScript | 適合 | 最小依存 |
| Hash Router | 適合 | GitHub Pages向け |
| Supabase非依存 | 適合 | 関連依存・コードなし |
| Domain純粋関数 | 適合 | React、fetch、crypto依存なし |
| playerId / nickname分離 | 適合 | IDを参照キーに使用 |
| officialResults使用 | 適合 | 得点再計算なし |
| Web Crypto復号 | 適合 | PBKDF2 + AES-GCM |
| パスワードをメモリだけに保持 | 適合 | Storage APIなし |
| Python CLI互換 | 適合 | fixture試験あり |
| Archive index | 部分適合 | 配信するが実行時には未使用 |
| 復号後の構造検証 | 部分適合 | 型は検証、参照整合性は未検証 |
| GitHub Actions deploy | 適合 | mainのみdeploy |
| CI全体 | 部分適合 | Python testなし |
| 平文非公開方針 | 要決定 | 合成fixture例外が未定義 |
| モバイル対応 | 静的には適合 | iPhone実機確認は未実施 |

## 7. 推奨対応順

### リリース前

1. 合成fixture／demo credentialの例外を文書で決定する
2. 復号後のplayerId参照整合性を最小validatorへ追加する
3. CIでPython pytestを実行する
4. `gameCount`の表示単位を修正する
5. iPhone実機と公開Pagesで手動確認する

### リリース後でもよい

1. CSSを段階的に簡素化する
2. build/typecheckとworkflow内index検証の重複を減らす
3. `domain/README.md`を削除する

### 今は行わない

1. Archive index fetch対応
2. JSON Schema導入
3. ファイル数削減を目的としたComponent統合
4. Python暗号モジュールの短縮リファクタリング
5. 新しいライブラリや共通基盤の追加

## 8. 最終判定

設計方向は正しい。Domain、Archive Adapter、UI、Python CLIという境界も、週末MVPとして十分に小さい。

ただし、「平文非公開」の定義と復号後データの信頼境界はリリース前に明確化すべきである。コード量削減はCSSとCIへ集中し、暗号処理、検証、Domain、テストを短さのために削らないことを推奨する。
