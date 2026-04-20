import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const SECRET = process.env.AUTH_SECRET || "dev-secret-change-in-prod";

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function signToken(data: Record<string, unknown>, ttlSeconds = 60 * 60 * 24 * 30): string {
  const body = { ...data, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const payload = Buffer.from(JSON.stringify(body)).toString("base64url");
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifyToken<T = Record<string, unknown>>(token: string | undefined | null): T | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (expected.length !== sig.length) return null;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  try {
    const body = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof body.exp === "number" && body.exp < Math.floor(Date.now() / 1000)) return null;
    return body as T;
  } catch {
    return null;
  }
}

export function randomId(bytes = 16): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashApiKey(key: string): string {
  return createHmac("sha256", SECRET).update(key).digest("hex");
}
