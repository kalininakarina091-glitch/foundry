import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";
const params = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
let active = 0;
async function derive(password: string, salt: string): Promise<Buffer> {
  if (active >= 2) throw new Error("Password service busy");
  active++;
  try {
    return await new Promise((resolve, reject) =>
      scrypt(password, salt, 64, params, (e, key) =>
        e ? reject(e) : resolve(key),
      ),
    );
  } finally {
    active--;
  }
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt-v1$${salt}$${(await derive(password, salt)).toString("hex")}`;
}
export async function verifyPassword(password: string, encoded: string) {
  const [v, salt, hex] = encoded.split("$");
  if (v !== "scrypt-v1" || !salt || !/^[a-f0-9]{128}$/.test(hex || ""))
    return false;
  return timingSafeEqual(await derive(password, salt), Buffer.from(hex, "hex"));
}
export function tokenDigest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function newToken() {
  return randomBytes(32).toString("base64url");
}
export function sameOrigin(request: Request) {
  try {
    return (
      request.headers.get("origin") ===
        new URL(process.env.APP_ORIGIN || request.url).origin &&
      request.headers.get("sec-fetch-site") !== "cross-site"
    );
  } catch {
    return false;
  }
}
