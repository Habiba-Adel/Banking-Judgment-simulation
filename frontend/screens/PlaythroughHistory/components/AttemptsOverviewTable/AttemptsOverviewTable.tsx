import { AttemptsOverviewTableLayout } from "./AttemptsOverviewTable.layout";
import type { AttemptOverview } from "../../types";

export interface AttemptsOverviewTableProps {
  attempts: AttemptOverview[];
}

export function AttemptsOverviewTable(props: AttemptsOverviewTableProps) {
  return <AttemptsOverviewTableLayout {...props} />;
}
