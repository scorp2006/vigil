// Runtime-agnostic token + hashing utilities.
//
// Next.js middleware (src/proxy.ts) runs in the Edge runtime, which has
// no node:crypto and no Buffer. So signToken / verifyToken use the Web
// Crypto API — available in both Edge and Node. The Node-only helpers
// (randomId, hashApiKey for API-key storage) stay separate and must
// only be imported from route handlers / server actions, never from
// middleware.

const SECRET = process.env.AUTH_SECRET || "dev-secret-change-in-prod";

// ── base64url helpers (work in both runtimes) ────────────────────────
function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  // btoa is defined in both Node 22+ and all Edge runtimes.
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const base64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function stringToBytes(s: string): Uint8Array<ArrayBuffer> {
  // TextEncoder returns Uint8Array<ArrayBuffer> at runtime; typing it
  // explicitly keeps Web Crypto's BufferSource overloads happy.
  return new TextEncoder().encode(s) as Uint8Array<ArrayBuffer>;
}

// ── Web Crypto HMAC-SHA256 ───────────────────────────────────────────
async function hmacSign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    stringToBytes(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, stringToBytes(payload));
  return toBase64Url(new Uint8Array(sig));
}

// Constant-time string compare. Web Crypto doesn't expose timingSafeEqual,
// but since the signature is a base64url HMAC output, a char-by-char XOR
// over equal-length strings is plenty good for session tokens.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ── Tokens ───────────────────────────────────────────────────────────
export async function signToken(
  data: Record<string, unknown>,
  ttlSeconds = 60 * 60 * 24 * 30,
): Promise<string> {
  const body = { ...data, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const payload = toBase64Url(stringToBytes(JSON.stringify(body)));
  const sig = await hmacSign(payload);
  return `${payload}.${sig}`;
}

export async function verifyToken<T = Record<string, unknown>>(
  token: string | undefined | null,
): Promise<T | null> {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = await hmacSign(payload);
  if (!safeEqual(expected, sig)) return null;
  try {
    const decoded = new TextDecoder().decode(fromBase64Url(payload));
    const body = JSON.parse(decoded);
    if (typeof body.exp === "number" && body.exp < Math.floor(Date.now() / 1000)) return null;
    return body as T;
  } catch {
    return null;
  }
}

// ── Node-only helpers (don't import from middleware) ─────────────────
// Both use Web Crypto too so they're actually safe either way, but we
// keep them here for namespacing clarity.
export function randomId(bytes = 16): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return toBase64Url(buf);
}

export async function hashApiKey(key: string): Promise<string> {
  const keyBytes = await crypto.subtle.importKey(
    "raw",
    stringToBytes(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", keyBytes, stringToBytes(key));
  // Keep hex output to match what the DB already stores.
  const bytes = new Uint8Array(sig);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
  return hex;
}
