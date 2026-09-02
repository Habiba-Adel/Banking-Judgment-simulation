"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { toFriendlyErrorMessage } from "@/lib/friendlyError";
import { DashboardLayout } from "./Dashboard.layout";
import {
  startOrResumePlaythrough,
  fetchUser,
  fetchPlaythroughProgress,
  fetchCurrentStep,
  fetchPlaythroughDetail,
  fetchMissions,
  startOrResumeAttempt,
  type MissionAttemptSummary,
} from "./api";
import type { DashboardData, MetricIconKey, MissionProgress } from "./types";

const METRIC_LABELS: Record<MetricIconKey, string> = {
  complianceSafety: "Compliance",
  reputationRisk: "Reputation Risk",
  customerTrust: "Customer Trust",
  dataProtection: "Data Protection",
  accountability: "Accountability",
  decisionQuality: "Decision Quality",
};

function computeProfileAndMetrics(missionAttempts: MissionAttemptSummary[]) {
  const completed = missionAttempts.filter((a) => a.status === "completed");

  if (completed.length === 0) {
    return {
      profile: { score: null, maxScore: 100, profileLabel: null },
      metrics: (Object.keys(METRIC_LABELS) as MetricIconKey[]).map((key) => ({
        id: key,
        icon: key,
        label: METRIC_LABELS[key],
        value: null,
        comparisonLabel: "No Data Yet",
      })),
    };
  }

  const avgScore = Math.round(
    completed.reduce((sum, a) => sum + (a.missionScore ?? 0), 0) / completed.length,
  );

  const metrics = (Object.keys(METRIC_LABELS) as MetricIconKey[]).map((key) => {
    const withMetric = completed.filter((a) => a.finalMetrics?.[key] !== undefined);
    const value = withMetric.length
      ? Math.round(
          withMetric.reduce((sum, a) => sum + (a.finalMetrics![key] ?? 0), 0) / withMetric.length,
        )
      : null;

    return {
      id: key,
      icon: key,
      label: METRIC_LABELS[key],
      value,
      comparisonLabel: value === null ? "No Data Yet" : `across ${withMetric.length} mission(s)`,
    };
  });

  return {
    profile: { score: avgScore, maxScore: 100, profileLabel: null },
    metrics,
  };
}

// No per-mission thumbnail exists for most missions yet — fallback until real assets/mapping land.
const FALLBACK_THUMBNAIL = "/mission-thumb-vip-friend-request.svg";

export function Dashboard() {
  const router = useRouter();
  const [playthroughId, setPlaythroughId] = useState<string | null>(null);
  const [firstMissionId, setFirstMissionId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [missions, setMissions] = useState<MissionProgress[] | null>(null);
  const [hasProgress, setHasProgress] = useState(false);
  const [profileAndMetrics, setProfileAndMetrics] = useState<ReturnType<
    typeof computeProfileAndMetrics
  > | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startOrResumePlaythrough()
      .then(async (playthrough) => {
        setPlaythroughId(playthrough.id);

        const [user, progress, detail, allMissions] = await Promise.all([
          fetchUser(playthrough.userId),
          fetchPlaythroughProgress(playthrough.id),
          fetchPlaythroughDetail(playthrough.id),
          fetchMissions(),
        ]);
        setUserName(user.displayName ?? user.email);
        setProfileAndMetrics(computeProfileAndMetrics(detail.missionAttempts));
        setFirstMissionId(allMissions.find((m) => m.orderIndex === 1)?.id ?? null);

        const inProgress = progress.filter((m) => !m.completed && m.lastAttemptId);
        setHasProgress(progress.some((m) => m.lastAttemptId !== null));

        const missionCards = await Promise.all(
          inProgress.map(async (m) => {
            const step = await fetchCurrentStep(m.lastAttemptId!);
            return {
              id: m.missionId,
              attemptId: m.lastAttemptId!,
              title: m.title,
              currentStep: step.currentStep,
              totalSteps: step.totalSteps,
              playedLabel: "In progress",
              thumbnailSrc: FALLBACK_THUMBNAIL,
            };
          }),
        );
        setMissions(missionCards);
      })
      .catch((err) => setError(toFriendlyErrorMessage(err, "Failed to load dashboard")));
  }, []);

  const goToAttempt = (attemptId: string) => router.push(`/mission/${attemptId}`);

  const handlePrimaryAction = async () => {
    if (missions && missions.length > 0) {
      goToAttempt(missions[0].attemptId);
      return;
    }
    if (!playthroughId || !firstMissionId) return;
    const attempt = await startOrResumeAttempt(playthroughId, firstMissionId);
    goToAttempt(attempt.attemptId);
  };

  const handleReadInstructions = () => router.push("/instructions");

  if (error) {
    return <div className="p-8 text-sm text-red-600">{error}</div>;
  }

  if (!userName || !missions || !profileAndMetrics) {
    return <LoadingSpinner />;
  }

  const data: DashboardData = {
    userName,
    hasProgress,
    profile: profileAndMetrics.profile,
    metrics: profileAndMetrics.metrics,
    missions,
  };

  return (
    <DashboardLayout
      data={data}
      onPrimaryAction={handlePrimaryAction}
      onReadInstructions={handleReadInstructions}
      onMissionClick={goToAttempt}
    />
  );
}