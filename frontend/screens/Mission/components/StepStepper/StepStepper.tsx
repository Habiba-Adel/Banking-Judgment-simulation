import { Check } from "lucide-react";
import type { StepSummary } from "../../types";

export interface StepStepperProps {
  steps: StepSummary[];
}


export function StepStepper({ steps }: StepStepperProps) {
  return (
    <div className="relative flex items-start justify-between px-2">
      <div
        className="absolute left-0 right-0 top-[18px] -z-0 border-t-2 border-dotted border-primary/40"
        style={{ marginInline: "10%" }}
      />

      {steps.map((step) => (
        <div
          key={step.index}
          data-testid="step-indicator"
          data-step-index={step.index}
          data-step-status={step.status}
          className="relative z-10 flex flex-1 flex-col items-center text-center"
        >
          <div
            className={[
              "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold",
              step.status === "done" && "bg-[#5871EC] text-white",
              step.status === "current" && "border-2 border-primary bg-white text-primary",
              step.status === "upcoming" && "border border-gray-300 bg-white text-gray-300",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {step.status === "done" ? <Check className="h-4 w-4" /> : step.index}
          </div>
          <span
            className={[
              "mt-2 text-xs",
              step.status === "upcoming" ? "text-gray-400" : "font-medium text-gray-700",
            ].join(" ")}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}
