import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { traceableUrl } from "@/lib/traceability";
export async function fetchPublic(url: string): Promise<Response> {
  let target = url;
  for (let i = 0; i < 5; i++) {
    if (!traceableUrl(target)) throw new Error("Invalid public source URL");
    const host = new URL(target).hostname;
    if (isIP(host)) throw new Error("IP source URLs are not supported");
    const addresses = await lookup(host, { all: true });
    if (
      !addresses.length ||
      addresses.some(({ address }) =>
        address.includes(":")
          ? /^(::|fc|fd|fe[89ab])/i.test(address)
          : /^(0\.|10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|22[4-9]\.|23\d\.)/.test(
              address,
            ),
      )
    )
      throw new Error("Private source address");
    const response = await fetch(target, {
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
      headers: {
        "User-Agent": "Foundry-pipeline-audit",
        Accept:
          "application/json, application/rss+xml, application/xml, text/xml",
      },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Missing redirect");
      target = new URL(location, target).href;
      continue;
    }
    if (!response.ok)
      throw new Error(`Source returned HTTP ${response.status}`);
    return response;
  }
  throw new Error("Too many source redirects");
}
export async function readBounded(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Empty source response");
  const decoder = new TextDecoder();
  let text = "";
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 5_000_000) {
      await reader.cancel();
      throw new Error("Source exceeds 5MB");
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}
export interface SourceItem {
  externalId: string;
  title: string;
  content: string | null;
  url: string | null;
  author: string | null;
  publishedAt: Date | null;
}
