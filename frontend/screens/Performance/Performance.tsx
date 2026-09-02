"use client";

import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { toFriendlyErrorMessage } from "@/lib/friendlyError";
import { PerformanceLayout } from "./Performance.layout";
import {
  startOrResumePlaythrough,
  fetchMissions,
  fetchPlaythroughProgress,
  fetchAttemptReport,
  type AttemptReport,
  type MissionSummary,
  type MissionProgressEntry,
} from "./api";
import type { PerformanceData, RadialMetric, RecentScenario } from "./types";

const RADIAL_META: Array<{ key: string; label: string; fill: string }> = [
  { key: "customerTrust", label: "Customer Trust", fill: "#FCEBD4" },
  { key: "complianceSafety", label: "Compliance Safety", fill: "#F9D59D" },
  { key: "dataProtection", label: "Data Protection", fill: "#F6C177" },
  { key: "decisionQuality", label: "Decision Quality", fill: "#F0A951" },
  { key: "accountability", label: "Accountability", fill: "#E8912B" },
  { key: "reputationRisk", label: "Reputation Risk", fill: "#CD7319" },
  { key: "responsibleBanking", label: "Responsible Banking", fill: "#B35607" },
];

// No backend concept of "behavior patterns" exists anywhere yet — nothing to
// derive this from, so it stays static until that's designed/built.
const MOCK_BEHAVIOR_PATTERNS: PerformanceData["behaviorPatterns"] = [
  { title: "speed bias", description: "No risky speed patterns detected in your last 5 simulations.", level: "Low" },
  { title: "Escalation Avoidance", description: "Escalate early when risk or policy is unclear.", signalsLabel: "0 signals", level: "Low" },
  { title: "Authority Pressure", description: "A manager's instruction is not a substitute for policy.", level: "Low" },
  { title: "Customer pressure", description: "Empathy yes; breaking the control no.", signalsLabel: "0 signals", level: "High" },
  { title: "Informal channel risk", description: "Use approved systems, never chat or screenshots.", signalsLabel: "0 signals", level: "High" },
  { title: "evidence discipline", description: "Keep documenting decisions and rationale.", signalsLabel: "1 signals", level: "Low" },
];

function isRisky(outcomeLabel: string | null): boolean {
  const normalized = (outcomeLabel ?? "").toLowerCase();
  return normalized.includes("risky") || normalized.includes("critical");
}

function isExcellent(outcomeLabel: string | null): boolean {
  return (outcomeLabel ?? "").toLowerCase().includes("excellent");
}

function relativeDay(dateStr: string | null): string {
  if (!dateStr) return "---------";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function totalTimeLabel(startedAt: string, completedAt: string | null): string {
  if (!completedAt) return "---------";
  const minutes = Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 60000);
  return `${Math.max(minutes, 1)} min`;
}

function missionDecisionQuality(report: AttemptReport): string {
  const outcomes = report.perDecisionBreakdown.map((d) => d.outcomeLabel);
  if (outcomes.some(isRisky)) return "Risky";
  if (outcomes.every(isExcellent)) return "Excellent";
  return "Good";
}

function buildPerformanceData(
  progress: MissionProgressEntry[],
  missions: MissionSummary[],
  reports: AttemptReport[],
): PerformanceData {
  const missionCategoryById = new Map(missions.map((m) => [m.id, m.category]));

  const rawAverageScore = reports.length
    ? Math.round(reports.reduce((sum, r) => sum + r.missionScore, 0) / reports.length)
    : 0;
  const averageScore = Math.min(Math.max(rawAverageScore, 0), 100);

  const radialMetrics: RadialMetric[] = RADIAL_META.map(({ key, label, fill }) => {
    const value = reports.length
      ? Math.round(reports.reduce((sum, r) => sum + (r.finalMetrics[key] ?? 0), 0) / reports.length)
      : 0;
    return { name: label, value: Math.min(Math.max(value, 0), 100), fill };
  });

  const allDecisions = reports.flatMap((r) => r.perDecisionBreakdown);
  const correctCount = allDecisions.filter((d) => isExcellent(d.outcomeLabel)).length;
  const errorCount = allDecisions.filter((d) => isRisky(d.outcomeLabel)).length;
  const accuracyPct = allDecisions.length ? Math.round((correctCount / allDecisions.length) * 100) : 0;

  const sortedByCompletion = [...reports].sort(
    (a, b) =>
      (a.completedAt ? new Date(a.completedAt).getTime() : 0) -
      (b.completedAt ? new Date(b.completedAt).getTime() : 0),
  );
  const growth =
    sortedByCompletion.length >= 2
      ? sortedByCompletion[sortedByCompletion.length - 1].missionScore - sortedByCompletion[0].missionScore
      : 0;

  // No real trend baseline exists (would need historical/previous-period data) —
  // trendLabel left blank rather than fabricated.
  const stats: PerformanceData["stats"] = [
    {
      id: "scenarios",
      label: "Scenarios Completed",
      value: `${reports.length} / ${progress.length}`,
      trendLabel: "",
      trendDirection: "up",
      description: "Missions you have completed so far.",
    },
    {
      id: "accuracy",
      label: "Decision Accuracy",
      value: `${accuracyPct}%`,
      trendLabel: "",
      trendDirection: "up",
      description: "Rated correct across all missions.",
    },
    {
      id: "errors",
      label: "Critical Errors",
      value: String(errorCount),
      trendLabel: "",
      trendDirection: "up",
      description: "High-risk decisions requiring attention.",
    },
    {
      id: "growth",
      label: "Performance Growth",
      value: `${growth >= 0 ? "+" : ""}${growth} pts`,
      trendLabel: "",
      trendDirection: growth >= 0 ? "up" : "down",
      description: "Change in your average score over time.",
    },
  ];

  const performanceOverTime = sortedByCompletion.map((r) => ({
    day: r.completedAt ? new Date(r.completedAt).toLocaleDateString("en-US", { weekday: "short" }) : "-",
    score: r.missionScore,
  }));
  const currentPointLabel = performanceOverTime.length
    ? `${performanceOverTime[performanceOverTime.length - 1].score} pts`
    : "0 pts";

  const decisionQuality = {
    totalDecisions: allDecisions.length,
    slices: [
      { label: "Correct", value: correctCount, color: "rgba(88, 113, 236, 1)" },
      {
        label: "Partially Correct",
        value: allDecisions.length - correctCount - errorCount,
        color: "rgba(88, 113, 236, 0.6)",
      },
      { label: "Incorrect", value: errorCount, color: "rgba(251, 178, 93, 1)" },
    ],
  };

  const reportByMissionId = new Map(reports.map((r) => [r.missionId, r]));
  const recentScenarios: RecentScenario[] = progress
    .filter((p) => p.completed || p.lastAttemptId)
    .map((p): RecentScenario => {
      const report = reportByMissionId.get(p.missionId);
      if (report) {
        return {
          mission: report.missionTitle,
          category: report.missionCategory,
          score: `${report.missionScore} / 100`,
          decisionQuality: missionDecisionQuality(report),
          totalTime: totalTimeLabel(report.startedAt, report.completedAt),
          lastPlayed: relativeDay(report.completedAt),
          status: "Completed",
        };
      }
      return {
        mission: p.title,
        category: missionCategoryById.get(p.missionId) ?? "",
        score: "---------",
        decisionQuality: "---------",
        totalTime: "---------",
        lastPlayed: "---------",
        status: "Pending",
      };
    });

  return {
    averageScore,
    radialMetrics,
    stats,
    performanceOverTime,
    currentPointLabel,
    decisionQuality,
    behaviorPatterns: MOCK_BEHAVIOR_PATTERNS,
    recentScenarios,
  };
}

export function Performance() {
  const [period, setPeriod] = useState<"Daily" | "Weekly" | "Monthly">("Daily");
  const [data, setData] = useState<PerformanceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startOrResumePlaythrough()
      .then(async (playthrough) => {
        const [progress, missions] = await Promise.all([
          fetchPlaythroughProgress(playthrough.id),
          fetchMissions(),
        ]);

        const completedEntries = progress.filter((p) => p.completed && p.lastAttemptId);
        const reports = await Promise.all(
          completedEntries.map((p) => fetchAttemptReport(p.lastAttemptId!)),
        );

        setData(buildPerformanceData(progress, missions, reports));
      })
      .catch((err) => setError(toFriendlyErrorMessage(err, "Failed to load performance data")));
  }, []);

  if (error) {
    return <div className="p-8 text-sm text-red-600">{error}</div>;
  }

  if (!data) {
    return <LoadingSpinner />;
  }

  return <PerformanceLayout data={data} period={period} onPeriodChange={setPeriod} />;
}