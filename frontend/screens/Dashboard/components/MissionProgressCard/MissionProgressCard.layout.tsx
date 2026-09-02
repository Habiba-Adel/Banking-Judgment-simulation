export interface MissionProgressCardLayoutProps {
  title: string;
  currentStep: number;
  totalSteps: number;
  playedLabel: string;
  thumbnailSrc: string;
  onClick: () => void;
}

export function MissionProgressCardLayout({
  title,
  currentStep,
  totalSteps,
  playedLabel,
  thumbnailSrc,
  onClick,
}: MissionProgressCardLayoutProps) {
  const percent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="flex h-[320px] w-[224px] shrink-0 flex-col rounded-lg bg-[#FBFBFB] p-3 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnailSrc}
        alt={title}
        className="h-[150px] w-full shrink-0 rounded object-cover"
      />
      <h3 className="mt-3 truncate text-base font-semibold text-[#1C1C1C]">{title}</h3>

      <div className="mt-4 flex items-center gap-2">
        <div className="relative h-3 flex-1 rounded-full bg-[#5570F1]/10">
          <div
            className="h-full rounded-full bg-[#5570F1]"
            style={{ width: `${percent}%` }}
          />
          <div
            className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#5570F1] ring-4 ring-[#5570F1]/10"
            style={{ left: `calc(${percent}% - 6px)` }}
          />
        </div>
        <span className="text-xs font-medium text-[#5570F1]">{percent}%</span>
      </div>

      <div className="mt-auto flex items-center justify-between pt-3">
        <div>
          <div className="text-xs font-medium text-[#1C1C1C]">
            Step {currentStep} of {totalSteps}
          </div>
          <div className="mt-1 text-xs text-gray-400">Played: {playedLabel}</div>
        </div>
        <button
          type="button"
          data-testid="continue-mission-card-button"
          onClick={onClick}
          aria-label={`Continue ${title}`}
          className="flex h-[31px] w-[27.5px] items-center justify-center rounded border border-[#5570F1] bg-[#FBFBFB]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mission-go-arrow.png" alt="" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}