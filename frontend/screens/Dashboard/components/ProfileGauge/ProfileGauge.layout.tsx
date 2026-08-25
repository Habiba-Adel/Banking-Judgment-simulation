import { MoreVertical } from "lucide-react";

export interface ProfileGaugeLayoutProps {
  score: number | null;
  maxScore: number;
  profileLabel: string | null;
}

const SIZE_W = 310;
const SIZE_H = 226;
const OUTER_RADIUS = 148;
const STROKE = 29.6;
const RADIUS = OUTER_RADIUS - STROKE / 2;
const CENTER_X = 155;
const CENTER_Y = 187;
const ARC_LENGTH = Math.PI * RADIUS;

export function ProfileGaugeLayout({ score, maxScore, profileLabel }: ProfileGaugeLayoutProps) {
  const ratio = score === null ? 0 : Math.min(Math.max(score / maxScore, 0), 1);
  const filledLength = ARC_LENGTH * ratio;

  const arcPath = `M ${CENTER_X - RADIUS} ${CENTER_Y} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER_X + RADIUS} ${CENTER_Y}`;

  return (
    <div className="rounded-2xl bg-indigo-600 p-6 text-white">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Your Profile</h2>
        <button
          type="button"
          aria-label="Profile options"
          className="flex h-6 w-6 items-center justify-center rounded-full border border-white text-white"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      <svg
        viewBox={`0 0 ${SIZE_W} ${SIZE_H}`}
        className="mx-auto mt-2 w-full max-w-[310px]"
      >
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FBFBFB" />
            <stop offset="28.8%" stopColor="#FFCC91" />
            <stop offset="86.5%" stopColor="#FFBA6B" />
          </linearGradient>
        </defs>
        <path d={arcPath} fill="none" stroke="#FBFBFB" strokeWidth={STROKE} strokeLinecap="butt" />
        {score !== null && (
          <path
            d={arcPath}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={STROKE}
            strokeLinecap="butt"
            strokeDasharray={`${filledLength} ${ARC_LENGTH}`}
          />
        )}
        <text
          x={CENTER_X}
          y={CENTER_Y - 40}
          textAnchor="middle"
          className="fill-white font-bold"
          style={{ fontSize: 28, fontWeight: 700 }}
        >
          {score === null ? "-" : score} / {maxScore}
        </text>
        <text
          x={CENTER_X}
          y={CENTER_Y - 7}
          textAnchor="middle"
          style={{ fontSize: 14, fill: "#FBFBFB" }}
        >
          {profileLabel ?? "No Data Yet"}
        </text>
      </svg>

      <div className="mt-1 flex justify-between text-sm text-white/40">
        <span>0</span>
        <span>{maxScore}</span>
      </div>
    </div>
  );
}