import Link from "next/link";
import { requireOrg } from "@/lib/session";

export const dynamic = "force-dynamic";

import {
  LayoutDashboardIcon,
  UsersIcon,
  SparklesIcon,
  PhoneCallIcon,
  BookOpenIcon,
  SettingsIcon,
  LogOutIcon,
  ActivityIcon,
  HelpCircleIcon,
  SearchIcon,
  MailIcon,
  BellIcon,
} from "lucide-react";

const NAV_PRIMARY = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/campaigns", label: "Campaigns", icon: SparklesIcon, badge: "6" },
  { href: "/templates", label: "Templates", icon: BookOpenIcon },
  { href: "/employees", label: "Employees", icon: UsersIcon },
  { href: "/risk", label: "Risk", icon: ActivityIcon },
];

const NAV_SECONDARY = [
  { href: "/lms", label: "LMS Bridge", icon: PhoneCallIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
  { href: "/ethics", label: "Help", icon: HelpCircleIcon },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { org, session } = await requireOrg();
  const name = session.name || "Admin";
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "A";

  return (
    <div className="min-h-screen bg-page p-4">
      <div className="grid gap-4 lg:grid-cols-[272px_1fr]">
        {/* ── SIDEBAR PANEL ──────────────────────────────────────── */}
        <aside className="panel sticky top-4 hidden h-[calc(100vh-2rem)] flex-col gap-7 px-[18px] py-6 lg:flex">
          {/* Brand */}
          <div className="flex items-center gap-2.5 px-1.5 py-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green text-[18px] font-bold text-white">
              V
            </div>
            <div className="text-[22px] font-bold tracking-tight text-ink">Vigil</div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto">
            <NavGroup label="Menu" items={NAV_PRIMARY} />
            <NavGroup label="General" items={NAV_SECONDARY} />
            <SidebarLink href="/" icon={LogOutIcon} label="Logout" />
          </nav>

          {/* Promo / ethics callout */}
          <div className="relative mt-auto overflow-hidden rounded-[18px] p-5 text-white"
               style={{ background: "linear-gradient(145deg,#0a3d24 0%,#0a6034 50%,#0d7a3d 100%)" }}>
            <div className="pointer-events-none absolute inset-0"
                 style={{ background: "radial-gradient(circle at 80% 110%, rgba(255,255,255,0.22), transparent 40%)" }} />
            <h5 className="relative mb-1 text-sm font-semibold">
              Ethical by <em className="not-italic font-normal text-[#cfe4d7]">default</em>
            </h5>
            <p className="relative mb-3.5 text-xs text-[#cfe4d7]">
              No deception without consent. Read our principles.
            </p>
            <Link
              href="/ethics"
              className="relative inline-block rounded-full bg-white px-4 py-2 text-xs font-semibold text-green"
            >
              View ethics →
            </Link>
          </div>
        </aside>

        {/* ── MAIN COLUMN ────────────────────────────────────────── */}
        <main className="flex min-w-0 flex-col gap-4">
          {/* Topbar */}
          <div className="panel flex items-center gap-4 px-[22px] py-3.5">
            <div className="flex max-w-[480px] flex-1 items-center gap-2.5 rounded-[12px] bg-page px-3.5 py-2.5 text-ink-3">
              <SearchIcon className="h-4 w-4" strokeWidth={1.8} />
              <input
                placeholder="Search employees, campaigns, templates…"
                className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-3"
              />
              <span className="rounded-md border border-line bg-white px-2 py-0.5 text-[11px] font-medium text-ink-2">
                ⌘ F
              </span>
            </div>
            <IconButton aria-label="Mail">
              <MailIcon className="h-4 w-4" strokeWidth={1.6} />
            </IconButton>
            <IconButton aria-label="Notifications" hasDot>
              <BellIcon className="h-4 w-4" strokeWidth={1.6} />
            </IconButton>
            <div className="ml-1 flex items-center gap-2.5 border-l border-line py-1 pl-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-soft text-sm font-semibold text-rose">
                {initials}
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-ink">{name}</div>
                <div className="text-xs text-ink-3">{session.email}</div>
              </div>
            </div>
          </div>

          {/* Page content */}
          {children}
        </main>
      </div>
    </div>
  );
}

function NavGroup({
  label,
  items,
}: {
  label: string;
  items: ReadonlyArray<{ href: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }>;
}) {
  return (
    <div className="mb-5">
      <h4 className="mb-2.5 px-2 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3">{label}</h4>
      <ul className="flex flex-col gap-0.5">
        {items.map((it) => (
          <SidebarLink key={it.href} {...it} />
        ))}
      </ul>
    </div>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}) {
  // Active styling is handled at the page level if needed.
  // For now: hover state only (no client-side path detection in server component).
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium text-ink-2 hover:bg-green-soft hover:text-ink"
      >
        <Icon className="h-[18px] w-[18px]" />
        <span className="flex-1">{label}</span>
        {badge ? (
          <span className="rounded-full bg-green-pill px-2 py-0.5 text-[11px] font-semibold text-green">
            {badge}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

function IconButton({
  children,
  hasDot,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { hasDot?: boolean }) {
  return (
    <button
      type="button"
      className="relative flex h-10 w-10 items-center justify-center rounded-[12px] bg-page text-ink"
      {...props}
    >
      {children}
      {hasDot ? (
        <span className="absolute right-2.5 top-2.5 h-[7px] w-[7px] rounded-full border-2 border-card bg-rose" />
      ) : null}
    </button>
  );
}
