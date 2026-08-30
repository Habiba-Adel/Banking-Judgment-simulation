import { AttemptStatsCardsLayout } from "./AttemptStatsCards.layout";
import type { AttemptOverview } from "../../types";

export interface AttemptStatsCardsProps {
  attempts: AttemptOverview[];
}

export function AttemptStatsCards(props: AttemptStatsCardsProps) {
  return <AttemptStatsCardsLayout {...props} />;
}
