import { MissionScoreGaugeLayout } from "./MissionScoreGauge.layout";

export interface MissionScoreGaugeProps {
  score: number;
  maxScore: number;
  verdictLabel: string;
}

export function MissionScoreGauge(props: MissionScoreGaugeProps) {
  return <MissionScoreGaugeLayout {...props} />;
}
