import Image from "next/image";
import type { MissionCardProps } from "./MissionCard";
import type { MissionStatus } from "../../types";

const STATUS_BADGE: Record<MissionStatus, { label: string; className: string }> = {
  in_progress: { label: "In Progress", className: "bg-[#F79009] text-white" },
  not_started: { label: "Not Started", className: "bg-[#FBFBFB] text-[#1C1C1C] shadow-sm" },
  completed: { label: "Completed", className: "bg-[#519C66] text-white" },
};

export function MissionCardLayout({
  mission,
  onStart,
  onContinue,
  onReplay,
  onReport,
}: MissionCardProps) {
  const { id, title, description, status, thumbnailSrc, totalDecisions, estimatedMinutes, currentStep, playedLabel } = mission;
  const badge = STATUS_BADGE[status];

  return (
    <div className="flex w-[220px] shrink-0 flex-col rounded-xl border border-gray-100 bg-[#FBFBFB] p-3 shadow-sm">
      <div className="relative h-[130px] w-full shrink-0 overflow-hidden rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumbnailSrc} alt={title} className="h-full w-full object-cover" />
        <span
          className={`absolute top-2 right-2 rounded-md px-2 py-1 text-xs font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      <h3 className="mt-3 text-base leading-6 font-medium tracking-normal align-middle text-[#1C1C1C]">
        {title}
      </h3>
      <p className="mt-1 text-xs text-gray-500">{description}</p>

      <div className="mt-auto pt-3">
        {status === "in_progress" ? (
          <>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#1C1C1C]">
                {currentStep} of {totalDecisions} decisions
              </span>
              <span className="text-gray-400">Played: {playedLabel}</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-[#5570F1]/10">
              <div
                className="h-full rounded-full bg-[#5570F1]"
                style={{ width: `${Math.round(((currentStep ?? 0) / totalDecisions) * 100)}%` }}
              />
            </div>
            <button
              type="button"
              onClick={() => onContinue?.(id)}
              className="mt-3 flex w-full items-center justify-center gap-2.5 rounded-lg bg-[#5570F1] py-2.5 text-sm font-semibold text-white hover:bg-[#4560e0]"
            >
              Continue Mission
              <span className="relative flex h-11 w-11 items-center justify-center rounded border-2 border-white bg-white p-1">
                <Image src="/mission-go-arrow.png" alt="" fill className="object-contain" />
              </span>
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{totalDecisions} decisions</span>
              <span>{estimatedMinutes} minutes</span>
            </div>
            {status === "not_started" ? (
              <button
                type="button"
                onClick={() => onStart?.(id)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#5570F1] py-2.5 text-sm font-semibold text-[#5570F1] hover:bg-[#5570F1]/5"
              >
                Start Mission
                <span className="flex h-6 w-6 items-center justify-center rounded border border-[#5570F1]">
                  <Image src="/mission-go-arrow.png" alt="" width={14} height={9} className="object-contain" />
                </span>
              </button>
            ) : (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onReplay?.(id)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#5570F1] py-2.5 text-sm font-semibold text-[#5570F1] hover:bg-[#5570F1]/5"
                >
                  Replay
                  <span className="flex h-6 w-6 items-center justify-center rounded border border-[#5570F1]">
                    <Image src="/mission-go-arrow.png" alt="" width={14} height={9} className="object-contain" />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onReport?.(id)}
                  className="flex-1 rounded-lg border border-[#5570F1] py-2.5 text-sm font-semibold text-[#5570F1] hover:bg-[#5570F1]/5"
                >
                  Report
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
