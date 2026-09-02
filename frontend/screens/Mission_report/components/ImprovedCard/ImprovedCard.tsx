import { ImprovedCardLayout } from "./ImprovedCard.layout";

export interface ImprovedMetric {
  iconSrc: string;
  label: string;
  delta: number;
}

export interface ImprovedCardProps {
  items: ImprovedMetric[];
}

export function ImprovedCard(props: ImprovedCardProps) {
  return <ImprovedCardLayout {...props} />;
}
