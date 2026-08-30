"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { MissionLayout } from "./Mission.layout";
import type { MissionData } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

// Map character IDs to actual avatar file paths
const AVATAR_MAP: Record<string, string> = {
  "farah-nabil": "/avatars/farah.png",
  "omar-shaker": "/avatars/omar.png",
  "dina-adel": "/avatars/dina.png",
};

const INITIAL_DATA: MissionData = {
  mission: {
    category: "Ethics & Data",
    title: "The Screenshot Shortcut",
    description: "Customer has an account, card, mobile banking, or digital service issue, and a colleague asks for customer screenshots via an informal channel to resolve it quickly.",
    goalText: "Resolve the request while protecting customer data and using approved channels.",
  },
  pressure: { level: "Low", time: "Low", expectation: "Low" },
  metrics: [
    { id: "compliance", label: "Compliance", value: 0, changeLabel: "" },
    { id: "reputationRisk", label: "Reputation Risk", value: 0, changeLabel: "" },
    { id: "responsibleBanking", label: "Responsible Banking", value: 0, changeLabel: "" },
  ],
  steps: [
    { index: 1, label: "The request", status: "upcoming" },
    { index: 2, label: "Customer pressure", status: "upcoming" },
    { index: 3, label: "The workaround", status: "upcoming" },
    { index: 4, label: "Authority pressure", status: "upcoming" },
    { index: 5, label: "Final resolution", status: "upcoming" },
  ],
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

export function Mission({ attemptId }: MissionProps) {
  const router = useRouter();
  const [data, setData] = useState<MissionData>(INITIAL_DATA);
  const [currentStepData, setCurrentStepData] = useState<any>(null);
  const [answeredDecisionIds, setAnsweredDecisionIds] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
  }, []);

  const fetchCurrentStep = useCallback(async () => {
    if (!attemptId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/attempts/${attemptId}/current-step`);
      if (!res.ok) throw new Error("Failed to fetch step data");

      const result = await res.json();

      if (result.isComplete) {
        router.push(`/attempts/${attemptId}/report`);
        return;
      }

      const { step, metrics, pressure } = result;
      setCurrentStepData(step);

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
          if (s.index < step.orderIndex) return { ...s, status: "done" };
          if (s.index === step.orderIndex) return { ...s, status: "current" };
          return { ...s, status: "upcoming" };
        });

        return {
          ...prev,
          contacts: updatedContacts,
          steps: updatedSteps,
          metrics: metrics || prev.metrics,
          pressure: pressure || prev.pressure,
        };
      });
    } catch (error) {
      console.error("Error loading current step:", error);
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

async function handleSend() {
  if (!data.selectedChoiceId || !currentStepData || isSending) return;

  setIsSending(true);
  try {
    const url = `${API_BASE_URL}/attempts/${attemptId}/decisions`;
    const payload = {
      decisionId: currentStepData.id,
      choiceId: data.selectedChoiceId,
    };

    console.log("📤 Sending:", payload);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseText = await res.text();
    console.log("📥 Status:", res.status, "Body:", responseText);

    if (!res.ok) {
      let errorMessage = `Server responded with ${res.status}`;
      try {
        const errorData = JSON.parse(responseText);
        if (res.status === 400 && errorData.message === "Attempt is already completed") {
          // Mission already complete → go to report
          router.push(`/attempts/${attemptId}/report`);
          return;
        }
        errorMessage = errorData.message || errorMessage;
      } catch (_) {
        
      }
      throw new Error(`${errorMessage} (${res.status})`);
    }

    const result = JSON.parse(responseText);
    const { isMissionComplete } = result;

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
    console.error("❌ Error submitting decision:", error);
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
    />
  );
}