import { AttemptsOverviewTableLayout } from "./AttemptsOverviewTable.layout";
import type { AttemptOverview } from "../../types";

export interface AttemptsOverviewTableProps {
  attempts: AttemptOverview[];
  title?: string;
  noun?: string;
  numberColumnLabel?: string;
}

export function AttemptsOverviewTable(props: AttemptsOverviewTableProps) {
  return <AttemptsOverviewTableLayout {...props} />;
}
