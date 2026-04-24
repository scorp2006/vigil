"use client";

import { useMemo, useState } from "react";
import { BandPill } from "@/components/vigil-ui";
import { SearchIcon, ArrowDownUpIcon } from "lucide-react";

export type RiskEmployeeRow = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  score: number;
  band: string;
  weakAreas: string[];
};

type BandFilter = "all" | "critical" | "high" | "medium" | "low";
type SortMode = "score-desc" | "score-asc" | "name-asc";

const BAND_CHIPS: Array<{ value: BandFilter; label: string; activeCls: string; idleCls: string }> = [
  { value: "all", label: "All", activeCls: "bg-green text-white", idleCls: "bg-page text-ink-2" },
  { value: "critical", label: "Critical", activeCls: "bg-rose text-white", idleCls: "bg-rose-soft text-rose" },
  { value: "high", label: "High", activeCls: "bg-amber text-white", idleCls: "bg-amber-soft text-amber" },
  { value: "medium", label: "Medium", activeCls: "bg-green text-white", idleCls: "bg-green-soft text-green" },
  { value: "low", label: "Low", activeCls: "bg-green text-white", idleCls: "bg-green-pill text-green" },
];

export function RiskEmployeesTable({ employees }: { employees: RiskEmployeeRow[] }) {
  const [query, setQuery] = useState("");
  const [band, setBand] = useState<BandFilter>("all");
  const [dept, setDept] = useState<string>("all");
  const [sort, setSort] = useState<SortMode>("score-desc");

  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const e of employees) {
      set.add(e.department || "Unassigned");
    }
    return Array.from(set).sort();
  }, [employees]);

  const counts = useMemo(() => {
    const c: Record<BandFilter, number> = { all: employees.length, critical: 0, high: 0, medium: 0, low: 0 };
    for (const e of employees) {
      const b = (e.band as BandFilter) ?? "low";
      if (b in c) c[b] += 1;
    }
    return c;
  }, [employees]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = employees.filter((e) => {
      if (band !== "all" && e.band !== band) return false;
      if (dept !== "all" && (e.department || "Unassigned") !== dept) return false;
      if (q) {
        const hay = `${e.name} ${e.email} ${e.department || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    rows = rows.slice().sort((a, b) => {
      if (sort === "score-desc") return b.score - a.score;
      if (sort === "score-asc") return a.score - b.score;
      return a.name.localeCompare(b.name);
    });

    return rows;
  }, [employees, query, band, dept, sort]);

  return (
    <div className="panel overflow-hidden">
      {/* Header + filter bar */}
      <div className="flex flex-col gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[17px] font-bold text-ink">All employees</p>
          <span className="text-xs text-ink-3 tabular-nums">
            {filtered.length} of {employees.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="flex flex-1 min-w-[220px] items-center gap-2 rounded-[12px] bg-page px-3 py-2 text-ink-3">
            <SearchIcon className="h-4 w-4" strokeWidth={1.8} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by name, email, department…"
              className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-3"
            />
          </div>

          {/* Department dropdown */}
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="rounded-[12px] border border-line bg-card px-3 py-2 text-sm font-medium text-ink outline-none focus:border-green"
            aria-label="Department"
          >
            <option value="all">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Sort */}
          <button
            type="button"
            onClick={() =>
              setSort((s) => (s === "score-desc" ? "score-asc" : s === "score-asc" ? "name-asc" : "score-desc"))
            }
            className="inline-flex items-center gap-1.5 rounded-[12px] border border-line bg-card px-3 py-2 text-sm font-medium text-ink hover:bg-page"
            title="Cycle sort"
          >
            <ArrowDownUpIcon className="h-3.5 w-3.5" />
            {sort === "score-desc" ? "Highest risk" : sort === "score-asc" ? "Lowest risk" : "Name A–Z"}
          </button>
        </div>

        {/* Band chips with counts */}
        <div className="flex flex-wrap gap-1.5">
          {BAND_CHIPS.map((chip) => {
            const isActive = band === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => setBand(chip.value)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  isActive ? chip.activeCls : chip.idleCls
                } hover:opacity-90`}
              >
                {chip.label}
                <span className={`tabular-nums ${isActive ? "text-white/80" : "opacity-60"}`}>
                  {counts[chip.value]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <Th>Employee</Th>
              <Th>Department</Th>
              <Th>Score</Th>
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
              filtered.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-line last:border-b-0 transition-colors hover:bg-page"
                >
                  <Td>
                    <p className="font-semibold text-ink">{e.name}</p>
                    <p className="text-xs text-ink-3">{e.email}</p>
                  </Td>
                  <Td className="text-ink-2">{e.department || "—"}</Td>
                  <Td className="font-mono tabular-nums text-ink">{e.score}</Td>
                  <Td>
                    <BandPill band={e.band} />
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {e.weakAreas.length === 0 ? (
                        <span className="text-xs text-ink-3">—</span>
                      ) : (
                        e.weakAreas.slice(0, 3).map((w) => (
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

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-4 ${className}`}>{children}</td>;
}
