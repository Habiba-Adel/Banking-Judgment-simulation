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
    // Gap 12px between metric cards as requested
    <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-3">
      {metrics.map((metric) => {
        const iconSrc = ICON_SRCS[metric.id];
        return (
          <div 
            key={metric.id} 
            className="flex h-[96px] items-center gap-[10px] rounded-lg border border-gray-100 bg-white p-[20px]"
          >
            {/* Icon Box */}
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-tint">
              <Image
                src={iconSrc}
                alt=""
                width={24}
                height={24}
                className="object-contain"
                style={{
                  filter:
                    "brightness(0) saturate(100%) invert(36%) sepia(97%) saturate(1036%) hue-rotate(214deg) brightness(101%) contrast(102%)",
                }}
              />
            </div>
            
            {/* Text & Values */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="text-[24px] font-bold leading-none text-gray-900">{metric.value} / 100</span>
                {metric.changeLabel && (
                  <span className="flex items-center text-xs font-medium text-emerald-600">
                    <TrendingUp className="mr-1 h-3.5 w-3.5" />
                    {metric.changeLabel}
                  </span>
                )}
              </div>
              <span className="mt-1 text-[14px] font-medium text-gray-500">{metric.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}