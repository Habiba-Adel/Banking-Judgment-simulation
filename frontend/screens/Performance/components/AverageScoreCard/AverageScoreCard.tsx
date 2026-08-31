"use client";

import { useMemo, useState } from "react";
import type { RadialMetric } from "../../types";

export interface AverageScoreCardProps {
  averageScore: number;
  metrics: RadialMetric[];
}

const SEGMENT_FILLS = [
  { type: "solid" as const, color: "#FBFBFB" },
  {
    type: "gradient" as const,
    id: "seg1",
    angle: 13.93,
    stops: [
      { offset: "33.66%", color: "#FFCC91" },
      { offset: "58.83%", color: "#FBFBFB" },
    ],
  },
  {
    type: "gradient" as const,
    id: "seg2",
    angle: 8.09,
    stops: [
      { offset: "40.62%", color: "#FFCC91" },
      { offset: "61.05%", color: "#FFECD6" },
    ],
  },
  { type: "solid" as const, color: "#FFCC91" },
  {
    type: "gradient" as const,
    id: "seg4",
    angle: 195.32,
    stops: [
      { offset: "35.33%", color: "#FFCC91" },
      { offset: "77.02%", color: "#FBFBFB" },
    ],
  },
  {
    type: "gradient" as const,
    id: "seg5",
    angle: 187.97,
    stops: [
      { offset: "33.25%", color: "#FFCC91" },
      { offset: "58.83%", color: "#FBFBFB" },
    ],
  },
  { type: "solid" as const, color: "#FBFBFB" },
];

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy - r * Math.sin(rad),
  };
}

function annularSectorPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startDeg: number,
  endDeg: number,
  cornerR: number,
) {
  const sweep = startDeg - endDeg;
  if (sweep <= 0) return "";

  const midR = (innerR + outerR) / 2;
  const thickness = outerR - innerR;
  const cr = Math.min(
    cornerR,
    thickness / 2 - 0.5,
    (sweep * Math.PI) / 180 * midR * 0.45,
  );

  const outerDelta = (Math.asin(Math.min(1, cr / (outerR - cr))) * 180) / Math.PI;
  const innerDelta = (Math.asin(Math.min(1, cr / (innerR + cr))) * 180) / Math.PI;

  const o0 = startDeg - outerDelta;
  const o1 = endDeg + outerDelta;
  const i0 = startDeg - innerDelta;
  const i1 = endDeg + innerDelta;

  const p = (r: number, a: number) => polar(cx, cy, r, a);

  const outerStart = p(outerR, o0);
  const outerEnd = p(outerR, o1);
  const endOuterInset = p(outerR - cr, endDeg);
  const endInnerInset = p(innerR + cr, endDeg);
  const innerEnd = p(innerR, i1);
  const innerStart = p(innerR, i0);
  const startInnerInset = p(innerR + cr, startDeg);
  const startOuterInset = p(outerR - cr, startDeg);

  const largeOuter = Math.abs(o0 - o1) > 180 ? 1 : 0;
  const largeInner = Math.abs(i0 - i1) > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeOuter} 1 ${outerEnd.x} ${outerEnd.y}`,
    `A ${cr} ${cr} 0 0 1 ${endOuterInset.x} ${endOuterInset.y}`,
    `L ${endInnerInset.x} ${endInnerInset.y}`,
    `A ${cr} ${cr} 0 0 1 ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeInner} 0 ${innerStart.x} ${innerStart.y}`,
    `A ${cr} ${cr} 0 0 1 ${startInnerInset.x} ${startInnerInset.y}`,
    `L ${startOuterInset.x} ${startOuterInset.y}`,
    `A ${cr} ${cr} 0 0 1 ${outerStart.x} ${outerStart.y}`,
    "Z",
  ].join(" ");
}

function cssAngleToSvgGradient(angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  return {
    x1: `${50 - dx * 50}%`,
    y1: `${50 - dy * 50}%`,
    x2: `${50 + dx * 50}%`,
    y2: `${50 + dy * 50}%`,
  };
}

export function AverageScoreCard({ averageScore, metrics }: AverageScoreCardProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const W = 416;
  const H = 314;
  const cx = 208;
  const cy = 198;
  const outerR = 158;
  const innerR = 118;
  const cornerR = 4;
  const gapDeg = 2.4;
  const startAngle = 180;
  const endAngle = 0;
  const totalSweep = startAngle - endAngle;
  const count = Math.max(metrics.length, 1);
  const gapTotal = gapDeg * (count - 1);
  const segmentSweep = (totalSweep - gapTotal) / count;

  const segments = useMemo(() => {
    return metrics.map((m, i) => {
      const a0 = startAngle - i * (segmentSweep + gapDeg);
      const a1 = a0 - segmentSweep;
      const fill = SEGMENT_FILLS[i % SEGMENT_FILLS.length];
      const path = annularSectorPath(cx, cy, innerR, outerR, a0, a1, cornerR);
      const mid = (a0 + a1) / 2;
      const tip = polar(cx, cy, (innerR + outerR) / 2, mid);
      return { ...m, path, fill, tip, mid };
    });
  }, [metrics, segmentSweep]);

  const active = hovered !== null ? segments[hovered] : null;

  return (
    <div className="flex h-[360px] w-full flex-col rounded-[16px] bg-[#5870ED] p-5 text-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
      <div className="relative h-[314px] w-full">
        <h3 className="relative z-10 text-[20px] font-semibold leading-[30px] text-white">
          Average Score
        </h3>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {SEGMENT_FILLS.filter((f) => f.type === "gradient").map((f) => {
              if (f.type !== "gradient") return null;
              const g = cssAngleToSvgGradient(f.angle);
              return (
                <linearGradient
                  key={f.id}
                  id={f.id}
                  gradientUnits="objectBoundingBox"
                  x1={g.x1}
                  y1={g.y1}
                  x2={g.x2}
                  y2={g.y2}
                >
                  {f.stops.map((s) => (
                    <stop key={s.offset} offset={s.offset} stopColor={s.color} />
                  ))}
                </linearGradient>
              );
            })}
          </defs>

          {segments.map((seg, i) => {
            const fill =
              seg.fill.type === "solid"
                ? seg.fill.color
                : `url(#${seg.fill.id})`;
            return (
              <path
                key={i}
                d={seg.path}
                fill={fill}
                stroke="none"
                className="cursor-pointer transition-opacity"
                opacity={hovered === null || hovered === i ? 1 : 0.7}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}

          {active && (
            <circle
              cx={active.tip.x}
              cy={active.tip.y}
              r={5}
              fill="#1C1C1C"
              pointerEvents="none"
            />
          )}
        </svg>

        {active && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-[8px] bg-[#1C1C1C] px-3 py-2 text-center text-[12px] font-medium text-white shadow-lg"
            style={{
              left: `${(active.tip.x / W) * 100}%`,
              top: `${(active.tip.y / H) * 100}%`,
              marginTop: -12,
            }}
          >
            <div>{active.name}</div>
            <div>
              {active.value} / 100
            </div>
          </div>
        )}

        <div className="absolute left-1/2 top-[129px] w-[135px] -translate-x-1/2 text-center">
          <span className="text-[36px] font-medium leading-[44px] tracking-[-0.02em] text-white">
            {averageScore} / 100
          </span>
        </div>

        <div className="absolute left-1/2 top-[231px] w-[315px] -translate-x-1/2 text-center">
          <p className="text-[16px] font-normal leading-[24px] text-white/80">
            Your average performance across completed missions.
          </p>
        </div>
      </div>
    </div>
  );
}