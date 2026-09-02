import { AttemptPickerLayout } from "./AttemptPicker.layout";

export interface AttemptOption {
  id: string;
  runNumber: number;
  date: string;
  score: number;
}

export interface AttemptPickerProps {
  options: AttemptOption[];
  selectedIds: string[];
  maxSelected: number;
  onToggle: (id: string) => void;
  /** Defaults keep the mission-attempt-comparison wording; the journey-comparison view overrides these. */
  title?: string;
  itemNoun?: string;
  pillPrefix?: string;
}

export function AttemptPicker(props: AttemptPickerProps) {
  return <AttemptPickerLayout {...props} />;
}