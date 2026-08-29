import { TopBar } from "@/components/TopBar";
import { HeroBanner } from "./components/HeroBanner";
import { StatusFilterTabs } from "./components/StatusFilterTabs";
import { MissionCategorySection } from "./components/MissionCategorySection";
import type { MissionCategoryData, StatusFilter } from "./types";

export interface SituationsLayoutProps {
  categories: MissionCategoryData[];
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
}

export function SituationsLayout({
  categories,
  statusFilter,
  onStatusFilterChange,
}: SituationsLayoutProps) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex justify-end px-8 pt-6">
        <TopBar />
      </div>

      <div className="flex flex-col gap-8 px-8 py-6">
        <HeroBanner />

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
            <MissionCategorySection key={category.id} category={category} />
          ))}
        </div>
      </div>
    </div>
  );
}
