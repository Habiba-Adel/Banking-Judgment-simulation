import { DecisionByAttemptTableLayout } from "./DecisionByAttemptTable.layout";
import type { AttemptOverview, DecisionRow } from "../../types";

export interface DecisionByAttemptTableProps {
  attempts: AttemptOverview[];
  decisions: DecisionRow[];
}

export function DecisionByAttemptTable(props: DecisionByAttemptTableProps) {
  return <DecisionByAttemptTableLayout {...props} />;
}
