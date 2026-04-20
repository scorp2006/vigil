// Strips `// @ts-nocheck` from Prisma-generated files so downstream code
// gets proper types. Prisma emits @ts-nocheck on its own generated files
// to keep their own validation quiet; we don't want it to infect our code.
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "src", "generated", "prisma");

function walk(dir) {
  let count = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) {
      count += walk(p);
      continue;
    }
    if (!p.endsWith(".ts")) continue;
    const src = readFileSync(p, "utf8");
    if (!src.includes("@ts-nocheck")) continue;
    const next = src.replace(/\/\/\s*@ts-nocheck.*$/gm, "");
    writeFileSync(p, next);
    count += 1;
  }
  return count;
}

try {
  const n = walk(ROOT);
  console.log(`[strip-ts-nocheck] cleaned ${n} files`);
} catch (e) {
  // Not fatal — skip if Prisma hasn't generated yet.
  console.log(`[strip-ts-nocheck] skipped (${e.message})`);
}
