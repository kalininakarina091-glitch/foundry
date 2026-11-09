// Short-lived signed session hint for Proxy, so most requests skip the
// self-call to /api/auth/session. Uses Web Crypto only (no Prisma, no native
// modules), which Netlify Middleware can run.
//
// It is a navigation hint, not authority: routes and pages that read personal
// data or change anything still verify the session (and admin rights) in the
// database. The hint is bound to the session token, signed with AUTH_SECRET
// and expires after CLAIMS_TTL_MS; without AUTH_SECRET it is never issued and
// Proxy uses the database lookup on every request, as before.
export const CLAIMS_COOKIE = "foundry_claims";
export const CLAIMS_TTL_MS = 10 * 60_000;
const MIN_SECRET_LENGTH = 32;
const encoder = new TextEncoder();
const b64url = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const fromB64url = (value: string) =>
  Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
export function claimsSecret(env: string | undefined = process.env.AUTH_SECRET): string | null {
  return env && env.length >= MIN_SECRET_LENGTH ? env : null;
}
async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}
/** Binds the hint to one session token without revealing the token. */
async function tokenTag(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`claims:${token}`));
  return b64url(new Uint8Array(digest).slice(0, 16));
}
export async function signClaims(
  token: string,
  admin: boolean,
  secret: string,
  now = Date.now(),
): Promise<string> {
  const payload = b64url(
    encoder.encode(JSON.stringify({ t: await tokenTag(token), a: admin ? 1 : 0, e: now + CLAIMS_TTL_MS })),
  );
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(payload));
  return `${payload}.${b64url(signature)}`;
}
/** The admin flag if the hint is authentic, unexpired and for this token. */
export async function verifyClaims(
  value: string | undefined,
  token: string,
  secret: string,
  now = Date.now(),
): Promise<{ admin: boolean } | null> {
  if (!value || value.length > 512) return null;
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      fromB64url(signature),
      encoder.encode(payload),
    );
    if (!valid) return null;
    const claims = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
    if (typeof claims?.e !== "number" || claims.e <= now) return null;
    if (claims.t !== (await tokenTag(token))) return null;
    return { admin: claims.a === 1 };
  } catch {
    return null;
  }
}
export function claimsCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: CLAIMS_TTL_MS / 1000,
  };
}
