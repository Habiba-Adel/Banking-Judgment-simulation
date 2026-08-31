// StatCard.tsx — unchanged, already matches spec
import { TrendingUp, TrendingDown } from "lucide-react";
import type { StatCardData } from "../../types";

export function StatCard({ label, value, trendLabel, trendDirection, description }: StatCardData) {
  const TrendIcon = trendDirection === "up" ? TrendingUp : TrendingDown;
  const trendColor = trendDirection === "up" ? "text-[#1B8354]" : "text-[#F04438]";

  return (
    <div className="flex h-[190px] w-full flex-col justify-between rounded-[16px] bg-white p-3 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
      <div className="flex items-start justify-between">
        <span className="text-[16px] font-normal leading-[24px] text-[#1C1C1C]">
          {label}
        </span>
        <span className={`flex h-[18px] items-center gap-[3.92px] text-[12px] font-medium ${trendColor}`}>
          <TrendIcon className="h-3.5 w-3.5" />
          {trendLabel}
        </span>
      </div>
      <div className="text-[30px] font-medium leading-[38px] text-[#1C1C1C]">{value}</div>
      <p className="text-[16px] font-normal leading-[24px] text-[#4D5761] opacity-60">
        {description}
      </p>
    </div>
  );
}