# Mahjong Tournament Support System Onboarding Guide

- Version: 0.1.0
- Status: Draft
- Last Updated: 2026-07-14
- Related Documents:
  - `requirements.md`
  - `architecture.md`
  - `development-plan.md`

---

## 1. Purpose

本書は、本プロジェクトへ参加する開発者向けのオンボーディングガイドである。

主対象は、以下の経験を持つが、React/TypeScriptによるWebフロントエンド開発経験が少ない開発者とする。

- Python
- C/C++
- Verilog/SystemVerilog
- Git/GitHubの基礎
- 設計・検証・データモデルの経験

本書はReact全般を体系的に学ぶ教材ではない。

本プロジェクトを理解し、Codexを活用しながら実装・レビューするために必要な知識だけを扱う。

---

## 2. Project Summary

本システムは、仲間内のリアル麻雀大会を支援するWebアプリケーションである。

大会中:

- 参加者がスマートフォンから結果入力
- Supabaseへ保存
- 順位をリアルタイム更新

大会終了後:

- 大会データをJSONへ出力
- AES-256-GCMで暗号化
- GitHub Pagesへ配置
- ブラウザ内で復号して閲覧

技術の役割分担:

```text
React / TypeScript
    Web画面・入力・表示・共通ロジック

Supabase
    大会中のDB・認証・Realtime・整合性

Python
    Excel変換・検証・暗号化・管理ツール

GitHub Pages
    Webアプリと暗号化アーカイブの配信
```

---

## 3. Required Development Environment

### 3.1 Recommended Environment

- Windows
- WSL2 Ubuntu
- VS Code
- Git
- GitHub account
- Node.js LTS
- npm
- Python 3.12以降
- Supabase CLI
- Codex CLIまたはCodex対応開発環境

### 3.2 Repository Location

WSL上に配置することを推奨する。

```bash
~/projects/mahjong-tournament
```

Windowsファイルシステム配下より、WSLのLinuxファイルシステム配下の方がNode.jsやGitの動作が安定しやすい。

### 3.3 Initial Checks

```bash
git --version
node --version
npm --version
python3 --version
```

Supabase CLI導入後:

```bash
supabase --version
```

---

## 4. Repository Setup

### 4.1 Clone

```bash
git clone <repository-url>
cd mahjong-tournament
```

### 4.2 Web Application Setup

```bash
cd apps/web
npm install
npm run dev
```

ブラウザでViteの開発URLを開く。

### 4.3 Python Setup

リポジトリルートで実行する。

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

### 4.4 Test Commands

TypeScript:

```bash
cd apps/web
npm run lint
npm run typecheck
npm test
npm run build
```

Python:

```bash
pytest
```

### 4.5 Supabase Local Setup

```bash
supabase start
supabase db reset
```

終了:

```bash
supabase stop
```

---

## 5. Repository Structure

```text
mahjong-tournament/
├── apps/
│   └── web/
├── tools/
├── schemas/
├── supabase/
├── tests/
├── data/
├── docs/
├── .github/
└── README.md
```

### `apps/web`

React/TypeScriptのWebアプリ。

### `tools`

Python製の管理ツール。

- Excel importer
- JSON validator
- Archive encryptor
- Archive decryptor

### `schemas`

Canonical JSONと暗号化アーカイブのJSON Schema。

### `supabase`

DB migration、seed、設定。

### `tests`

TypeScript・Python・SQLで共有するテストデータや統合テスト。

### `data`

実データ置き場。

```text
data/raw
data/plain
```

はGit管理外とする。

### `docs`

要件、設計、計画、運用、ADR。

---

## 6. Minimum TypeScript Knowledge

### 6.1 Primitive Types

```ts
const name: string = "player-01";
const point: number = 32.1;
const active: boolean = true;
```

### 6.2 Object Type

```ts
type Player = {
  id: string;
  nickname: string;
  point: number;
};
```

Cの`struct`に近い。

### 6.3 Array

```ts
const players: Player[] = [];
```

### 6.4 Optional Property

```ts
type Player = {
  id: string;
  nickname: string;
  memo?: string;
};
```

`memo`は存在しない場合がある。

### 6.5 Union Type

```ts
type TournamentState =
  | "preparing"
  | "active"
  | "closed"
  | "archived";
```

不正な状態文字列を型レベルで防げる。

### 6.6 Function

```ts
function calculateTotal(
  mahjongPoint: number,
  subgamePoint: number,
): number {
  return mahjongPoint + subgamePoint;
}
```

### 6.7 Avoid `any`

```ts
const data: any = ...
```

は型検査を無効化するため原則禁止する。

外部データは`unknown`として受け、検証後に型へ変換する。

---

## 7. Minimum React Knowledge

### 7.1 Component

Reactでは画面をComponentへ分割する。

```tsx
type RankingTableProps = {
  rows: RankingRow[];
};

export function RankingTable({ rows }: RankingTableProps) {
  return (
    <table>
      <tbody>
        {rows.map((row) => (
          <tr key={row.playerId}>
            <td>{row.rank}</td>
            <td>{row.nickname}</td>
            <td>{row.totalPoint}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

Componentは、入力であるPropsから画面を生成する関数と考えると理解しやすい。

### 7.2 Props

親Componentから子Componentへ渡す入力。

```tsx
<RankingTable rows={rankingRows} />
```

LSI設計でいうポート入力に近いが、Reactではデータオブジェクトを渡す。

### 7.3 State

画面内で変化する一時状態。

```tsx
const [password, setPassword] = useState("");
```

例:

- 入力中の素点
- 選択中の参加者
- ダイアログ表示状態
- 復号パスワード

DBデータそのものを無条件にStateへ複製しない。

### 7.4 Event

利用者操作への反応。

```tsx
function handleSubmit() {
  // 登録処理
}

<button onClick={handleSubmit}>登録</button>
```

### 7.5 Effect

外部システムとの同期に使用する。

```tsx
useEffect(() => {
  // Realtime subscribe
  return () => {
    // unsubscribe
  };
}, []);
```

`useEffect`は便利だが、計算処理や通常の値変換には使わない。

### 7.6 Derived Value

既存データから計算できる値はStateへ保存せず、計算する。

```tsx
const totalPoint = mahjongPoint + subgamePoint;
```

ランキングも可能な限りDomain関数から導出する。

---

## 8. Application Layer Boundaries

### 8.1 Domain Layer

純粋な計算を置く。

```text
domain/
  scoring/
  ranking/
  statistics/
```

禁止:

- React import
- Supabase import
- DOM操作
- localStorage
- fetch

### 8.2 Online Layer

Supabaseとの通信を置く。

```text
online/
  repositories/
  realtime/
  auth/
```

### 8.3 Archive Layer

暗号化アーカイブを扱う。

```text
archive/
  crypto/
  loaders/
  validators/
```

### 8.4 UI Layer

画面と入力を扱う。

```text
pages/
components/
```

UIから直接複雑なSQL相当の集計を実装しない。

---

## 9. Data Flow Examples

### 9.1 Tournament Result Input

```text
Input Form
   ↓
Client validation
   ↓
Scoring preview
   ↓
Online repository
   ↓
Supabase RPC
   ↓
Database validation
   ↓
Commit
   ↓
Realtime event
   ↓
Ranking re-fetch
```

### 9.2 Archive Viewing

```text
Archive list
   ↓
Encrypted file fetch
   ↓
Password input
   ↓
Web Crypto decrypt
   ↓
JSON validation
   ↓
Domain model
   ↓
Ranking/statistics
   ↓
UI
```

---

## 10. npm and package.json

### 10.1 npm

Node.jsのパッケージ管理とスクリプト実行に使う。

```bash
npm install
npm run dev
npm test
npm run build
```

### 10.2 package.json

主に以下を定義する。

- 依存ライブラリ
- 開発用依存ライブラリ
- 実行スクリプト
- Node.js関連設定

新しい依存を追加する前に確認すること。

1. 標準APIで代替できないか
2. 既存依存で実現できないか
3. 保守されているか
4. バンドルサイズが過剰でないか
5. 本当に初期版で必要か

### 10.3 Lock File

`package-lock.json`をGit管理する。

再現可能な依存解決のため、手動削除しない。

---

## 11. Vite

ViteはReactアプリの開発サーバとビルドを担当する。

主要コマンド:

```bash
npm run dev
npm run build
npm run preview
```

GitHub Pagesでサブパス配信する場合、`base`設定が必要になる可能性がある。

例:

```ts
export default defineConfig({
  base: "/mahjong-tournament/",
});
```

実際のリポジトリ名に合わせる。

---

## 12. Supabase Basics

### 12.1 Supabase URL and Publishable Key

Webアプリには公開可能な接続情報を設定する。

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

これらは秘密鍵ではない。

ただし、RLSが正しく設定されていることが前提である。

### 12.2 Never Expose Service Role Key

以下は禁止。

```env
VITE_SUPABASE_SERVICE_ROLE_KEY=...
```

`VITE_`付き変数はブラウザへ埋め込まれるため、秘密情報を置かない。

### 12.3 Migration

DB変更はSQL migrationで管理する。

```bash
supabase migration new create_tournaments
```

ダッシュボードで変更した場合も、最終的にmigrationへ反映する。

### 12.4 RLS

RLSはブラウザから直接Supabaseへアクセスする構成の防御境界である。

RLSなしで公開テーブルを作らない。

---

## 13. Python Tooling Principles

PythonはWeb UIには使わず、以下へ集中させる。

- Excel読込
- 年度別変換
- JSON検証
- 暗号化
- 復号確認
- テストデータ生成

PythonツールはCLIとして実装し、処理結果とエラーを明確にする。

例:

```bash
python tools/import_excel.py \
  --year 2026 \
  --input data/raw/2026.xlsx \
  --output data/plain/2026.json
```

---

## 14. Git Workflow

### 14.1 Branch

1タスクごとにブランチを作る。

```bash
git switch -c task/3-1-scoring
```

### 14.2 Before Commit

```bash
git status
git diff
```

必ず確認する。

特に以下を確認する。

- Excelが入っていない
- 平文JSONが入っていない
- `.env`が入っていない
- secretが入っていない
- 無関係な変更がない

### 14.3 Commit

```bash
git add <reviewed-files>
git commit -m "Task 3-1: implement mahjong scoring"
```

`git add .`は内容を確認した後にのみ使う。

### 14.4 Pull Request

PRには以下を書く。

- Task ID
- 目的
- 主な変更
- テスト結果
- 手動確認
- 未解決事項
- スクリーンショット

---

## 15. Codex Workflow

### 15.1 Before Asking Codex

以下を準備する。

- 対象Task ID
- 参照文書
- 変更対象
- 完成条件
- 非対象
- テスト要件

### 15.2 Recommended Prompt

```text
docs/requirements.md、docs/architecture.md、
docs/development-plan.mdを参照してください。

Task 3-1 Mahjong Scoring Functionだけを実装してください。

対象:
- apps/web/src/domain/scoring/
- 関連テスト

非対象:
- React UI
- Supabase
- DB migration
- 他の統計機能

制約:
- 純粋関数
- any禁止
- 外部ライブラリ追加禁止

完成条件:
- 指定テストベクトルを通過
- npm run typecheck成功
- npm test成功

変更後、実装概要、変更ファイル、テスト結果、
残課題を報告してください。
```

### 15.3 After Codex Finishes

以下の順で確認する。

1. 変更ファイル一覧
2. diff
3. 依存追加
4. 設計との整合
5. テスト
6. 手動実行
7. 境界条件
8. ドキュメント更新

### 15.4 Do Not Accept Blindly

Codexが以下を行った場合は理由を確認する。

- 新しいライブラリ追加
- 大規模なディレクトリ変更
- 要件外機能追加
- `any`の導入
- テスト削除
- RLS緩和
- service role使用
- 平文データの追加
- 複雑な抽象化

---

## 16. Debugging Approach

### 16.1 Reproduce First

修正前に以下を明確にする。

- 期待結果
- 実際結果
- 再現手順
- 対象データ
- 発生環境

### 16.2 Narrow the Layer

問題がどの層かを切り分ける。

```text
UI
Domain logic
Online adapter
Supabase RPC
Database
Archive decrypt
Excel importer
```

### 16.3 Add a Test

再現可能なら、修正前に失敗テストを追加する。

特に以下は必ずテスト化する。

- 得点計算
- 同点処理
- 丸め
- 二重登録
- 暗号化互換
- Excel変換

### 16.4 Avoid Symptom Fixes

UIで数値を補正してDB不整合を隠すような修正を避ける。

正本の責務を確認して原因層を修正する。

---

## 17. Security Checklist for Daily Development

- `.env`をcommitしていない
- service role keyを使用していない
- RLSを無効化していない
- 平文Excelをcommitしていない
- 平文大会JSONをcommitしていない
- パスワードをコードへ書いていない
- `localStorage`へパスワードを保存していない
- 外部CDNからJavaScriptを読み込んでいない
- ログへ個人情報を出していない

---

## 18. Coding Guidelines

### 18.1 Keep Functions Small

1つの関数は1つの責務を持つ。

悪い例:

```text
入力取得
得点計算
Supabase登録
画面遷移
通知
```

を1関数で行う。

### 18.2 Prefer Pure Functions

計算ロジックは入力から出力だけを返す。

```ts
const result = calculateMahjongPoints(ruleSet, rawScores);
```

### 18.3 Explicit Names

短すぎる名前を避ける。

```ts
rawScore
finalPoint
tournamentId
submissionId
```

### 18.4 Error as Data

想定可能な入力エラーは、例外だけでなく明示的な結果型も検討する。

```ts
type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: DomainError };
```

### 18.5 Comments

コードから分かる処理を日本語で繰り返さない。

コメントには以下を書く。

- なぜ必要か
- ルール上の理由
- 直感に反する制約
- 将来変更時の注意

---

## 19. Testing Guidelines

### 19.1 Test Pyramid

優先順位:

1. Domain unit tests
2. Python conversion tests
3. SQL/RPC tests
4. Component tests
5. End-to-end tests

### 19.2 Scoring Tests

必須ケース:

- 通常順位
- 同点
- マイナス素点
- 端数
- 丸め境界
- オカ
- ウマ
- pt合計

### 19.3 Archive Tests

- 正しいパスワード
- 誤パスワード
- 改ざん
- 不正形式
- 未対応version
- Python暗号化とブラウザ復号の互換

### 19.4 Excel Import Tests

実Excelそのものを公開テストへ入れない。

匿名化fixtureを作成する。

---

## 20. Daily Development Routine

### Start

```bash
git status
git pull
git switch <task-branch>
```

文書とTaskを確認する。

### Work

- Codexへ小さな依頼
- diff確認
- テスト
- 手動確認
- 修正

### End

```bash
npm run lint
npm run typecheck
npm test
pytest
git status
git diff
```

Taskメモを更新し、commitする。

---

## 21. Learning Priorities

### Learn Now

- TypeScript object types
- React Component
- Props
- State
- Event
- `useEffect`の基本
- npm scripts
- Vite
- Git diff
- Supabase RLSの概念
- async/await
- JSON Schema

### Learn When Needed

- TanStack Query
- React Router
- Supabase Realtime
- Web Crypto API
- PostgreSQL function
- Pydantic
- GitHub Actions

### Do Not Learn Yet

- Redux
- Next.js
- Server Components
- Kubernetes
- Advanced CSS architecture
- Complex monorepo tooling
- Microservices
- GraphQL
- Full offline sync

---

## 22. First Week Checklist

- [ ] WSL上にリポジトリを配置
- [ ] Node.jsとnpm確認
- [ ] Python仮想環境作成
- [ ] React/Vite起動
- [ ] TypeScript test実行
- [ ] Python test実行
- [ ] `.gitignore`確認
- [ ] `data/raw`作成
- [ ] 過去Excelを配置
- [ ] ExcelがGit対象外であることを確認
- [ ] `requirements.md`を読む
- [ ] `architecture.md`を読む
- [ ] `development-plan.md`のTask 0-1を開始
- [ ] 最初のCodex依頼を実施

---

## 23. Common Questions

### Q. Reactを十分理解してから始めるべきか

不要。

必要な機能を実装しながら、変更差分を読んで学ぶ。

ただし、生成コードを理解せずマージしない。

### Q. PythonでWebアプリを作った方が早くないか

短期的には慣れているが、スマートフォンUI、静的配信、Realtime、長期拡張を考えるとReact/TypeScriptが適する。

PythonはExcel処理と管理ツールへ集中させる。

### Q. Supabaseのanon keyが公開されてよいのか

公開前提のキーである。

安全性はRLSとDB設計で確保する。

service role keyは公開禁止。

### Q. 全機能をCodexへ一括依頼してよいか

不可。

レビュー困難、要件逸脱、過剰設計の原因になるため、Task単位で依頼する。

### Q. 暗号化アーカイブのパスワードを保存してよいか

コード、GitHub、localStorageへ保存しない。

利用者が入力し、ブラウザメモリ上のみ保持する。

---

## 24. Definition of Ready for a Task

Task開始前に以下が揃っていること。

- 目的が明確
- 入力と出力が明確
- 参照文書がある
- 非対象が明確
- 完成条件がある
- テスト方法がある
- 未決仕様を含まない

未決仕様がある場合、コード生成前に文書を更新する。

---

## 25. Definition of Done for a Task

- 要件を満たす
- 設計に一致する
- 型チェック成功
- lint成功
- 自動テスト成功
- 手動確認済み
- secret漏洩なし
- 平文データ漏洩なし
- ドキュメント更新済み
- diffがレビュー済み
- commit済み

---

## 26. Summary

本プロジェクトで重要なのは、Reactの高度な知識ではなく、以下を守ることである。

1. データモデルを先に決める
2. Domain LogicをUIから分離する
3. Codexへ小さなTaskを依頼する
4. 生成コードをdiffとテストで確認する
5. Supabaseの重要操作をDB側で防御する
6. 平文大会データと秘密情報をGitへ入れない
7. 大会中と大会後の正本を明確に分ける

React/TypeScriptはWeb画面を実現する手段であり、プロジェクト所有者の主な役割は要件、設計、正解データ、レビューである。
