import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { runSeed } from "./seed-fn";

const db = new PrismaClient();

runSeed(db)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
