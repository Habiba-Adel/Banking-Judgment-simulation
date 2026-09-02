export type MetricIconKey =
  | "complianceSafety"
  | "reputationRisk"
  | "customerTrust"
  | "dataProtection"
  | "accountability"
  | "decisionQuality";

export interface MetricData {
  id: string;
  icon: MetricIconKey;
  label: string;
  value: number | null;
  comparisonLabel: string;
}

export interface MissionProgress {
  id: string;
  attemptId: string;
  title: string;
  currentStep: number;
  totalSteps: number;
  playedLabel: string;
  thumbnailSrc: string;
}

export interface ProfileSummary {
  score: number | null;
  maxScore: number;
  profileLabel: string | null;
}

export interface DashboardData {
  userName: string;
  hasProgress: boolean;
  profile: ProfileSummary;
  metrics: MetricData[];
  missions: MissionProgress[];
}