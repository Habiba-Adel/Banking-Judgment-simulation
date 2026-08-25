import Image from "next/image";
import { LogOut } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", iconSrc: "/dashboard.png", active: true },
  { label: "Instructions", iconSrc: "/instructions.png", active: false },
  { label: "Simulations", iconSrc: "/simulations.png", active: false },
  { label: "Performance", iconSrc: "/performance.png", active: false },
] as const;

export function SidebarNavLayout() {
  return (
    <aside className="flex h-[1024px] w-[248px] shrink-0 flex-col justify-between border-r border-gray-100 bg-white p-[20px]">
      <div>
        <div className="mb-8 px-2">
          <Image
            src="/edushift-logo.png"
            alt="EduShift AI — Simulate Decisions. Measure Progress."
            width={160}
            height={40}
            priority
            className="h-auto w-full max-w-[160px]"
          />
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ label, iconSrc, active }) => (
            <button
              key={label}
              type="button"
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Image
                src={iconSrc}
                alt=""
                width={38}
                height={35}
                className="h-[35px] w-[38px] object-contain"
              />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <button
        type="button"
        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50"
      >
        <LogOut className="h-5 w-5" />
        Logout
      </button>
    </aside>
  );
}