# Weekend Sprint Plan: Mahjong Tournament Archive Viewer

- Version: 0.1.0
- Target: 週末2日、合計8〜12時間
- Goal: 過去大会の暗号化アーカイブをGitHub Pages上で閲覧できる最小MVP
- Non-Goal: Supabase、同時入力、Realtime、次卓候補

---

## 1. Weekend Goal

週末終了時に、以下が成立していることを目標とする。

1. React/Vite/TypeScriptアプリが起動する
2. 匿名化または実データ由来の1大会分JSONを読み込める
3. 最終順位表を表示できる
4. 個人成績の最低限を表示できる
5. JSONをPython CLIで暗号化できる
6. ブラウザでパスワードを入力して復号できる
7. GitHub Pagesへ公開できる
8. iPhoneから閲覧できる

最終デモフロー:

```text
GitHub Pagesを開く
    ↓
大会を選ぶ
    ↓
パスワードを入力
    ↓
暗号化JSONをブラウザ内で復号
    ↓
最終順位と個人成績を表示
```

---

## 2. Scope Cut

### Must

- React/Vite/TypeScript
- GitHub Pages
- 1大会のみ
- 手作業または専用Pythonで作ったCanonical JSON
- 順位表
- 個人成績
- AES-256-GCM暗号化
- Web Crypto API復号
- スマホ表示

### Could

- 複数大会一覧
- 平均順位
- トップ率
- 対局履歴
- 順位推移グラフ
- Excel自動変換

### Weekendでは実施しない

- Supabase
- Auth/RLS
- Realtime
- 同時入力
- 結果訂正
- 次卓候補
- 年度横断集計
- 完全なJSON Schema
- 高度なUIデザイン

---

## 3. Recommended Schedule

## Friday Night / Start: 30〜60分

### Human Tasks

- GitHubリポジトリ作成
- WSLへclone
- 過去Excelから代表年度を1つ選ぶ
- 順位、参加者、対局結果が分かるか確認
- 実データを`data/raw/`へ配置
- `.gitignore`対象であることを確認

### Decision

週末中にExcel形式を完全自動解析しない。

- 最速案: 手作業で1大会分JSONを作る
- Excelが単純なら: その年度専用Importerを1本だけ作る

---

## Saturday Morning: 2〜3時間

### Task W-01 Repository Bootstrap

Codexへの依頼:

```text
docs/requirements.md、docs/architecture.md、
docs/development-plan.md、docs/onboarding.mdを参照してください。

週末MVPとしてArchive Viewerだけを実装します。
Supabase関連は一切実装しないでください。

以下を実施してください。
1. React + Vite + TypeScriptプロジェクト作成
2. Hash Router導入
3. src/domain、src/archive、src/pages、src/components作成
4. dev/build/lint/typecheck/test scripts追加
5. GitHub Pages用build設定
6. README更新
7. .gitignoreへdata/raw、data/plain、*.xlsx、*.decrypted.json、.env*を追加

制約:
- UIライブラリ追加禁止
- 状態管理ライブラリ追加禁止
- Supabase追加禁止
- 不要な抽象化禁止

変更ファイル、実行方法、テスト結果を報告してください。
```

確認:

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

---

## Saturday Midday: 2時間

### Task W-02 Minimal Archive Model and Sample Data

最小JSON例:

```json
{
  "schemaVersion": "0.1.0",
  "tournament": {
    "id": "2026",
    "name": "2026年度大会",
    "date": "2026-07-01"
  },
  "players": [
    { "playerId": "P001", "nickname": "Player A" }
  ],
  "games": [],
  "officialResults": [
    {
      "playerId": "P001",
      "mahjongPoint": 32.1,
      "subgamePoint": 0,
      "totalPoint": 32.1,
      "rank": 1
    }
  ]
}
```

Codexへの依頼:

```text
Task W-02として、週末MVP用の最小Archiveモデルを実装してください。

対象:
- src/domain/archive.ts
- src/domain/ranking.ts
- src/domain/statistics.ts
- 関連テスト
- public/sample/archive.json

要件:
- playerIdとnicknameを分離
- officialResultsを公式順位表示に利用
- gamesから対局数、平均順位、トップ率、ラス率を計算
- 純粋関数
- React依存禁止
- any禁止
- 外部ライブラリ追加禁止

Supabaseや得点再計算は実装しないでください。
```

---

## Saturday Afternoon: 2〜3時間

### Task W-03 Plain JSON Viewer

Codexへの依頼:

```text
Task W-03として、平文Archive JSONを表示する最小UIを実装してください。

画面:
1. 大会トップ
2. 最終順位表
3. プレイヤー詳細

要件:
- スマートフォン優先
- 順位、ニックネーム、総合pt、麻雀pt、サブゲームptを表示
- プレイヤー詳細に対局数、平均順位、トップ率、ラス率を表示
- Hash Router
- 単純なCSS
- UIライブラリ追加禁止
- グラフ実装禁止
- localStorage禁止
```

土曜終了条件:

- 平文JSONから順位表が表示される
- Player詳細へ移動できる
- iPhone幅で崩れない
- build成功

---

## Sunday Morning: 2〜3時間

### Task W-04 Python Archive Encryptor

Codexへの依頼:

```text
Task W-04として、Python製の大会Archive暗号化CLIを実装してください。

対象:
- tools/encrypt_archive.py
- tools/decrypt_archive.py
- tests/test_archive_crypto.py
- pyproject.tomlの必要最小限の更新

仕様:
- AES-256-GCM
- PBKDF2-HMAC-SHA-256
- random salt / IV
- iterationsをファイル保存
- Base64エンコード
- パスワードはgetpass入力
- encrypt時に確認入力
- 入力JSONを上書きしない
- 出力先存在時は拒否
- 暗号化後に内部で復号検証

禁止:
- パスワードを引数で渡す
- パスワードをログへ出す
- 独自暗号方式
- 平文ファイルの自動削除

テスト:
- 正常暗号化・復号
- 誤パスワード
- 改ざん
- 空ファイル
```

---

## Sunday Midday: 2〜3時間

### Task W-05 Browser Decryption

Codexへの依頼:

```text
Task W-05として、Python CLIで生成した暗号化Archiveを
ブラウザ内で復号する機能を実装してください。

対象:
- src/archive/decrypt.ts
- src/archive/loadArchive.ts
- src/pages/ArchiveUnlockPage.tsx
- 関連テスト

仕様:
- Web Crypto API
- PBKDF2-HMAC-SHA-256
- AES-GCM
- envelope version確認
- パスワードはメモリ内だけで保持
- localStorage/sessionStorage禁止
- 復号後にJSON parseと最小構造検証
- 誤パスワードと破損は同じ利用者向けエラー
- Python CLIとの互換fixtureを使用

禁止:
- 外部暗号ライブラリ
- パスワード送信
- 復号済みJSON保存
```

確認:

- 正しいパスワードで開く
- 誤パスワードで開かない
- リロード後に再入力が必要
- Network上でパスワード送信がない
- 平文版と順位が同じ

---

## Sunday Afternoon: 1〜2時間

### Task W-06 GitHub Pages Deployment

Codexへの依頼:

```text
Task W-06としてGitHub Pages公開を完成させてください。

要件:
- GitHub Actionsでlint、typecheck、test、build、deploy
- Vite base path対応
- Hash Router
- public/archives/index.json
- 暗号化Archive配信
- 平文JSONをproduction buildへ含めない
- READMEへ公開・ローカル実行手順追記

CIで以下を検査:
- *.xlsxが追跡されていない
- data/raw、data/plainが成果物にない
- public配下に平文大会JSONがない
```

最終確認:

1. iPhoneでGitHub Pagesを開く
2. 大会を選択
3. 正しいパスワードを入力
4. 順位表表示
5. 個人成績表示
6. 誤パスワード確認
7. リロード後に再入力要求
8. GitHubに平文データがないことを確認

---

## 4. Definition of Weekend Done

- [ ] React/ViteアプリがGitHub Pagesへ公開済み
- [ ] 暗号化Archiveが1大会分存在
- [ ] パスワード入力で復号可能
- [ ] 公式順位を表示
- [ ] 個人成績を表示
- [ ] iPhoneで閲覧可能
- [ ] 誤パスワードで閲覧不可
- [ ] GitHubに平文Excelなし
- [ ] GitHubに平文本番JSONなし
- [ ] build/test成功
- [ ] READMEに操作手順あり

---

## 5. Stop Rules

問題が出た場合、以下の順で削る。

1. グラフ
2. 対局履歴画面
3. 複数大会対応
4. Excel自動変換
5. 詳細JSON Schema
6. 個人成績の詳細項目

削ってはいけないもの:

- 公式順位
- 暗号化
- ブラウザ復号
- スマホ表示
- 平文非公開
- 最低限のテスト

---

## 6. Human vs Codex

### Human

- 代表Excel選定
- Excel列の意味判断
- 公式順位確認
- 1大会分JSON準備
- パスワード決定
- diffレビュー
- iPhone確認
- GitHub公開判断

### Codex

- プロジェクト初期化
- TypeScript型
- 集計関数
- React UI
- Python暗号化CLI
- Web Crypto復号
- テスト
- GitHub Actions
- README更新

---

## 7. Commit Sequence

```text
Task W-01: initialize archive viewer project
Task W-02: add archive model and domain calculations
Task W-03: add ranking and player pages
Task W-04: add archive encryption CLI
Task W-05: add browser archive decryption
Task W-06: deploy archive viewer to GitHub Pages
```

---

## 8. Monday Backlog

- 過去Excel importer
- 複数大会対応
- JSON Schema正式版
- 対局履歴
- グラフ
- Supabase local setup
- DB schema
- Result input RPC
- スマホ入力画面
- Realtime ranking

週末MVPへSupabaseを無理に追加しない。
