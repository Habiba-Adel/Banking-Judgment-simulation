import { TopBar } from "@/components/TopBar";
import { PrimaryBackButton } from "@/components/PrimaryBackButton";
import { TitleCard } from "./components/TitleCard";
import { MissionScoreGauge } from "./components/MissionScoreGauge";
import { ImprovedCard } from "./components/ImprovedCard";
import { AttentionCard } from "./components/AttentionCard";
import { LandedCard } from "./components/LandedCard";
import { DecisionMetrics } from "./components/DecisionMetrics";
import { LowerButtons } from "./components/LowerButtons";
import type { MissionReportData } from "./types";

export interface MissionReportLayoutProps {
  data: MissionReportData;
  onBack?: () => void;
  onReplay?: () => void;
  onGoToHistory?: () => void;
}

export function MissionReportLayout({ data, onBack, onReplay, onGoToHistory }: MissionReportLayoutProps) {
  const { category, title, description, highlights, score, maxScore, verdictLabel, improved, attention, landed, decisions } = data;

  return (
    <div data-testid="mission-report-root" className="animate-fade-in-up min-w-0 flex-1 px-8 pt-[29px] pb-8">
      <div className="flex items-center justify-between">
        <PrimaryBackButton onClick={onBack} />
        <TopBar />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <TitleCard category={category} title={title} description={description} highlights={highlights} />
        <MissionScoreGauge score={score} maxScore={maxScore} verdictLabel={verdictLabel} />
      </div>

      <div className="mt-6 flex flex-wrap justify-between gap-6">
        <ImprovedCard items={improved} />
        <AttentionCard items={attention} />
        <LandedCard items={landed} />
      </div>

      <div className="mt-6">
        <DecisionMetrics decisions={decisions} />
      </div>

      <div className="mt-6">
        <LowerButtons onReplay={onReplay} onGoToHistory={onGoToHistory} />
      </div>
    </div>
  );
}