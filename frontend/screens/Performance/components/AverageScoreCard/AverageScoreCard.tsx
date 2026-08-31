"use client";

import { useMemo, useState } from "react";
import type { RadialMetric } from "../../types";

export interface AverageScoreCardProps {
  averageScore: number;
  metrics: RadialMetric[];
}

const SEGMENT_COLORS = [
  "#FBFBFB",
  "#FFE8D1",
  "#FFD6A3",
  "#FFCC91",
  "#FFD6A3",
  "#FFE8D1",
  "#FBFBFB",
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

export function AverageScoreCard({ averageScore, metrics }: AverageScoreCardProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const W = 416;
  const H = 360; // taller inner artboard
  const cx = 208;
  const cy = 248; // lower → ~10px under title (title ~30px + gap)
  const outerR = 212; // same piece thickness
  const innerR = 172;
  const cornerR = 4;
  const gapDeg = 2.2;
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
      const path = annularSectorPath(cx, cy, innerR, outerR, a0, a1, cornerR);
      const mid = (a0 + a1) / 2;
      const tip = polar(cx, cy, (innerR + outerR) / 2, mid);
      return { ...m, path, tip, mid };
    });
  }, [metrics, segmentSweep]);

  const active = hovered !== null ? segments[hovered] : null;

  return (
    // 400px → closer to square with flex width ~456
    <div className="flex h-[400px] w-full flex-col overflow-hidden rounded-[16px] bg-[#5871EC] p-5 text-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
      <div className="relative h-[360px] w-full">
        <h3 className="relative z-10 text-[20px] font-semibold leading-[30px] text-white">
          Average Score
        </h3>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {segments.map((seg, i) => (
            <path
              key={i}
              d={seg.path}
              fill={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
              stroke="none"
              className="cursor-pointer transition-opacity"
              opacity={hovered === null || hovered === i ? 1 : 0.7}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}

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

        {/* shifted down with the taller card */}
        <div className="absolute left-1/2 top-[200px] w-[135px] -translate-x-1/2 text-center">
          <span className="text-[36px] font-medium leading-[44px] tracking-[-0.02em] text-white">
            {averageScore} / 100
          </span>
        </div>

        <div className="absolute left-1/2 top-[252px] w-[315px] -translate-x-1/2 text-center">
          <p className="text-[16px] font-normal leading-[24px] text-white/80">
            Your average performance across completed missions.
          </p>
        </div>
      </div>
    </div>
  );
}