# Domain

Reactや外部サービスに依存しない大会モデル・集計ロジックを配置します。

- `archive.ts`: 最小Archiveモデル
- `ranking.ts`: `officialResults`を使う麻雀・サブゲーム別の公式順位
- `statistics.ts`: 保存済み結果から求める個人成績とpt推移

得点の再計算はこの層へ含めていません。
