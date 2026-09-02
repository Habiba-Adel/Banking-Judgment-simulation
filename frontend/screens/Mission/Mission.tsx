"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toFriendlyErrorMessage } from "@/lib/friendlyError";
import { MissionLayout } from "./Mission.layout";
import { fetchMissionDetail, fetchCurrentStep as apiFetchCurrentStep, submitDecision as apiSubmitDecision } from "./api";
import type { MissionData } from "./types";

// Map character IDs to actual avatar file paths
const AVATAR_MAP: Record<string, string> = {
  "farah-nabil": "/avatars/farah.png",
  "omar-shaker": "/avatars/omar.png",
  "dina-adel": "/avatars/dina.png",
};

// Placeholder step labels — the real stageLabel from the backend drives the
// active step's contents; these generic labels are only shown for steps the
// player hasn't reached yet, since we don't fetch every step's content upfront.
const STEP_LABELS = ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"];

const EMPTY_DATA: MissionData = {
  mission: { category: "", title: "", description: "", goalText: "" },
  pressure: { level: "Low", time: "Low", expectation: "Low" },
  metrics: [
    { id: "compliance", label: "Compliance", value: 0, changeLabel: "" },
    { id: "reputationRisk", label: "Reputation Risk", value: 0, changeLabel: "" },
    { id: "responsibleBanking", label: "Responsible Banking", value: 0, changeLabel: "" },
  ],
  steps: STEP_LABELS.map((label, i) => ({ index: i + 1, label, status: "upcoming" as const })),
  contacts: [],
  activeCharacter: null,
  messages: [],
  choices: [],
  selectedChoiceId: null,
  dateLabel: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
};

export interface MissionProps {
  attemptId: string;
}

const RUNNING_METRIC_KEYS: Record<"compliance" | "reputationRisk" | "responsibleBanking", string> = {
  compliance: "complianceSafety",
  reputationRisk: "reputationRisk",
  responsibleBanking: "responsibleBanking",
};

export function Mission({ attemptId }: MissionProps) {
  const router = useRouter();
  const [data, setData] = useState<MissionData>(EMPTY_DATA);
  const [currentStepData, setCurrentStepData] = useState<any>(null);
  const [answeredDecisionIds, setAnsweredDecisionIds] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadedMissionId = useRef<string | null>(null);
  // fetchCurrentStep() is called from two places (mount, and after every
  // successful submit) with no cancellation — an older call can resolve
  // AFTER a newer one and silently overwrite it with stale step data (real
  // bug found 2026-09-01: submit decision 1 fast enough, and the slow
  // initial-mount fetch can land after the post-submit fetch and revert the
  // UI back to decision 1). This ref tracks which call is the latest one
  // fired; a response only gets applied if it's still that latest call.
  const latestStepRequestId = useRef(0);

  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
  }, []);

  const fetchCurrentStep = useCallback(async () => {
    if (!attemptId) return;
    const requestId = ++latestStepRequestId.current;

    try {
      const result = await apiFetchCurrentStep(attemptId);

      // A newer fetchCurrentStep() call has been fired since this one
      // started — its eventual response would be stale, so drop this one.
      if (requestId !== latestStepRequestId.current) return;

      if (result.isComplete) {
        router.push(`/attempts/${attemptId}/report`);
        return;
      }

      const { step, runningMetrics, pressure } = result;
      if (!step) return;
      setCurrentStepData(step);

      if (loadedMissionId.current !== step.missionId) {
        loadedMissionId.current = step.missionId;
        fetchMissionDetail(step.missionId)
          .then((mission) => {
            const stepLabels = [...mission.steps]
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((s) => s.stageLabel);

            setData((prev) => ({
              ...prev,
              mission: {
                category: mission.category,
                title: mission.title,
                description: mission.description,
                goalText: mission.goalText,
              },
              steps: prev.steps.map((s, i) => ({ ...s, label: stepLabels[i] ?? s.label })),
            }));
          })
          .catch((err) => console.warn("Error loading mission detail:", err));
      }

      const metrics = EMPTY_DATA.metrics.map((m) => ({
        ...m,
        value: runningMetrics[RUNNING_METRIC_KEYS[m.id]] ?? 0,
      }));

      // Play sound immediately
      if (audioRef.current) {
        audioRef.current.play().catch((e) => console.log("Audio blocked:", e));
      }

      setData((prev) => {
        const mainChar = step.characters[0];
        if (!mainChar) return prev;

        const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const characterId = mainChar.name.toLowerCase().replace(/\s/g, '-');

        // Check if character already exists in contacts
        const existingIndex = prev.contacts.findIndex((c) => c.characterId === characterId);
        let updatedContacts = [...prev.contacts];

        if (existingIndex === -1) {
          // New character – add it
          const newContact = {
            characterId,
            name: mainChar.name,
            role: mainChar.role || "",
            avatarSrc: AVATAR_MAP[characterId] || `/avatars/${characterId}.png`,
            lastMessage: mainChar.message,
            lastMessageTime: timeString,
            unread: true,
          };
          updatedContacts = [newContact, ...updatedContacts]; 
        } else {
          const contact = updatedContacts[existingIndex];
          const updatedContact = {
            ...contact,
            lastMessage: mainChar.message,
            lastMessageTime: timeString,
            unread: true,
          };
          // Move to top
          updatedContacts.splice(existingIndex, 1);
          updatedContacts = [updatedContact, ...updatedContacts];
        }

        updatedContacts = updatedContacts.map((c) => ({
          ...c,
          unread: c.characterId === characterId,
        }));

        const updatedSteps = prev.steps.map((s) => {
          const status: "done" | "current" | "upcoming" =
            s.index < step.orderIndex ? "done" : s.index === step.orderIndex ? "current" : "upcoming";
          return { ...s, status };
        });

        // The open chat panel's choices must always belong to the step we're
        // about to submit against (currentStepData, set above). Once a new
        // step arrives, any previously-rendered choice buttons are for an
        // already-answered decision — clearing them here prevents clicking a
        // stale choice and submitting it against the new step's id (the
        // backend correctly 400s that mismatch as "Invalid choice for this
        // decision", but the UI shouldn't let it happen in the first place).
        // If the same character voices two consecutive steps, refresh the
        // panel with the new step's own messages/choices instead of just
        // clearing it, since a contact click won't happen to trigger that.
        const reopenActiveChat = prev.activeCharacter?.id === characterId;

        return {
          ...prev,
          contacts: updatedContacts,
          steps: updatedSteps,
          metrics,
          pressure,
          choices: reopenActiveChat ? step.choices : [],
          selectedChoiceId: null,
          ...(reopenActiveChat && {
            messages: step.characters.map((c: any, idx: number) => ({
              id: `msg-${step.id}-${idx}`,
              characterId,
              text: c.message,
              timestamp: timeString,
            })),
          }),
        };
      });
    } catch (error) {
      if (requestId !== latestStepRequestId.current) return;
      console.warn("Error loading current step:", error);
      setSubmitError(toFriendlyErrorMessage(error, "Couldn't load this step. Please refresh and try again."));
    }
  }, [attemptId, router]);

  useEffect(() => {
    fetchCurrentStep();
  }, [fetchCurrentStep]);

  function handleSelectContact(characterId: string) {
    setData((prev) => {
      // Mark contact as read
      const updatedContacts = prev.contacts.map((c) =>
        c.characterId === characterId ? { ...c, unread: false } : c
      );

      const clickedContact = updatedContacts.find((c) => c.characterId === characterId);
      if (!clickedContact || !currentStepData) return { ...prev, contacts: updatedContacts };

      const currentStepCharId = currentStepData.characters[0].name.toLowerCase().replace(/\s/g, '-');

      // If it's the current step's character, show the step's messages and choices
      if (characterId === currentStepCharId) {
        // Check if this step is already answered
        const isAnswered = answeredDecisionIds.has(currentStepData.id);
        return {
          ...prev,
          contacts: updatedContacts,
          activeCharacter: {
            id: clickedContact.characterId,
            name: clickedContact.name,
            role: clickedContact.role || "",
            avatarSrc: clickedContact.avatarSrc,
          },
          messages: currentStepData.characters.map((c: any, idx: number) => ({
            id: `msg-${currentStepData.id}-${idx}`,
            characterId: currentStepCharId,
            text: c.message,
            timestamp: clickedContact.lastMessageTime,
          })),
          choices: isAnswered ? [] : currentStepData.choices, 
          selectedChoiceId: isAnswered ? null : prev.selectedChoiceId,
        };
      }

      // For previous characters – show only their last message, no choices
      return {
        ...prev,
        contacts: updatedContacts,
        activeCharacter: {
          id: clickedContact.characterId,
          name: clickedContact.name,
          role: clickedContact.role || "",
          avatarSrc: clickedContact.avatarSrc,
        },
        messages: [{
          id: `msg-old-${characterId}`,
          characterId: characterId,
          text: clickedContact.lastMessage,
          timestamp: clickedContact.lastMessageTime,
        }],
        choices: [],
        selectedChoiceId: null,
      };
    });
  }

  function handleSelectChoice(choiceId: string) {
    setData((prev) => ({ ...prev, selectedChoiceId: choiceId }));
  }

const [isSending, setIsSending] = useState(false);
const [submitError, setSubmitError] = useState<string | null>(null);

async function handleSend() {
  if (!data.selectedChoiceId || !currentStepData || isSending) return;
  setSubmitError(null);

  // Defensive guard: the selected choice must actually belong to the step
  // we're about to submit against. A selection can go stale if the current
  // step advanced between the choice click and Send (e.g. two consecutive
  // steps voiced by the same character) — re-sync instead of submitting a
  // mismatched pair, which the backend would otherwise reject outright.
  const choiceBelongsToCurrentStep = currentStepData.choices.some(
    (c: any) => c.id === data.selectedChoiceId
  );
  if (!choiceBelongsToCurrentStep) {
    setData((prev) => ({ ...prev, selectedChoiceId: null, choices: currentStepData.choices }));
    return;
  }

  setIsSending(true);
  try {
    const { isMissionComplete } = await apiSubmitDecision(attemptId, currentStepData.id, data.selectedChoiceId);

    // Mark as answered
    setAnsweredDecisionIds((prev) => new Set(prev).add(currentStepData.id));

    if (isMissionComplete) {
      router.push(`/attempts/${attemptId}/report`);
    } else {
      // Keep chat open, clear selection and fetch next step
      setData((prev) => ({ ...prev, selectedChoiceId: null }));
      fetchCurrentStep();
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Attempt is already completed") {
      router.push(`/attempts/${attemptId}/report`);
      return;
    }
    // console.warn, not console.error — Next's dev overlay auto-triggers on
    // any console.error(Error), even ones already caught and handled here.
    // The friendly message above is the real user-facing feedback.
    console.warn("Error submitting decision:", error);
    setSubmitError(toFriendlyErrorMessage(error, "Couldn't submit your answer. Please try again."));
  } finally {
    setIsSending(false);
  }
}

  return (
    <MissionLayout 
      data={data} 
      onSelectChoice={handleSelectChoice} 
      onSend={handleSend} 
      onSelectContact={handleSelectContact}
      isSending={isSending}
      submitError={submitError}
    />
  );
}