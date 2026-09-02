import Image from "next/image";

export interface PrimaryBackButtonLayoutProps {
  onClick?: () => void;
  className?: string;
}

export function PrimaryBackButtonLayout({
  onClick,
  className = "",
}: PrimaryBackButtonLayoutProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[48px] w-[83px] items-center gap-2 rounded-lg bg-[#FBFBFB] pl-[10px] shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-colors hover:bg-gray-50 ${className}`}
    >
      <Image
        src="/back-chevron.png"
        alt=""
        width={58}
        height={38}
        style={{ width: "25px", height: "35px" }}
        className="-scale-x-100 shrink-0 object-contain"
      />
      <span className="text-sm font-bold text-[#5871EC]">Back</span>
    </button>
  );
}
