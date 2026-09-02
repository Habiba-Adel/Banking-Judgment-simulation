import { LoadingSpinnerLayout } from "./LoadingSpinner.layout";

export interface LoadingSpinnerProps {
  label?: string;
  className?: string;
}

export function LoadingSpinner({ label = "Loading...", className }: LoadingSpinnerProps) {
  return <LoadingSpinnerLayout label={label} className={className} />;
}
