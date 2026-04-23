import bcrypt from "bcryptjs";
import type { PrismaClient } from "../src/generated/prisma/client";

const FIRST_NAMES = [
  "Priya", "Rohan", "Ananya", "Arjun", "Sneha", "Rahul", "Kavya", "Vikram",
  "Neha", "Aditya", "Meera", "Siddharth", "Riya", "Karan", "Diya", "Aarav",
  "Ishita", "Dhruv", "Tanvi", "Aryan", "Sanya", "Vihaan", "Pooja", "Kunal",
  "Shruti", "Manav", "Aisha", "Rohit", "Kiara", "Nikhil", "Zara", "Yash",
];
const LAST_NAMES = [
  "Shah", "Mehta", "Rao", "Iyer", "Patel", "Kapoor", "Singh", "Kumar",
  "Nair", "Joshi", "Reddy", "Bose", "Das", "Menon", "Pillai", "Gupta",
  "Khan", "Sharma", "Verma", "Agarwal",
];
const DEPARTMENTS = ["Finance", "Engineering", "HR", "Sales", "Marketing", "Operations", "IT", "Legal"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function rand(n: number) {
  return Math.floor(Math.random() * n);
}
function phoneIN() {
  return "+91 9" + String(rand(900000000) + 100000000).padStart(9, "0");
}

function buildTraining(category: string, _name: string) {
  const base = {
    quiz: [
      { q: "What's a universal sign of social engineering?", options: ["Polite greeting", "Urgency pressure", "Professional logo", "Correct spelling"], correctIndex: 1, explain: "Urgency is the attacker's go-to tool." },
      { q: "A caller asks for your MFA code. Best response?", options: ["Give it to them", "Hang up and call IT on the known number", "Give only last 3 digits", "Put them on hold"], correctIndex: 1, explain: "Real IT never asks for MFA codes." },
      { q: "An email's domain is slightly off. You should:", options: ["Trust it anyway", "Click once just to check", "Stop and verify via a channel you trust", "Forward to a friend"], correctIndex: 2, explain: "Lookalike domains are a classic red flag." },
    ],
    redFlags: ["Lookalike sender domain", "Urgency framing", "Requests that bypass normal process"],
  };
  if (category === "invoice_fraud")
    return { title: "Vendor invoice fraud in 90 seconds", summary: "Attackers pose as vendors and change bank details.", lesson: "Always verify bank-detail changes by calling the vendor on a known number. Never reply to the email with confirmation. Require dual approval for any account change.", ...base };
  if (category === "it_support")
    return { title: "Never read your MFA code", summary: "Your MFA code is a password in disguise.", lesson: "Real IT will never ask you to share your MFA code. If you're unsure, hang up and call IT back through the official portal.", ...base };
  return { title: "Spot urgency pretexts", summary: "Urgency is the attacker's favorite lever.", lesson: "Attackers manufacture pressure so you act before you think. Slow down. Verify through a channel you trust, not the one in the message.", ...base };
}

export async function runSeed(db: PrismaClient) {
  const existing = await db.org.findUnique({ where: { slug: "acme-bank-demo" } });
  if (existing) {
    console.log("[seed] Demo org already exists. Deleting and recreating for a clean demo…");
    await db.org.delete({ where: { id: existing.id } });
  }

  const passwordHash = await bcrypt.hash("demo1234", 10);
  const org = await db.org.create({
    data: {
      name: "Acme Bank Ltd",
      slug: "acme-bank-demo",
      region: "IN",
      users: {
        create: {
          email: "admin@acme.demo",
          name: "Priya Shah",
          password: passwordHash,
          role: "admin",
        },
      },
    },
  });
  console.log(`[seed] Org created: ${org.name}`);

  const groupByName = new Map<string, string>();
  for (const d of DEPARTMENTS) {
    const g = await db.group.create({ data: { orgId: org.id, name: d } });
    groupByName.set(d, g.id);
  }

  const employees: { id: string }[] = [];
  const SEED_COUNT = 80;
  for (let i = 0; i < SEED_COUNT; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const dept = pick(DEPARTMENTS);
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${i}@acme.demo`;
    const e = await db.employee.create({
      data: {
        orgId: org.id,
        email,
        name: `${first} ${last}`,
        phone: phoneIN(),
        department: dept,
        groupId: groupByName.get(dept)!,
        consent: true,
        consentAt: new Date(Date.now() - rand(80) * 86400_000),
        locale: Math.random() < 0.8 ? "en" : "hi",
      },
    });
    employees.push({ id: e.id });
  }
  console.log(`[seed] ${employees.length} employees`);

  const TEMPLATES = [
    {
      name: "Vendor invoice urgency",
      category: "invoice_fraud",
      channel: "multi",
      subject: "URGENT: Invoice #KY-2026-0918 past due",
      fromName: "Kyocera Accounts",
      fromEmail: "accounts@kyocera-payments.co",
      bodyHtml: `<p>Dear Finance,</p><p>Invoice <strong>#KY-2026-0918</strong> is 7 days overdue. Bank details changed — see <a href="{{TRACK_URL}}">updated portal</a>.</p><p>Regards,<br/>Priya Nair</p>`,
      landing: { headline: "Kyocera Vendor Portal", subhead: "Sign in to view updated bank details.", ctaLabel: "Sign in" },
      voiceScript:
        "Hello, this is Priya from Kyocera Accounts. Invoice KY-2026-0918 is seven days overdue. We updated our bank account last quarter. Please press 1 to confirm your vendor code.",
      voicePersona: "Accounts Receivable executive",
    },
    {
      name: "IT support MFA reset",
      category: "it_support",
      channel: "multi",
      subject: "Action required: MFA re-enrollment by Monday",
      fromName: "IT Helpdesk",
      fromEmail: "helpdesk@acme-it-support.net",
      bodyHtml: `<p>Hi team,</p><p>New MFA policy rolls out Monday. <a href="{{TRACK_URL}}">Re-enroll now</a> to avoid lockout.</p><p>— IT</p>`,
      landing: { headline: "MFA Re-enrollment", subhead: "Sign in with your corporate credentials.", ctaLabel: "Sign in" },
      voiceScript:
        "Hi, this is Arjun from IT Helpdesk. Your MFA token needs rotation to avoid Monday lockout. I'll walk you through re-enrollment. Press 1 when you're ready.",
      voicePersona: "IT helpdesk agent",
    },
    {
      name: "Blue Dart delivery reschedule",
      category: "courier",
      channel: "email",
      subject: "Your package BD-88012 — delivery attempt failed",
      fromName: "Blue Dart Notifications",
      fromEmail: "alerts@bluedart-deliveries.co",
      bodyHtml: `<p>Your package <strong>BD-88012</strong> could not be delivered. <a href="{{TRACK_URL}}">Reschedule here</a>.</p>`,
      landing: { headline: "Reschedule delivery", subhead: "Confirm address and slot.", ctaLabel: "Confirm" },
      voiceScript: "",
      voicePersona: "",
    },
  ];

  const storedTemplates: Array<Awaited<ReturnType<typeof db.template.create>>> = [];
  for (const t of TEMPLATES) {
    const training = buildTraining(t.category, t.name);
    const tpl = await db.template.create({
      data: {
        orgId: org.id,
        name: t.name,
        channel: t.channel,
        category: t.category,
        locale: "en",
        subject: t.subject,
        fromName: t.fromName,
        fromEmail: t.fromEmail,
        bodyHtml: t.bodyHtml,
        landingHtml: JSON.stringify(t.landing),
        voiceScript: t.voiceScript,
        voicePersona: t.voicePersona,
        trainingModuleJson: JSON.stringify(training),
        generatedBy: "seed",
      },
    });
    storedTemplates.push(tpl);
  }
  console.log(`[seed] ${storedTemplates.length} templates`);

  const now = Date.now();

  async function runWaveEvents(
    campaign: { id: string },
    tpl: { category: string },
    targets: { id: string }[],
    launchedAt: Date,
  ) {
    for (const emp of targets) {
      const baseAt = new Date(launchedAt.getTime() + rand(60) * 60_000);
      await db.event.create({
        data: {
          orgId: org.id, campaignId: campaign.id, employeeId: emp.id,
          type: "sent", channel: "email", createdAt: baseAt,
          meta: JSON.stringify({ category: tpl.category }),
        },
      });
      const openRoll = Math.random();
      if (openRoll < 0.72) {
        await db.event.create({
          data: {
            orgId: org.id, campaignId: campaign.id, employeeId: emp.id,
            type: "opened", channel: "email",
            createdAt: new Date(baseAt.getTime() + (1 + rand(180)) * 60_000),
            meta: JSON.stringify({ category: tpl.category }),
          },
        });
        const clickRoll = Math.random();
        if (clickRoll < 0.35) {
          const clickedAt = new Date(baseAt.getTime() + (3 + rand(600)) * 60_000);
          await db.event.create({
            data: {
              orgId: org.id, campaignId: campaign.id, employeeId: emp.id,
              type: "clicked", channel: "email", createdAt: clickedAt,
              meta: JSON.stringify({ category: tpl.category }),
            },
          });
          if (Math.random() < 0.4) {
            await db.event.create({
              data: {
                orgId: org.id, campaignId: campaign.id, employeeId: emp.id,
                type: "submitted", channel: "email",
                createdAt: new Date(clickedAt.getTime() + (1 + rand(5)) * 60_000),
                meta: JSON.stringify({ category: tpl.category }),
              },
            });
          } else if (Math.random() < 0.5) {
            await db.event.create({
              data: {
                orgId: org.id, campaignId: campaign.id, employeeId: emp.id,
                type: "training_completed", channel: "training",
                createdAt: new Date(clickedAt.getTime() + (30 + rand(60)) * 60_000),
                meta: JSON.stringify({ category: tpl.category, score: 2 + rand(2), total: 3 }),
              },
            });
          }
        } else if (clickRoll < 0.6) {
          const delayMin = rand(12);
          await db.event.create({
            data: {
              orgId: org.id, campaignId: campaign.id, employeeId: emp.id,
              type: "reported", channel: "email",
              createdAt: new Date(baseAt.getTime() + (2 + delayMin) * 60_000),
              meta: JSON.stringify({ category: tpl.category, fastSeconds: delayMin * 60 }),
            },
          });
        }
      }
    }
  }

  // Past waves — 60 to 8 days ago, all completed.
  for (let c = 0; c < 4; c++) {
    const tpl = pick(storedTemplates);
    const launchedAt = new Date(now - (8 + c * 14 + rand(6)) * 86400_000);
    const targets = employees.slice().sort(() => Math.random() - 0.5).slice(0, 20 + rand(30));
    const campaign = await db.campaign.create({
      data: {
        orgId: org.id, name: `${tpl.name} · wave ${c + 1}`,
        channel: tpl.channel, status: "completed", templateId: tpl.id,
        targetJson: JSON.stringify(targets.map((e) => e.id)),
        launchedAt, completedAt: new Date(launchedAt.getTime() + 2 * 86400_000),
      },
    });
    await runWaveEvents(campaign, tpl, targets, launchedAt);
  }

  // Running wave — launched 4 days ago so the 7-day bar chart lights up.
  {
    const tpl = storedTemplates[0];
    const launchedAt = new Date(now - 4 * 86400_000);
    const targets = employees.slice().sort(() => Math.random() - 0.5).slice(0, 45);
    const running = await db.campaign.create({
      data: {
        orgId: org.id, name: `${tpl.name} · wave 5`,
        channel: tpl.channel, status: "running", templateId: tpl.id,
        targetJson: JSON.stringify(targets.map((e) => e.id)),
        launchedAt,
      },
    });
    await runWaveEvents(running, tpl, targets, launchedAt);
  }

  // Scheduled wave — tomorrow, no events yet. Populates dashboard Upcoming card.
  {
    const tpl = storedTemplates[1];
    const scheduledAt = new Date(now + 1 * 86400_000);
    scheduledAt.setHours(10, 0, 0, 0);
    const targets = employees.slice().sort(() => Math.random() - 0.5).slice(0, 120 > employees.length ? employees.length : 120);
    await db.campaign.create({
      data: {
        orgId: org.id, name: "Q3 Vendor invoice lure",
        channel: tpl.channel, status: "scheduled", templateId: tpl.id,
        targetJson: JSON.stringify(targets.map((e) => e.id)),
        scheduledAt,
      },
    });
  }

  // Sprinkle a handful of "report" events across today + the last few days so
  // Reports Today is non-zero and recent activity feels alive. These are
  // late-reports on older campaigns (common in real life).
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const allCampaigns = await db.campaign.findMany({ where: { orgId: org.id }, select: { id: true, templateId: true } });
  for (let i = 0; i < 12; i++) {
    const emp = pick(employees);
    const camp = pick(allCampaigns);
    const daysBack = rand(6);
    const createdAt = new Date(startOfToday.getTime() - daysBack * 86400_000 + rand(20) * 3600_000);
    await db.event.create({
      data: {
        orgId: org.id, campaignId: camp.id, employeeId: emp.id,
        type: "reported", channel: "email", createdAt,
        meta: JSON.stringify({ fastSeconds: 60 + rand(600), lateReport: true }),
      },
    });
  }

  const { recomputeEmployeeRisk } = await import("../src/lib/risk");
  for (const e of employees) {
    await recomputeEmployeeRisk(e.id);
  }
  console.log("[seed] ✓ complete. Login: admin@acme.demo / demo1234");
}
