import { MissionCategorySectionLayout } from "./MissionCategorySection.layout";
import type { MissionCategoryData } from "../../types";

export interface MissionCategorySectionProps {
  category: MissionCategoryData;
  onStart?: (missionId: string) => void;
  onContinue?: (missionId: string) => void;
  onReplay?: (missionId: string) => void;
  onReport?: (missionId: string) => void;
}

export function MissionCategorySection(props: MissionCategorySectionProps) {
  return <MissionCategorySectionLayout {...props} />;
}
