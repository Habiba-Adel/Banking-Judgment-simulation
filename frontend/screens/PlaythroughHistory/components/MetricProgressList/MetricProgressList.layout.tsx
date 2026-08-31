import type { MetricProgressListProps } from "./MetricProgressList";

const EARLY_RUN_COLORS = ["#D2D6DB", "#9CA3AF", "#6C737F"];

export function MetricProgressListLayout({ metrics }: MetricProgressListProps) {
  return (
    <section>
      <h2 className="text-xl leading-7 font-bold text-gray-900">Metric movement</h2>
      <p className="mt-1 text-sm text-gray-500">
        One bar per run — where you started, and how you've moved since.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-full bg-gray-300" />
          Earlier runs
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-full bg-[#5570F1]" />
          Most recent run
        </span>
        <span className="flex items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Trend Icon.svg" alt="" className="h-3.5 w-3.5" />
          Progress made
        </span>
        <span className="flex items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/down icon.svg" alt="" className="h-3.5 w-3.5" />
          Ground lost
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map(({ key, label, iconSrc, valuesByRun }) => {
          const first = valuesByRun[0] ?? 0;
          const latest = valuesByRun[valuesByRun.length - 1] ?? 0;
          const delta = latest - first;
          const improved = delta >= 0;
          const trackColor = improved ? "#519C66" : "#D92D20";

          return (
            <div key={key} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5570F11A]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={iconSrc} alt="" className="h-5 w-5 shrink-0 object-contain" />
                </div>
                <div
                  className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: trackColor }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={improved ? "/Trend Icon.svg" : "/down icon.svg"}
                    alt=""
                    className="h-4 w-4"
                  />
                  <span>{improved ? `+${delta}` : delta}</span>
                </div>
              </div>

              <div className="mt-3 text-2xl font-bold text-gray-900">{latest} / 100</div>
              <div className="mt-1 text-sm text-gray-500">{label}</div>

              <div className="mt-4 flex flex-col gap-2">
                {valuesByRun.map((value, index) => {
                  const isLatest = index === valuesByRun.length - 1;
                  const barColor = isLatest
                    ? "#5570F1"
                    : EARLY_RUN_COLORS[index % EARLY_RUN_COLORS.length];

                  return (
                    <div key={index} className="flex items-center gap-2">
                      <span
                        className="w-9 shrink-0 text-xs"
                        style={{ color: isLatest ? "#5570F1" : "#9CA3AF", fontWeight: isLatest ? 600 : 400 }}
                      >
                        Run {index + 1}
                      </span>
                      <div className="relative h-2 flex-1 rounded-full bg-gray-100">
                        <div
                          className="absolute top-0 h-2 rounded-full"
                          style={{ width: `${value}%`, backgroundColor: barColor }}
                        />
                      </div>
                      <span
                        className="w-6 shrink-0 text-right text-xs"
                        style={{ color: isLatest ? "#5570F1" : "#6B7280", fontWeight: isLatest ? 600 : 400 }}
                      >
                        {value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
