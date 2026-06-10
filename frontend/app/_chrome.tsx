"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function TopBar() {
  const { user } = useAuth();
  return (
    <header className="fixed top-0 w-full z-50 bg-[#f6f6f6]/80 backdrop-blur-xl border-b border-outline-variant/30">
      <div className="max-w-2xl mx-auto flex justify-between items-center px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl material-symbols-filled">
              eco
            </span>
          </div>
          <span className="text-2xl font-extrabold tracking-tighter text-primary font-headline">
            NutriSmart
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/shopping"
            className="text-on-surface-variant hover:text-primary active:scale-95 transition-all duration-200"
            aria-label="Shopping list"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
          </Link>
          <Link
            href="/settings"
            className="text-on-surface-variant hover:text-primary active:scale-95 transition-all duration-200"
            aria-label="Settings"
          >
            <span className="material-symbols-outlined">settings</span>
          </Link>
          {!user && (
            <Link
              href="/login"
              className="text-xs font-bold text-primary bg-primary-container/40 px-3 py-1.5 rounded-full hover:bg-primary-container/60 transition-colors"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

const NAV_ITEMS = [
  { href: "/",          label: "Home",     icon: "home" },
  { href: "/calendar",  label: "Calendar", icon: "calendar_month" },
  { href: "/log",       label: "Log",      icon: "add_circle", primary: true },
  { href: "/inventory", label: "Pantry",   icon: "kitchen" },
  { href: "/coach",     label: "Coach",    icon: "smart_toy" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-2 pb-6 pt-3 bg-[#f6f6f6]/80 backdrop-blur-xl z-50 rounded-t-2xl shadow-[0_-8px_32px_-4px_rgba(45,47,47,0.06)] border-t border-outline-variant/30">
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const isPrimary = "primary" in item && item.primary;

        if (isPrimary) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center bg-primary text-on-primary rounded-full px-4 py-1.5 transition-all duration-300 shadow-lg ${
                active ? "scale-110 -translate-y-2" : "active:scale-95"
              }`}
            >
              <span
                className="material-symbols-outlined material-symbols-filled"
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-medium tracking-wide uppercase mt-1">
                {item.label}
              </span>
            </Link>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-full active:scale-90 transition-all duration-200 ${
              active
                ? "text-primary bg-primary-container/40"
                : "text-on-surface hover:bg-zinc-200/50"
            }`}
          >
            <span
              className={`material-symbols-outlined ${active ? "material-symbols-filled" : ""}`}
              aria-hidden="true"
            >
              {item.icon}
            </span>
            <span className="text-[10px] font-medium tracking-wide uppercase mt-1">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
