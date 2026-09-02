import type { AttemptPickerProps } from "./AttemptPicker";

export function AttemptPickerLayout({
  options,
  selectedIds,
  maxSelected,
  onToggle,
  title = "Choose attempts to compare",
  itemNoun = "attempts on this mission",
  pillPrefix = "Run",
}: AttemptPickerProps) {
  return (
    <section className="rounded-xl border border-gray-100 bg-[#FBFBFB] p-6">
      <h2 className="text-xl leading-7 font-bold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">
        You have {options.length} {itemNoun} — pick up to {maxSelected} to compare.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          const isDisabled = !isSelected && selectedIds.length >= maxSelected;
          return (
            <button
              key={option.id}
              type="button"
              disabled={isDisabled}
              onClick={() => onToggle(option.id)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                isSelected
                  ? "border-[#5570F1] bg-[#5570F1] text-white"
                  : isDisabled
                    ? "border-gray-100 bg-gray-50 text-gray-300"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {pillPrefix} {option.runNumber} · {option.date} · {option.score}/100
            </button>
          );
        })}
      </div>
    </section>
  );
}
