import { TopBar } from "@/components/TopBar";
import { PrimaryBackButton } from "@/components/PrimaryBackButton";
import { MetricProgressList } from "./components/MetricProgressList";
import { AttemptStatsCards } from "./components/AttemptStatsCards";
import { ScoreProgressionChart } from "./components/ScoreProgressionChart";
import { DecisionByAttemptTable } from "./components/DecisionByAttemptTable";
import { AttemptsOverviewTable } from "./components/AttemptsOverviewTable";
import type { MissionAttemptHistoryData } from "./types";

export interface PlaythroughHistoryLayoutProps {
  data: MissionAttemptHistoryData;
  onBack?: () => void;
}

export function PlaythroughHistoryLayout({ data, onBack }: PlaythroughHistoryLayoutProps) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between px-8 pt-6">
        <PrimaryBackButton onClick={onBack} />
        <TopBar />
      </div>

      <div className="flex flex-col gap-6 px-8 py-6">
        <div>
          <h1 className="text-2xl leading-8 font-bold text-gray-900">Attempt History</h1>
          <p className="mt-1 text-sm text-gray-500">{data.missionTitle}</p>
        </div>

        <AttemptStatsCards attempts={data.attempts} />

        <MetricProgressList metrics={data.metrics} />

        <ScoreProgressionChart attempts={data.attempts} />

        <DecisionByAttemptTable attempts={data.attempts} decisions={data.decisions} />

        <AttemptsOverviewTable attempts={data.attempts} />
      </div>
    </div>
  );
}