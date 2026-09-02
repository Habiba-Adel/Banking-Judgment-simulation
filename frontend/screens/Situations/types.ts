export type MissionStatus = "in_progress" | "not_started" | "completed";

export type StatusFilter = "all" | "in_progress" | "not_started" | "completed";

export interface MissionCardData {
  id: string;
  title: string;
  description: string;
  status: MissionStatus;
  thumbnailSrc: string;
  totalDecisions: number;
  estimatedMinutes: number;
  /** in_progress only */
  currentStep?: number;
  /** in_progress only */
  playedLabel?: string;
  /** in_progress or completed */
  attemptId?: string;
}

export interface MissionCategoryData {
  id: string;
  title: string;
  missions: MissionCardData[];
}

export interface SituationsData {
  categories: MissionCategoryData[];
}
