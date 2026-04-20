import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ShieldCheckIcon,
  LayoutDashboardIcon,
  UsersIcon,
  SparklesIcon,
  PhoneCallIcon,
  BookOpenIcon,
  SettingsIcon,
  LogOutIcon,
  ActivityIcon,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboardIcon },
  { href: "/campaigns", label: "Campaigns", icon: SparklesIcon },
  { href: "/employees", label: "Employees", icon: UsersIcon },
  { href: "/risk", label: "Risk Heatmap", icon: ActivityIcon },
  { href: "/templates", label: "Templates", icon: BookOpenIcon },
  { href: "/lms", label: "LMS Bridge", icon: PhoneCallIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const org = await db.org.findUnique({ where: { id: session.orgId } });
  if (!org) redirect("/login");

  const initial = (session.name || session.email || "?")[0]?.toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-slate-50/50 lg:grid lg:grid-cols-[240px_1fr]">
      {/* ── SIDEBAR ──────────────────────────────────────────── */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-slate-200 bg-white lg:flex">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/30">
            <ShieldCheckIcon className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">Vigil</p>
            <p className="text-xs text-slate-400">{org.name}</p>
          </div>
        </div>

        {/* Nav label */}
        <div className="px-5 pb-1.5 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Navigation</p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-0.5 px-3 pb-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <item.icon className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">{session.name || "Admin"}</p>
              <p className="truncate text-xs text-slate-400">{session.email}</p>
            </div>
            <form action={logout}>
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                aria-label="Sign out"
                className="h-7 w-7 text-slate-400 hover:text-slate-700"
              >
                <LogOutIcon className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ──────────────────────────────────────── */}
      <main className="min-h-screen">{children}</main>
    </div>
  );
}
