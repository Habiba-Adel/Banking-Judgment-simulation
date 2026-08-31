// PerformanceLayout.tsx
import { TopBar } from "@/components/TopBar";
import { AverageScoreCard } from "./components/AverageScoreCard";
import { StatCard } from "./components/StatCard";
import { PerformanceOverTimeCard } from "./components/PerformanceOverTimeCard";
import { DecisionQualityCard } from "./components/DecisionQualityCard";
import { BehaviorPatternsCard } from "./components/BehaviorPatternsCard";
import { RecentScenariosCard } from "./components/RecentScenariosCard";
import type { PerformanceData } from "./types";

export interface PerformanceLayoutProps {
  data: PerformanceData;
  period: "Daily" | "Weekly" | "Monthly";
  onPeriodChange: (period: "Daily" | "Weekly" | "Monthly") => void;
}

export function PerformanceLayout({
  data,
  period,
  onPeriodChange,
}: PerformanceLayoutProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-[#F9FAFB]">
      <TopBar />

      <div className="flex w-full flex-col px-8 py-6">
        {/* Title only — small gap under it */}
        <h1 className="mb-6 text-[24px] font-medium leading-[32px] text-[#1C1C1C]">
          Performance Overview
        </h1>

        {/* Card rows only — large gap between rows */}
        <div className="flex w-full flex-col gap-y-12">
          {/* Row 1 */}
          <div className="flex w-full gap-x-6">
            <div className="min-w-0 flex-[456]">
              <AverageScoreCard
                averageScore={data.averageScore}
                metrics={data.radialMetrics}
              />
            </div>
            <div className="min-w-0 flex-[648]">
              <div className="grid grid-cols-2 gap-x-5 gap-y-5">
                {data.stats.map((stat) => (
                  <StatCard key={stat.id} {...stat} />
                ))}
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="flex w-full gap-x-6">
            <div className="min-w-0 flex-[744]">
              <PerformanceOverTimeCard
                data={data.performanceOverTime}
                period={period}
                onPeriodChange={onPeriodChange}
              />
            </div>
            <div className="min-w-0 flex-[360]">
              <DecisionQualityCard
                totalDecisions={data.decisionQuality.totalDecisions}
                slices={data.decisionQuality.slices}
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="w-full">
            <BehaviorPatternsCard patterns={data.behaviorPatterns} />
          </div>

          {/* Row 4 */}
          <div className="w-full">
            <RecentScenariosCard scenarios={data.recentScenarios} />
          </div>
        </div>
      </div>
    </div>
  );
}