import type { AttemptStatsCardsProps } from "./AttemptStatsCards";

export function AttemptStatsCardsLayout({ attempts }: AttemptStatsCardsProps) {
  const totalAttempts = attempts.length;
  const firstScore = attempts[0]?.score ?? 0;
  const lastScore = attempts[attempts.length - 1]?.score ?? 0;
  const improvement = lastScore - firstScore;
  const improved = improvement >= 0;

  const cards = [
    { label: "Total attempts", value: totalAttempts, accent: "#5570F1" },
    { label: "First attempt score", value: firstScore, accent: "#6C737F" },
    { label: "Last attempt score", value: lastScore, accent: "#5570F1" },
    {
      label: "Improvement",
      value: improved ? `+${improvement} points` : `${improvement} points`,
      accent: improved ? "#519C66" : "#D92D20",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, accent }) => (
        <div key={label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">{label}</div>
          <div className="mt-2 text-3xl font-bold" style={{ color: accent }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}