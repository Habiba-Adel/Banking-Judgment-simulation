import { useAnimatedNumber } from "@/lib/useAnimatedNumber";
import { ProfileGaugeLayout } from "./ProfileGauge.layout";
import type { ProfileSummary } from "../../types";

export type ProfileGaugeProps = ProfileSummary;

export function ProfileGauge({ score, maxScore, profileLabel }: ProfileGaugeProps) {
  const animatedScore = useAnimatedNumber(score ?? 0);
  return (
    <ProfileGaugeLayout
      score={score}
      maxScore={maxScore}
      profileLabel={profileLabel}
      animatedScore={animatedScore}
    />
  );
}