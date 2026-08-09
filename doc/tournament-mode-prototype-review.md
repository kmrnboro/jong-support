# Tournament Mode Prototype Review

- Version: 0.1.0
- Status: Implementation Complete - User Review Pending
- Last Updated: 2026-08-08
- Specification: `tournament-mode-spec.md`
- Development Plan: `tournament-mode-development-plan.md`

## 1. Implemented Scope

- メモリ内のサンプル大会を開始・終了
- 登録済み対局から暫定順位と最近の対局を表示
- 開始時の東・南・西・北順で参加者と素点を入力
- 素点合計と「持ち点 × 4」の一致を検証
- 仮着順・仮ptを登録前に確認
- 理由付き訂正、revision更新、訂正履歴
- リロード時の初期化

Supabase、永続化、外部状態管理、正式得点計算、サブゲームは追加していない。

## 2. Verification

自動確認:

- lint: 成功、warningなし
- typecheck: 成功
- test: 10 files / 36 tests passed
- production build: 成功

ブラウザ確認:

- 大会開始から結果入力、登録、訂正まで完了
- 99,900点の登録を「持ち点 × 4」不一致として拒否
- 空の訂正理由を拒否
- 訂正後に暫定順位、revision、訂正履歴を更新
- リロード後に大会状態と完了メッセージを初期化
- 320px、390px、PC幅でページ全体の横はみ出しなし

## 3. Implementation Findings

- 入力行は東・南・西・北で固定し、算出着順だけを横へ表示すると入力中に行が動かない
- 未対局者を0ptで順位へ含めると誤解を招くため、1件以上登録がある参加者だけを表示する
- 成功メッセージをURL履歴へ保持するとリロード後に残るため、セッションと同じReactメモリへ置く

## 4. User Review Checklist

- スマートフォンで4名を選択する操作量は許容できるか
- 東・南・西・北固定と着順表示を迷わず読めるか
- 合計点とエラーの表示位置は十分か
- 登録前確認で読み合わせに必要な情報が揃っているか
- 登録成功を認識できるか
- 訂正対象を見つけ、変更前後と理由を安全に確認できるか
- 暫定順位と登録済み対局の情報量は適切か

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
