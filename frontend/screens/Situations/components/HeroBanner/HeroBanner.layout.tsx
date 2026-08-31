import Image from "next/image";
import type { HeroBannerProps } from "./HeroBanner";

export function HeroBannerLayout({ onContinueMission, onSeePerformance }: HeroBannerProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-[#FBFBFB] p-8">
      <h1 className="text-4xl leading-10 font-bold tracking-tight align-middle text-gray-900">
        Banking Judgment in Action
      </h1>
      <p className="mt-3 text-lg leading-7 font-medium tracking-normal align-middle text-gray-900">
        12 real banking dilemmas
      </p>
      <p className="mt-3 max-w-3xl text-gray-500">
        Every choice moves seven live metrics and leaves a behavioral trace. There is rarely one
        obvious answer — some risky options are meant to feel helpful. Play all twelve to reveal
        your banker profile.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onContinueMission}
          className="flex items-center gap-2.5 rounded-xl bg-[#5570F1] px-5 py-3 text-lg leading-7 font-medium tracking-normal align-middle text-white hover:bg-[#4560e0]"
        >
          Continue Mission
          <span className="relative flex h-11 w-11 items-center justify-center rounded border-2 border-white bg-white p-1">
            <Image src="/mission-go-arrow.png" alt="" fill className="object-contain" />
          </span>
        </button>
        <button
          type="button"
          onClick={onSeePerformance}
          className="rounded-xl border border-[#5570F1] px-5 py-3 text-lg leading-7 font-medium tracking-normal align-middle text-gray-700 hover:bg-gray-50"
        >
          See Your Performance
        </button>
      </div>
    </div>
  );
}
