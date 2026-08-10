# Tournament Mode Prototype Specification

- Version: 0.1.0
- Status: Draft for Review
- Last Updated: 2026-08-10
- Related: `requirements.md`, `architecture.md`, `operation.md`

## 1. Purpose

Supabaseや本番用得点計算を実装する前に、大会中の結果入力、順位確認、
訂正の操作性を確認するフロントエンド限定プロトタイプを定義する。

確認対象は次の3点とする。

1. 卓代表者がスマートフォンから1卓4名分を入力できるか
2. 登録結果が暫定順位と対局一覧へ分かりやすく反映されるか
3. 運営者が誤登録を安全に訂正できるか

本書は本番Tournament Modeの完成仕様ではない。

## 2. Implementation Boundary

- Archive Viewerと同じリポジトリを使用する
- `prototype/tournament-mode`ブランチで実装する
- ブラウザメモリだけで動作し、リロードで初期化する
- 匿名サンプル大会だけを使用する
- UXレビュー完了前は`main`へmergeしない

対象外:

- Supabase、DB、Auth、RLS、RPC、Realtime
- localStorage、sessionStorage、IndexedDB
- 複数端末、競合処理、オフライン同期
- 正式得点計算、サブゲーム、次卓候補
- Canonical Archive出力、本番公開、実大会データ

## 3. Users

| Role | Prototypeでの操作 |
|---|---|
| Table Reporter | 1卓4名分の結果入力 |
| Organizer | 大会状態変更、結果確認、訂正 |
| Participant | 暫定順位と最近の対局の閲覧 |

認証・認可は実装せず、画面上の操作範囲だけを確認する。

## 4. Assumptions

- 1卓は4名、1件の登録で4名分をまとめて扱う
- 同一対局内で同じplayerIdを複数選択できない
- 素点は開始時の席順（東・南・西・北）で入力する
- 大会設定に持ち点を持ち、登録時の素点合計は「持ち点 × 4」とする
- プロトタイプのサンプル大会では持ち点を25,000点とする
- 麻雀とサブゲームのptは合算しない
- 大会中順位は有効な麻雀結果から生成する暫定値である
- Archiveの`officialResults`は使用しない
- プロトタイプ得点は本番ルールとして再利用しない

## 5. Tournament Lifecycle

| 状態 | 意味 | 新規入力 | 訂正 |
|---|---|---:|---:|
| `preparing` | 開始前 | 不可 | 不可 |
| `active` | 開催中 | 可 | 可 |
| `closed` | 入力終了 | 不可 | 可 |

状態変更はOrganizer操作とし、`closed`から`active`へ入力を再開できる。

## 6. Screens and Routes

```text
/#/prototype/tournament
  大会ダッシュボード

/#/prototype/tournament/input
  麻雀結果入力・登録前確認

/#/prototype/tournament/progress
  参加者別の素点推移

/#/prototype/tournament/games/:gameId/edit
  結果訂正
```

### 6.1 Dashboard

- 大会名、状態、登録済み対局数
- 暫定麻雀順位
- 最近の対局
- 結果入力、素点推移、運営操作への導線
- 運営操作として入力終了・再開

### 6.2 Result Input

- 回番号、卓番号
- 開始時の東・南・西・北に対応する参加者4名
- 席順を固定した4名分の素点
- サンプル順位・ptプレビュー
- 入力エラー、登録前確認、登録成功

入力中に行を着順へ並べ替えない。着順は素点から算出して各行の横に表示する。
登録前確認では入力欄より最終着順と素点を優先して表示する。
検証失敗時は理由とOKボタンをダイアログへ表示する。

### 6.3 Result Correction

- 現在値と訂正後の値
- 訂正理由
- 確定前の変更比較
- 訂正履歴

確定前は訂正前・訂正後の着順と素点を同じ位置で比較できるようにする。

### 6.4 Raw Score Progression

- 登録済み対局がある全参加者の素点推移
- 参加者ごとの表示ON/OFF
- 訂正後は現在有効な結果から再生成

## 7. User Flows

### 7.1 Register Result

1. Organizerが大会を`active`にする
2. Table Reporterが回・卓と、開始時の東・南・西・北ごとに参加者・素点を入力する
3. サンプル計算結果を確認する
4. 素点合計が「持ち点 × 4」であることを確認する
5. 確認画面で4名分を読み合わせる
6. 登録する
7. ダッシュボードの暫定順位と最近の対局へ反映される

### 7.2 Correct Result

1. Organizerが登録済み対局を選ぶ
2. 訂正内容と理由を入力する
3. 変更前後を確認する
4. 訂正を確定する
5. 訂正履歴を残し、暫定順位を再生成する

物理削除は行わない。

## 8. Functional Requirements

| ID | Requirement |
|---|---|
| TM-FR-001 | 外部通信なしでサンプル大会を開始できる |
| TM-FR-002 | 大会状態を`preparing`、`active`、`closed`へ変更できる |
| TM-FR-003 | `active`時だけ1卓4名分を登録できる |
| TM-FR-004 | 登録前にサンプル順位・ptを確認できる |
| TM-FR-005 | 同一対局のplayerId重複と同じ回・卓の二重登録を拒否する |
| TM-FR-006 | 登録・訂正後に暫定順位と最近の対局を更新する |
| TM-FR-007 | Organizerが理由付きで結果を訂正できる |
| TM-FR-008 | 訂正前後と理由をメモリ内で確認できる |
| TM-FR-009 | リロード時に初期状態へ戻る |
| TM-FR-010 | 素点合計が「持ち点 × 4」でない結果の登録・訂正を拒否する |
| TM-FR-011 | 入力終了後にOrganizerが結果入力を再開できる |
| TM-FR-012 | 検証失敗理由をOK付きダイアログへ表示する |
| TM-FR-013 | 別ページで参加者ごとの素点推移を比較できる |

## 9. Prototype State

大会中固有の状態をCanonical Archiveへ追加しない。

```text
TournamentSession
  tournament: id, name, status, startingScore
  players[]
  games[]
  corrections[]

Game
  gameId, roundNumber, tableNumber, revision
  results[4]: initialSeat, playerId, rawScore, rank, finalPoint

Correction
  correctionId, gameId, reason, before, after
```

DB用ID形式、監査ログSchema、日時の正本はプロトタイプで確定しない。

## 10. Domain Rules

次をReact非依存の純粋関数として実装する。

- `startTournament`
- `closeTournament`
- `resumeTournament`
- `registerGame`
- `correctGame`
- `createLiveRanking`
- `createRawScoreProgressions`

拒否するのは操作成立に必要な次の条件だけとする。

- `active`以外での新規登録
- 参加者が4名でない
- 同一対局内のplayerId重複
- 未登録playerId
- 同じ回・卓の重複
- 素点合計が「持ち点 × 4」でない
- 空の訂正理由

大会ルール固有の厳格な検証は行わない。

## 11. Scoring Boundary

```text
raw scores → PrototypeScoringAdapter → rank / finalPoint preview
```

- 画面へ「サンプル計算」と表示する
- 仮計算はprototype内へ閉じる
- 正式ルール受領後に置き換える
- Archive Viewerの計算・公式順位へ影響させない

同点処理、ウマ・オカ、丸めは未決定とする。

## 12. Live Ranking

- 有効な`finalPoint`をplayerIdごとに合計する
- 登録済み対局が1件以上ある参加者だけを表示する
- 同点時は安定した表示順を与えるが公式順位とは扱わない
- 訂正時は差分更新ではなく、有効な全対局から再生成する

## 13. UI and Data Policy

- 320px以上で操作できる
- 素点入力で数値キーボードを利用できる
- 東・南・西・北の入力行を登録完了まで固定する
- タップ領域とフォーカス表示を確保する
- エラーを色だけで表現しない
- 登録前確認と登録成功を区別する
- 確認画面では最終着順と素点を最も目立たせる
- 訂正画面では訂正前後を同時に表示する
- UI・状態管理ライブラリを追加しない
- 実名、認証情報、パスワード、実大会データを扱わない
- 外部送信・永続化を行わない

## 14. Acceptance Criteria

- サンプル大会を開始・入力終了・再開できる
- スマートフォン幅で1卓4名分を登録できる
- 入力内容とサンプル計算結果を登録前に確認できる
- 検証失敗理由をダイアログで確認できる
- 「持ち点 × 4」以外では登録・訂正できない
- 登録後に暫定順位と対局一覧が変化する
- 同じ回・卓の二重登録を拒否する
- 理由付きで結果を訂正し、順位を再計算できる
- 訂正前後の順位と素点を同時に確認できる
- 別ページで参加者ごとの素点推移を表示できる
- リロードで初期化する
- Domain処理がReactへ依存しない
- lint、typecheck、test、buildが成功する
- Supabaseと外部状態管理ライブラリを追加していない

## 15. Open Decisions

| ID | Decision | Prototype |
|---|---|---|
| TM-D-001 | 主な入力者 | 同じ画面でTable ReporterとOrganizerを想定 |
| TM-D-002 | 正式得点ルール | サンプル計算で代替 |
| TM-D-003 | 同点順位 | 公式仕様を決めない |
| TM-D-004 | 素点入力順 | 開始時の東・南・西・北で固定し、着順は自動表示 |
| TM-D-005 | 訂正権限 | UI上はOrganizerのみ |
| TM-D-006 | Auth・参加コード | 実装しない |
| TM-D-007 | 冪等性・競合・通信断 | 本番バックエンド設計へ延期 |

## 16. Review and Exit Gate

レビューでは入力操作量、確認情報、登録成功の認識、訂正の安全性、
ダッシュボードの情報量を確認する。

次が決まるまでSupabase実装へ進まない。

- 入力・訂正フローのユーザーレビュー完了
- 正式得点ルールの入力・出力仕様
- 入力者とOrganizerの認証方針
- 冪等性と複数端末競合の要件
