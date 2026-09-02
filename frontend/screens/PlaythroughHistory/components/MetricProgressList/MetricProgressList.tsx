import { MetricProgressListLayout } from "./MetricProgressList.layout";
import type { MetricComparison } from "../../types";

export interface MetricProgressListProps {
  metrics: MetricComparison[];
}

export function MetricProgressList(props: MetricProgressListProps) {
  return <MetricProgressListLayout {...props} />;
}
