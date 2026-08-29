import { SidebarNav } from "../../components/SidebarNav";
import { TopBar } from "../../components/TopBar";
import { WelcomeCard } from "./components/WelcomeCard";
import { MetricsGrid } from "./components/MetricsGrid";
import { ProfileGauge } from "./components/ProfileGauge";
import { ContinuePanel } from "./components/ContinuePanel";
import type { DashboardData } from "./types";

export interface DashboardLayoutProps {
  data: DashboardData;
}

export function DashboardLayout({ data }: DashboardLayoutProps) {
  const { userName, hasProgress, profile, metrics, missions } = data;

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      <SidebarNav />

      <div className="flex-1">
        <TopBar />

        <div className="grid grid-cols-1 gap-6 px-8 py-6 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-6">
            <WelcomeCard userName={userName} hasProgress={hasProgress} />
            <MetricsGrid metrics={metrics} />
          </div>

          <div className="flex flex-col gap-6">
            <ProfileGauge {...profile} />
            <ContinuePanel hasProgress={hasProgress} missions={missions} />
          </div>
        </div>
      </div>
    </div>
  );
}