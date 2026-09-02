"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { MissionReportLayout } from "./MissionReport.layout";
import { fetchAttemptReport, startOrResumeAttempt, type AttemptReport, type DecisionBreakdown } from "./api";
import type { MissionReportData } from "./types";
import type { DecisionVerdict } from "./components/DecisionMetrics/DecisionMetrics";

const METRIC_META: Record<string, { iconSrc: string; label: string }> = {
  customerTrust: { iconSrc: "/customer trust.svg", label: "Customer Trust" },
  complianceSafety: { iconSrc: "/compliance safety.svg", label: "Compliance Safety" },
  dataProtection: { iconSrc: "/dataprotection.svg", label: "Data Protection" },
  decisionQuality: { iconSrc: "/decision quality.svg", label: "Decision Quality" },
  accountability: { iconSrc: "/accoutability.png", label: "Accountability" },
  reputationRisk: { iconSrc: "/reputation risk.svg", label: "Reputation Risk" },
  responsibleBanking: { iconSrc: "/responsible banking.svg", label: "Responsible Banking" },
};

// Heuristic tiers — no spec for this exists yet; adjust freely.
function verdictLabelFor(score: number): string {
  if (score >= 85) return "Excellent Judgment";
  if (score >= 70) return "Acceptable with Risk Areas";
  if (score >= 50) return "Needs Improvement";
  return "High Risk Decision-Making";
}

// LandedCard's color is purely a caller-chosen tag, no fixed meaning in the
// component itself — here it reflects whether this metric's net delta across
// the mission was bad (red), good (green), or exactly unmoved (blue).
// reputationRisk is inverted (a higher value is worse), mirroring
// PRESSURE_METRIC_WEIGHTS on the backend.
function landedColorFor(key: string, delta: number): "red" | "green" | "blue" {
  const conceptual = key === "reputationRisk" ? -delta : delta;
  if (conceptual > 0) return "green";
  if (conceptual < 0) return "red";
  return "blue";
}

function verdictFor(outcomeLabel: string | null): DecisionVerdict {
  const normalized = (outcomeLabel ?? "").toLowerCase();
  if (normalized.includes("excellent")) return "excellent";
  if (normalized.includes("risky") || normalized.includes("critical")) return "risky";
  return "good";
}

function toReportData(report: AttemptReport): MissionReportData {
  const metricEntries = Object.entries(report.finalMetrics);

  const improved = metricEntries
    .filter(([, delta]) => delta >= 0)
    .map(([key, delta]) => ({ iconSrc: METRIC_META[key]?.iconSrc ?? "", label: METRIC_META[key]?.label ?? key, delta }));

  const attention = metricEntries
    .filter(([, delta]) => delta < 0)
    .map(([key, delta]) => ({ iconSrc: METRIC_META[key]?.iconSrc ?? "", label: METRIC_META[key]?.label ?? key, delta }));

  const landed = metricEntries.map(([key, value]) => {
    const clamped = Math.min(Math.max(value, 0), 100);
    return { label: METRIC_META[key]?.label ?? key, value: clamped, color: landedColorFor(key, value) };
  });

  const decisions = report.perDecisionBreakdown.map((row: DecisionBreakdown) => ({
    id: `D${row.orderIndex}`,
    text: row.choiceLabel,
    subtitle: row.explanationText ?? "",
    verdict: verdictFor(row.outcomeLabel),
    deltas: Object.entries(row.metricDeltas)
      .filter(([, value]) => value !== 0)
      .map(([key, value]) => ({ iconSrc: METRIC_META[key]?.iconSrc ?? "", value })),
  }));

  const highlights = report.perDecisionBreakdown
    .map((row) => row.explanationText)
    .filter((text): text is string => Boolean(text))
    .slice(0, 3);

  return {
    category: report.missionCategory,
    title: report.missionTitle,
    description: report.missionDescription,
    highlights: highlights.length > 0 ? highlights : [report.coachFeedback],
    score: report.missionScore,
    maxScore: 100,
    verdictLabel: verdictLabelFor(report.missionScore),
    improved,
    attention,
    landed,
    decisions,
  };
}

export interface MissionReportProps {
  attemptId: string;
}

export function MissionReport({ attemptId }: MissionReportProps) {
  const router = useRouter();
  const [report, setReport] = useState<AttemptReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAttemptReport(attemptId)
      .then(setReport)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load report"));
  }, [attemptId]);

  const handleReplay = async () => {
    if (!report) return;
    const attempt = await startOrResumeAttempt(report.playthroughId, report.missionId);
    router.push(`/mission/${attempt.attemptId}`);
  };

  if (error) {
    return <div className="p-8 text-sm text-red-600">{error}</div>;
  }

  if (!report) {
    return <LoadingSpinner />;
  }

  return (
    <MissionReportLayout
      data={toReportData(report)}
      onBack={() => router.push("/situations")}
      onReplay={handleReplay}
      onGoToHistory={() => router.push(`/playthrough-history/${report.missionId}`)}
    />
  );
}