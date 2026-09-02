import { DecisionMetricsLayout } from "./DecisionMetrics.layout";

export type DecisionVerdict = "excellent" | "good" | "risky";

export interface DecisionMetricDelta {
  iconSrc: string;
  value: number;
}

export interface DecisionMetricRow {
  id: string;
  text: string;
  subtitle: string;
  verdict: DecisionVerdict;
  deltas: DecisionMetricDelta[];
}

export interface DecisionMetricsProps {
  decisions: DecisionMetricRow[];
}

export function DecisionMetrics(props: DecisionMetricsProps) {
  return <DecisionMetricsLayout {...props} />;
}
