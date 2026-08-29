import { TopBarLayout } from "./TopBar.layout";

export interface TopBarProps {
  language?: "AR" | "EN";
}

export function TopBar({ language = "EN" }: TopBarProps) {
  return <TopBarLayout language={language} />;
}
