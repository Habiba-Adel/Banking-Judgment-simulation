// RecentScenariosCard.tsx — unchanged
import { ChevronDown } from "lucide-react";
import type { RecentScenario } from "../../types";

export interface RecentScenariosCardProps {
  scenarios: RecentScenario[];
}

const COLUMNS = ["Mission", "Category", "Score", "Decision Quality", "Total Time", "Last Played", "Status"] as const;

export function RecentScenariosCard({ scenarios }: RecentScenariosCardProps) {
  return (
    <div className="flex h-[289px] w-full flex-col rounded-[12px] bg-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
      <div className="flex h-[72px] w-full items-center justify-between px-5">
        <h3 className="text-[24px] font-medium leading-[32px] text-[#1C1C1C]">
          Recent Scenarios
        </h3>
        <button
          type="button"
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-500"
        >
          All
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      <div className="w-full overflow-x-auto px-5">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="h-[52px] border-y border-[#E5E7EB]">
              {COLUMNS.map((col) => (
                <th key={col} className="text-[14px] font-medium text-[#1C1C1C]">
                  <span className="flex items-center gap-[22px]">
                    {col}
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scenarios.map((row, i) => (
              <tr key={i} className="h-[48px] border-b border-[#E5E7EB] last:border-b-0">
                <td className="text-[14px] font-medium text-[#1C1C1C]">{row.mission}</td>
                <td className="text-[14px] text-[#4D5761]">{row.category}</td>
                <td className="text-[14px] text-[#4D5761]">{row.score}</td>
                <td className="text-[14px] text-[#4D5761]">{row.decisionQuality}</td>
                <td className="text-[14px] text-[#4D5761]">{row.totalTime}</td>
                <td className="text-[14px] text-[#4D5761]">{row.lastPlayed}</td>
                <td>
                  <span
                    className="inline-flex h-[28px] items-center justify-center rounded-[8px] px-[11px] py-[4px] text-[14px] font-medium text-white"
                    style={{
                      backgroundColor:
                        row.status === "Completed" ? "rgba(7, 148, 85, 0.9)" : "rgba(245, 150, 34, 0.9)",
                    }}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}