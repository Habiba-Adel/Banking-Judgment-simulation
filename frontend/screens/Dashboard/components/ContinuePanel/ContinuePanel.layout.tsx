import type { RefObject } from "react";
import { ArrowRight, FolderClosed } from "lucide-react";
import { MissionProgressCard } from "../MissionProgressCard";
import type { MissionProgress } from "../../types";

export interface ContinuePanelLayoutProps {
  hasProgress: boolean;
  missions: MissionProgress[];
  scrollRef: RefObject<HTMLDivElement | null>;
  onPrev: () => void;
  onNext: () => void;
}

export function ContinuePanelLayout({
  hasProgress,
  missions,
  scrollRef,
  onPrev,
  onNext,
}: ContinuePanelLayoutProps) {
  return (
    <div className="rounded-lg bg-[#FBFBFB] p-5 shadow-sm">
      <h2 className="text-lg font-bold text-[#1C1C1C]">Continue where you left off</h2>

      {!hasProgress || missions.length === 0 ? (
        <div className="mt-6 flex flex-col items-center text-center">
          <div className="flex h-40 w-40 items-center justify-center rounded-full border border-gray-100">
            <FolderClosed className="h-16 w-16 text-gray-300" />
          </div>
          <p className="mt-4 font-semibold text-gray-900">No Simulation History Yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Once you start a simulation, your ongoing progress will appear here.
          </p>
          <button
            type="button"
            className="mt-5 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Start New Simulation
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/20">
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <div
            ref={scrollRef}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none" }}
          >
            {missions.map((mission) => (
              <div key={mission.id} data-mission-card className="snap-start">
                <MissionProgressCard {...mission} />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous"
              className="flex h-8 w-8 items-center justify-center rounded-[4px] border-2 border-[#5570F1] bg-[#FBFBFB] p-[10px]"
            >
              <span
                aria-hidden
                className="h-3 w-3 bg-[#5570F1]"
                style={{
                  maskImage: "url(/carousel-arrow-left.svg)",
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                  WebkitMaskImage: "url(/carousel-arrow-left.svg)",
                  WebkitMaskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                }}
              />
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="Next"
              className="flex h-8 w-8 items-center justify-center rounded-[4px] border-2 border-[#5570F1] bg-[#FBFBFB] p-[10px]"
            >
              <span
                aria-hidden
                className="h-3 w-3 bg-[#5570F1]"
                style={{
                  maskImage: "url(/carousel-arrow-right.png)",
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                  WebkitMaskImage: "url(/carousel-arrow-right.png)",
                  WebkitMaskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                }}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}