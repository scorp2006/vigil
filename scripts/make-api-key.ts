import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashApiKey, randomId } from "../src/lib/crypto";

const db = new PrismaClient();
async function main() {
  const org = await db.org.findFirst({ where: { slug: "acme-bank-demo" } });
  if (!org) throw new Error("run seed first");
  const key = "vgl_" + randomId(18);
  await db.apiKey.create({
    data: { orgId: org.id, name: "smoke-test", keyHash: hashApiKey(key) },
  });
  console.log("Key:", key);
  const emp = await db.employee.findFirst({ where: { orgId: org.id } });
  console.log("Sample employee id:", emp?.id);
}
main().finally(() => db.$disconnect());
