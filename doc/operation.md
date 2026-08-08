# Mahjong Tournament Support System Operations Manual

- Version: 0.1.0
- Status: Draft
- Last Updated: 2026-08-08
- Related Documents:
  - `requirements.md`
  - `architecture.md`
  - `development-plan.md`
  - `onboarding.md`

---

## 1. Purpose

本書は、リアル麻雀大会支援Webアプリケーションを実運用するための手順を定義する。

対象範囲は以下とする。

- 大会1か月前からの準備
- 大会前週・前日の確認
- 大会当日の開始手順
- 大会中の結果入力と監視
- 誤入力訂正
- 通信障害・サービス障害時の対応
- 大会終了処理
- JSONエクスポート
- 暗号化
- GitHub Pagesへのアーカイブ公開
- 大会後の保管と次年度準備

本書は、運営者が当日に迷わず操作できることを優先する。

現行実装は大会後のArchive Viewerだけを対象とする。Supabase、大会中の入力、
訂正、Realtimeに関する手順は将来の大会運営モード向けであり、現在は実行できない。
現時点で利用できるのはplayerId台帳管理、Archive検証・暗号化・公開、
ブラウザ内復号、順位・統計・対局履歴の閲覧である。

---

## 2. Roles

### 2.1 Primary Organizer

主担当運営者。

責務:

- SupabaseとWebアプリの事前確認
- 大会作成
- ルール設定
- 参加者登録
- 大会状態変更
- 結果訂正
- 大会終了
- アーカイブ生成
- GitHubへの反映

### 2.2 Secondary Organizer

副担当運営者。

責務:

- 当日の入力支援
- 通信・端末障害時のバックアップ
- 誤入力内容の確認
- Primary Organizer不在時の代行

### 2.3 Table Reporter

各卓で結果を入力する代表者。

責務:

- 4名分の素点確認
- 卓結果入力
- 登録成功確認
- 不一致時の運営者連絡

### 2.4 Participant

大会参加者。

責務:

- 順位確認
- 結果確認
- 誤り発見時の申告

---

## 3. Operating Principles

### OP-001 One Table, One Submission

1卓の結果は、卓代表者1名が4名分をまとめて入力する。

各参加者が自分の点だけを個別入力しない。

### OP-002 Confirm Before Submit

送信前に卓内で以下を確認する。

- 4名のニックネーム
- 4名の素点
- 素点合計
- 自動計算された順位
- 自動計算されたポイント

### OP-003 Organizer Controls Corrections

登録後の訂正は運営者が行う。

参加者が自由に過去結果を編集しない。

### OP-004 Supabase Is the Live Source of Truth

大会開催中はSupabaseを正本とする。

画面表示に差異がある場合は、再読み込み後のSupabaseデータを優先する。

### OP-005 Archive Is the Final Source of Truth

大会終了後は、確定済み暗号化アーカイブを公式記録とする。

### OP-006 Keep a Manual Fallback

通信障害やサービス障害に備え、紙またはExcelによる一時記録手段を必ず用意する。

---

## 4. Annual Operating Timeline

```text
大会1か月前
    Supabase・アプリ確認
    ルール・参加者準備

大会1週間前
    模擬入力
    端末・通信確認
    QRコード作成

大会前日
    最終設定
    バックアップ
    権限確認

大会当日開始前
    大会active化
    参加者接続確認

大会中
    卓結果入力
    順位監視
    訂正対応

大会終了直後
    入力停止
    最終結果確認
    closed化

大会後
    JSON生成
    暗号化
    GitHub公開
    archived化
```

---

## 5. One Month Before Tournament

### 5.1 Confirm Application Availability

確認項目:

- GitHub Pagesが開く
- 大会一覧が表示される
- 過去大会アーカイブを復号できる
- 最新ブラウザで表示できる
- iPhoneで操作できる

### 5.2 Confirm Supabase Project

確認項目:

- Supabaseプロジェクトが存在する
- プロジェクトがpause状態でない
- 管理画面へログインできる
- Databaseへ接続できる
- Auth設定が有効
- Realtime設定が有効
- RLSが有効

Supabaseプロジェクトを再作成する場合:

1. 新規プロジェクト作成
2. migration適用
3. seed適用
4. Webアプリの環境変数更新
5. GitHub Pages再デプロイ
6. 接続試験

### 5.3 Apply Database Migrations

```bash
supabase db push
```

ローカル確認:

```bash
supabase db reset
```

本番DBへ直接手作業で変更しない。

### 5.4 Create Tournament

設定項目:

- 大会名
- 開催日
- 説明
- 持ち点
- 返し点
- ウマ
- オカ
- 丸め規則
- 同点規則
- サブゲーム
- 参加者予定数

大会状態は`preparing`とする。

### 5.5 Register Players

確認項目:

- ニックネーム
- 重複
- 表記揺れ
- 同一人物のplayerId
- 不参加者の無効化

本名やメールアドレスは大会データへ登録しない。

#### Cross-Year playerId Procedure

playerIdは年度やニックネームから生成せず、Git管理外の
`data/private/player-registry.json`で管理する。

初回のみ台帳を作成する。

```bash
python tools/manage_players.py init
```

参加者を登録する前に、現在名と過去名を検索する。

```bash
python tools/manage_players.py find "ニックネーム"
```

- 該当者が1名で本人と確認できた場合: 表示されたplayerIdを使用する
- 該当者が複数の場合: 運営者が本人確認し、自動選択しない
- 該当者がいない場合: `add`で新しいplayerIdを発行する
- 同名の別人の場合: 確認後に限り`--allow-duplicate-nickname`を使用する

```bash
python tools/manage_players.py add "ニックネーム"
python tools/manage_players.py add "同名の別人" --allow-duplicate-nickname
```

表示名変更は新規IDを発行せず、既存IDを指定して更新する。

```bash
python tools/manage_players.py rename <playerId> "新しいニックネーム"
python tools/manage_players.py validate
```

変更後は台帳を暗号化された運営者管理ストレージへバックアップする。
リポジトリ、GitHub Actions、公開Archiveへ台帳を含めない。バックアップから
復元する場合も`validate`成功後に使用する。

### 5.6 Confirm Scoring Rules

過去Excelまたは大会ルール表と照合する。

最低限、以下のテスト入力を行う。

- 通常順位
- トップ大勝
- 箱下
- 同点
- 端数
- サブゲーム加点

計算結果を運営者が確認する。

### 5.7 Nominate Operators

最低2名を運営者として準備する。

確認項目:

- ログイン可能
- 管理画面閲覧可能
- 訂正操作可能
- 大会状態変更可能

---

## 6. One Week Before Tournament

### 6.1 Run a Mock Tournament

推奨規模:

- 8〜16名
- 2〜4卓
- 2ラウンド以上

確認内容:

- 複数端末入力
- 同時登録
- 同一卓二重登録
- 誤った素点合計
- 訂正
- Realtime更新
- 通信切断
- 再接続
- 順位再取得

### 6.2 Confirm Venue Connectivity

確認項目:

- 会場Wi-Fi
- 携帯回線
- 通信の安定性
- 電源
- 運営PCの接続
- スマートフォンの接続

会場Wi-Fiだけに依存しない。

### 6.3 Prepare QR Code

QRコードのリンク先:

- 開催中大会のトップ画面
- または大会参加ページ

QRコードは以下へ配置する。

- 受付
- 各卓
- 会場スクリーン
- グループチャット

### 6.4 Prepare Manual Fallback

以下を用意する。

- 紙の結果記入表
- Excelバックアップ
- 筆記具
- ラウンド・卓番号表
- 参加者一覧

### 6.5 Prepare Operator Devices

最低限:

- Primary Organizer PC
- Secondary Organizerスマートフォン
- 充電器
- モバイルバッテリー

---

## 7. Day Before Tournament

### 7.1 Final Configuration Review

確認項目:

- 大会名
- 開催日
- 参加者
- ルール
- サブゲーム
- 卓数
- ラウンド数
- 運営者権限
- join code

### 7.2 Remove Test Data

模擬大会データと本番大会データを混在させない。

本番大会にテスト結果が入っている場合は削除または無効化する。

### 7.3 Backup Configuration

以下を保存する。

- tournament設定
- participant一覧
- rule set
- Supabase migration commit
- Webアプリcommit hash

### 7.4 Verify Web Deployment

確認項目:

- 最新版がGitHub Pagesへ反映されている
- commit hashまたはアプリversionが想定どおり
- キャッシュされた旧版でない
- iPhoneから開ける

### 7.5 Final Test Submission

本番大会を`preparing`のまま、専用のテスト大会またはローカル環境で最終試験する。

本番大会へダミー結果を残さない。

---

## 8. Tournament Day: Before Opening

### 8.1 Organizer Login

Primary OrganizerとSecondary Organizerがログインする。

確認:

- 管理画面
- 参加者一覧
- 大会設定
- 訂正機能

### 8.2 Confirm Participant Access

数名の参加者で以下を確認する。

- QRコード読取
- 大会画面表示
- 順位画面表示
- 入力画面表示

### 8.3 Activate Tournament

全設定確認後、大会状態を`active`へ変更する。

変更前チェック:

- 参加者確定
- ルール確定
- 卓番号確定
- join code共有済み
- テストデータなし

### 8.4 Announce Input Rules

参加者へ以下を説明する。

1. 卓代表者1名が入力する
2. 4名分の素点を入力する
3. 全員で確認してから登録する
4. 登録後の修正は運営へ申告する
5. 登録成功画面を確認する
6. 通信失敗時に何度も新規入力しない

---

## 9. Tournament Day: Result Input Procedure

### 9.1 Table Procedure

各対局終了後:

1. 4名の素点を確認
2. 卓代表者を決める
3. 大会画面を開く
4. ラウンド番号を選ぶ
5. 卓番号を選ぶ
6. 参加者4名を選ぶ
7. 4名の素点を入力
8. 合計点を確認
9. 順位とポイントを確認
10. 卓内で読み合わせ
11. 登録
12. 登録成功を確認
13. 順位表への反映を確認

### 9.2 Input Error Before Submission

送信前であればフォーム上で修正する。

### 9.3 Uncertain Submission State

通信エラー等で登録成否が不明な場合:

1. 新規フォームで再入力しない
2. 順位表または対局履歴を再読み込み
3. 当該ラウンド・卓が存在するか確認
4. 未登録の場合のみ再送
5. 必要なら運営者へ連絡

送信IDにより二重登録を防止するが、利用者も確認する。

---

## 10. Tournament Day: Live Monitoring

運営者は定期的に以下を確認する。

- 最近の登録結果
- ラウンド・卓の欠落
- 同一参加者の重複
- pt合計
- 順位更新
- 通信エラー申告
- 訂正待ち
- サブゲーム入力

推奨確認タイミング:

- 各ラウンド終了時
- 休憩前
- 最終ラウンド前
- 大会終了直前

---

## 11. Result Correction Procedure

### 11.1 Correction Request

申告内容:

- ラウンド番号
- 卓番号
- 正しい4名
- 正しい素点
- 誤りの内容
- 申告者

### 11.2 Organizer Verification

可能であれば卓の複数人に確認する。

紙記録がある場合は照合する。

### 11.3 Correction Operation

1. 管理画面で対象結果を開く
2. 元結果を確認
3. 訂正理由を入力
4. 正しい結果を入力
5. 得点プレビュー確認
6. 訂正確定
7. 順位再計算確認
8. 申告者へ完了連絡

### 11.4 Cancellation

対局自体が無効な場合は`cancelled`とする。

物理削除しない。

---

## 12. Subgame Operation

### 12.1 Before Input

確認:

- サブゲーム名称
- 加点単位
- 入力担当者

### 12.2 Input

参加者ごとに以下を入力する。

- 得点
- 備考
- 必要に応じて結果根拠

### 12.3 Confirmation

サブゲーム順位を麻雀順位と分けて確認する。両部門を合算した総合順位は生成しない。

毎年ルールが異なる場合は、最終得点だけを入力する初期運用とする。

---

## 13. Communication Failure Procedure

### 13.1 Single Device Failure

- 別端末で同じ大会ページを開く
- 入力済みか確認
- 未登録のみ再入力
- 端末固有問題として記録

### 13.2 Venue Network Failure

1. 携帯回線へ切替
2. 運営PCで入力継続
3. 紙へ結果記録
4. 復旧後に順番に登録

### 13.3 Supabase Failure

症状:

- 全端末で登録不可
- 順位取得不可
- 認証不可

対応:

1. 運営者が障害を確認
2. 参加者へ紙記録への切替を案内
3. 各卓結果を紙またはExcelへ集約
4. 復旧後にラウンド順で登録
5. 重複登録を確認
6. 公式順位を再確認

### 13.4 GitHub Pages Failure

大会中にGitHub Pagesが開けない場合:

- 既に開いている端末は可能なら利用継続
- 代替URLがある場合は共有
- 運営PCで入力
- 紙運用へ切替

初期版では完全な代替ホスティングを必須としない。

---

## 14. End of Tournament Procedure

### 14.1 Stop New Input

最終対局とサブゲーム入力完了後:

1. 未登録卓がないか確認
2. 訂正待ちがないか確認
3. 大会状態を`closed`へ変更

`closed`後は参加者の新規入力を停止する。

### 14.2 Final Validation

確認項目:

- 全ラウンド・全卓が存在
- 各卓4名
- 素点合計
- 同一ラウンド重複なし
- 麻雀pt合計
- サブゲーム入力
- 総合順位
- 同点処理
- 訂正履歴

### 14.3 Official Result Confirmation

運営者2名以上で最終順位を確認する。

確認後、`officialResults`を確定する。

### 14.4 Announce Results

アプリの最終順位を大会結果として共有する。

アーカイブ公開は後日でもよい。

---

## 15. Archive Export Procedure

### 15.1 Export Canonical JSON

管理画面または管理ツールで大会JSONを出力する。

出力先例:

```text
data/plain/tournament-2026.json
```

このディレクトリはGit管理外であること。

### 15.2 Validate JSON

公開CLIの実行時にSchema検証される。暗号化前に単独確認したい場合も、現行版では
`publish_archive.py`の検証結果を使用する。

確認:

- Schema valid
- 公式順位存在
- 生対局結果存在
- サブゲーム存在
- 個人情報なし
- Supabase認証IDなし
- メールアドレスなし

### 15.3 Compare Official Results

大会終了画面または運営から受領した公式結果と、JSONの`officialResults`を
運営者2名で照合する。現行版に自動比較CLIはない。

### 15.4 Plaintext Backup

平文JSONを運営者管理の安全な場所へ保存する。

候補:

- 暗号化されたローカルストレージ
- パスワード保護されたクラウドストレージ
- 外付けストレージ

公開GitHubへ入れない。

---

## 16. Archive Encryption Procedure

### 16.1 Generate Password

大会ごとの長いパスフレーズを作成する。

避ける例:

```text
mahjong2026
taikai2026
```

推奨:

- 無関係な単語を4〜5個
- 数字または記号を含む
- 仲間内情報から推測しにくい

### 16.2 Validate and Publish

```bash
python tools/publish_archive.py data/plain/tournament-2026.json
```

CLI上でパスワードを入力する。CLIは次を一括して行う。

- Archive 1.0 JSON Schema検証
- playerId台帳との照合
- 参加資格と公式順位の整合性検証
- archiveId・出力ファイル重複の拒否
- AES-GCM暗号化とメモリ内復号一致確認
- `apps/web/public/archives/<archiveId>-v<revision>.enc`生成
- `apps/web/public/archives/index.json`更新

処理途中で失敗した場合、公開indexは更新せず、新規暗号ファイルも残さない。
既存の暗号Archiveとindex entryは上書きしない。

### 16.3 Browser Verification

ローカルWebを起動し、大会一覧に新しい年度が増え、共有予定のパスワードで
順位・統計を表示できることを確認する。平文JSONは`data/plain`から移動せず、
`apps/web/public`へコピーしない。

---

## 17. GitHub Publication Procedure

### 17.1 Pre-Commit Check

```bash
git status
git diff
```

確認:

- `.enc`ファイルのみ追加
- `index.json`更新
- 平文JSONなし
- Excelなし
- `.env`なし
- パスワードなし

### 17.2 Plaintext String Check

既知のニックネームを検索する。

```bash
grep -R "known-nickname" apps/web/public
```

暗号化ファイル以外に本番ニックネームが存在しないこと。

### 17.3 Commit

```bash
git add apps/web/public/archives/index.json
git add apps/web/public/archives/tournament-2026-v1.enc
git commit -m "Archive 2026 tournament results"
git push
```

### 17.4 Confirm GitHub Actions

確認:

- CI成功
- build成功
- deploy成功

### 17.5 Confirm Public Site

1. 大会一覧表示
2. 対象大会選択
3. パスワード入力
4. 復号成功
5. 最終順位一致
6. 比較統計と対局履歴表示
7. 複数大会を開いた場合の年度横断統計
8. スマートフォン確認
9. 誤パスワード確認

### 17.6 Mark Tournament Archived

公開確認後、Supabase上の大会状態を`archived`へ変更する。

---

## 18. Password Sharing

### 18.1 Share Separately

サイトURLとパスワードは、可能であれば別メッセージまたは別経路で共有する。

### 18.2 Do Not Publish Password

以下へ書かない。

- GitHub
- README
- Webアプリ
- Archive index
- ソースコード
- 公開Issue

### 18.3 Password Loss

パスワードを失った場合、暗号化ファイルから復元できない。

Primary OrganizerとSecondary Organizerが安全に保管する。

### 18.4 Password Leakage

漏洩時:

1. 平文原本から新パスワードで再暗号化
2. 新revisionを作成
3. Archive index更新
4. 旧ファイル削除を検討
5. 新パスワード共有

ただし、旧暗号化ファイルを保存済みの者から回収できない。

---

## 19. Post-Tournament Data Retention

### 19.1 Retain

- 暗号化アーカイブ
- 平文原本バックアップ
- scoring rule
- JSON Schema version
- calculation version
- Git commit
- 運用上の問題記録

### 19.2 Do Not Retain Unnecessarily

- 認証セッション
- 一時パスワード
- 不要なログ
- メールアドレス
- テスト用個人データ

### 19.3 Supabase Cleanup

大会終了後、すぐにSupabaseデータを削除する必要はない。

ただし、過去閲覧の正本として依存しない。

無償枠やプロジェクト休止を前提に、次回大会前に再構築できる状態を維持する。

---

## 20. Incident Recording

以下の事象を記録する。

- 登録失敗
- 二重登録
- 誤入力
- 通信断
- Realtime未反映
- 権限問題
- 暗号化失敗
- GitHub公開失敗
- 参加者が迷った操作
- 手作業で回避した処理

記録先:

```text
doc/incidents/2026-tournament.md
```

記録項目:

- 時刻
- 症状
- 影響
- 暫定対応
- 原因
- 恒久対策候補

---

## 21. Postmortem

大会後1〜2週間以内に振り返る。

### Review Items

- 入力時間
- 入力待ち
- 誤入力数
- 訂正数
- 通信障害
- 操作ミス
- 順位表示の分かりやすさ
- 次卓候補の有用性
- サブゲーム入力
- アーカイブ作業時間

### Outputs

- 改善Issue
- requirements更新
- architecture更新
- operation更新
- 次年度優先順位

---

## 22. Emergency Checklist

### Results Cannot Be Submitted

- [ ] 他端末で試す
- [ ] ページ再読み込み
- [ ] 携帯回線へ切替
- [ ] 登録済み確認
- [ ] 運営PCで入力
- [ ] 紙へ記録

### Ranking Does Not Update

- [ ] 手動再読み込み
- [ ] 対局履歴確認
- [ ] DB登録確認
- [ ] Realtime再接続
- [ ] 運営者画面確認

### Duplicate Result Suspected

- [ ] ラウンド・卓確認
- [ ] submission_id確認
- [ ] 有効結果確認
- [ ] 不要結果をcancelled化
- [ ] 順位再確認

### Archive Cannot Be Decrypted

- [ ] パスワード再確認
- [ ] Caps Lock確認
- [ ] 別ブラウザ
- [ ] ファイル再取得
- [ ] Python CLIで復号確認
- [ ] 平文原本から再暗号化

---

## 23. Pre-Tournament Checklist

### One Month Before

- [ ] GitHub Pages動作
- [ ] Supabase動作
- [ ] migration適用
- [ ] 大会作成
- [ ] ルール設定
- [ ] 参加者登録
- [ ] 運営者設定

### One Week Before

- [ ] 模擬大会
- [ ] 複数端末試験
- [ ] 通信確認
- [ ] QRコード
- [ ] 紙・Excel退避
- [ ] 運営端末準備

### Day Before

- [ ] 最終参加者
- [ ] 最終ルール
- [ ] テストデータ除去
- [ ] デプロイ確認
- [ ] バックアップ
- [ ] 権限確認

### Before Start

- [ ] 運営ログイン
- [ ] 参加者アクセス
- [ ] active化
- [ ] 入力ルール説明

---

## 24. Post-Tournament Checklist

- [ ] 全卓登録確認
- [ ] 訂正确認
- [ ] closed化
- [ ] 公式順位確定
- [ ] JSON出力
- [ ] Schema検証
- [ ] 個人情報確認
- [ ] 平文バックアップ
- [ ] 暗号化
- [ ] 復号検証
- [ ] Archive index更新
- [ ] Git status確認
- [ ] 平文漏洩確認
- [ ] Git commit/push
- [ ] GitHub Pages確認
- [ ] archived化
- [ ] パスワード共有
- [ ] 振り返り日程設定

---

## 25. Summary

運用上最も重要な点は以下である。

1. 1卓1送信とする
2. 送信前に4名で確認する
3. 登録後の訂正は運営者が行う
4. 大会中はSupabaseを正本とする
5. 通信障害時は紙またはExcelへ退避する
6. 大会終了後に公式順位を確定する
7. 平文JSONをGitHubへ入れない
8. 暗号化後に必ず復号確認する
9. 公開後は暗号化アーカイブを公式記録とする
10. 大会後に問題点を記録し、次年度へ反映する
