"use client";

import { useMemo, useState } from "react";
import { BandPill } from "@/components/vigil-ui";
import { SearchIcon } from "lucide-react";

export type EmployeeRow = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  consent: boolean;
  score: number;
  band: string;
};

export function EmployeesTable({ employees }: { employees: EmployeeRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => {
      const dept = (e.department || "").toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        dept.includes(q) ||
        e.band.toLowerCase().includes(q)
      );
    });
  }, [query, employees]);

  return (
    <>
      {/* Search row */}
      <div className="panel flex items-center gap-3 px-5 py-3">
        <SearchIcon className="h-4 w-4 text-ink-3" strokeWidth={1.8} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name, email, department, or risk band…"
          className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-3"
        />
        <span className="rounded-full bg-page px-2.5 py-1 text-xs font-medium text-ink-3 tabular-nums">
          {filtered.length} / {employees.length}
        </span>
      </div>

      {/* Table */}
      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <Th>Name</Th>
              <Th>Department</Th>
              <Th>Risk</Th>
              <Th className="text-right">Consent</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm text-ink-3">
                  No employees match &ldquo;{query}&rdquo;.
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-line last:border-b-0 transition-colors hover:bg-page"
                >
                  <Td>
                    <div className="font-semibold text-ink">{e.name}</div>
                    <div className="text-xs text-ink-3">{e.email}</div>
                  </Td>
                  <Td className="text-ink-2">{e.department || "—"}</Td>
                  <Td>
                    <BandPill band={e.band} score={Math.round(e.score)} />
                  </Td>
                  <Td className="text-right">
                    <ConsentDot given={e.consent} />
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
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

function ConsentDot({ given }: { given: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-ink-3"
      title={given ? "Consent given" : "Consent pending"}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: given ? "var(--green)" : "var(--line-2)" }}
        aria-hidden="true"
      />
      {given ? "Given" : "Pending"}
    </span>
  );
}
