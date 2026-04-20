export type CampaignSpec = {
  name: string;
  category: string;
  locale: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  bodyHtml: string;
  landingHeadline: string;
  landingSubhead: string;
  ctaLabel: string;
  voicePersona: string;
  voiceScript: string;
  redFlags: string[];
  training: {
    title: string;
    summary: string;
    lesson: string;
    quiz: Array<{ q: string; options: string[]; correctIndex: number; explain: string }>;
  };
};

const ETHICAL_GUARD = `Block and refuse if the request is one of:
- Fake layoff, termination, or disciplinary threat scenarios.
- Fake bonus, lottery, or personal-windfall scenarios.
- Fake news of a colleague's death, injury, or family emergency.
- Anything impersonating a named real public figure, named executive, or a specific real brand identity without clear authorization.
If blocked, return { "blocked": true, "reason": "<short reason>" }.`;

const SYSTEM = `You are the Vigil Campaign Composer. You help security teams build ETHICAL phishing & vishing simulations.
${ETHICAL_GUARD}
Otherwise, return a strict JSON object matching the schema. No markdown, no prose around it.
The scenarios must feel realistic but contain at least 2 subtle red flags a vigilant employee could spot.
Locale: follow the requested locale for all user-visible text. Voice script must be in sentences ready for TTS.`;

const SCHEMA_HINT = `{
  "name": "Short campaign name (<= 50 chars)",
  "category": "one of: invoice_fraud | credential_reset | it_support | courier | vendor_onboarding | hr_form | ceo_fraud | kyc",
  "locale": "en | hi",
  "subject": "Email subject",
  "fromName": "Plausible sender display name (no real brand)",
  "fromEmail": "Plausible sender email on a lookalike domain (e.g. acccounts@acme-pay.io)",
  "bodyHtml": "Email body as simple HTML (p, br, a, strong, ul). Include a call-to-action link with href {{TRACK_URL}} placeholder.",
  "landingHeadline": "Headline on the fake landing page",
  "landingSubhead": "Subheadline on the fake landing page",
  "ctaLabel": "Button label (e.g., 'Verify now')",
  "voicePersona": "Short persona description for the caller",
  "voiceScript": "5-8 sentences the AI voice will say. Use natural pauses. Include a prompt asking target to press 1 or share info.",
  "redFlags": ["array of 2-4 short strings describing the giveaways"],
  "training": {
    "title": "60-90 second micro-training title",
    "summary": "1-sentence summary",
    "lesson": "3-5 short paragraphs teaching how to spot THIS class of attack",
    "quiz": [
      { "q": "question", "options": ["a","b","c","d"], "correctIndex": 0, "explain": "why" },
      { "q": "question", "options": ["a","b","c","d"], "correctIndex": 1, "explain": "why" },
      { "q": "question", "options": ["a","b","c","d"], "correctIndex": 2, "explain": "why" }
    ]
  }
}`;

export async function composeCampaign(opts: {
  prompt: string;
  locale?: string;
  channel?: "email" | "voice" | "multi";
}): Promise<CampaignSpec | { blocked: true; reason: string }> {
  const provider = process.env.LLM_PROVIDER;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || "llama-3.3-70b-versatile";
  const baseUrl = process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1";
  const locale = opts.locale || "en";

  const userMessage = `Compose a ${opts.channel || "multi"}-vector simulation. Locale: ${locale}.
Target scenario: ${opts.prompt}

Respond with JSON matching this schema:
${SCHEMA_HINT}`;

  if (!provider || !apiKey) {
    return mockCompose(opts.prompt, locale, opts.channel || "multi");
  }

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!res.ok) {
      console.error("LLM error", res.status, await res.text());
      return mockCompose(opts.prompt, locale, opts.channel || "multi");
    }
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    if (typeof raw !== "string") return mockCompose(opts.prompt, locale, opts.channel || "multi");
    const parsed = JSON.parse(raw);
    if (parsed.blocked) return { blocked: true, reason: String(parsed.reason || "policy") };
    return normalize(parsed, locale);
  } catch (err) {
    console.error("LLM call failed, falling back to mock", err);
    return mockCompose(opts.prompt, locale, opts.channel || "multi");
  }
}

function normalize(p: Partial<CampaignSpec>, locale: string): CampaignSpec {
  return {
    name: p.name || "Generated campaign",
    category: p.category || "credential_reset",
    locale: p.locale || locale,
    subject: p.subject || "Action required",
    fromName: p.fromName || "IT Helpdesk",
    fromEmail: p.fromEmail || "it-helpdesk@acme-support.net",
    bodyHtml: p.bodyHtml || "<p>Please verify your account.</p>",
    landingHeadline: p.landingHeadline || "Verify your account",
    landingSubhead: p.landingSubhead || "Sign in to continue.",
    ctaLabel: p.ctaLabel || "Verify now",
    voicePersona: p.voicePersona || "IT support agent",
    voiceScript: p.voiceScript || "Hello, this is IT support. We detected unusual activity on your account...",
    redFlags: p.redFlags || ["Lookalike sender domain", "Urgency pressure", "Generic greeting"],
    training: p.training || {
      title: "Spotting urgency-based phishing",
      summary: "Urgency is the attacker's best tool.",
      lesson: "Attackers manufacture pressure so you don't stop to think. Pause. Verify through a second channel.",
      quiz: [
        { q: "What should you do first?", options: ["Click quickly", "Pause and verify", "Forward to a friend", "Delete silently"], correctIndex: 1, explain: "Pausing breaks the urgency spell." },
      ],
    },
  };
}

function mockCompose(prompt: string, locale: string, channel: string): CampaignSpec {
  const lower = prompt.toLowerCase();
  const isInvoice = /invoice|vendor|payment|wire|bank|kyocera/.test(lower);
  const isIT = /mfa|password|it|login|reset|support/.test(lower);
  const isCourier = /courier|delivery|package|parcel|fedex|dhl|blue dart/.test(lower);

  if (isInvoice) {
    return {
      name: "Vendor invoice urgency",
      category: "invoice_fraud",
      locale,
      subject: "URGENT: Invoice #KY-2026-0918 past due — bank details updated",
      fromName: "Kyocera Accounts",
      fromEmail: "accounts@kyocera-payments.co",
      bodyHtml: `<p>Dear Finance team,</p>
<p>Please find attached invoice <strong>#KY-2026-0918</strong> which is now <strong>7 days past due</strong>.</p>
<p>Our bank details changed this quarter. To avoid service disruption, kindly process payment to the <strong>updated account</strong> shown in the portal.</p>
<p><a href="{{TRACK_URL}}">Open secure payment portal →</a></p>
<p>Regards,<br/>Priya Nair<br/>Accounts, Kyocera Document Solutions</p>`,
      landingHeadline: "Kyocera Vendor Portal",
      landingSubhead: "Sign in with your company email to view the updated bank details.",
      ctaLabel: "Sign in & pay",
      voicePersona: "Accounts Receivable executive, slightly hurried tone",
      voiceScript:
        "Hello, this is Priya from Kyocera Accounts. I'm calling about invoice KY-2026-0918 which is seven days overdue. We updated our bank account last quarter — I can share the new details over this call if you confirm your vendor code. Please press 1 to proceed.",
      redFlags: [
        "Lookalike domain kyocera-payments.co instead of kyocera.co.in",
        "Urgency about service disruption",
        "Request to change bank details via email",
      ],
      training: {
        title: "Vendor invoice fraud in 90 seconds",
        summary: "Attackers pose as vendors and quietly change bank details.",
        lesson:
          "Vendor invoice fraud targets Finance. The attacker either impersonates an existing vendor or creates a lookalike. They typically ask for a bank-detail change combined with urgency (late payment, service cutoff).\n\nAlways verify bank-detail changes by calling the vendor on a number you already have on file — never the number in the email or the call. Ask your AP team to require dual approval for any account change.\n\nWatch for: lookalike domains (.co instead of .in, .pay instead of the real TLD), slightly altered logos, and 'past due' pressure language.",
        quiz: [
          {
            q: "A vendor emails a new bank account. What's the safest first step?",
            options: [
              "Wire payment before the deadline",
              "Call the vendor on a number you already have on file",
              "Reply to the email to confirm",
              "Ask the email's 'reply-to' address for verification",
            ],
            correctIndex: 1,
            explain: "Replying to the email keeps you inside the attacker's channel. Call the known number.",
          },
          {
            q: "Which of these is a red flag?",
            options: [
              "Invoice attached as PDF",
              "Vendor logo in the signature",
              "Lookalike domain like kyocera-payments.co",
              "Mention of a purchase order number",
            ],
            correctIndex: 2,
            explain: "Domains that mimic the real vendor are a hallmark of invoice fraud.",
          },
          {
            q: "Finance receives urgent payment demands daily. Best policy?",
            options: [
              "Pay fastest first",
              "Require dual approval for any bank-detail change",
              "Trust long-standing vendors fully",
              "Escalate every invoice to the CFO",
            ],
            correctIndex: 1,
            explain: "Dual approval on account changes is the single most effective control.",
          },
        ],
      },
    };
  }

  if (isIT) {
    return {
      name: "IT support MFA reset",
      category: "it_support",
      locale,
      subject: "Action required: MFA re-enrollment this week",
      fromName: "IT Helpdesk",
      fromEmail: "helpdesk@acme-it-support.net",
      bodyHtml: `<p>Hi team,</p>
<p>We are rolling out a new MFA policy this week. To avoid lockout on Monday, please re-enroll using the secure link below before 6 PM today.</p>
<p><a href="{{TRACK_URL}}">Re-enroll MFA (2 minutes)</a></p>
<p>If you have questions, reply to this email.</p>
<p>Regards,<br/>Acme IT Helpdesk</p>`,
      landingHeadline: "MFA Re-enrollment",
      landingSubhead: "Sign in with your corporate credentials to verify your device.",
      ctaLabel: "Sign in to continue",
      voicePersona: "IT helpdesk agent, friendly and confident",
      voiceScript:
        "Hi, this is Arjun from IT Helpdesk. We've detected your MFA token hasn't been rotated in the last 90 days. To avoid Monday lockout I need you to open the re-enrollment link we emailed and read back the six-digit code. Press 1 when you're ready, or stay on the line and I'll walk you through it.",
      redFlags: [
        "Domain acme-it-support.net (not the real corporate IT domain)",
        "Deadline pressure (lockout on Monday)",
        "Asking users to read back an MFA code",
      ],
      training: {
        title: "MFA code phishing in 90 seconds",
        summary: "Your MFA code is a password. Never read it out.",
        lesson:
          "Attackers know that one-time MFA codes are the last barrier. They create urgency ('you'll be locked out Monday') and ask you to either click a link to 'verify' or read the code back on a call.\n\nReal IT will never ask you to read your MFA code. If you're unsure, hang up, open your company's help portal yourself, and call IT back through the official number.",
        quiz: [
          {
            q: "IT calls asking you to read your MFA code. What do you do?",
            options: [
              "Read it slowly so they get it right",
              "Refuse and call IT back on the number you know",
              "Ask them to prove they're IT",
              "Share only the last 3 digits",
            ],
            correctIndex: 1,
            explain: "No real IT team needs your MFA code. Hang up and call the known number.",
          },
          {
            q: "An email claims you'll be locked out Monday unless you click now. First action?",
            options: [
              "Click to avoid lockout",
              "Forward to your manager to decide",
              "Check sender domain carefully and verify via the IT portal",
              "Reply asking to extend the deadline",
            ],
            correctIndex: 2,
            explain: "Urgency is a red flag. Verify via a channel you trust, not the one in the message.",
          },
        ],
      },
    };
  }

  // generic courier / default
  return {
    name: isCourier ? "Courier delivery redirect" : "Generic urgency pretext",
    category: isCourier ? "courier" : "credential_reset",
    locale,
    subject: isCourier ? "Your package couldn't be delivered — action needed" : "Security check required on your account",
    fromName: isCourier ? "Blue Dart Notifications" : "Account Security",
    fromEmail: isCourier ? "alerts@bluedart-deliveries.co" : "security@acme-portal.io",
    bodyHtml: isCourier
      ? `<p>Hello,</p><p>We attempted delivery of package <strong>BD-88012</strong> today. The consignee was unavailable. To reschedule, please confirm your delivery address via the link below.</p><p><a href="{{TRACK_URL}}">Reschedule delivery →</a></p>`
      : `<p>Hi,</p><p>We detected a sign-in from an unrecognized device in a new location. If this wasn't you, please <a href="{{TRACK_URL}}">review the activity</a> and re-authenticate.</p>`,
    landingHeadline: isCourier ? "Reschedule your delivery" : "Verify your identity",
    landingSubhead: isCourier ? "Confirm your address and preferred slot." : "Sign in to continue.",
    ctaLabel: isCourier ? "Confirm delivery" : "Verify now",
    voicePersona: isCourier ? "Courier dispatch agent" : "Fraud prevention officer",
    voiceScript: isCourier
      ? "Hello, this is Blue Dart dispatch. We have a package for you but the address on file didn't match. To avoid return, please confirm your full address and date of birth. Press 1 to continue."
      : "Hello, this is the fraud prevention team. We flagged an unusual login on your account. For your safety I'll walk you through verification. Please confirm the one-time code I just sent to your phone. Press 1 to proceed.",
    redFlags: ["Lookalike domain", "Urgency framing", "Asking for personal or MFA data on call"],
    training: {
      title: "Spot urgency pretexts",
      summary: "Urgency is the common thread in social engineering.",
      lesson:
        "Most phishing — email, SMS, voice — relies on urgency. Your attacker wants you acting, not thinking. The counter-move is always the same: pause, and verify through a channel you already trust.",
      quiz: [
        {
          q: "An unsolicited caller pressures you for a one-time code. What's your response?",
          options: ["Provide it to end the call", "Hang up and call back on the known number", "Offer the last 2 digits only", "Ask them to email you"],
          correctIndex: 1,
          explain: "Never share MFA codes with anyone who called you.",
        },
      ],
    },
  };
}
