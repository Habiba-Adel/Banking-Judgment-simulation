import { MissionCardLayout } from "./MissionCard.layout";
import type { MissionCardData } from "../../types";

export interface MissionCardProps {
  mission: MissionCardData;
  onStart?: (missionId: string) => void;
  onContinue?: (missionId: string) => void;
  onReplay?: (missionId: string) => void;
  onReport?: (missionId: string) => void;
}

export function MissionCard(props: MissionCardProps) {
  return <MissionCardLayout {...props} />;
}
