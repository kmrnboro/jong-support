# Domain

Reactや外部サービスに依存しない大会モデル・集計ロジックを配置します。

- `archive.ts`: 最小Archiveモデル
- `ranking.ts`: `officialResults`を使う公式順位
- `statistics.ts`: 保存済み対局結果から求める個人成績

得点の再計算はこの層へ含めていません。

