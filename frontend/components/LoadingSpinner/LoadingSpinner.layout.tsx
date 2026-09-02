import type { LoadingSpinnerProps } from "./LoadingSpinner";

export function LoadingSpinnerLayout({ label, className }: LoadingSpinnerProps) {
  return (
    <div className={`flex min-h-screen w-full flex-col items-center justify-center gap-5 text-sm text-gray-500 ${className ?? ""}`}>
      <span
        className="h-24 w-24 animate-spin rounded-full border-8 border-gray-200 border-t-[#5570F1]"
        aria-hidden="true"
      />
      {label && <span>{label}</span>}
    </div>
  );
}
