import Link from "next/link";
import { MetricsBar } from "./components/MetricsBar";
import { SituationPressureCard } from "./components/SituationPressureCard";
import { StepStepper } from "./components/StepStepper";
import { ContactsList } from "./components/ContactsList";
import { ChatPanel } from "./components/ChatPanel";
import { SidebarNav } from "../../components/SidebarNav"; 
import type { MissionData } from "./types";
import { ChevronLeft, Languages } from "lucide-react";
import Image from "next/image";

export interface MissionLayoutProps {
  data: MissionData;
  onSelectChoice: (choiceId: string) => void;
  onSend: () => void;
  onSelectContact: (characterId: string) => void;
}

export function MissionLayout({ data, onSelectChoice, onSend ,onSelectContact }: MissionLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-primary-tint">
      <SidebarNav collapsed={true} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex items-center justify-between">
         <Link
  href="/"
  dir="ltr"
  className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-primary shadow-sm hover:bg-gray-50 transition-colors"
>
  <Image src="/carousel-arrow-left.svg" alt="Back" width={12} height={18} className="object-contain" />
  Back
</Link>
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1 text-xs">
            <Languages className="h-3.5 w-3.5 text-gray-400" />
            <button className="rounded-full px-2 py-0.5 text-gray-400">AR</button>
            <button className="rounded-full bg-primary px-2 py-0.5 font-semibold text-white">EN</button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <MetricsBar metrics={data.metrics} />
            <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <span className="inline-block rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white">
                {data.mission.category}
              </span>
              <h1 className="mt-3 text-xl font-bold text-gray-900">{data.mission.title}</h1>
              <p className="mt-2 text-sm text-gray-500">{data.mission.description}</p>
            </div>
          </div>
          <SituationPressureCard pressure={data.pressure} goalText={data.mission.goalText} />
        </div>

        <StepStepper steps={data.steps} />

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[451px_1fr] items-start">
<ContactsList 
  contacts={data.contacts} 
  activeCharacterId={data.activeCharacter?.id ?? null} 
  onSelectContact={onSelectContact}
/>
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
  );
}