"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { toFriendlyErrorMessage } from "@/lib/friendlyError";
import { SituationsLayout } from "./Situations.layout";
import {
  startOrResumePlaythrough,
  fetchMissions,
  fetchPlaythroughProgress,
  fetchCurrentStep,
  startOrResumeAttempt,
} from "./api";
import type { MissionCardData, MissionCategoryData, StatusFilter } from "./types";

const TOTAL_DECISIONS = 5;
const ESTIMATED_MINUTES = 10;
const THUMBNAILS = ["/mission-photo-1.jpg", "/mission-photo-2.jpg", "/mission-photo-3.jpg", "/mission-photo-4.jpg"];

export function Situations() {
  const router = useRouter();
  const [playthroughId, setPlaythroughId] = useState<string | null>(null);
  const [categories, setCategories] = useState<MissionCategoryData[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startOrResumePlaythrough()
      .then(async (playthrough) => {
        setPlaythroughId(playthrough.id);

        const [missions, progress] = await Promise.all([
          fetchMissions(),
          fetchPlaythroughProgress(playthrough.id),
        ]);

        const progressByMissionId = new Map(progress.map((p) => [p.missionId, p]));

        const cards: MissionCardData[] = await Promise.all(
          missions.map(async (mission, index) => {
            const progressEntry = progressByMissionId.get(mission.id);
            const status: MissionCardData["status"] = progressEntry?.completed
              ? "completed"
              : progressEntry?.lastAttemptId
                ? "in_progress"
                : "not_started";

            const base: MissionCardData = {
              id: mission.id,
              title: mission.title,
              description: mission.description,
              status,
              thumbnailSrc: THUMBNAILS[index % THUMBNAILS.length],
              totalDecisions: TOTAL_DECISIONS,
              estimatedMinutes: ESTIMATED_MINUTES,
            };

            if (status === "in_progress" && progressEntry?.lastAttemptId) {
              const step = await fetchCurrentStep(progressEntry.lastAttemptId);
              return {
                ...base,
                currentStep: step.currentStep,
                playedLabel: "In progress",
                attemptId: progressEntry.lastAttemptId,
              };
            }

            if (status === "completed" && progressEntry?.lastAttemptId) {
              return { ...base, attemptId: progressEntry.lastAttemptId };
            }

            return base;
          }),
        );

        const categoryMap = new Map<string, MissionCategoryData>();
        for (const card of cards) {
          const mission = missions.find((m) => m.id === card.id)!;
          const existing = categoryMap.get(mission.category);
          if (existing) {
            existing.missions.push(card);
          } else {
            categoryMap.set(mission.category, {
              id: mission.category,
              title: mission.category,
              missions: [card],
            });
          }
        }

        setCategories(Array.from(categoryMap.values()));
      })
      .catch((err) => setError(toFriendlyErrorMessage(err, "Failed to load missions")));
  }, []);

  const goToAttempt = (attemptId: string) => router.push(`/mission/${attemptId}`);

  const handleStart = async (missionId: string) => {
    if (!playthroughId) return;
    const attempt = await startOrResumeAttempt(playthroughId, missionId);
    goToAttempt(attempt.attemptId);
  };

  const handleContinue = (missionId: string) => {
    const mission = categories?.flatMap((c) => c.missions).find((m) => m.id === missionId);
    if (mission?.attemptId) goToAttempt(mission.attemptId);
  };

  const handleReplay = async (missionId: string) => {
    if (!playthroughId) return;
    const attempt = await startOrResumeAttempt(playthroughId, missionId);
    goToAttempt(attempt.attemptId);
  };

  const handleReport = (missionId: string) => {
    const mission = categories?.flatMap((c) => c.missions).find((m) => m.id === missionId);
    if (mission?.attemptId) router.push(`/attempts/${mission.attemptId}/report`);
  };

  // Hero banner's "Continue Mission" has no specific mission in mind — resume
  // whichever one is actually in progress, or start the first not-started one
  // if nothing's in progress yet.
  const handleContinueMission = async () => {
    const allMissions = categories?.flatMap((c) => c.missions) ?? [];
    const inProgress = allMissions.find((m) => m.status === "in_progress");
    if (inProgress?.attemptId) {
      goToAttempt(inProgress.attemptId);
      return;
    }
    const notStarted = allMissions.find((m) => m.status === "not_started");
    if (notStarted) await handleStart(notStarted.id);
  };

  const handleSeePerformance = () => router.push("/performance");

  if (error) {
    return <div className="p-8 text-sm text-red-600">{error}</div>;
  }

  if (!categories) {
    return <LoadingSpinner />;
  }

  const filteredCategories =
    statusFilter === "all"
      ? categories
      : categories
          .map((category) => ({
            ...category,
            missions: category.missions.filter((mission) => mission.status === statusFilter),
          }))
          .filter((category) => category.missions.length > 0);

  return (
    <SituationsLayout
      categories={filteredCategories}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
      onStart={handleStart}
      onContinue={handleContinue}
      onReplay={handleReplay}
      onReport={handleReport}
      onContinueMission={handleContinueMission}
      onSeePerformance={handleSeePerformance}
    />
  );
}