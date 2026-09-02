import { TopBar } from "@/components/TopBar";
import { HeroBanner } from "./components/HeroBanner";
import { StatusFilterTabs } from "./components/StatusFilterTabs";
import { MissionCategorySection } from "./components/MissionCategorySection";
import type { MissionCategoryData, StatusFilter } from "./types";

export interface SituationsLayoutProps {
  categories: MissionCategoryData[];
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  onStart: (missionId: string) => void;
  onContinue: (missionId: string) => void;
  onReplay: (missionId: string) => void;
  onReport: (missionId: string) => void;
  onContinueMission?: () => void;
  onSeePerformance?: () => void;
}

export function SituationsLayout({
  categories,
  statusFilter,
  onStatusFilterChange,
  onStart,
  onContinue,
  onReplay,
  onReport,
  onContinueMission,
  onSeePerformance,
}: SituationsLayoutProps) {
  return (
    <div data-testid="situations-root" className="min-w-0 flex-1">
      <div className="flex justify-end px-8 pt-6">
        <TopBar />
      </div>

      <div className="animate-fade-in-up flex flex-col gap-8 px-8 py-6">
        <HeroBanner onContinueMission={onContinueMission} onSeePerformance={onSeePerformance} />

        <div>
          <h2 className="text-xl leading-7 font-medium tracking-normal align-middle text-gray-900">
            Choose a mission
          </h2>
          <p className="mt-1 text-lg leading-7 font-normal tracking-normal align-middle text-gray-500">
            Select Scenario and put your banking judgment to the test.
          </p>
          <div className="mt-4">
            <StatusFilterTabs
              active={statusFilter}
              onChange={onStatusFilterChange}
            />
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {categories.map((category) => (
            <MissionCategorySection
              key={category.id}
              category={category}
              onStart={onStart}
              onContinue={onContinue}
              onReplay={onReplay}
              onReport={onReport}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
