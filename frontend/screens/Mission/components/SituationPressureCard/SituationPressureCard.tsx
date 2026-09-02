import Image from "next/image";
import type { SituationPressure } from "../../types";

export interface SituationPressureCardProps {
  pressure: SituationPressure;
  goalText: string;
}


const LEVEL_COLOR: Record<SituationPressure["level"], string> = {
  Low: "text-[#AAF3AD]",
  Moderate: "text-[#B8E4B9]",
  "Medium-High": "text-[#FFBA6B]",
  High: "text-[#FC4D50]",
  Critical: "text-[#FC4D50]",
};

const LEVEL_ROTATION: Record<SituationPressure["level"], number> = {
  Low: -60,
  Moderate: -20,
  "Medium-High": 30,
  High: 70,
  Critical: 90,
};

export function SituationPressureCard({ pressure, goalText }: SituationPressureCardProps) {
  return (
    <div className="rounded-2xl bg-primary p-5 text-white shadow-sm flex flex-col justify-between">
      <h3 className="text-xl font-semibold mb-4">Situation Pressure</h3>

      <div className="flex items-center gap-[15px]">
       <div className="relative w-[118px] h-[59px] overflow-hidden flex-shrink-0">
          <svg className="w-full h-full absolute top-0 left-0" viewBox="0 45 100 50">
            <defs>
              <linearGradient id="pressureGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(170, 243, 173, 1)" />
                <stop offset="33%" stopColor="rgba(52, 189, 58, 1)" />
                <stop offset="66%" stopColor="rgba(255, 186, 107, 1)" />
                <stop offset="100%" stopColor="rgba(252, 77, 80, 1)" />
              </linearGradient>
            </defs>
            <path
              d="M 10 90 A 40 40 0 0 1 90 90"
              fill="none"
              stroke="url(#pressureGradient)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <g
              transform={`rotate(${LEVEL_ROTATION[pressure.level]} 50 90)`}
              className="transition-transform duration-700 ease-out"
            >
              <line x1="50" y1="90" x2="50" y2="58" stroke="white" strokeWidth="2" />
              <circle cx="50" cy="90" r="4" fill="white" />
              <polygon points="47,62 53,62 50,50" fill="white" />
            </g>
          </svg>
        </div>

        <div className="flex flex-col gap-[2px]">
          <div className={`text-lg font-bold ${LEVEL_COLOR[pressure.level]}`}>{pressure.level}</div>
          <div className="text-sm font-normal text-[#E5E7EB]">Time: {pressure.time}</div>
          <div className="text-sm font-normal text-[#E5E7EB]">Expectation: {pressure.expectation}</div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2">
       <div className="flex items-center gap-1.5 text-sm font-medium text-white">
  <Image src="/goal.png" alt="" width={22} height={21} className="object-contain" />
  Your goal
</div>
        <p className="text-sm font-normal text-[#E5E7EB] leading-relaxed">{goalText}</p>
      </div>
    </div>
  );
}