"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes needs the client to mount before resolvedTheme is correct;
  // until then, render a neutral icon to avoid a SSR/CSR flash.
  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : false;
  const next = isDark ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={mounted ? `Switch to ${next} theme` : "Toggle theme"}
      title={mounted ? `Switch to ${next} theme` : "Toggle theme"}
      className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-page text-ink"
    >
      {isDark ? (
        <SunIcon className="h-4 w-4" strokeWidth={1.8} />
      ) : (
        <MoonIcon className="h-4 w-4" strokeWidth={1.8} />
      )}
    </button>
  );
}
