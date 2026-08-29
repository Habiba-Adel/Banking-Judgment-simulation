import Image from "next/image";
import { TrendingUp } from "lucide-react";
import type { MissionMetric, MissionMetricKey } from "../../types";


const ICON_SRCS: Partial<Record<MissionMetricKey, string>> = {
  compliance: "/icon-compliance.png",
  reputationRisk: "/icon-reputation-risk.png",
  responsibleBanking: "/icon-decision-quality.png",
};

export interface MetricsBarProps {
  metrics: MissionMetric[];
}

export function MetricsBar({ metrics }: MetricsBarProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {metrics.map((metric) => {
        const iconSrc = ICON_SRCS[metric.id];
        return (
          <div key={metric.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-tint">
               <Image
  src={iconSrc}
  alt=""
  width={20}
  height={20}
  className="object-contain"
  style={{
    filter:
      "brightness(0) saturate(100%) invert(36%) sepia(97%) saturate(1036%) hue-rotate(214deg) brightness(101%) contrast(102%)",
  }}
/>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>{metric.changeLabel}</span>
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-gray-900">{metric.value} / 100</div>
            <div className="mt-1 text-sm text-gray-500">{metric.label}</div>
          </div>
        );
      })}
    </div>
  );
}
