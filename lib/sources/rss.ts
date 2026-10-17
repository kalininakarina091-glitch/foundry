import Parser from "rss-parser";
import { fetchPublic, readBounded, type SourceItem } from "./http";
import { hashId } from "@/lib/traceability";
export async function fetchRSS(url: string | null): Promise<SourceItem[]> {
  if (!url) throw new Error("Configure a feed URL");
  const feed = await new Parser().parseString(
    await readBounded(await fetchPublic(url)),
  );
  return (feed.items || [])
    .slice(0, 15)
    .map((item) => ({
      externalId: hashId("rss", [
        url,
        item.guid || item.link || item.title || "",
      ]),
      title: item.title || "Untitled",
      content: item.contentSnippet || item.content || null,
      url: item.link || null,
      author: item.creator || null,
      publishedAt:
        item.isoDate && !Number.isNaN(Date.parse(item.isoDate))
          ? new Date(item.isoDate)
          : null,
    }));
}
