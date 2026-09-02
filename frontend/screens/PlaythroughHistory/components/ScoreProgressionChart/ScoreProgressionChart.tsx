import { ScoreProgressionChartLayout } from "./ScoreProgressionChart.layout";
import type { AttemptOverview } from "../../types";

export interface ScoreProgressionChartProps {
  attempts: AttemptOverview[];
  subtitle?: string;
  pointPrefix?: string;
}

export function ScoreProgressionChart(props: ScoreProgressionChartProps) {
  return <ScoreProgressionChartLayout {...props} />;
}
