import { createHash } from "node:crypto";
// Netlify's edge sets x-nf-client-connection-ip itself; a client cannot
// override it. X-Forwarded-For is only a fallback for local/other hosting,
// where its first entry is client-controlled and limits are best effort.
export function clientIp(request: Request): string {
  const headers = request.headers;
  const ip =
    headers.get("x-nf-client-connection-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0] ||
    headers.get("x-real-ip") ||
    "unknown";
  return ip.trim().toLowerCase() || "unknown";
}
/** Rate-limit keys store digests, never raw IP addresses or emails. */
export function limitKey(scope: string, value: string): string {
  return `${scope}-${createHash("sha256").update(value).digest("hex").slice(0, 32)}`;
}
