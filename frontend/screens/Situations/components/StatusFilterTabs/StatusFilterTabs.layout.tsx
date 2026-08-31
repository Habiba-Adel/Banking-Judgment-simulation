import type { StatusFilterTabsProps } from "./StatusFilterTabs";
import type { StatusFilter } from "../../types";

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in_progress", label: "In Progress" },
  { id: "not_started", label: "Not Started" },
  { id: "completed", label: "Completed" },
];

export function StatusFilterTabsLayout({ active, onChange }: StatusFilterTabsProps) {
  return (
    <div className="flex items-center gap-3">
      {FILTERS.map((filter) => (
        <button
          key={filter.id}
          type="button"
          onClick={() => onChange(filter.id)}
          className={`rounded-lg border border-[#5570F1] px-4 py-2 text-lg leading-7 font-normal tracking-normal align-middle transition-colors ${
            active === filter.id
              ? "bg-[#5570F1] text-white"
              : "text-black hover:bg-[#5570F1]/5"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
