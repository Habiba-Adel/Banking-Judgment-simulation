import { PrimaryBackButtonLayout } from "./PrimaryBackButton.layout";

export interface PrimaryBackButtonProps {
  onClick?: () => void;
  className?: string;
}

export function PrimaryBackButton({ onClick, className }: PrimaryBackButtonProps) {
  return <PrimaryBackButtonLayout onClick={onClick} className={className} />;
}
