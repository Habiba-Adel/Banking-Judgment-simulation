import type { CSSProperties } from "react";
import type { LandedCardProps, LandedMetricColor } from "./LandedCard";

const COLOR_HEX: Record<LandedMetricColor, string> = {
  red: "#F04438",
  green: "#34C759",
  blue: "#5570F1",
};

export function LandedCardLayout({ items }: LandedCardProps) {
  return (
    <section className="flex h-[420px] w-[540px] flex-col gap-[22px] rounded-[16px] bg-[#FBFBFB] p-[20px] opacity-100">
      <h2 className="text-xl font-bold text-[#1C1C1C]">Where you landed</h2>

      <ul className="divide-y divide-dashed divide-[#D2D6DB]">
        {items.map(({ label, value, maxValue = 100, color }) => {
          const hex = COLOR_HEX[color];
          const ratio = Math.min(Math.max(value / maxValue, 0), 1) * 100;

          return (
            <li key={label} className="flex items-center gap-3 py-[8px]">
              <span className="w-[130px] shrink-0 text-base text-[#1C1C1C]">
                {label}
              </span>
              <span
                className="h-3 flex-1 rounded-full"
                style={{ backgroundColor: `${hex}1A` }}
              >
                <span
                  className="animate-bar-fill block h-3 rounded-full"
                  style={{ "--bar-fill": `${ratio}%`, backgroundColor: hex } as CSSProperties}
                />
              </span>
              <span className="w-6 shrink-0 text-right text-sm text-[#1C1C1C]">
                {value}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
