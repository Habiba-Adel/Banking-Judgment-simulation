import { MissionProgressCardLayout } from "./MissionProgressCard.layout";
import type { MissionProgress } from "../../types";

export type MissionProgressCardProps = MissionProgress;

export function MissionProgressCard({
  title,
  currentStep,
  totalSteps,
  playedLabel,
  thumbnailSrc,
}: MissionProgressCardProps) {
  return (
    <MissionProgressCardLayout
      title={title}
      currentStep={currentStep}
      totalSteps={totalSteps}
      playedLabel={playedLabel}
      thumbnailSrc={thumbnailSrc}
    />
  );
}