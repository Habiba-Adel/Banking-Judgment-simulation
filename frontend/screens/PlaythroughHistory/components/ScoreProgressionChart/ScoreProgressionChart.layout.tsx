import type { ScoreProgressionChartProps } from "./ScoreProgressionChart";

const WIDTH = 640;
const HEIGHT = 220;
const PADDING_X = 32;
const PADDING_Y = 24;

export function ScoreProgressionChartLayout({ attempts }: ScoreProgressionChartProps) {
  const plotWidth = WIDTH - PADDING_X * 2;
  const plotHeight = HEIGHT - PADDING_Y * 2;

  const points = attempts.map((attempt, index) => {
    const x =
      attempts.length === 1
        ? PADDING_X + plotWidth / 2
        : PADDING_X + (index / (attempts.length - 1)) * plotWidth;
    const y = PADDING_Y + plotHeight - (attempt.score / 100) * plotHeight;
    return { x, y, attempt };
  });

  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const gridLines = [0, 25, 50, 75, 100];

  return (
    <section className="rounded-2xl border border-gray-100 bg-[#FBFBFB] p-6">
      <h2 className="text-xl leading-7 font-bold text-gray-900">Score progression</h2>
      <p className="mt-1 text-sm text-gray-500">Your score across attempts.</p>

      <div className="mt-4 overflow-x-auto">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ minWidth: 480 }}>
          {gridLines.map((value) => {
            const y = PADDING_Y + plotHeight - (value / 100) * plotHeight;
            return (
              <g key={value}>
                <line
                  x1={PADDING_X}
                  y1={y}
                  x2={WIDTH - PADDING_X}
                  y2={y}
                  stroke="#EAECF0"
                  strokeWidth={1}
                />
                <text x={4} y={y + 4} fontSize={10} fill="#9CA3AF">
                  {value}
                </text>
              </g>
            );
          })}

          <path d={linePath} fill="none" stroke="#5570F1" strokeWidth={2.5} />

          {points.map(({ x, y, attempt }) => (
            <g key={attempt.attemptNumber}>
              <circle cx={x} cy={y} r={5} fill="#5570F1" stroke="white" strokeWidth={2} />
              <text x={x} y={y - 14} fontSize={11} fontWeight={600} fill="#1C1C1C" textAnchor="middle">
                {attempt.score}
              </text>
              <text x={x} y={HEIGHT - 4} fontSize={10} fill="#9CA3AF" textAnchor="middle">
                Attempt {attempt.attemptNumber}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}
