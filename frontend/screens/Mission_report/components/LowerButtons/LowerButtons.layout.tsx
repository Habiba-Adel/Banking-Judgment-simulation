import type { LowerButtonsProps } from "./LowerButtons";

export function LowerButtonsLayout({ onReplay, onNext }: LowerButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={onReplay}
        className="h-[48px] w-[184px] rounded-lg border border-[#5570F1] bg-[#FBFBFB] text-sm font-bold text-[#1C1C1C] transition-colors hover:bg-gray-50"
      >
        Replay this mission
      </button>

      <button
        type="button"
        onClick={onNext}
        className="flex h-[48px] w-[170px] items-center justify-between rounded-lg bg-[#5570F1] pr-1.5 pl-5 text-sm font-bold text-white transition-colors hover:bg-[#4a63e0]"
      >
        Next mission
        <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[6px] bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/next-mission-arrow.png"
            alt=""
            className="h-[18px] w-[18px]"
          />
        </span>
      </button>
    </div>
  );
}
