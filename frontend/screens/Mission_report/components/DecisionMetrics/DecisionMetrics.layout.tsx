import type {
  DecisionMetricsProps,
  DecisionVerdict,
} from "./DecisionMetrics";

const VERDICT_BG: Record<DecisionVerdict, string> = {
  excellent: "#1B8354",
  good: "#5871EC",
  risky: "#F04438",
};

const VERDICT_LABEL: Record<DecisionVerdict, string> = {
  excellent: "Excellent",
  good: "Good",
  risky: "Risky",
};

export function DecisionMetricsLayout({ decisions }: DecisionMetricsProps) {
  return (
    <section>
      <h2 className="text-xl font-bold text-[#1C1C1C]">
        How each decision moved the metrics
      </h2>

      <div className="mt-5 rounded-2xl bg-[#FBFBFB] p-5">
        <ul className="divide-y divide-dashed divide-[#D2D6DB]">
          {decisions.map(({ id, text, subtitle, verdict, deltas }) => (
            <li key={id} className="flex flex-col gap-2 py-6 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-4">
                <p className="text-base font-bold text-[#1C1C1C]">
                  {id} · {text}
                </p>
                <span
                  className="shrink-0 rounded-[2px] px-3 py-1 text-xs font-bold text-[#FBFBFB]"
                  style={{ backgroundColor: VERDICT_BG[verdict] }}
                >
                  {VERDICT_LABEL[verdict]}
                </span>
              </div>

              <p className="text-sm text-[#6C737F]">{subtitle}</p>

              <div className="flex flex-wrap gap-4">
                {deltas.map(({ iconSrc, value }, index) => (
                  <span
                    key={index}
                    className="flex items-center gap-1.5 text-sm font-medium"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={iconSrc}
                      alt=""
                      className="h-4 w-4 brightness-0"
                    />
                    <span
                      className={value >= 0 ? "text-[#519C66]" : "text-[#F04438]"}
                    >
                      {value >= 0 ? `+${value}` : value}
                    </span>
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
