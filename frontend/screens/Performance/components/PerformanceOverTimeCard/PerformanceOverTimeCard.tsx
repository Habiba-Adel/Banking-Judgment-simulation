"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { PerformancePoint } from "../../types";

export interface PerformanceOverTimeCardProps {
  data: PerformancePoint[];
  period: "Daily" | "Weekly" | "Monthly";
  onPeriodChange: (period: "Daily" | "Weekly" | "Monthly") => void;
}

const PERIODS = ["Daily", "Weekly", "Monthly"] as const;

export function PerformanceOverTimeCard({ data, period, onPeriodChange }: PerformanceOverTimeCardProps) {
  return (
    <div className="flex h-[433px] w-full flex-col rounded-[16px] bg-white p-5 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
      <div className="flex h-[46px] items-center justify-between">
        <h3 className="text-[24px] font-medium leading-[32px] text-[#1C1C1C]">
          Performance Over Time
        </h3>
        <div className="flex items-center gap-1 rounded-[8px] bg-[#5870ED] p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange(p)}
              className={`rounded-[6px] px-3 py-1.5 text-[14px] font-medium transition-colors ${
  period === p
    ? "text-white shadow-sm"
    : "bg-transparent text-white/70 hover:text-white"
}`}
style={period === p ? { backgroundColor: "rgba(117, 137, 240, 1)" } : undefined}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 h-[calc(100%-46px-24px)] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5870ED" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#5870ED" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#F3F4F6" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9CA3AF" }} dy={10} />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#9CA3AF" }}
            />
            <Tooltip
              cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '4 4' }}
              contentStyle={{
                backgroundColor: "#1C1C1C",
                borderRadius: 8,
                border: "none",
                color: "#fff",
                fontSize: 12,
                padding: "4px 8px",
              }}
              itemStyle={{ color: "#fff" }}
              labelStyle={{ display: "none" }}
              formatter={(value: number) => [`${value} pts`, ""]}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#5870ED"
              strokeWidth={3}
              fill="url(#scoreAreaFill)"
              dot={{ r: 4, fill: "#5870ED", strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#1C1C1C", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}