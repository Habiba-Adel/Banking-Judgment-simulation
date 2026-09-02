import { DecisionByAttemptTableLayout } from "./DecisionByAttemptTable.layout";
import type { AttemptOverview, DecisionRow } from "../../types";

export interface DecisionByAttemptTableProps {
  attempts: AttemptOverview[];
  decisions: DecisionRow[];
  title?: string;
  rowHeader?: string;
  columnPrefix?: string;
}

export function DecisionByAttemptTable(props: DecisionByAttemptTableProps) {
  return <DecisionByAttemptTableLayout {...props} />;
}
