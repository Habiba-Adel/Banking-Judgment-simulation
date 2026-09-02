"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PlaythroughHistoryLayout } from "./PlaythroughHistory.layout";
import {
  fetchPlaythroughs,
  fetchPlaythroughDetail,
  fetchAttemptReport,
  fetchMissions,
  startOrResumePlaythrough,
  startOrResumeAttempt,
  resetPlaythrough,
  type AttemptReport,
  type AttemptRow,
  type MissionSummary,
} from "./api";
import type {
  MissionAttemptHistoryData,
  JourneyComparisonData,
  AttemptOverview,
  DecisionRow,
  MetricComparison,
  DecisionVerdict,
} from "./types";

const MAX_COMPARED = 3;

const METRIC_META: Array<{ key: string; label: string; iconSrc: string }> = [
  { key: "customerTrust", label: "Customer Trust", iconSrc: "/customer trust.svg" },
  { key: "complianceSafety", label: "Compliance Safety", iconSrc: "/compliance safety.svg" },
  { key: "dataProtection", label: "Data Protection", iconSrc: "/dataprotection.svg" },
  { key: "reputationRisk", label: "Reputation Risk", iconSrc: "/reputation risk.svg" },
  { key: "responsibleBanking", label: "Responsible Banking", iconSrc: "/responsible banking.svg" },
  { key: "accountability", label: "Accountability", iconSrc: "/accoutability.png" },
  { key: "decisionQuality", label: "Decision Quality", iconSrc: "/decision quality.svg" },
];

function verdictFor(outcomeLabel: string | null): DecisionVerdict {
  const normalized = (outcomeLabel ?? "").toLowerCase();
  if (normalized.includes("excellent")) return "excellent";
  if (normalized.includes("risky") || normalized.includes("critical")) return "risky";
  return "good";
}

function clamp0to100(value: number): number {
  return Math.min(Math.max(Math.round(value), 0), 100);
}

// Same tiers as Mission Report's verdictLabelFor, applied to a single
// mission's score instead of outcomeLabel text — used for the journey
// comparison's per-mission table, where there's no outcomeLabel to read.
function verdictForScore(score: number): DecisionVerdict {
  if (score >= 85) return "excellent";
  if (score >= 50) return "good";
  return "risky";
}

interface AttemptSummary {
  id: string;
  runNumber: number;
  date: string;
  score: number;
  startedAt: string;
}

function buildComparisonData(selected: AttemptSummary[], reports: AttemptReport[]): MissionAttemptHistoryData {
  const attempts: AttemptOverview[] = selected.map((a, i) => {
    const report = reports[i];
    const decisions = report.perDecisionBreakdown;
    const correctCount = decisions.filter((d) => verdictFor(d.outcomeLabel) === "excellent").length;
    const accuracy = decisions.length ? Math.round((correctCount / decisions.length) * 100) : 0;
    const decisionQuality = clamp0to100(report.finalMetrics.decisionQuality ?? 0);
    const improvement = i === 0 ? 0 : report.missionScore - reports[i - 1].missionScore;

    return {
      attemptNumber: a.runNumber,
      date: a.date,
      score: clamp0to100(report.missionScore),
      accuracy,
      decisionQuality,
      improvement,
    };
  });

  const firstBreakdown = [...(reports[0]?.perDecisionBreakdown ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
  const decisions: DecisionRow[] = firstBreakdown.map((d0) => ({
    decisionId: `D${d0.orderIndex}`,
    decisionLabel: d0.stageLabel,
    verdictsByAttempt: reports.map((r) => {
      const match = r.perDecisionBreakdown.find((x) => x.decisionId === d0.decisionId);
      return verdictFor(match?.outcomeLabel ?? null);
    }),
  }));

  const metrics: MetricComparison[] = METRIC_META.map(({ key, label, iconSrc }) => ({
    key,
    label,
    iconSrc,
    valuesByRun: reports.map((r) => clamp0to100(r.finalMetrics[key] ?? 0)),
  }));

  return {
    missionTitle: reports[0]?.missionTitle ?? "",
    attempts,
    decisions,
    metrics,
  };
}

interface JourneySummary {
  id: string;
  runNumber: number;
  date: string;
  startedAt: string;
  score: number;
  finished: boolean;
  missionScores: Map<string, number>;
  metricTotals: Record<string, number>;
}

const EMPTY_METRICS: Record<string, number> = {
  customerTrust: 0, complianceSafety: 0, dataProtection: 0,
  reputationRisk: 0, responsibleBanking: 0, accountability: 0, decisionQuality: 0,
};

// A journey (playthrough) is only meaningfully comparable once every mission
// in it has a completed attempt — mirrors the "full journey" framing (user's
// explicit call, 2026-09-01). Only the LATEST completed attempt per mission
// counts, ordered by startedAt — the same ordering fix applied to the
// backend's getPlaythroughProgress bug (an unordered "first match" silently
// picked a stale replay instead of the real latest one).
function summarizeJourney(playthroughId: string, runNumber: number, attemptRows: AttemptRow[], totalMissions: number): JourneySummary {
  const latestByMission = new Map<string, AttemptRow>();
  for (const row of [...attemptRows].sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())) {
    if (row.status === "completed") latestByMission.set(row.missionId, row);
  }

  const finished = latestByMission.size >= totalMissions && totalMissions > 0;
  const missionScores = new Map<string, number>();
  const metricTotals: Record<string, number> = { ...EMPTY_METRICS };
  let latestCompletedAt: string | null = null;

  for (const row of latestByMission.values()) {
    missionScores.set(row.missionId, row.missionScore ?? 0);
    const deltas = row.finalMetrics ?? {};
    for (const key in metricTotals) {
      metricTotals[key] += deltas[key] ?? 0;
    }
    if (row.completedAt && (!latestCompletedAt || row.completedAt > latestCompletedAt)) {
      latestCompletedAt = row.completedAt;
    }
  }

  const scores = Array.from(missionScores.values());
  const overallScore = scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;

  return {
    id: playthroughId,
    runNumber,
    date: latestCompletedAt
      ? new Date(latestCompletedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "-",
    startedAt: "",
    score: clamp0to100(overallScore),
    finished,
    missionScores,
    metricTotals,
  };
}

function buildJourneyComparisonData(selected: JourneySummary[], missions: MissionSummary[]): JourneyComparisonData {
  const attempts: AttemptOverview[] = selected.map((journey, i) => {
    const scores = Array.from(journey.missionScores.values());
    const excellentCount = scores.filter((s) => verdictForScore(s) === "excellent").length;
    const accuracy = scores.length ? Math.round((excellentCount / scores.length) * 100) : 0;
    const improvement = i === 0 ? 0 : journey.score - selected[i - 1].score;

    return {
      attemptNumber: journey.runNumber,
      date: journey.date,
      score: journey.score,
      accuracy,
      decisionQuality: clamp0to100(journey.metricTotals.decisionQuality ?? 0),
      improvement,
    };
  });

  const sortedMissions = [...missions].sort((a, b) => a.orderIndex - b.orderIndex);
  const decisions: DecisionRow[] = sortedMissions.map((mission) => ({
    decisionId: `M${mission.orderIndex}`,
    decisionLabel: mission.title,
    verdictsByAttempt: selected.map((journey) => verdictForScore(journey.missionScores.get(mission.id) ?? 0)),
  }));

  const metrics: MetricComparison[] = METRIC_META.map(({ key, label, iconSrc }) => ({
    key,
    label,
    iconSrc,
    valuesByRun: selected.map((journey) => clamp0to100(journey.metricTotals[key] ?? 0)),
  }));

  return { missionTitle: "Full Journey Comparison", attempts, decisions, metrics };
}

export interface PlaythroughHistoryProps {
  missionId: string;
}

export function PlaythroughHistory({ missionId }: PlaythroughHistoryProps) {
  const router = useRouter();
  const [allAttempts, setAllAttempts] = useState<AttemptSummary[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [data, setData] = useState<MissionAttemptHistoryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [missions, setMissions] = useState<MissionSummary[] | null>(null);
  const [viewMode, setViewMode] = useState<"attempts" | "journeys">("attempts");
  const [allJourneys, setAllJourneys] = useState<JourneySummary[] | null>(null);
  const [selectedJourneyIds, setSelectedJourneyIds] = useState<string[]>([]);
  const [journeyData, setJourneyData] = useState<JourneyComparisonData | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  useEffect(() => {
    fetchMissions()
      .then(setMissions)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load missions"));
  }, []);

  // Discover every completed attempt of this mission across all of the user's
  // playthroughs — a mission can be replayed both within one playthrough and
  // across separate playthrough runs, so there's no single call for this.
  useEffect(() => {
    async function loadAttemptList() {
      const playthroughs = await fetchPlaythroughs();
      const details = await Promise.all(playthroughs.map((p) => fetchPlaythroughDetail(p.id)));

      const matching: AttemptSummary[] = details
        .flatMap((d) => d.missionAttempts)
        .filter((a) => a.missionId === missionId && a.status === "completed")
        .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
        .map((a, i) => ({
          id: a.id,
          runNumber: i + 1,
          date: a.completedAt
            ? new Date(a.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "-",
          score: a.missionScore ?? 0,
          startedAt: a.startedAt,
        }));

      setAllAttempts(matching);
      setSelectedIds(matching.slice(-MAX_COMPARED).map((a) => a.id));
    }

    loadAttemptList().catch((err) => setError(err instanceof Error ? err.message : "Failed to load attempts"));
  }, [missionId]);

  // Rebuild the comparison whenever which attempts are selected changes.
  useEffect(() => {
    if (!allAttempts || selectedIds.length === 0) {
      setData(null);
      return;
    }

    const selected = allAttempts
      .filter((a) => selectedIds.includes(a.id))
      .sort((a, b) => a.runNumber - b.runNumber);

    Promise.all(selected.map((a) => fetchAttemptReport(a.id)))
      .then((reports) => setData(buildComparisonData(selected, reports)))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load comparison"));
  }, [allAttempts, selectedIds]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARED) return prev;
      return [...prev, id];
    });
  }

  // Loaded lazily once the user switches to the journeys view — every other
  // playthrough of the user, not just ones touching this mission.
  useEffect(() => {
    if (viewMode !== "journeys" || allJourneys || !missions) return;

    async function loadJourneys() {
      const playthroughs = await fetchPlaythroughs();
      const details = await Promise.all(playthroughs.map((p) => fetchPlaythroughDetail(p.id)));

      const summaries = playthroughs
        .map((p, i) => summarizeJourney(p.id, p.runNumber, details[i].missionAttempts, missions!.length))
        .filter((j) => j.finished)
        .sort((a, b) => a.runNumber - b.runNumber);

      setAllJourneys(summaries);
      setSelectedJourneyIds(summaries.slice(-MAX_COMPARED).map((j) => j.id));
    }

    loadJourneys().catch((err) => setError(err instanceof Error ? err.message : "Failed to load journeys"));
  }, [viewMode, allJourneys, missions]);

  // Rebuild the journey comparison whenever which journeys are selected changes.
  useEffect(() => {
    if (!allJourneys || !missions || selectedJourneyIds.length === 0) {
      setJourneyData(null);
      return;
    }

    const selected = allJourneys
      .filter((j) => selectedJourneyIds.includes(j.id))
      .sort((a, b) => a.runNumber - b.runNumber);

    setJourneyData(buildJourneyComparisonData(selected, missions));
  }, [allJourneys, selectedJourneyIds, missions]);

  function toggleSelectJourney(id: string) {
    setSelectedJourneyIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARED) return prev;
      return [...prev, id];
    });
  }

  // "Go to Next Mission" when there is one; on the last mission of the
  // sequence, there's nothing to start, so it switches to the journey
  // comparison instead (user's explicit call, 2026-09-01).
  const currentMission = missions?.find((m) => m.id === missionId) ?? null;
  const nextMission = currentMission && missions
    ? missions.find((m) => m.orderIndex === currentMission.orderIndex + 1) ?? null
    : null;
  const isLastMission = Boolean(currentMission) && !nextMission;

  // Redundant once already viewing the journeys comparison — nothing to
  // switch to (user's explicit call, 2026-09-01).
  const hideNextOrCompareButton = isLastMission && viewMode === "journeys";

  async function handleGoToNextOrCompare() {
    if (!nextMission) {
      setViewMode("journeys");
      return;
    }

    const playthrough = await startOrResumePlaythrough();
    const attempt = await startOrResumeAttempt(playthrough.id, nextMission.id);
    router.push(`/mission/${attempt.attemptId}`);
  }

  // Abandons the current in-progress playthrough (kept in history, not
  // deleted — see resetPlaythrough) and starts a brand-new one, same
  // "start over" action as elsewhere in the app.
  async function handleConfirmRestartJourney() {
    setShowRestartConfirm(false);
    const current = await startOrResumePlaythrough();
    await resetPlaythrough(current.id);
    await startOrResumePlaythrough();
    router.push("/situations");
  }

  if (error) {
    return <div className="p-8 text-sm text-red-600">{error}</div>;
  }

  if (!allAttempts) {
    return <LoadingSpinner />;
  }

  if (allAttempts.length === 0) {
    return (
      <div className="p-8 text-sm text-gray-500">
        No completed attempts yet for this mission — play it through once to see attempt history here.
      </div>
    );
  }

  return (
    <>
      <PlaythroughHistoryLayout
        data={data}
        pickerOptions={allAttempts}
        selectedIds={selectedIds}
        maxSelected={MAX_COMPARED}
        onTogglePick={toggleSelect}
        onBack={() => router.back()}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        journeyData={journeyData}
        journeyPickerOptions={allJourneys ?? []}
        selectedJourneyIds={selectedJourneyIds}
        onToggleJourneyPick={toggleSelectJourney}
        onGoToNextOrCompare={handleGoToNextOrCompare}
        isLastMission={isLastMission}
        hideNextOrCompareButton={hideNextOrCompareButton}
        onRestartJourney={() => setShowRestartConfirm(true)}
        onReturnToDashboard={() => router.push("/")}
      />
      <ConfirmDialog
        open={showRestartConfirm}
        title="Restart your journey?"
        message="Your current run will be saved to history, and you'll start fresh from mission 1."
        confirmLabel="Continue"
        onConfirm={handleConfirmRestartJourney}
        onCancel={() => setShowRestartConfirm(false)}
      />
    </>
  );
}