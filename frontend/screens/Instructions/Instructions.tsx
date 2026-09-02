"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toFriendlyErrorMessage } from "@/lib/friendlyError";
import { InstructionsLayout } from "./Instructions.layout";
import { fetchCharacters, startOrResumePlaythrough, resetPlaythrough } from "./api";
import type { CastMember, JourneyStep, BehaviorMetricInfo } from "./types";

// Static content — matches Figma exactly, doesn't come from the backend.
const JOURNEY_STEPS: JourneyStep[] = [
  { index: 1, title: "12 Missions", description: "Different realistic banking incidents" },
  { index: 2, title: "5 Decision Moments", description: "Each mission progresses through multiple decisions" },
  { index: 3, title: "Consequences", description: "Your choices influence what happens next" },
  { index: 4, title: "Behavioral Signals", description: "Repeated patterns are tracked across decisions" },
  { index: 5, title: "Final Profile", description: "Your tendencies reveal your banker profile" },
];

const BEHAVIOR_METRICS: BehaviorMetricInfo[] = [
  { key: "customerTrust", iconSrc: "/icon-customer-trust.png", label: "Customer Trust", description: "How your decisions protect customer relationships." },
  { key: "complianceSafety", iconSrc: "/icon-compliance.png", label: "Compliance Safety", description: "How consistently you follow policies and controls." },
  { key: "dataProtection", iconSrc: "/icon-data-protection.png", label: "Data Protection", description: "How well you protect sensitive information." },
  { key: "decisionQuality", iconSrc: "/icon-decision-quality.png", label: "Decision Quality", description: "The quality and balance of your judgment." },
  { key: "accountability", iconSrc: "/icon-accountability.png", label: "Accountability", description: "Whether you document and take ownership of decisions." },
  { key: "reputationRisk", iconSrc: "/icon-reputation-risk.png", label: "Reputation Risk", description: "The reputational risk created by your decisions." },
  { key: "responsibleBanking", iconSrc: "/file.svg", label: "Responsible Banking", description: "How responsibly you balance business and customer impact." },
];


// Fallback portraits for characters whose DB row has no avatarUrl yet.
const AVATAR_FALLBACK: Record<string, string> = {
  "Farah Nabil": "/avatars/farah.png",
  "Omar Shaker": "/avatars/omar.png",
  "Dina Adel": "/avatars/dina.png",
  "Salma El-Hadidi": "/avatars/salma.png",
};

// Overrides a DB avatarUrl that points at a file that doesn't exist yet.
// Remove once a real ahmed.png asset is added and the DB row is fixed.
const AVATAR_OVERRIDE: Record<string, string> = {
  "Ahmed Raouf": "/avatars/hany.png",
};

const PLAYER: CastMember = { id: "you", name: "You: The Banker", role: "Simulation learner", isPlayer: true };

export function Instructions() {
  const router = useRouter();
  const [cast, setCast] = useState<CastMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  useEffect(() => {
    fetchCharacters()
      .then((characters) => {
        setCast([
          PLAYER,
          ...characters.map((c) => ({
            id: c.id,
            name: c.name,
            role: c.role,
            avatarSrc: AVATAR_OVERRIDE[c.name] ?? c.avatarUrl ?? AVATAR_FALLBACK[c.name],
          })),
        ]);
      })
      .catch((err) => setError(toFriendlyErrorMessage(err, "Failed to load cast")));
  }, []);

  // Abandons the current in-progress playthrough (kept in history, not
  // deleted) and starts a brand-new one — same "start over" action as
  // Playthrough History's Restart Journey button.
  async function handleConfirmStartNewSimulation() {
    setShowRestartConfirm(false);
    const current = await startOrResumePlaythrough();
    await resetPlaythrough(current.id);
    await startOrResumePlaythrough();
    router.push("/situations");
  }

  return (
    <>
      <InstructionsLayout
        journeySteps={JOURNEY_STEPS}
        behaviorMetrics={BEHAVIOR_METRICS}
        cast={cast ?? [PLAYER]}
        loading={!cast && !error}
        error={error}
        onStartNewSimulation={() => setShowRestartConfirm(true)}
      />
      <ConfirmDialog
        open={showRestartConfirm}
        title="Start a new simulation?"
        message="Your current journey will be saved to history, and you'll start fresh from mission 1."
        confirmLabel="Continue"
        onConfirm={handleConfirmStartNewSimulation}
        onCancel={() => setShowRestartConfirm(false)}
      />
    </>
  );
}
