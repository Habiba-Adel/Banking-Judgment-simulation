import type { AttentionCardProps } from "./AttentionCard";

export function AttentionCardLayout({ items }: AttentionCardProps) {
  return (
    <section className="flex h-[420px] w-[500px] flex-col gap-[22px] rounded-[16px] bg-[#FBFBFB] p-[20px] opacity-100">
      <h2 className="text-xl font-bold text-[#1C1C1C]">What needs attention</h2>

      <ul className="divide-y divide-dashed divide-[#D2D6DB]">
        {items.map(({ iconSrc, label, delta }) => (
          <li key={label} className="flex items-center gap-3 py-[19px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={iconSrc} alt="" className="h-[26px] w-[26px] shrink-0" />
            <span className="flex-1 text-base text-[#1C1C1C]">{label}</span>
            <span className="flex items-center gap-1 text-base font-medium text-[#D92D20]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={delta >= 0 ? "/red Trend Icon.svg" : "/down icon.svg"}
                alt=""
                className="h-4 w-4"
              />
              {delta > 0 ? `+${delta}` : delta}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
