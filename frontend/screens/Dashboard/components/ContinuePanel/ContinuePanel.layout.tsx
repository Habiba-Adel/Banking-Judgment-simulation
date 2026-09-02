import type { RefObject } from "react";
import Image from "next/image";
import { MissionProgressCard } from "../MissionProgressCard";
import type { MissionProgress } from "../../types";

export interface ContinuePanelLayoutProps {
  hasProgress: boolean;
  missions: MissionProgress[];
  scrollRef: RefObject<HTMLDivElement | null>;
  onPrev: () => void;
  onNext: () => void;
  onStartNew: () => void;
  onMissionClick: (attemptId: string) => void;
}

export function ContinuePanelLayout({
  hasProgress,
  missions,
  scrollRef,
  onPrev,
  onNext,
  onStartNew,
  onMissionClick,
}: ContinuePanelLayoutProps) {
  return (
    <div className="rounded-lg bg-[#FBFBFB] p-5 shadow-sm">
      <h2 className="text-lg font-bold text-[#1C1C1C]">Continue where you left off</h2>

      {!hasProgress || missions.length === 0 ? (
        <div className="mt-6 flex flex-col items-center text-center">
          <Image src="/folder-icon.png" alt="" width={160} height={160} className="h-40 w-40 object-contain" />
          <p className="mt-4 font-semibold text-gray-900">No Simulation History Yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Once you start a simulation, your ongoing progress will appear here.
          </p>
          <button
            type="button"
            onClick={onStartNew}
            className="mt-5 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Start New Simulation
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white">
              <Image
                src="/continue-arrow.png"
                alt=""
                width={38}
                height={34}
                className="object-contain"
              />
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
                <MissionProgressCard {...mission} onClick={() => onMissionClick(mission.attemptId)} />
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