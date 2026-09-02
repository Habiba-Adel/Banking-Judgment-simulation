export type DecisionVerdict = "excellent" | "good" | "risky";

export interface AttemptOverview {
  attemptNumber: number;
  date: string;
  score: number;
  accuracy: number;
  decisionQuality: number;
  improvement: number;
}

export interface DecisionRow {
  decisionId: string;
  decisionLabel: string;
  verdictsByAttempt: DecisionVerdict[];
}

export interface MetricComparison {
  key: string;
  label: string;
  iconSrc: string;
  valuesByRun: number[];
}

export interface MissionAttemptHistoryData {
  missionTitle: string;
  attempts: AttemptOverview[];
  decisions: DecisionRow[];
  metrics: MetricComparison[];
}

// Reuses the same shapes as the mission-attempt comparison above — a
// "journey" (full playthrough) slots into AttemptOverview the same way a
// mission attempt does, and each mission slots into DecisionRow the same way
// a decision does, so the same comparison components render both.
export type JourneyComparisonData = MissionAttemptHistoryData;
