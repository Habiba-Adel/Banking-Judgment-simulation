import Image from "next/image";
import { TrendingUp } from "lucide-react";
import type { MetricIconKey } from "../../types";

const ICON_SRCS: Record<MetricIconKey, string> = {
  compliance: "/icon-compliance.png",
  reputationRisk: "/icon-reputation-risk.png",
  customerTrust: "/icon-customer-trust.png",
  dataProtection: "/icon-data-protection.png",
  accountability: "/icon-accountability.png",
  decisionQuality: "/icon-decision-quality.png",
};

export interface MetricCardLayoutProps {
  icon: MetricIconKey;
  label: string;
  value: number | null;
  comparisonLabel: string;
}

export function MetricCardLayout({
  icon,
  label,
  value,
  comparisonLabel,
}: MetricCardLayoutProps) {
  const iconSrc = ICON_SRCS[icon];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5570F11A]">
          <Image
            src={iconSrc}
            alt=""
            width={20}
            height={20}
            className="object-contain"
            style={{ filter: "brightness(0) saturate(100%) invert(36%) sepia(97%) saturate(1036%) hue-rotate(214deg) brightness(101%) contrast(102%)" }}
          />

        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>+2%</span>
        </div>
      </div>
      <div className="mt-1 text-right text-xs text-gray-400">{comparisonLabel}</div>
      <div className="mt-3 text-2xl font-bold text-gray-900">
        {value === null ? "-" : value} / 100
      </div>
      <div className="mt-1 text-sm text-gray-500">{label}</div>
    </div>
  );
}