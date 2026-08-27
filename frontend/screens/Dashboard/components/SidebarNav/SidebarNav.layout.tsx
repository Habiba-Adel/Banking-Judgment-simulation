import Image from "next/image";
import { LogOut } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", iconSrc: "/dashboard.png", active: true },
  { label: "Instructions", iconSrc: "/instructions.png", active: false },
  { label: "Simulations", iconSrc: "/simulations.png", active: false },
  { label: "Performance", iconSrc: "/performance.png", active: false },
] as const;

export function SidebarNavLayout({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <aside
      className={`flex h-screen shrink-0 flex-col justify-between border-r border-gray-100 bg-white py-[20px] transition-all ${
        collapsed ? "w-[80px] items-center px-2" : "w-[248px] px-[20px]"
      }`}
    >
      <div className="flex w-full flex-col items-center">
        <div className={`mb-8 flex justify-center ${collapsed ? "w-full" : "px-2"}`}>
          {collapsed ? (
            <div className="flex h-8 w-8 items-center justify-center text-2xl text-amber-500">
              ✦
            </div>
          ) : (
            <Image
              src="/edushift-logo.png"
              alt="EduShift AI"
              width={160}
              height={40}
              priority
              className="h-auto w-full max-w-[160px]"
            />
          )}
        </div>

        <nav className="flex w-full flex-col gap-2">
          {NAV_ITEMS.map(({ label, iconSrc, active }) => (
            <button
              key={label}
              type="button"
              title={collapsed ? label : undefined}
              className={`flex items-center rounded-xl transition-colors ${
                collapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
              } ${
                active
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Image
                src={iconSrc}
                alt={collapsed ? label : ""}
                width={24}
                height={24}
                className="h-[24px] w-[24px] object-contain"
              />
              {!collapsed && <span className="text-sm font-medium">{label}</span>}
            </button>
          ))}
        </nav>
      </div>

      <button
        type="button"
        title={collapsed ? "Logout" : undefined}
        className={`flex items-center rounded-xl text-red-500 hover:bg-red-50 ${
          collapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
        }`}
      >
        <LogOut className="h-5 w-5" />
        {!collapsed && <span className="text-sm font-medium">Logout</span>}
      </button>
    </aside>
  );
}