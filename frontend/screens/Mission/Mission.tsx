"use client";

import { useState } from "react";
import { MissionLayout } from "./Mission.layout";
import type { MissionData } from "./types";

// Static mock data matching Step 2 of "The Screenshot Shortcut" — replace with
// GET /attempts/:attemptId/current-step once the backend endpoint is ready.
// This lets the whole screen be built and reviewed today even before integration.
const MOCK_DATA: MissionData = {
  mission: {
    category: "Ethics & Data",
    title: "The Screenshot Shortcut",
    description:
      "Customer has an account, card, mobile banking, or digital service issue, and a colleague asks for customer screenshots via an informal channel to resolve it quickly.",
    goalText: "Resolve the request while protecting customer data and using approved channels.",
  },
  pressure: { level: "Moderate", time: "Low", expectation: "Medium" },
  metrics: [
    { id: "compliance", label: "Compliance", value: 82, changeLabel: "+2%" },
    { id: "reputationRisk", label: "Reputation Risk", value: 50, changeLabel: "+2%" },
    { id: "responsibleBanking", label: "Responsible Banking", value: 50, changeLabel: "+2%" },
  ],
  steps: [
    { index: 1, label: "The request", status: "done" },
    { index: 2, label: "Customer pressure", status: "current" },
    { index: 3, label: "The workaround", status: "upcoming" },
    { index: 4, label: "Authority pressure", status: "upcoming" },
    { index: 5, label: "Final resolution", status: "upcoming" },
  ],

  contacts: [
    {
      characterId: "dina",
      name: "Dina Adel",
      avatarSrc: "/avatars/dina.png",
      lastMessage: "We need to close this today. Find a practical solution.",
      lastMessageTime: "11:17 am",
      unread: true,
    },
    {
      characterId: "farah",
      name: "Farah Nabil",
      avatarSrc: "/avatars/farah.png",
      lastMessage: "The customer is angry. If we delay, they will escalate.",
      lastMessageTime: "11:12 am",
    },
    {
      characterId: "omar",
      name: "Omar Shaker",
      avatarSrc: "/avatars/omar.png",
      lastMessage: "Can you send me a screenshot of the customer profile? I will check it faster.",
      lastMessageTime: "10:55 am",
    },
  ],
  activeCharacter: {
    id: "farah",
    name: "Farah Nabil",
    role: "Digital Banking Operations Specialist",
    avatarSrc: "/avatars/farah.png",
  },
  messages: [
    {
      id: "m1",
      characterId: "farah",
      text: "The customer is angry. If we delay, they will escalate.",
      timestamp: "11:12 am",
    },
  ],
  choices: [
    { id: "c1", labelKey: "A", labelText: "Send the data to resolve it quickly." },
    { id: "c2", labelKey: "B", labelText: "I'll open a case through the approved workflow." },
    { id: "c3", labelKey: "C", labelText: "I'll ask the manager for guidance through the official channel." },
    { id: "c4", labelKey: "D", labelText: "I'll wait until the customer calms down." },
  ],
  selectedChoiceId: null,
  dateLabel: "25 August 2026",
};

export interface MissionProps {
  attemptId?: string; // will drive the real fetch once backend integration is wired up
}

export function Mission({ attemptId }: MissionProps) {
  const [data, setData] = useState<MissionData>(MOCK_DATA);

  function handleSelectChoice(choiceId: string) {
    setData((prev) => ({ ...prev, selectedChoiceId: choiceId }));
  }

  function handleSend() {
    if (!data.selectedChoiceId) return;

    console.log("Submitting choice", data.selectedChoiceId, "for attempt", attemptId);
  }

  return (
    <MissionLayout data={data} onSelectChoice={handleSelectChoice} onSend={handleSend} />
  );
}
