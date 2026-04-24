"use client";

import { useMemo, useState } from "react";
import { BandPill } from "@/components/vigil-ui";
import { SearchIcon, XIcon } from "lucide-react";

export type RiskRow = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  score: number;
  band: string;
  weakAreas: string[];
};

const BAND_ORDER = ["critical", "high", "medium", "low"] as const;
type Band = (typeof BAND_ORDER)[number];

export function RiskEmployeesTable({ rows }: { rows: RiskRow[] }) {
  const [query, setQuery] = useState("");
  const [bandSet, setBandSet] = useState<Set<Band>>(new Set());
  const [dept, setDept] = useState("all");
  const [sort, setSort] = useState<"score-desc" | "score-asc" | "name">("score-desc");

  // Departments — derived from data so the dropdown reflects reality.
  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (r.department) set.add(r.department);
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = rows.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !r.email.toLowerCase().includes(q)) return false;
      if (bandSet.size > 0 && !bandSet.has(r.band as Band)) return false;
      if (dept !== "all" && r.department !== dept) return false;
      return true;
    });
    if (sort === "score-desc") out = [...out].sort((a, b) => b.score - a.score);
    else if (sort === "score-asc") out = [...out].sort((a, b) => a.score - b.score);
    else out = [...out].sort((a, b) => a.name.localeCompare(b.name));
    return out;
  }, [rows, query, bandSet, dept, sort]);

  const toggleBand = (b: Band) =>
    setBandSet((s) => {
      const next = new Set(s);
      if (next.has(b)) next.delete(b);
      else next.add(b);
      return next;
    });

  const hasFilters = query.trim() || bandSet.size > 0 || dept !== "all";
  const reset = () => {
    setQuery("");
    setBandSet(new Set());
    setDept("all");
  };

  // Per-band counts on the unfiltered set (helps show what's available).
  const bandCounts = useMemo(() => {
    const counts: Record<Band, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const r of rows) counts[r.band as Band] = (counts[r.band as Band] ?? 0) + 1;
    return counts;
  }, [rows]);

  return (
    <div className="panel overflow-hidden">
      {/* Header — title + match count + reset */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <p className="text-[15px] font-bold text-ink">All employees</p>
        <span className="rounded-full bg-page px-2.5 py-1 text-xs font-medium text-ink-3 tabular-nums">
          {filtered.length} / {rows.length}
        </span>
        {hasFilters ? (
          <button
            type="button"
            onClick={reset}
            className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-ink-3 hover:text-rose"
          >
            <XIcon className="h-3 w-3" /> Clear filters
          </button>
        ) : null}
      </div>

      {/* Filters row */}
      <div className="flex flex-col gap-3 border-b border-line px-5 py-4 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="flex flex-1 items-center gap-2.5 rounded-[12px] border border-line bg-page px-3 py-2 focus-within:border-green focus-within:bg-card lg:max-w-[320px]">
          <SearchIcon className="h-4 w-4 text-ink-3" strokeWidth={1.8} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or email…"
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-3"
          />
        </div>

        {/* Band chips — multi-select toggle */}
        <div className="flex flex-wrap items-center gap-1.5">
          {BAND_ORDER.map((b) => {
            const active = bandSet.has(b);
            const tone =
              b === "critical" ? "rose" : b === "high" ? "amber" : "green";
            const activeCls =
              tone === "rose"
                ? "bg-rose-soft text-rose ring-1 ring-rose"
                : tone === "amber"
                  ? "bg-amber-soft text-amber ring-1 ring-amber"
                  : "bg-green-pill text-green ring-1 ring-green";
            return (
              <button
                key={b}
                type="button"
                onClick={() => toggleBand(b)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                  active
                    ? activeCls
                    : "bg-page text-ink-2 hover:bg-line"
                }`}
              >
                {b}
                <span className="tabular-nums opacity-70">{bandCounts[b]}</span>
              </button>
            );
          })}
        </div>

        {/* Department + Sort */}
        <div className="flex items-center gap-2 lg:ml-auto">
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="rounded-[12px] border border-line bg-card px-3 py-2 text-sm font-medium text-ink outline-none focus:border-green"
            aria-label="Filter by department"
          >
            <option value="all">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-[12px] border border-line bg-card px-3 py-2 text-sm font-medium text-ink outline-none focus:border-green"
            aria-label="Sort"
          >
            <option value="score-desc">Riskiest first</option>
            <option value="score-asc">Safest first</option>
            <option value="name">Name (A→Z)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <Th>Employee</Th>
              <Th>Department</Th>
              <Th className="text-right">Score</Th>
              <Th>Band</Th>
              <Th>Weak areas</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-ink-3">
                  No employees match these filters.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-line last:border-b-0 transition-colors hover:bg-page"
                >
                  <Td>
                    <p className="font-semibold text-ink">{r.name}</p>
                    <p className="text-xs text-ink-3">{r.email}</p>
                  </Td>
                  <Td className="text-ink-2">{r.department || "—"}</Td>
                  <Td className="text-right font-mono tabular-nums text-ink">{r.score}</Td>
                  <Td>
                    <BandPill band={r.band} />
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {r.weakAreas.length === 0 ? (
                        <span className="text-xs text-ink-3">—</span>
                      ) : (
                        r.weakAreas.slice(0, 3).map((w) => (
                          <span key={w} className="rounded-full bg-page px-2.5 py-0.5 text-xs text-ink-2">
                            {w.replaceAll("_", " ")}
                          </span>
                        ))
                      )}
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3 ${className}`}>
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-4 ${className}`}>{children}</td>;
}
