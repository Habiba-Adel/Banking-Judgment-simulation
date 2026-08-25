import { MetricCardLayout } from "./MetricCard.layout";
import type { MetricData } from "../../types";

export type MetricCardProps = MetricData;

export function MetricCard({ icon, label, value, comparisonLabel }: MetricCardProps) {
  return (
    <MetricCardLayout
      icon={icon}
      label={label}
      value={value}
      comparisonLabel={comparisonLabel}
    />
  );
}