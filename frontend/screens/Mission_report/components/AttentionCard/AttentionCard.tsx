import { AttentionCardLayout } from "./AttentionCard.layout";

export interface AttentionMetric {
  iconSrc: string;
  label: string;
  delta: number;
}

export interface AttentionCardProps {
  items: AttentionMetric[];
}

export function AttentionCard(props: AttentionCardProps) {
  return <AttentionCardLayout {...props} />;
}
