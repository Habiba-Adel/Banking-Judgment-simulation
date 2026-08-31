import { WelcomeCardLayout } from "./WelcomeCard.layout";

export interface WelcomeCardProps {
  userName: string;
  hasProgress: boolean;
}

export function WelcomeCard({ userName, hasProgress }: WelcomeCardProps) {
  return <WelcomeCardLayout userName={userName} hasProgress={hasProgress} />;
}