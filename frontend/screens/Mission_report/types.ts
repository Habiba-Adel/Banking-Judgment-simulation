import type { ImprovedMetric } from "./components/ImprovedCard/ImprovedCard";
import type { AttentionMetric } from "./components/AttentionCard/AttentionCard";
import type { LandedMetric } from "./components/LandedCard/LandedCard";
import type { DecisionMetricRow } from "./components/DecisionMetrics/DecisionMetrics";

export interface MissionReportData {
  category: string;
  title: string;
  description: string;
  highlights: string[];
  score: number;
  maxScore: number;
  verdictLabel: string;
  improved: ImprovedMetric[];
  attention: AttentionMetric[];
  landed: LandedMetric[];
  decisions: DecisionMetricRow[];
}