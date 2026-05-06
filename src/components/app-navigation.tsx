"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FilePlus2,
  LayoutDashboard,
  Menu,
  PackageSearch,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/orders/new",
    label: "Legacy Builder",
    icon: FilePlus2,
  },
  {
    href: "/orders",
    label: "Orders",
    icon: PackageSearch,
  },
  {
    href: "/bin",
    label: "Bin",
    icon: Trash2,
  },
];

export function AppNavigation() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    return window.localStorage.getItem("succulent-sphere-theme") === "dark"
      ? "dark"
      : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("succulent-sphere-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header className="print:hidden">
        <div className="surface-card mt-4 flex items-center justify-between gap-4 rounded-[2rem] border border-white/50 px-4 py-4 sm:mt-6 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
              <LayoutDashboard className="size-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                Succulent Sphere
              </p>
              <h1 className="text-lg font-semibold text-slate-900">
                Order Desk
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-200 hover:bg-white"
          >
            <Menu className="size-4" />
            Menu
          </button>
        </div>
      </header>

      <div
        className={cn(
          "print:hidden fixed inset-0 z-40 bg-slate-950/30 transition-opacity duration-200",
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMenuOpen(false)}
      />

      <aside
        className={cn(
          "print:hidden surface-card-strong fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-white/20 p-5 shadow-2xl transition-transform duration-300",
          menuOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Quick Access
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Sidebar Menu
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="inline-flex size-11 items-center justify-center rounded-full border border-white/70 bg-white/85 text-slate-700"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="mt-8 grid gap-3">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "inline-flex items-center justify-between gap-3 rounded-[1.4rem] border px-4 py-4 text-sm font-semibold",
                  isActive
                    ? "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "border-white/70 bg-white/80 text-slate-700 hover:border-emerald-100 hover:bg-white",
                )}
              >
                <span className="inline-flex items-center gap-3">
                  <Icon className="size-4" />
                  {link.label}
                </span>
                <span className="text-xs uppercase tracking-[0.24em] opacity-70">
                  Open
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 rounded-[1.6rem] border border-white/70 bg-white/75 p-4">
          <p className="text-sm font-semibold text-slate-900">Appearance</p>
          <p className="mt-1 text-sm text-slate-500">
            Switch between the bright desk view and a darker review mode.
          </p>

          <button
            type="button"
            onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
            className="mt-4 inline-flex w-full items-center justify-between rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
          >
            <span className="inline-flex items-center gap-2">
              <Sun className="size-4" />
              Toggle Light / Dark
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs uppercase tracking-[0.24em]">
              Theme
            </span>
          </button>
        </div>

        <div className="mt-auto rounded-[1.6rem] border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-900">
          Deleted legacy orders move to Bin first, so you can review them before
          restoring or deleting permanently.
        </div>
      </aside>
    </>
  );
}
