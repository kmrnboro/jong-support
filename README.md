# jong-support

リアル麻雀大会の過去結果を閲覧する Archive Viewer です。

現在は週末MVPの暗号化Archive Viewerとして、ブラウザ内でArchiveを復号し、
匿名化サンプル大会のトップ、部門別順位、比較統計を閲覧できます。パスワードは
画面のメモリ内だけで扱い、送信・永続化しません。大会中の入力機能や
Supabase連携は、このスコープには含みません。

表示内容:

- `officialResults`による麻雀・サブゲーム別の順位（総合ptなし）
- 全参加者を重ねた麻雀pt・サブゲームptの回別推移
- プレイヤーごとのグラフ表示切替
- 全参加者の対局数、平均順位、トップ率、ラス率の比較
- ラウンド・卓ごとの対局履歴、素点、順位、pt
- 開いた大会の集計値による年度横断成績と部門別優勝回数

2026サンプルのサブゲーム結果は画面確認用の仮データです。Archive内の
`subgame.dataStatus`を`sample`として保持し、画面にも仮データであることを表示します。

## 必要な環境

- Node.js 20以上
- npm 10以上
- Python 3.12以上（管理CLIを利用する場合）

## セットアップ

```bash
cd apps/web
npm install
```

## 開発サーバー

```bash
cd apps/web
npm run dev
```

`http://localhost:5173/jong-support/` をブラウザで開きます。
ルーティングにはHash Routerを使用するため、
順位画面は `/jong-support/#/archive/<archiveId>`、比較統計は
`/jong-support/#/archive/<archiveId>/statistics` 形式です。

2年度分の匿名化互換fixtureを画面で確認する場合のパスワードは
`weekend-mvp-2026` です。これはテスト専用であり、実大会では使用しないでください。

## 品質確認とビルド

```bash
cd apps/web
npm run lint
npm run typecheck
npm test
npm run build
npm run preview
```

`npm run build` の成果物は `apps/web/dist/` に生成されます。
`npm run preview` 後は `http://localhost:4173/jong-support/` でproduction buildを
確認できます。Viteの `base` は `/jong-support/` に設定しているため、
リポジトリ配下のGitHub Pagesでも静的アセットと暗号Archiveを解決できます。

## GitHub Pages公開

公開URL:

- https://kmrnboro.github.io/jong-support/

GitHubのリポジトリ設定で **Settings → Pages → Build and deployment → Source** を
**GitHub Actions** に設定します。`main`へpushすると
`.github/workflows/pages.yml` が次を順番に実行し、成功した成果物だけを公開します。

1. 追跡対象Excel・private台帳・公開JSONの検査
2. TypeScriptのlint・typecheck・test・buildとPython test
3. production成果物の平文混入検査
4. GitHub Pages artifactのアップロードとdeploy

Pull Requestではdeploy以外の同じ検査を行います。production成果物に含めるJSONは
非機密メタデータの `archives/index.json` だけで、大会本体は `.enc` のみ配信します。

## 年度横断playerId台帳

同一人物を年度をまたいで集計できるように、Git管理外の
`data/private/player-registry.json`で安定したplayerIdを管理します。

初回だけ空の台帳を作成します。

```bash
python tools/manage_players.py init
```

新規IDを発行する前に、現在または過去のニックネームで既存登録を検索します。

```bash
python tools/manage_players.py find "Player A"
python tools/manage_players.py add "Player A"
```

表示名が変わった場合もplayerIdは変更しません。

```bash
python tools/manage_players.py rename player_0123456789abcdef0123456789abcdef "Player Alpha"
python tools/manage_players.py validate
```

同じニックネームの別人を登録する場合だけ、検索結果を人が確認したうえで
`add`へ`--allow-duplicate-nickname`を付けます。CLIは名前だけで同一人物を
自動統合しません。

台帳はArchiveとは別の運営データです。変更後は暗号化された安全な保存先へ
バックアップし、リポジトリや共有フォルダーへ平文で置かないでください。

## Archive公開CLI

Python 3.12以上の仮想環境を作成し、開発依存をインストールします。

```bash
python -m venv .venv
# PowerShell: .\.venv\Scripts\Activate.ps1
# WSL/macOS: source .venv/bin/activate
python -m pip install -e ".[dev]"
```

Archive 1.0の平文JSONを検証し、playerId台帳と照合してから暗号化Archiveと
公開indexを同時に生成します。新しい年度の追加ではWebコードの変更は不要です。
パスワードと確認入力は端末上で対話的に求められます。

```bash
python tools/publish_archive.py data/plain/<archiveId>.json
```

公開前に次を自動確認します。

- `schemas/tournament-archive.schema.json`への適合
- 部門別参加資格と公式順位の整合性
- `data/private/player-registry.json`とのplayerId・ニックネーム照合
- archiveId重複、参照先欠損、既存ファイル上書き
- 暗号化直後のメモリ内復号一致

単独の暗号化・復号調査には`tools/encrypt_archive.py`と
`tools/decrypt_archive.py`も利用できます。すべてのCLIは既存出力の上書きを拒否します。

いずれのCLIも出力先が既に存在する場合は拒否します。暗号化後も入力した平文JSONは
自動削除されません。

Pythonテスト:

```bash
python -m pytest
```

## ディレクトリ

```text
apps/web/
  src/
    archive/     暗号Archiveの取得・ブラウザ内復号・最小構造検証
    components/  画面共通コンポーネント・順位表・SVGグラフ
    domain/      Reactに依存しないモデル・部門別順位・統計ロジック
    pages/       ルート単位の画面
```

Python CLI互換の暗号化fixtureは
`apps/web/public/archives/2026-sample-v1.enc`と
`apps/web/public/archives/2025-sample-v1.enc`、
公開大会一覧は `apps/web/public/archives/index.json`、
テスト用の匿名化平文fixtureは `tests/fixtures/` にあります。
平文fixtureはWebの公開成果物には含まれません。

実データは `data/raw/`、`data/plain/`、`data/private/`に置き、Gitへ追加しないでください。
Excel、復号済みJSON、`.env` 系ファイルも `.gitignore` の対象です。

## 設計文書

- [要件](doc/requirements.md)
- [アーキテクチャ](doc/architecture.md)
- [開発計画](doc/development-plan.md)
- [Tournament Modeプロトタイプ仕様](doc/tournament-mode-spec.md)
- [Tournament Modeプロトタイプ開発計画](doc/tournament-mode-development-plan.md)
- [Tournament Modeプロトタイプレビュー](doc/tournament-mode-prototype-review.md)
- [オンボーディング](doc/onboarding.md)
- [週末スプリント計画](doc/weekend-sprint-plan.md)
