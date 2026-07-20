# jong-support

リアル麻雀大会の過去結果を閲覧する Archive Viewer です。

現在は週末MVPの暗号化Archive Viewerとして、ブラウザ内でArchiveを復号し、
匿名化サンプル大会のトップ、最終順位、個人成績を閲覧できます。パスワードは
画面のメモリ内だけで扱い、送信・永続化しません。大会中の入力機能や
Supabase連携は、このスコープには含みません。

表示内容:

- `officialResults`による公式順位
- 総合pt、麻雀pt、サブゲームpt
- 対局数、平均順位、トップ率、ラス率

## 必要な環境

- Node.js 20以上
- npm 10以上

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
順位画面は `/jong-support/#/archive/<archiveId>`、個人成績は
`/jong-support/#/player/<playerId>` 形式です。

匿名化された互換fixtureを画面で確認する場合のパスワードは
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

1. 追跡対象Excelと公開JSONの検査
2. lint、typecheck、test、build
3. production成果物の平文混入検査
4. GitHub Pages artifactのアップロードとdeploy

Pull Requestではdeploy以外の同じ検査を行います。production成果物に含めるJSONは
非機密メタデータの `archives/index.json` だけで、大会本体は `.enc` のみ配信します。

## Archive暗号化CLI

Python 3.12以上の仮想環境を作成し、開発依存をインストールします。

```bash
python -m venv .venv
# PowerShell: .\.venv\Scripts\Activate.ps1
# WSL/macOS: source .venv/bin/activate
python -m pip install -e ".[dev]"
```

平文Archive JSONを暗号化します。パスワードと確認入力は端末上で対話的に求められます。

```bash
python tools/encrypt_archive.py \
  data/plain/tournament.json \
  apps/web/public/archives/tournament.enc
```

復号確認もパスワードを対話入力します。

```bash
python tools/decrypt_archive.py \
  apps/web/public/archives/tournament.enc \
  data/plain/tournament.decrypted.json
```

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
    components/  画面共通コンポーネント・順位表
    domain/      Reactに依存しないモデル・順位・統計ロジック
    pages/       ルート単位の画面
```

Python CLI互換の暗号化fixtureは `apps/web/public/archives/2026-sample.enc`、
公開大会一覧は `apps/web/public/archives/index.json`、
テスト用の匿名化平文fixtureは `tests/fixtures/archive.json` にあります。
平文fixtureはWebの公開成果物には含まれません。

実データは `data/raw/` または `data/plain/` に置き、Gitへ追加しないでください。
Excel、復号済みJSON、`.env` 系ファイルも `.gitignore` の対象です。

## 設計文書

- [要件](doc/requirements.md)
- [アーキテクチャ](doc/architecture.md)
- [開発計画](doc/development-plan.md)
- [オンボーディング](doc/onboarding.md)
- [週末スプリント計画](doc/weekend-sprint-plan.md)
