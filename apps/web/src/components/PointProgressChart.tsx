import type { PlayerPointProgression } from "../domain/statistics";

type PointProgressChartProps = {
  label: string;
  series: readonly PlayerPointProgression[];
  visiblePlayerIds: ReadonlySet<string>;
  colorByPlayerId: ReadonlyMap<string, string>;
  includeZero?: boolean;
};

const pointFormatter = new Intl.NumberFormat("ja-JP", {
  maximumFractionDigits: 1,
});

export function PointProgressChart({
  label,
  series,
  visiblePlayerIds,
  colorByPlayerId,
  includeZero = true,
}: PointProgressChartProps) {
  const visibleSeries = series.filter((item) =>
    visiblePlayerIds.has(item.playerId),
  );

  if (visibleSeries.length === 0) {
    return <p className="empty-chart">表示するプレイヤーを選択してください。</p>;
  }

  const width = 900;
  const height = 380;
  const margin = { top: 24, right: 24, bottom: 42, left: 62 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const rounds = [
    ...new Set(
      visibleSeries.flatMap((item) =>
        item.points.map((point) => point.roundNumber),
      ),
    ),
  ].sort((left, right) => left - right);
  const maxRound = Math.max(...rounds, 1);
  const values = visibleSeries.flatMap((item) =>
    item.points.map((point) => point.point),
  );
  const rawMin = Math.min(...(includeZero ? [0, ...values] : values));
  const rawMax = Math.max(...(includeZero ? [0, ...values] : values));
  const targetStep = Math.max((rawMax - rawMin) / 4, 1);
  const magnitude = 10 ** Math.floor(Math.log10(targetStep));
  const normalizedStep = targetStep / magnitude;
  const stepFactor =
    normalizedStep <= 1
      ? 1
      : normalizedStep <= 2
        ? 2
        : normalizedStep <= 5
          ? 5
          : 10;
  const tickStep = stepFactor * magnitude;
  let minPoint = Math.floor(rawMin / tickStep) * tickStep;
  let maxPoint = Math.ceil(rawMax / tickStep) * tickStep;

  if (minPoint === maxPoint) {
    minPoint -= tickStep;
    maxPoint += tickStep;
  }

  const pointRange = maxPoint - minPoint;
  const x = (roundNumber: number) =>
    margin.left + (roundNumber / maxRound) * plotWidth;
  const y = (point: number) =>
    margin.top + ((maxPoint - point) / pointRange) * plotHeight;
  const yTicks = Array.from(
    { length: Math.round(pointRange / tickStep) + 1 },
    (_, index) => maxPoint - index * tickStep,
  );

  return (
    <div className="chart-scroll">
      <svg
        className="progress-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${label}の回別推移`}
      >
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              className="chart-grid-line"
              x1={margin.left}
              x2={width - margin.right}
              y1={y(tick)}
              y2={y(tick)}
            />
            <text
              className="chart-axis-label"
              x={margin.left - 10}
              y={y(tick) + 4}
            >
              {pointFormatter.format(tick)}
            </text>
          </g>
        ))}

        {rounds.map((roundNumber) => (
          <g key={roundNumber}>
            <line
              className="chart-grid-line chart-grid-line-vertical"
              x1={x(roundNumber)}
              x2={x(roundNumber)}
              y1={margin.top}
              y2={height - margin.bottom}
            />
            <text
              className="chart-axis-label chart-round-label"
              x={x(roundNumber)}
              y={height - 14}
            >
              {roundNumber === 0 ? "開始" : `${roundNumber}回`}
            </text>
          </g>
        ))}

        {includeZero ? (
          <line
            className="chart-zero-line"
            x1={margin.left}
            x2={width - margin.right}
            y1={y(0)}
            y2={y(0)}
          />
        ) : null}

        {visibleSeries.map((item) => {
          const color = colorByPlayerId.get(item.playerId) ?? "#4f5962";
          const points = item.points
            .map((point) => `${x(point.roundNumber)},${y(point.point)}`)
            .join(" ");
          const lastPoint = item.points.at(-1);

          return (
            <g key={item.playerId}>
              <title>{item.nickname}</title>
              <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="3"
                vectorEffect="non-scaling-stroke"
              />
              {lastPoint === undefined ? null : (
                <circle
                  cx={x(lastPoint.roundNumber)}
                  cy={y(lastPoint.point)}
                  r="4"
                  fill={color}
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
