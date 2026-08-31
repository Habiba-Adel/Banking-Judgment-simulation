import type { BehaviorPattern } from "../../types";

export interface BehaviorPatternsCardProps {
  patterns: BehaviorPattern[];
}

export function BehaviorPatternsCard({ patterns }: BehaviorPatternsCardProps) {
  return (
    <div className="flex h-auto w-full flex-col rounded-[16px] bg-white p-5 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
      <h3 className="text-[24px] font-medium leading-[32px] text-[#1C1C1C]">
        Behavior Patterns
      </h3>

      <div className="mt-6 flex flex-col gap-6">
        {patterns.map((pattern) => (
          <div key={pattern.title} className="flex min-h-[28px] w-full items-start justify-between">
            <div className="flex-1">
              <div className="text-[16px] font-medium leading-[24px] text-[#1C1C1C]">
                {pattern.title}
              </div>
              <p className="mt-1 text-[14px] font-normal leading-[20px] text-[#6C737F]">
                {pattern.description}
                {pattern.signalsLabel && (
                  <>
                    <br />
                    {pattern.signalsLabel}
                  </>
                )}
              </p>
            </div>
            <span
              className="ml-4 flex h-[28px] flex-shrink-0 items-center justify-center rounded-[4px] px-4 py-1 text-[14px] font-medium text-white"
              style={{
                backgroundColor:
                  pattern.level === "Low" ? "rgba(27, 131, 84, 0.9)" : "rgba(240, 68, 56, 0.9)",
              }}
            >
              {pattern.level}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}