import { useAnimatedNumber } from "@/lib/useAnimatedNumber";
import { MissionScoreGaugeLayout } from "./MissionScoreGauge.layout";

export interface MissionScoreGaugeProps {
  score: number;
  maxScore: number;
  verdictLabel: string;
}

export function MissionScoreGauge(props: MissionScoreGaugeProps) {
  const animatedScore = useAnimatedNumber(props.score);
  return <MissionScoreGaugeLayout {...props} animatedScore={animatedScore} />;
}
