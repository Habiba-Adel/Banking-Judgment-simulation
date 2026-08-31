import Link from "next/link";
import Image from "next/image";
import { TopBar } from "../../components/TopBar";
//import { SidebarNav } from "../../components/SidebarNav";
import { MetricsBar } from "./components/MetricsBar";
import { SituationPressureCard } from "./components/SituationPressureCard";
import { StepStepper } from "./components/StepStepper";
import { ContactsList } from "./components/ContactsList";
import { ChatPanel } from "./components/ChatPanel";
import type { MissionData } from "./types";

export interface MissionLayoutProps {
  data: MissionData;
  onSelectChoice: (choiceId: string) => void;
  onSend: () => void;
  onSelectContact: (characterId: string) => void;
  isSending?: boolean;
}

export function MissionLayout({
  data,
  onSelectChoice,
  onSend,
  onSelectContact,
  isSending,
}: MissionLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-gray-50">

      <div className="flex-1 overflow-y-auto">
        {/* Header – Back button + TopBar, with correct top/left padding */}
        <div className="flex items-center justify-between px-6 pt-5 mb-6">
          <Link
            href="/"
            dir="ltr"
            className="flex h-[48px] w-[83px] items-center justify-center gap-[10px] rounded-lg bg-[#FBFBFB] p-[10px] text-sm font-bold text-primary shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] transition-colors hover:bg-gray-100"
          >
            <Image
              src="/carousel-arrow-left.svg"
              alt="Back"
              width={12}
              height={18}
              className="object-contain"
            />
            Back
          </Link>
          <TopBar />
        </div>

        {/* Main content */}
        <div className="px-6 pb-8">
          {/* Metrics + Description + Pressure row */}
          <div className="mb-[20px] flex flex-col gap-6">
            <MetricsBar metrics={data.metrics} />

            <div className="grid grid-cols-1 items-stretch gap-[20px] lg:grid-cols-4">
              <div className="flex flex-col gap-6 lg:col-span-3">
                {/* Description card – height 163px as per Figma */}
                <div className="flex h-[163px] flex-col gap-[12px] rounded-2xl border border-gray-100 bg-white p-[24px]">
                  <div>
                    <span className="inline-block rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white">
                      {data.mission.category}
                    </span>
                    <span className="ml-3 text-xl font-bold text-gray-900">
                      {data.mission.title}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{data.mission.description}</p>
                </div>
              </div>

              {/* SituationPressureCard – now stretches to same height */}
              <div className="lg:col-span-1 h-full">
                <SituationPressureCard
                  pressure={data.pressure}
                  goalText={data.mission.goalText}
                />
              </div>
            </div>
          </div>

          <StepStepper steps={data.steps} />

          <div className="mt-6 flex items-start gap-[24px]">
            <ContactsList
              contacts={data.contacts}
              activeCharacterId={data.activeCharacter?.id ?? null}
              onSelectContact={onSelectContact}
            />
            <div className="flex-1 min-w-0">
              <ChatPanel
                character={data.activeCharacter}
                messages={data.messages}
                choices={data.choices}
                selectedChoiceId={data.selectedChoiceId}
                dateLabel={data.dateLabel}
                onSelectChoice={onSelectChoice}
                onSend={onSend}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}