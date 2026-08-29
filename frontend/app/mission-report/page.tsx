import { SidebarNav } from "@/components/SidebarNav";
import { TopBar } from "@/components/TopBar";
import { PrimaryBackButton } from "@/screens/Mission_report/components/PrimaryBackButton";
import { TitleCard } from "@/screens/Mission_report/components/TitleCard";
import { MissionScoreGauge } from "@/screens/Mission_report/components/MissionScoreGauge";
import { ImprovedCard } from "@/screens/Mission_report/components/ImprovedCard";
import { AttentionCard } from "@/screens/Mission_report/components/AttentionCard";
import { LandedCard } from "@/screens/Mission_report/components/LandedCard";
import { DecisionMetrics } from "@/screens/Mission_report/components/DecisionMetrics";
import { LowerButtons } from "@/screens/Mission_report/components/LowerButtons";

export default function MissionReportPage() {
  return (
    <div className="flex min-h-screen w-full bg-[#F5F5F5]">
      <SidebarNav />
      <div className="min-w-0 flex-1 px-8 pt-[29px] pb-8">
        <div className="flex items-center justify-between">
          <PrimaryBackButton />
          <TopBar />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <TitleCard
            category="Ethics & Data"
            title="The Screenshot Shortcut"
            description="In banking, speed matters — but never at the expense of customer confidentiality, access controls, or the audit trail. You refused informal sharing, held the line under authority pressure, and closed the case with documentation."
            highlights={[
              "Customer data moved outside approved channels — that's where Data Protection fell. Use the system, not screenshots or chat.",
              "You escalated through the proper channel — that's what lifted Compliance and lowered Reputation Risk.",
              "Documenting the decision is why Accountability held up. A clean record protects you later.",
            ]}
          />

          <MissionScoreGauge
            score={74}
            maxScore={100}
            verdictLabel="Acceptable with Risk Areas"
          />
        </div>

        <div className="mt-6 flex flex-wrap justify-between gap-6">
          <ImprovedCard
            items={[
              { iconSrc: "/customer trust.svg", label: "Customer Trust", delta: 18 },
              { iconSrc: "/compliance safety.svg", label: "Compliance Safety", delta: 34 },
              { iconSrc: "/dataprotection.svg", label: "Data Protection", delta: 18 },
              { iconSrc: "/decision quality.svg", label: "Decision Quality", delta: 12 },
              { iconSrc: "/accoutability.png", label: "Accountability", delta: 50 },
            ]}
          />

          <AttentionCard
            items={[
              { iconSrc: "/reputation risk.svg", label: "Reputation Risk", delta: 30 },
              { iconSrc: "/responsible banking.svg", label: "Responsible Banking", delta: -18 },
            ]}
          />

          <LandedCard
            items={[
              { label: "Compliance Safety", value: 57, color: "red" },
              { label: "Responsible Banking", value: 40, color: "green" },
              { label: "Reputation Risk", value: 10, color: "red" },
              { label: "Data Protection", value: 56, color: "red" },
              { label: "Accountability", value: 48, color: "green" },
              { label: "Decision Quality", value: 65, color: "blue" },
              { label: "Customer Trust", value: 50, color: "blue" },
            ]}
          />
        </div>

        <div className="mt-6">
          <DecisionMetrics
            decisions={[
              {
                id: "D1",
                text: "Refuse and ask her to access the case through the approved system.",
                subtitle: "Slower, but a proper audit trail exists.",
                verdict: "excellent",
                deltas: [
                  { iconSrc: "/customer trust.svg", value: 18 },
                  { iconSrc: "/compliance safety.svg", value: 34 },
                ],
              },
              {
                id: "D2",
                text: "Send the data because the customer is angry.",
                subtitle: "Emotion overrode the control.",
                verdict: "risky",
                deltas: [
                  { iconSrc: "/customer trust.svg", value: 18 },
                  { iconSrc: "/responsible banking.svg", value: -13 },
                ],
              },
              {
                id: "D3",
                text: "Provide a non-confidential verbal description.",
                subtitle: "Helpful without exposing identifiers.",
                verdict: "good",
                deltas: [
                  { iconSrc: "/customer trust.svg", value: 18 },
                  { iconSrc: "/decision quality.svg", value: 12 },
                  { iconSrc: "/compliance safety.svg", value: 34 },
                ],
              },
              {
                id: "D4",
                text: "Explain that data cannot be shared outside approved channels.",
                subtitle: "You held the line respectfully.",
                verdict: "excellent",
                deltas: [
                  { iconSrc: "/customer trust.svg", value: 18 },
                  { iconSrc: "/compliance safety.svg", value: 34 },
                ],
              },
              {
                id: "D5",
                text: "Escalate, document, and provide the official next step.",
                subtitle: "Strong, defensible closure.",
                verdict: "excellent",
                deltas: [
                  { iconSrc: "/customer trust.svg", value: 18 },
                  { iconSrc: "/compliance safety.svg", value: 34 },
                ],
              },
            ]}
          />
        </div>

        <div className="mt-6">
          <LowerButtons />
        </div>
      </div>
    </div>
  );
}
