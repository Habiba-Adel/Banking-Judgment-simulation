import { ProfileGaugeLayout } from "./ProfileGauge.layout";
import type { ProfileSummary } from "../../types";

export type ProfileGaugeProps = ProfileSummary;

export function ProfileGauge({ score, maxScore, profileLabel }: ProfileGaugeProps) {
  return <ProfileGaugeLayout score={score} maxScore={maxScore} profileLabel={profileLabel} />;
}