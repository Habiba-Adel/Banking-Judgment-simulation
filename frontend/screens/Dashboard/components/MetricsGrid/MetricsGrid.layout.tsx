import { MetricCard } from "../MetricCard";
import type { MetricData } from "../../types";

export interface MetricsGridLayoutProps {
  metrics: MetricData[];
}

export function MetricsGridLayout({ metrics }: MetricsGridLayoutProps) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-gray-900">Your Performance Overview</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} {...metric} />
        ))}
      </div>
    </section>
  );
}