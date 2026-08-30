import type { DecisionByAttemptTableProps } from "./DecisionByAttemptTable";
import type { DecisionVerdict } from "../../types";

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

function SortIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
      <path d="M2 3.5L5 1L8 3.5" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 6.5L5 9L8 6.5" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DecisionByAttemptTableLayout({ attempts, decisions }: DecisionByAttemptTableProps) {
  return (
    <section className="rounded-xl border border-gray-100 bg-[#FBFBFB] p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl leading-7 font-bold text-gray-900">Decision by decision</h2>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="sticky left-0 bg-[#FBFBFB] pb-3 pr-4 font-normal text-gray-500">
                <span className="flex items-center gap-1.5">
                  Decision
                  <SortIcon />
                </span>
              </th>
              {attempts.map((attempt) => (
                <th key={attempt.attemptNumber} className="pb-3 pr-4 text-center font-normal text-gray-500">
                  <span className="flex items-center justify-center gap-1.5">
                    Attempt {attempt.attemptNumber}
                    <SortIcon />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {decisions.map(({ decisionId, decisionLabel, verdictsByAttempt }) => (
              <tr key={decisionId} className="border-b border-gray-100 last:border-0">
                <td className="sticky left-0 bg-[#FBFBFB] py-4 pr-4 font-semibold text-[#1C1C1C]">
                  {decisionId} · {decisionLabel}
                </td>
                {verdictsByAttempt.map((verdict, index) => (
                  <td key={index} className="py-4 pr-4 text-center">
                    <span
                      className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: VERDICT_BG[verdict] }}
                    >
                      {VERDICT_LABEL[verdict]}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
