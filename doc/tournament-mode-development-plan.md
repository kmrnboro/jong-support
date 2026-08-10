# Tournament Mode Prototype Development Plan

- Version: 0.1.0
- Status: Review Round 1 Changes Implemented
- Last Updated: 2026-08-10
- Specification: `tournament-mode-spec.md`

## 1. Objective

2026年度の実データやSupabaseへ依存せず、大会ダッシュボード、麻雀結果入力、
訂正を確認できるフロントエンド限定プロトタイプを段階的に実装する。

## 2. Policy

- `codex/tournament-mode`ブランチで作業する
- Archive Viewerと同じReactアプリを使う
- 1タスク1責務・1コミットを基本とする
- 状態遷移を純粋関数として先に実装する
- 共通化は実際に重複してから行う
- ライブラリ、Supabase、永続化を追加しない
- 入力・訂正のユーザーレビュー前に本番実装へ進まない

## 3. Scope

対象:

- サンプル大会セッション
- 大会状態、暫定順位、最近の対局
- 麻雀結果入力、登録前確認
- 理由付き訂正、訂正履歴
- 320px以上のレスポンシブ表示

対象外:

- Supabase、DB、Auth、RLS、RPC、Realtime
- 複数端末、永続化、正式得点計算
- サブゲーム、Archive export、実大会データ、本番公開

## 4. Minimal Structure

```text
apps/web/src/
  tournament/
    session.ts
    session.test.ts
    sampleSession.ts
  pages/
    TournamentDashboardPage.tsx
    MahjongResultInputPage.tsx
    MahjongResultEditPage.tsx
```

必要になるまでComponentやhookを追加しない。

## 5. Milestones

| Milestone | Task | Output | Review |
|---|---|---|---|
| P0 | W-11A | 仕様・計画 | 文書レビュー |
| P1 | W-11B | Session純粋関数 | コードレビュー |
| P2 | W-11C | Dashboard | 画面確認 |
| P3 | W-11D | Result Input | ユーザー操作レビュー必須 |
| P4 | W-11E | Correction | ユーザー操作レビュー必須 |
| P5 | W-11F | Responsive・レビュー記録 | 最終レビュー |
| P6 | W-11G | スマホレビュー指摘対応 | 再レビュー必須 |

## 6. W-11A: Specification and Plan

対象:

- `doc/tournament-mode-spec.md`
- `doc/tournament-mode-development-plan.md`

完了条件:

- Prototypeと本番実装の境界が明確
- Open DecisionsとReview Gateが記載されている
- 既存文書と矛盾しない

## 7. W-11B: Session Domain

対象:

- `apps/web/src/tournament/session.ts`
- `apps/web/src/tournament/session.test.ts`
- `apps/web/src/tournament/sampleSession.ts`

実装:

- `TournamentSession`、`LiveGame`、`GameCorrection`
- `startTournament`、`closeTournament`
- `registerGame`、`correctGame`
- `createLiveRanking`

テスト:

- 開始・終了
- 正常登録
- 状態不正、参加者重複、回・卓重複、素点合計不正
- 正常訂正、空理由
- 訂正時の素点合計不正
- 訂正後順位
- 元状態を変更しない

完了条件:

- React、Supabase、Web APIへ依存しない
- `any`を使用しない
- 正式得点計算を含めない

## 8. W-11C: Dashboard

対象:

- `apps/web/src/App.tsx`
- `apps/web/src/pages/TournamentDashboardPage.tsx`
- `apps/web/src/styles.css`

Route:

```text
/#/prototype/tournament
```

完了条件:

- 大会名、状態、暫定順位、最近の対局を表示する
- 状態変更と結果入力への導線がある
- 状態に応じて入力可否を表示する
- 320px幅で主要情報を確認できる

## 9. W-11D: Mahjong Result Input

対象:

- `apps/web/src/pages/MahjongResultInputPage.tsx`
- 必要な場合だけ小さな入力Component

Route:

```text
/#/prototype/tournament/input
```

完了条件:

- 回・卓と、開始時の東・南・西・北ごとに参加者・素点を入力できる
- 入力行を着順へ並べ替えず、算出した着順を各行に表示する
- playerId重複と回・卓重複を表示する
- 素点合計と「持ち点 × 4」の期待値を常時表示し、不一致なら登録できない
- サンプル計算であることを明示する
- 登録前確認後にメモリ内登録する
- エラー時に入力内容を失わない
- 登録後にDashboardへ反映する

ユーザーレビュー:

- 4名選択の操作量
- 東・南・西・北固定入力と着順表示の分かりやすさ
- 登録前確認の情報量
- 登録成功の分かりやすさ

このレビュー完了までAuth・DB設計へ進まない。

## 10. W-11E: Result Correction

対象:

- `apps/web/src/pages/MahjongResultEditPage.tsx`

Route:

```text
/#/prototype/tournament/games/:gameId/edit
```

完了条件:

- 現在値と訂正後の値を表示する
- 訂正理由を必須にする
- 確定前に変更前後を確認できる
- 訂正後の素点合計が「持ち点 × 4」でない場合は確定できない
- 訂正履歴をメモリ内へ追加する
- 訂正後に暫定順位を再計算する
- 物理削除を実装しない

ユーザーレビュー:

- 訂正対象の見つけやすさ
- 変更前後比較の見やすさ
- 確認操作の安全性

## 11. W-11F: Responsive Review and Report

確認幅:

- 320px
- 390px
- PC幅

確認項目:

- タップ領域、数値キーボード、フォーカス
- エラー通知、登録連打、戻る操作
- 長いnickname、表の横幅

出力:

- `doc/tournament-mode-prototype-review.md`
- 仕様書のOpen Decisions更新
- 本番バックエンドへ進むかの判断

## 12. Quality Gate

各Taskで実行する。

```bash
cd apps/web
npm run lint
npm run typecheck
npm test
npm run build
```

追加確認:

- Archive Viewerの既存テストが通る
- 新しい外部ライブラリとSupabase関連ファイルがない
- 実データがない
- Storageへ状態を保存していない

## 13. Commit Plan

```text
docs: define tournament mode prototype
feat: add tournament session domain
feat: add tournament prototype dashboard
feat: add prototype result input
feat: add prototype result correction
docs: record tournament prototype review
```

## 14. Stop Conditions

次の場合は実装を止めて仕様確認する。

- 正式得点ルールがないとUXを評価できない
- 入力者の役割により画面構成が大きく変わる
- 訂正に承認フローが必要になる
- Archiveモデルへ大会中固有情報を追加する必要がある
- Supabaseなしでは検証できない要件へ到達する

## 15. After Prototype

ユーザーレビュー後に、本番仕様と次の開発計画を別途作成する。

1. 正式得点ルールとテストベクトル
2. Supabase Schema、RLS、Auth
3. 結果登録RPC、冪等性、監査ログ
4. Realtime、再取得、複数端末模擬大会

本番要件と一致するDomain処理だけを残し、仮計算や役割切替は削除・置換する。

## 16. W-11G: Smartphone Review Follow-up

- 登録確認で最終着順と素点を強調する
- 検証失敗理由をOK付きダイアログへ表示する
- 訂正前後の着順と素点を並べて表示する
- 参加者別の素点推移ページを追加する
- 運営操作から入力終了後に再開できるようにする

W-11G反映版をスマートフォンで再レビューする。
