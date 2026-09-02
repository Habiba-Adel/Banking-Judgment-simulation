import { LandedCardLayout } from "./LandedCard.layout";

export type LandedMetricColor = "red" | "green" | "blue";

export interface LandedMetric {
  label: string;
  value: number;
  maxValue?: number;
  color: LandedMetricColor;
}

export interface LandedCardProps {
  items: LandedMetric[];
}

export function LandedCard(props: LandedCardProps) {
  return <LandedCardLayout {...props} />;
}
