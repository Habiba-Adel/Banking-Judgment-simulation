import { LowerButtonsLayout } from "./LowerButtons.layout";

export interface LowerButtonsProps {
  onReplay?: () => void;
  onGoToHistory?: () => void;
}

export function LowerButtons(props: LowerButtonsProps) {
  return <LowerButtonsLayout {...props} />;
}
