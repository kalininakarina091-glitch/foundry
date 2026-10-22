import { createHash, timingSafeEqual } from "node:crypto";
export const MIN_CRON_SECRET_LENGTH = 32;
/** "missing" when the server has no usable secret: the endpoint fails closed. */
export function cronAuthorization(
  header: string | null,
  secret: string | undefined,
): "ok" | "missing" | "denied" {
  if (!secret || secret.length < MIN_CRON_SECRET_LENGTH) return "missing";
  const digest = (v: string) => createHash("sha256").update(v).digest();
  // Equal-length digests keep the comparison constant-time.
  return header && timingSafeEqual(digest(header), digest(`Bearer ${secret}`))
    ? "ok"
    : "denied";
}
