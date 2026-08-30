import type { AttemptsOverviewTableProps } from "./AttemptsOverviewTable";

function SortIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
      <path d="M2 3.5L5 1L8 3.5" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 6.5L5 9L8 6.5" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const HEADERS = ["Attempt", "Date", "Score", "Accuracy", "Decision quality", "Improvement"];

export function AttemptsOverviewTableLayout({ attempts }: AttemptsOverviewTableProps) {
  return (
    <section className="rounded-xl border border-gray-100 bg-[#FBFBFB] p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl leading-7 font-bold text-gray-900">All attempts overview</h2>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {HEADERS.map((label) => (
                <th key={label} className="pb-3 pr-4 font-normal text-gray-500">
                  <span className="flex items-center gap-1.5">
                    {label}
                    <SortIcon />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attempts.map(({ attemptNumber, date, score, accuracy, decisionQuality, improvement }) => {
              const improved = improvement >= 0;
              const isFirst = attemptNumber === 1;
              const pillColor = isFirst ? "#6C737F" : improved ? "#519C66" : "#D92D20";
              const pillLabel = isFirst
                ? "First attempt"
                : improved
                  ? `+${improvement} improved`
                  : `${improvement} declined`;

              return (
                <tr key={attemptNumber} className="border-b border-gray-100 last:border-0">
                  <td className="py-4 pr-4 font-semibold text-[#1C1C1C]">#{attemptNumber}</td>
                  <td className="py-4 pr-4 text-gray-500">{date}</td>
                  <td className="py-4 pr-4 font-medium text-[#1C1C1C]">{score} / 100</td>
                  <td className="py-4 pr-4 text-gray-500">{accuracy}%</td>
                  <td className="py-4 pr-4 text-gray-500">{decisionQuality}</td>
                  <td className="py-4 pr-4">
                    <span
                      className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: pillColor }}
                    >
                      {pillLabel}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
