"use client";

import { useRouter } from "next/navigation";
import { PlaythroughHistoryLayout } from "./PlaythroughHistory.layout";
import type { MissionAttemptHistoryData } from "./types";

const MOCK_DATA: MissionAttemptHistoryData = {
  missionTitle: "The Screenshot Shortcut",
  attempts: [
    { attemptNumber: 1, date: "Jan 12, 2026", score: 61, accuracy: 60, decisionQuality: 58, improvement: 0 },
    { attemptNumber: 2, date: "Feb 3, 2026", score: 68, accuracy: 65, decisionQuality: 66, improvement: 7 },
    { attemptNumber: 3, date: "Mar 20, 2026", score: 73, accuracy: 74, decisionQuality: 75, improvement: 5 },
  ],
  decisions: [
    { decisionId: "D1", decisionLabel: "Refuse and use the approved system", verdictsByAttempt: ["good", "excellent", "excellent"] },
    { decisionId: "D2", decisionLabel: "Handle the angry customer", verdictsByAttempt: ["risky", "good", "excellent"] },
    { decisionId: "D3", decisionLabel: "Share a non-confidential description", verdictsByAttempt: ["good", "good", "excellent"] },
    { decisionId: "D4", decisionLabel: "Explain the approved channels", verdictsByAttempt: ["excellent", "excellent", "excellent"] },
    { decisionId: "D5", decisionLabel: "Escalate and document", verdictsByAttempt: ["risky", "excellent", "excellent"] },
  ],
  metrics: [
    { key: "customerTrust", label: "Customer Trust", iconSrc: "/customer trust.svg", valuesByRun: [50, 60, 68] },
    { key: "complianceSafety", label: "Compliance Safety", iconSrc: "/compliance safety.svg", valuesByRun: [45, 63, 79] },
    { key: "dataProtection", label: "Data Protection", iconSrc: "/dataprotection.svg", valuesByRun: [56, 65, 74] },
    { key: "reputationRisk", label: "Reputation Risk", iconSrc: "/reputation risk.svg", valuesByRun: [40, 30, 22] },
    { key: "responsibleBanking", label: "Responsible Banking", iconSrc: "/responsible banking.svg", valuesByRun: [58, 50, 40] },
    { key: "accountability", label: "Accountability", iconSrc: "/accoutability.png", valuesByRun: [48, 70, 88] },
    { key: "decisionQuality", label: "Decision Quality", iconSrc: "/decision quality.svg", valuesByRun: [65, 71, 77] },
  ],
};

export function PlaythroughHistory() {
  const router = useRouter();

  return (
    <PlaythroughHistoryLayout data={MOCK_DATA} onBack={() => router.push("/mission-report")} />
  );
}
