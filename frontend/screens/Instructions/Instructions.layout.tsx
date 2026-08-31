import Image from "next/image";
//import { SidebarNav } from "@/components/SidebarNav";
import { TopBar } from "@/components/TopBar";
import type { CastMember, JourneyStep, BehaviorMetricInfo } from "./types";

export interface InstructionsLayoutProps {
  journeySteps: JourneyStep[];
  behaviorMetrics: BehaviorMetricInfo[];
  cast: CastMember[];
  loading: boolean;
  error: string | null;
}

function CastAvatar({ name, avatarSrc, isPlayer }: { name: string; avatarSrc?: string; isPlayer?: boolean }) {
  if (isPlayer) {
    return (
      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
        <Image src="/avatars/banker.png" alt={name} fill sizes="48px" className="object-cover" />
      </div>
    );
  }
  if (avatarSrc) {
    return (
      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
        <Image src={avatarSrc} alt={name} fill sizes="48px" className="object-cover" />
      </div>
    );
  }
  return (
    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-500">
      {name.charAt(0)}
    </div>
  );
}

export function InstructionsLayout({
  journeySteps,
  behaviorMetrics,
  cast,
  loading,
  error,
}: InstructionsLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-[#FBFBFB]">

      <div className="flex-1">
        <TopBar showNotifications={false} />

        <div className="flex w-full flex-col gap-[48px] px-8 py-6">
          {/* Card 1: How the simulation works */}
          <div className="flex min-h-[276px] w-full flex-col gap-[24px] rounded-2xl border border-[#FEF7EC] p-5 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
            <div className="flex min-h-[158px] w-full flex-col gap-[12px]">
              <h1 className="text-[48px] font-medium leading-[60px] tracking-[-0.02em] text-[#1C1C1C]">
                How the simulation works
              </h1>
              <p className="text-[18px] font-semibold leading-[28px] text-[#1C1C1C]">
                Practice making decisions under realistic banking pressure.
              </p>
              <p className="text-[18px] font-normal leading-[28px] text-[#4D5761]">
                You play a bank employee facing realistic dilemmas. Colleagues, managers,
                customers, and vendors all push you. Choose, live the consequences, and build a
                behavioural profile across twelve missions.
              </p>
            </div>
            {/* BUTTON 1 (TOP) FIX */}
            <button
              type="button"
              className="flex h-[52px] w-[238px] items-center justify-center gap-[10px] rounded-lg bg-primary px-[10px] transition-colors hover:bg-indigo-600"
            >
              <span className="whitespace-nowrap text-[18px] font-medium leading-[28px] text-white">
                Start New Simulation
              </span>
              <span className="flex h-[32px] w-[32px] flex-shrink-0 items-center justify-center rounded-[4px] border-2 border-[#FFFEF2] bg-[#FBFBFB]">
                <Image src="/continue-arrow.png" alt="" width={60} height={60} className="object-contain" />
              </span>
            </button>
          </div>

          {/* Your simulation journey */}
          <div className="mt-2">
            <h2 className="text-[24px] font-semibold text-[#1C1C1C]">Your simulation journey</h2>
            <p className="mt-1 text-[16px] text-[#4D5761]">
              Your performance builds across multiple missions. Every decision contributes to
              the bigger picture.
            </p>

            <div className="relative mt-6 flex items-start justify-between">
              <div className="absolute left-[70px] right-[70px] top-[18px] -z-0 border-t-2 border-dotted border-primary/40" />              
              {journeySteps.map((step) => (
                <div key={step.index} className="relative z-10 flex flex-col items-center text-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white">
                    {step.index}
                  </div>
                  <span className="mt-3 text-[18px] font-medium leading-[28px] text-[#1C1C1C]">{step.title}</span>
                  <span className="mt-1 max-w-[192px] text-[16px] font-normal leading-[24px] text-[#4D5761]/60">
                    {step.description}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 7 behavioural metrics */}
          <div className="mt-4">
            <h2 className="text-[24px] font-semibold text-[#1C1C1C]">7 behavioral metrics</h2>
            <p className="mt-1 text-[16px] text-[#4D5761]">
              Your decisions are evaluated across seven behavioral dimensions.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {behaviorMetrics.map((metric) => (
                <div
                  key={metric.key}
                  // Changed p-[10px] to py-[10px] px-[20px] to add the requested left/right padding
                  className="flex flex-col gap-3 rounded-2xl bg-white py-[10px] px-[20px] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-tint">
                    <Image
                      src={metric.iconSrc}
                      alt=""
                      width={20}
                      height={20}
                      className="object-contain"
                      style={{
                        filter:
                          "brightness(0) saturate(100%) invert(36%) sepia(97%) saturate(1036%) hue-rotate(214deg) brightness(101%) contrast(102%)",
                      }}
                    />
                  </div>
                  <div className="text-sm font-semibold text-[#1C1C1C]">{metric.label}</div>
                  <div className="text-xs text-[#4D5761]">{metric.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h2 className="text-[24px] font-semibold text-[#1C1C1C]">The cast you&apos;ll face</h2>

            {loading && <p className="mt-4 text-sm text-gray-400">Loading cast…</p>}
            {error && <p className="mt-4 text-sm text-red-500">Couldn&apos;t load cast: {error}</p>}

            {!loading && !error && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
                {cast.map((member) => (
                  <div
                    key={member.id}
                    className={[
                      "flex flex-col items-center gap-3 rounded-lg bg-white p-3 text-center shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]",
                      member.isPlayer ? "sm:col-span-2" : "",
                    ].join(" ")}
                  >
                    <CastAvatar name={member.name} avatarSrc={member.avatarSrc} isPlayer={member.isPlayer} />
                    <div>
                      <div className="text-sm font-semibold text-[#1C1C1C]">{member.name}</div>
                      <div className="text-xs text-[#4D5761]">{member.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom banner */}
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-primary p-6">
            <div>
              <h3 className="text-[24px] font-medium leading-[32px] text-white">
                You finish with a profile, not a grade
              </h3>
              <p className="mt-1 text-sm text-white/80">
                Your repeated tendencies not single right answers reveal one of eight banker profiles.
              </p>
            </div>
            <button
              type="button"
              className="flex h-[52px] w-[238px] flex-shrink-0 items-center justify-center gap-[10px] rounded-lg bg-[#FBFBFB] px-[10px] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] transition-colors hover:bg-gray-50"
            >
              <span className="whitespace-nowrap text-[18px] font-medium leading-[28px] text-[#5871EC]">
                Start New Simulation
              </span>
              <span className="flex h-[32px] w-[32px] flex-shrink-0 items-center justify-center rounded-[4px] border-2 border-[#5871EC] bg-[#FBFBFB]">
                <Image src="/continue-arrow.png" alt="" width={60} height={60} className="object-contain" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}