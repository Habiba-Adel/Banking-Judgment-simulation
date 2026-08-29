import type { TopBarProps } from "./TopBar";

export function TopBarLayout({ language }: TopBarProps) {
  return (
    <div className="flex w-full items-center justify-end gap-4 px-8 pt-6">
      <div
        className={`flex items-center gap-[12px] w-[68px] h-[32px] rounded-[4px] border-2 p-[4px] transition-all ${
          language === "AR" ? "bg-[#FBFBFB] border-transparent" : "bg-white border-[#5570F1]"
        }`}
      >
        <span
          className={`flex w-[24px] h-[24px] items-center justify-center text-[10px] font-bold rounded-[4px] transition-all ${
            language === "AR" ? "bg-[#5570F1] text-white" : "text-gray-800"
          }`}
        >
          AR
        </span>
        <span
          className={`flex w-[24px] h-[24px] items-center justify-center text-[10px] font-bold rounded-[4px] transition-all ${
            language === "EN" ? "bg-[#5570F1] text-white" : "text-gray-400"
          }`}
        >
          EN
        </span>
      </div>
    </div>
  );
}