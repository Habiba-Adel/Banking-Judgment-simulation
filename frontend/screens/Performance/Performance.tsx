// Performance.tsx — mock data with 7 radial metrics
"use client";

import { useState } from "react";
import { PerformanceLayout } from "./Performance.layout";
import type { PerformanceData } from "./types";

const MOCK_DATA: PerformanceData = {
  averageScore: 78,
  radialMetrics: [
    { name: "Customer Trust", value: 85, fill: "#FCEBD4" },
    { name: "Compliance Safety", value: 92, fill: "#F9D59D" },
    { name: "Data Protection", value: 75, fill: "#F6C177" },
    { name: "Decision Quality", value: 88, fill: "#F0A951" },
    { name: "Accountability", value: 82, fill: "#E8912B" },
    { name: "Reputation Risk", value: 95, fill: "#CD7319" },
    { name: "Responsible Banking", value: 80, fill: "#B35607" }
  ],
  stats: [
    { id: "scenarios", label: "Scenarios Completed", value: "7 / 12", trendLabel: "+20%", trendDirection: "up", description: "Missions you have completed so far." },
    { id: "accuracy", label: "Decision Accuracy", value: "82%", trendLabel: "+20%", trendDirection: "up", description: "Rated correct across all missions." },
    { id: "errors", label: "Critical Errors", value: "4", trendLabel: "+1%", trendDirection: "up", description: "High-risk decisions requiring attention." },
    { id: "growth", label: "Performance Growth", value: "+12 pts", trendLabel: "+10%", trendDirection: "up", description: "Change in your average score over time." },
  ],
  performanceOverTime: [
    { day: "Sat", score: 55 },
    { day: "Sun", score: 40 },
    { day: "Mon", score: 78 },
    { day: "Tue", score: 65 },
    { day: "Wed", score: 83 },
    { day: "Thu", score: 45 },
  ],
  currentPointLabel: "83 pts",
  decisionQuality: {
    totalDecisions: 35,
    slices: [
     { label: "Correct", value: 42, color: "rgba(88, 113, 236, 1)" },
{ label: "Partially Correct", value: 33, color: "rgba(88, 113, 236, 0.6)" },
{ label: "Incorrect", value: 25, color: "rgba(251, 178, 93, 1)" },
    ],
  },
  behaviorPatterns: [
    { title: "speed bias", description: "No risky speed patterns detected in your last 5 simulations.", level: "Low" },
    { title: "Escalation Avoidance", description: "Escalate early when risk or policy is unclear.", signalsLabel: "0 signals", level: "Low" },
    { title: "Authority Pressure", description: "A manager's instruction is not a substitute for policy.", level: "Low" },
    { title: "Customer pressure", description: "Empathy yes; breaking the control no.", signalsLabel: "0 signals", level: "High" },
    { title: "Informal channel risk", description: "Use approved systems, never chat or screenshots.", signalsLabel: "0 signals", level: "High" },
    { title: "evidence discipline", description: "Keep documenting decisions and rationale.", signalsLabel: "1 signals", level: "Low" },
  ],
  recentScenarios: [
    { mission: "The screenshot Shortcut", category: "Ethics & Data", score: "92 / 100", decisionQuality: "Excellent", totalTime: "12 min", lastPlayed: "2 days ago", status: "Completed" },
    { mission: "The VIP Friend Request", category: "Privacy & Access", score: "74 / 100", decisionQuality: "Good", totalTime: "7 min", lastPlayed: "3 days ago", status: "Completed" },
    { mission: "The VIP Friend Request", category: "Privacy & Access", score: "---------", decisionQuality: "---------", totalTime: "3 min", lastPlayed: "6 days ago", status: "Pending" },
  ],
};

export function Performance() {
  const [period, setPeriod] = useState<"Daily" | "Weekly" | "Monthly">("Daily");
  return <PerformanceLayout data={MOCK_DATA} period={period} onPeriodChange={setPeriod} />;
}