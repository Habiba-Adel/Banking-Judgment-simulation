import { TopBar } from "@/components/TopBar";
import { PrimaryBackButton } from "@/components/PrimaryBackButton";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { MetricProgressList } from "./components/MetricProgressList";
import { AttemptStatsCards } from "./components/AttemptStatsCards";
import { ScoreProgressionChart } from "./components/ScoreProgressionChart";
import { DecisionByAttemptTable } from "./components/DecisionByAttemptTable";
import { AttemptsOverviewTable } from "./components/AttemptsOverviewTable";
import { AttemptPicker } from "./components/AttemptPicker";
import type { MissionAttemptHistoryData, JourneyComparisonData } from "./types";

export interface AttemptPickerOption {
  id: string;
  runNumber: number;
  date: string;
  score: number;
}

export interface PlaythroughHistoryLayoutProps {
  data: MissionAttemptHistoryData | null;
  pickerOptions: AttemptPickerOption[];
  selectedIds: string[];
  maxSelected: number;
  onTogglePick: (id: string) => void;
  onBack?: () => void;
  viewMode: "attempts" | "journeys";
  onViewModeChange: (mode: "attempts" | "journeys") => void;
  journeyData: JourneyComparisonData | null;
  journeyPickerOptions: AttemptPickerOption[];
  selectedJourneyIds: string[];
  onToggleJourneyPick: (id: string) => void;
  onGoToNextOrCompare: () => void;
  isLastMission: boolean;
  hideNextOrCompareButton: boolean;
  onRestartJourney: () => void;
  onReturnToDashboard: () => void;
}

export function PlaythroughHistoryLayout({
  data,
  pickerOptions,
  selectedIds,
  maxSelected,
  onTogglePick,
  onBack,
  viewMode,
  onViewModeChange,
  journeyData,
  journeyPickerOptions,
  selectedJourneyIds,
  onToggleJourneyPick,
  onGoToNextOrCompare,
  isLastMission,
  hideNextOrCompareButton,
  onRestartJourney,
  onReturnToDashboard,
}: PlaythroughHistoryLayoutProps) {
  return (
    <div data-testid="playthrough-history-root" className="min-w-0 flex-1">
      <div className="flex items-center justify-between px-8 pt-6">
        <PrimaryBackButton onClick={onBack} />
        <TopBar />
      </div>

      <div className="animate-fade-in-up flex flex-col gap-6 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl leading-8 font-bold text-gray-900">
              {viewMode === "attempts" ? "Attempt History" : "Journey Comparison"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {viewMode === "attempts" ? data?.missionTitle : "Compare full playthrough runs, mission by mission."}
            </p>
          </div>

          <div className="flex rounded-lg border border-gray-200 bg-white p-1">
            <button
              type="button"
              data-testid="view-mode-attempts"
              onClick={() => onViewModeChange("attempts")}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                viewMode === "attempts" ? "bg-[#5570F1] text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              This Mission
            </button>
            <button
              type="button"
              data-testid="view-mode-journeys"
              onClick={() => onViewModeChange("journeys")}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                viewMode === "journeys" ? "bg-[#5570F1] text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              Full Journeys
            </button>
          </div>
        </div>

        {viewMode === "attempts" ? (
          <>
            {pickerOptions.length > maxSelected && (
              <AttemptPicker
                options={pickerOptions}
                selectedIds={selectedIds}
                maxSelected={maxSelected}
                onToggle={onTogglePick}
              />
            )}

            {!data ? (
              <LoadingSpinner label="Loading comparison..." />
            ) : (
              <>
                <AttemptStatsCards attempts={data.attempts} />
                <MetricProgressList metrics={data.metrics} />
                <ScoreProgressionChart attempts={data.attempts} />
                <DecisionByAttemptTable attempts={data.attempts} decisions={data.decisions} />
                <AttemptsOverviewTable attempts={data.attempts} />
              </>
            )}
          </>
        ) : (
          <>
            {journeyPickerOptions.length === 0 ? (
              <div className="text-sm text-gray-500">
                No finished journeys yet — complete every mission in a playthrough to compare full runs here.
              </div>
            ) : (
              <>
                {journeyPickerOptions.length > maxSelected && (
                  <AttemptPicker
                    options={journeyPickerOptions}
                    selectedIds={selectedJourneyIds}
                    maxSelected={maxSelected}
                    onToggle={onToggleJourneyPick}
                    title="Choose journeys to compare"
                    itemNoun="finished journeys"
                  />
                )}

                {!journeyData ? (
                  <LoadingSpinner label="Loading comparison..." />
                ) : (
                  <>
                    <AttemptStatsCards attempts={journeyData.attempts} noun="journey" />
                    <MetricProgressList metrics={journeyData.metrics} />
                    <ScoreProgressionChart
                      attempts={journeyData.attempts}
                      subtitle="Your overall score across full journeys."
                      pointPrefix="Run"
                    />
                    <DecisionByAttemptTable
                      attempts={journeyData.attempts}
                      decisions={journeyData.decisions}
                      title="Mission by mission"
                      rowHeader="Mission"
                      columnPrefix="Run"
                    />
                    <AttemptsOverviewTable
                      attempts={journeyData.attempts}
                      title="All journeys overview"
                      noun="journey"
                      numberColumnLabel="Run"
                    />
                  </>
                )}
              </>
            )}
          </>
        )}

        <div className="flex justify-center gap-4 pt-2">
          <button
            type="button"
            data-testid="return-to-dashboard-button"
            onClick={onReturnToDashboard}
            className="flex h-[48px] items-center gap-2 rounded-lg border border-[#5570F1] bg-[#FBFBFB] px-6 text-sm font-bold text-[#1C1C1C] transition-colors hover:bg-gray-50"
          >
            Return to Dashboard
          </button>
          <button
            type="button"
            data-testid="restart-journey-button"
            onClick={onRestartJourney}
            className="flex h-[48px] items-center gap-2 rounded-lg border border-[#5570F1] bg-[#FBFBFB] px-6 text-sm font-bold text-[#1C1C1C] transition-colors hover:bg-gray-50"
          >
            Restart Journey
          </button>
          {!hideNextOrCompareButton && (
            <button
              type="button"
              data-testid="next-or-compare-button"
              onClick={onGoToNextOrCompare}
              className="flex h-[48px] items-center gap-2 rounded-lg bg-[#5570F1] px-6 text-sm font-bold text-white transition-colors hover:bg-[#4a63e0]"
            >
              {isLastMission ? "Compare Journeys" : "Go to Next Mission"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
