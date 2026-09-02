import { MissionProgressCardLayout } from "./MissionProgressCard.layout";
import type { MissionProgress } from "../../types";

export type MissionProgressCardProps = MissionProgress & { onClick: () => void };

export function MissionProgressCard({
  title,
  currentStep,
  totalSteps,
  playedLabel,
  thumbnailSrc,
  onClick,
}: MissionProgressCardProps) {
  return (
    <MissionProgressCardLayout
      title={title}
      currentStep={currentStep}
      totalSteps={totalSteps}
      playedLabel={playedLabel}
      thumbnailSrc={thumbnailSrc}
      onClick={onClick}
    />
  );
}