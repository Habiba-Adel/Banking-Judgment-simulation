"use client";

import { useRef } from "react";
import { ContinuePanelLayout } from "./ContinuePanel.layout";
import type { MissionProgress } from "../../types";

export interface ContinuePanelProps {
  hasProgress: boolean;
  missions: MissionProgress[];
}

export function ContinuePanel({ hasProgress, missions }: ContinuePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (direction: 1 | -1) => {
    const container = scrollRef.current;
    if (!container) return;
    const card = container.querySelector<HTMLElement>("[data-mission-card]");
    const gap = 12;
    const amount = (card?.offsetWidth ?? 280) + gap;
    container.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  return (
    <ContinuePanelLayout
      hasProgress={hasProgress}
      missions={missions}
      scrollRef={scrollRef}
      onPrev={() => scrollByCard(-1)}
      onNext={() => scrollByCard(1)}
    />
  );
}