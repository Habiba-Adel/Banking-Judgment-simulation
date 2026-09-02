"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", iconSrc: "/dashboard.png" },
  { label: "Instructions", href: "/instructions", iconSrc: "/instructions.png" },
  { label: "Situations", href: "/situations", iconSrc: "/simulations.png" },
  { label: "Performance", href: "/performance", iconSrc: "/performance.png" },
] as const;

export function SidebarNavLayout() {
  const pathname = usePathname();
  const [isPinned, setIsPinned] = useState(false);

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col justify-between overflow-visible border-r border-gray-100 bg-[#FBFBFB] p-[20px] transition-[width] duration-200 ease-in-out ${
        isPinned ? "w-[248px]" : "w-[88px]"
      }`}
    >
      <div>
        <div className="mb-8 flex items-center gap-2">
          <div className="group relative shrink-0">
            <button
              type="button"
              onClick={() => {
                if (!isPinned) setIsPinned(true);
              }}
              aria-label="Expand sidebar"
              disabled={isPinned}
              className={`relative block shrink-0 overflow-hidden transition-all duration-200 ${
                isPinned ? "h-[53px] w-[160px] cursor-default" : "h-10 w-[39px] cursor-pointer"
              }`}
            >
              {/* Collapsed: cropped logo by default, hides on hover */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Logo.svg"
                alt="EduShift AI"
                width={39}
                height={40}
                style={{ width: "39px", height: "40px" }}
                className={`absolute inset-0 object-contain transition-opacity duration-200 ${
                  isPinned ? "opacity-0" : "opacity-100 group-hover:opacity-0"
                }`}
              />
              {/* Collapsed: sidebar icon, revealed in the logo's place on hover */}
              {!isPinned && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src="/sidebar.svg"
                  alt=""
                  width={22}
                  height={20}
                  style={{ width: "22px", height: "20px" }}
                  className="absolute inset-0 m-auto object-contain opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                />
              )}
              {/* Expanded: full logo */}
              <Image
                src="/edushift-logo.png"
                alt="EduShift AI — Simulate Decisions. Measure Progress."
                width={256}
                height={85}
                style={{ width: "160px", height: "53px" }}
                className={`absolute inset-0 object-contain transition-opacity duration-200 ${
                  isPinned ? "opacity-100" : "opacity-0"
                }`}
              />
            </button>
            {!isPinned && (
              <span className="pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-y-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100">
                Expand
              </span>
            )}
          </div>

          {isPinned && (
            <div className="group relative shrink-0">
              <button
                type="button"
                onClick={() => setIsPinned(false)}
                aria-label="Collapse sidebar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors duration-200 hover:bg-gray-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/sidebar.svg"
                  alt=""
                  width={22}
                  height={20}
                  style={{ width: "22px", height: "20px" }}
                  className="object-contain"
                />
              </button>
              <span className="pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-y-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100">
                Collapse
              </span>
            </div>
          )}
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ label, href, iconSrc }) => {
            const active = pathname === href;

            return (
              <Link
                key={label}
                href={href}
                data-testid={`nav-${label.toLowerCase()}`}
                className={`flex items-center gap-3 rounded-xl py-3 text-sm font-medium whitespace-nowrap transition-[padding,background-color,color] duration-200 ${
                  isPinned ? "px-4" : "px-[5px]"
                } ${
                  active
                    ? "bg-[#5570F1] text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Image
                  src={iconSrc}
                  alt=""
                  width={38}
                  height={35}
                  style={
                    isPinned
                      ? { width: "46px", height: "42px" }
                      : { width: "32px", height: "29px" }
                  }
                  className="shrink-0 object-contain transition-all duration-200"
                />
                <span
                  className={`overflow-hidden opacity-0 transition-all duration-200 ${
                    isPinned ? "max-w-[160px] opacity-100" : "max-w-0"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <button
        type="button"
        className={`flex items-center gap-3 rounded-xl py-3 text-sm font-medium whitespace-nowrap text-red-500 transition-[padding] duration-200 hover:bg-red-50 ${
          isPinned ? "px-4" : "px-[5px]"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logout.svg" alt="" className="h-5 w-5 shrink-0" />
        <span
          className={`overflow-hidden opacity-0 transition-all duration-200 ${
            isPinned ? "max-w-[160px] opacity-100" : "max-w-0"
          }`}
        >
          Logout
        </span>
      </button>
    </aside>
  );
}