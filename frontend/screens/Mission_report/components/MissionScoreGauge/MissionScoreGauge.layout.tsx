import type { MissionScoreGaugeProps } from "./MissionScoreGauge";

const SIZE_W = 310;
const SIZE_H = 210;
const OUTER_RADIUS = 148;
const STROKE = 22;
const RADIUS = OUTER_RADIUS - STROKE / 2;
const CENTER_X = 155;
const CENTER_Y = 187;
const ARC_LENGTH = Math.PI * RADIUS;

export function MissionScoreGaugeLayout({
  score,
  maxScore,
  verdictLabel,
}: MissionScoreGaugeProps) {
  const ratio = Math.min(Math.max(score / maxScore, 0), 1);
  const filledLength = ARC_LENGTH * ratio;

  const arcPath = `M ${CENTER_X - RADIUS} ${CENTER_Y} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER_X + RADIUS} ${CENTER_Y}`;

  return (
    <div className="rounded-2xl bg-[#5570F1] p-6 text-white">
      <h2 className="text-lg font-bold">Mission score</h2>

      <svg
        viewBox={`0 0 ${SIZE_W} ${SIZE_H}`}
        className="mx-auto mt-2 w-full max-w-[310px]"
      >
        <defs>
          <linearGradient
            id="missionScoreGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#FBFBFB" />
            <stop offset="28.8%" stopColor="#FFCC91" />
            <stop offset="86.5%" stopColor="#FFBA6B" />
          </linearGradient>
        </defs>
        <path
          d={arcPath}
          fill="none"
          stroke="#FBFBFB"
          strokeWidth={STROKE}
          strokeLinecap="butt"
        />
        <path
          d={arcPath}
          fill="none"
          stroke="url(#missionScoreGradient)"
          strokeWidth={STROKE}
          strokeLinecap="butt"
          strokeDasharray={`${filledLength} ${ARC_LENGTH}`}
        />
        <text
          x={CENTER_X}
          y={CENTER_Y - 40}
          textAnchor="middle"
          className="fill-white font-bold"
          style={{ fontSize: 36, fontWeight: 700 }}
        >
          {score} / {maxScore}
        </text>
        <text
          x={CENTER_X - RADIUS}
          y={CENTER_Y + 20}
          textAnchor="start"
          className="fill-white/40"
          style={{ fontSize: 14 }}
        >
          0
        </text>
        <text
          x={CENTER_X + RADIUS}
          y={CENTER_Y + 20}
          textAnchor="end"
          className="fill-white/40"
          style={{ fontSize: 14 }}
        >
          {maxScore}
        </text>
      </svg>

      <p className="mx-auto -mt-2 w-[214px] text-center text-lg leading-7 font-bold text-white tracking-normal">
        {verdictLabel}
      </p>
    </div>
  );
}
