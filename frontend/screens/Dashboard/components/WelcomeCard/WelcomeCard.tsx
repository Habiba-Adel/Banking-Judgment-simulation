import { WelcomeCardLayout } from "./WelcomeCard.layout";

export interface WelcomeCardProps {
  userName: string;
  hasProgress: boolean;
  onPrimaryAction: () => void;
  onReadInstructions: () => void;
}

export function WelcomeCard({ userName, hasProgress, onPrimaryAction, onReadInstructions }: WelcomeCardProps) {
  return (
    <WelcomeCardLayout
      userName={userName}
      hasProgress={hasProgress}
      onPrimaryAction={onPrimaryAction}
      onReadInstructions={onReadInstructions}
    />
  );
}