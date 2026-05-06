"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePlus2, LayoutDashboard, PackageSearch } from "lucide-react";
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
];

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <header className="print:hidden">
      <div className="surface-card mt-4 flex flex-col gap-4 rounded-[2rem] border border-white/50 px-4 py-4 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
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

        <nav className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium",
                  isActive
                    ? "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "border-transparent bg-white/70 text-slate-700 hover:border-emerald-100 hover:bg-white",
                )}
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
