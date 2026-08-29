import { StatusFilterTabsLayout } from "./StatusFilterTabs.layout";
import type { StatusFilter } from "../../types";

export interface StatusFilterTabsProps {
  active: StatusFilter;
  onChange: (filter: StatusFilter) => void;
}

export function StatusFilterTabs(props: StatusFilterTabsProps) {
  return <StatusFilterTabsLayout {...props} />;
}
