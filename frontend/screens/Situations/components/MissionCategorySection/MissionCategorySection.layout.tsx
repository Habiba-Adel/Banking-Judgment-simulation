import { MissionCard } from "../MissionCard";
import type { MissionCategorySectionProps } from "./MissionCategorySection";

export function MissionCategorySectionLayout({
  category,
  onStart,
  onContinue,
  onReplay,
  onReport,
}: MissionCategorySectionProps) {
  const { title, missions } = category;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg leading-7 font-medium tracking-normal align-middle text-gray-900">
          {title}
        </h3>
        <span className="text-lg leading-7 font-normal tracking-normal align-middle text-gray-400">
          {missions.length} Missions
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-5">
        {missions.map((mission) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            onStart={onStart}
            onContinue={onContinue}
            onReplay={onReplay}
            onReport={onReport}
          />
        ))}
      </div>
    </div>
  );
}
