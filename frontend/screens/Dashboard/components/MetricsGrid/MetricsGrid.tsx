import { MetricsGridLayout } from "./MetricsGrid.layout";
import type { MetricData } from "../../types";

export interface MetricsGridProps {
  metrics: MetricData[];
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return <MetricsGridLayout metrics={metrics} />;
}