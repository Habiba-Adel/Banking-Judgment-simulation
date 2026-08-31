import { DashboardLayout } from "./Dashboard.layout";
import type { DashboardData } from "./types";

const EMPTY_STATE_DATA: DashboardData = {
  userName: "Alyan",
  hasProgress: false,
  profile: { score: null, maxScore: 100, profileLabel: null },
  metrics: [
    { id: "compliance", icon: "compliance", label: "Compliance", value: null, comparisonLabel: "No Data Yet" },
    { id: "reputationRisk", icon: "reputationRisk", label: "Reputation Risk", value: null, comparisonLabel: "No Data Yet" },
    { id: "customerTrust", icon: "customerTrust", label: "Customer Trust", value: null, comparisonLabel: "No Data Yet" },
    { id: "dataProtection", icon: "dataProtection", label: "Data Protection", value: null, comparisonLabel: "No Data Yet" },
    { id: "accountability", icon: "accountability", label: "Accountability", value: null, comparisonLabel: "No Data Yet" },
    { id: "decisionQuality", icon: "decisionQuality", label: "Decision Quality", value: null, comparisonLabel: "No Data Yet" },
  ],
  missions: [],
};

const CONTINUE_STATE_DATA: DashboardData = {
  userName: "Alyan",
  hasProgress: true,
  profile: { score: 78, maxScore: 100, profileLabel: "Risk Spotter" },
  metrics: [
    { id: "compliance", icon: "compliance", label: "Compliance", value: 82, comparisonLabel: "vs last 7 days" },
    { id: "reputationRisk", icon: "reputationRisk", label: "Reputation Risk", value: 50, comparisonLabel: "vs last 9 days" },
    { id: "customerTrust", icon: "customerTrust", label: "Customer Trust", value: 50, comparisonLabel: "vs last 9 days" },
    { id: "dataProtection", icon: "dataProtection", label: "Data Protection", value: 26, comparisonLabel: "vs last 9 days" },
    { id: "accountability", icon: "accountability", label: "Accountability", value: 26, comparisonLabel: "vs last 9 days" },
    { id: "decisionQuality", icon: "decisionQuality", label: "Decision Quality", value: 26, comparisonLabel: "vs last 9 days" },
  ],
  missions: [
    {
      id: "vip-friend-request",
      title: "The VIP Friend Request",
      currentStep: 3,
      totalSteps: 5,
      playedLabel: "2 days ago",
      thumbnailSrc: "/mission-thumb-vip-friend-request.svg",
    },
    {
      id: "screenshot-shortcut",
      title: "The Screenshot Shortcut",
      currentStep: 2,
      totalSteps: 5,
      playedLabel: "3 days ago",
      thumbnailSrc: "/mission-thumb-screenshot-shortcut.svg",
    },
  ],
};

// Toggle this to preview the empty vs. in-progress dashboard state until it's
// driven by GET /playthroughs/:id/progress.
const MOCK_HAS_PROGRESS = true;

export function Dashboard() {
  const data = MOCK_HAS_PROGRESS ? CONTINUE_STATE_DATA : EMPTY_STATE_DATA;

  return <DashboardLayout data={data} />;
}