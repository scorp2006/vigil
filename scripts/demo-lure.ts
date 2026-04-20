import "dotenv/config";
import { db } from "../src/lib/db";
import { randomId } from "../src/lib/crypto";
async function main() {
  const org = await db.org.findFirst({ where: { slug: "acme-bank-demo" } });
  if (!org) throw new Error("run seed first");

  const template = await db.template.findFirst({ where: { orgId: org.id, category: "invoice_fraud" } });
  const employee = await db.employee.findFirst({ where: { orgId: org.id } });
  if (!template || !employee) throw new Error("missing seed data");

  const campaign = await db.campaign.create({
    data: {
      orgId: org.id,
      name: "Demo lure",
      channel: "email",
      templateId: template.id,
      targetJson: JSON.stringify([employee.id]),
      status: "running",
      launchedAt: new Date(),
    },
  });

  const id = randomId(10);
  await db.trackToken.create({
    data: { id, orgId: org.id, campaignId: campaign.id, employeeId: employee.id },
  });
  console.log("Lure URL:   http://localhost:3000/lure/" + id);
  console.log("Gotcha URL: http://localhost:3000/gotcha/" + id + "?mode=submit");
}
main().finally(() => db.$disconnect());
