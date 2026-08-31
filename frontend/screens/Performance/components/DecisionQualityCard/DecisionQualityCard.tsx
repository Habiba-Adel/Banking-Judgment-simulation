"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { DecisionQualitySlice } from "../../types";

export interface DecisionQualityCardProps {
  totalDecisions: number;
  slices: DecisionQualitySlice[];
}

export function DecisionQualityCard({ totalDecisions, slices }: DecisionQualityCardProps) {
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.05) return null;
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="500">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="flex h-[433px] w-full flex-col rounded-[16px] bg-white p-5 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
      <h3 className="text-[24px] font-medium leading-[32px] text-[#1C1C1C]">
        Decision Quality
      </h3>

      <div className="mt-3 flex flex-1 flex-col items-center justify-between">
        <div className="relative h-[220px] w-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                startAngle={90}
                endAngle={-270}
                labelLine={false}
                label={renderCustomizedLabel}
              >
                {slices.map((slice) => (
                  <Cell key={slice.label} fill={slice.color} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[16px] font-medium leading-[24px] text-[#1C1C1C]">
              {totalDecisions}
            </span>
            <span className="text-[16px] font-medium leading-[24px] text-[#1C1C1C]">
              Total Decisions
            </span>
          </div>
        </div>

        {/* Legend – only labels, no percentages */}
        <div className="mt-4 flex w-full flex-col gap-3 pl-2">
          {slices.map((slice) => (
            <div key={slice.label} className="flex items-center gap-2 text-[14px] text-[#1C1C1C]">
              <span className="h-[10px] w-[10px] flex-shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="font-medium">{slice.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}