"use client";

import { useEffect, useState } from "react";
import { InstructionsLayout } from "./Instructions.layout";
import { api } from "@/lib/api";
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


const STATIC_AVATARS: Record<string, string> = {
  "Farah Nabil": "/avatars/farah.png",
  "Omar Shaker": "/avatars/omar.png",
  "Salma El-Hadidi": "/avatars/salma.png",
  "Dina Adel": "/avatars/dina.png",
  "Ahmed Raouf": "/avatars/hany.png", 
};

export function Instructions() {
  const [cast, setCast] = useState<CastMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCast() {
      try {
        // GET /characters now returns every distinct character directly — no more
        // looping through missions to collect them. Shows exactly what's in the DB,
        // no cap applied, per the "no less and no more" requirement.
        const rows = await api.getCharacters();
        if (!cancelled) {
          setCast(
            rows.map((row) => ({
              id: row.id,
              name: row.name,
              role: row.role,
              avatarSrc: STATIC_AVATARS[row.name] ?? row.avatarUrl ?? undefined,
            })),
          );
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load cast");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCast();
    return () => {
      cancelled = true;
    };
  }, []);

  const fullCast: CastMember[] = [
    { id: "you", name: "You: The Banker", role: "Simulation learner", isPlayer: true },
    ...cast,
  ];

  return (
    <InstructionsLayout
      journeySteps={JOURNEY_STEPS}
      behaviorMetrics={BEHAVIOR_METRICS}
      cast={fullCast}
      loading={loading}
      error={error}
    />
  );
}
