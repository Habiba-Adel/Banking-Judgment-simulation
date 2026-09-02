export interface RadialMetric {
  name: string;
  value: number;
  fill: string;
}

export interface StatCardData {
  id: string;
  label: string;
  value: string;
  trendLabel: string;
  trendDirection: "up" | "down";
  description: string;
}

export interface PerformancePoint {
  day: string;
  score: number;
}

export interface DecisionQualitySlice {
  label: string;
  value: number;
  color: string;
}

export interface BehaviorPattern {
  title: string;
  description: string;
  signalsLabel?: string;
  level: "Low" | "High";
}

export interface RecentScenario {
  mission: string;
  category: string;
  score: string;
  decisionQuality: string;
  totalTime: string;
  lastPlayed: string;
  status: "Completed" | "Pending";
}

export interface PerformanceData {
  averageScore: number;
  radialMetrics: RadialMetric[];
  stats: StatCardData[];
  performanceOverTime: PerformancePoint[];
  currentPointLabel: string;
  decisionQuality: {
    totalDecisions: number;
    slices: DecisionQualitySlice[];
  };
  behaviorPatterns: BehaviorPattern[];
  recentScenarios: RecentScenario[];
}