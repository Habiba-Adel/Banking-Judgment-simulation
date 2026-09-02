import Image from "next/image";
import type { TitleCardProps } from "./TitleCard";

export function TitleCardLayout({
  category,
  title,
  description,
  highlights,
}: TitleCardProps) {
  return (
    <section className="flex h-full flex-col rounded-2xl bg-[#FBFBFB] p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center rounded-[2px] bg-[#5871EC] px-3 py-1 text-xs font-bold text-[#FBFBFB]">
          {category}
        </span>
        <h2 className="text-xl font-bold text-[#1C1C1C]">{title}</h2>
      </div>

      <p className="mt-4 max-w-[872px] text-sm leading-relaxed text-[#6C737F]">
        {description}
      </p>

      <ul className="flex flex-col gap-2 pt-6">
        {highlights.map((highlight, index) => (
          <li key={index} className="flex items-center gap-3">
            <Image
              src="/pin-icon.png"
              alt=""
              width={144}
              height={98}
              style={{ width: "44px", height: "30px" }}
              className="shrink-0 object-contain"
            />
            <span className="text-sm leading-relaxed text-[#1C1C1C]">
              {highlight}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
