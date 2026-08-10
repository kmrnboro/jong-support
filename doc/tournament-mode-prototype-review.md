# Tournament Mode Prototype Review

- Version: 0.1.0
- Status: Review Round 1 Changes Implemented - Round 2 Pending
- Last Updated: 2026-08-10
- Specification: `tournament-mode-spec.md`
- Development Plan: `tournament-mode-development-plan.md`

## 1. Implemented Scope

- メモリ内のサンプル大会を開始・終了
- 登録済み対局から暫定順位と最近の対局を表示
- 開始時の東・南・西・北順で参加者と素点を入力
- 素点合計と「持ち点 × 4」の一致を検証
- 仮着順・仮ptを登録前に確認
- 理由付き訂正、revision更新、訂正履歴
- 検証理由のダイアログ、訂正前後比較
- 参加者別の素点推移
- 入力終了後の運営者による再開
- リロード時の初期化

Supabase、永続化、外部状態管理、正式得点計算、サブゲームは追加していない。

## 2. Verification

自動確認:

- lint: 成功、warningなし
- typecheck: 成功
- test: 11 files / 39 tests passed
- production build: 成功

ブラウザ確認:

- 大会開始から結果入力、登録、訂正まで完了
- 99,000点の登録を「持ち点 × 4」不一致として拒否し、理由をダイアログ表示
- 登録前に最終着順順の参加者、開始時の席、素点を表示
- 訂正前後のrevision、着順、参加者、素点と訂正理由を同時表示
- 訂正後に暫定順位、revision、訂正履歴、素点推移を更新
- 入力終了後、運営操作から入力を再開
- リロード後に大会状態と完了メッセージを初期化
- 320px幅で素点推移を含むページ全体の横はみ出しなし

## 3. Implementation Findings

- 入力行は東・南・西・北で固定し、算出着順だけを横へ表示すると入力中に行が動かない
- 未対局者を0ptで順位へ含めると誤解を招くため、1件以上登録がある参加者だけを表示する
- 成功メッセージをURL履歴へ保持するとリロード後に残るため、セッションと同じReactメモリへ置く

## 4. User Review Round 1

| Review | Result | Follow-up |
|---|---|---|
| 4名選択の操作量 | 許容できる | 変更なし |
| 東南西北と着順 | 順位が見にくい | 確認画面で最終着順と素点を強調 |
| 合計点・エラー | 位置は十分 | 検証失敗理由をOK付きダイアログへ表示 |
| 登録前確認 | 順位と点数が必要 | 着順順の確認表示へ変更 |
| 登録成功 | 認識できる | 変更なし |
| 訂正確認 | 変更前が分かりにくい | 訂正前後を並べて表示 |
| 暫定順位 | 適切 | 別ページへ素点推移を追加 |
| 入力終了 | 再開できず不安 | 運営操作へ終了・再開を配置 |

Round 2では、最終着順の読みやすさ、ダイアログ、訂正前後比較、
素点推移、入力再開を確認する。

## 5. Remaining Decisions

- 正式なウマ・オカ、丸め、同点順位
- 主な入力者とOrganizerの認証方法
- 訂正権限と承認フロー
- 冪等性、複数端末競合、通信断

ユーザー操作レビューと上記判断が終わるまで、本番バックエンド実装へ進まない。

## 6. Smartphone Review

`codex/tournament-mode`ブランチの`Verify and deploy GitHub Pages`を
`workflow_dispatch`で実行すると、mainへmergeせずレビュー版をPagesへ配置できる。

```text
https://kmrnboro.github.io/jong-support/#/prototype/tournament
```

GitHub Pagesは単一環境のため、手動deploy中はこのブランチの成果物が公開版になる。
Archive Viewerも同じ成果物へ含まれる。mainのworkflowを再実行するとmain版へ戻る。
