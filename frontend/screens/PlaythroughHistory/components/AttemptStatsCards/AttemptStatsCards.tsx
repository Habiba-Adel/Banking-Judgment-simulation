import { AttemptStatsCardsLayout } from "./AttemptStatsCards.layout";
import type { AttemptOverview } from "../../types";

export interface AttemptStatsCardsProps {
  attempts: AttemptOverview[];
  /** "attempt" (default, mission-comparison view) or "journey" (journey-comparison view). */
  noun?: string;
}

export function AttemptStatsCards(props: AttemptStatsCardsProps) {
  return <AttemptStatsCardsLayout {...props} />;
}
