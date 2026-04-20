import { db } from "@/lib/db";

let bootstrapped = false;
let bootstrapping: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (bootstrapped) return;
  if (bootstrapping) return bootstrapping;

  bootstrapping = (async () => {
    try {
      const existing = await db.org.findFirst({ where: { slug: "acme-bank-demo" } });
      if (existing) {
        bootstrapped = true;
        return;
      }

      const seedMod = await import("../../prisma/seed-fn");
      await seedMod.runSeed(db);
      bootstrapped = true;
      console.log("[vigil] demo tenant seeded on first boot.");
    } catch (err) {
      console.error("[vigil] seed-on-boot failed:", err);
    } finally {
      bootstrapping = null;
    }
  })();

  return bootstrapping;
}
