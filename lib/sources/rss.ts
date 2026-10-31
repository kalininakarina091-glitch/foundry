import Parser from "rss-parser";
import { fetchPublic, readBounded, type SourceItem } from "./http.ts";
import { hashId } from "../traceability.ts";
export async function fetchRSS(url: string | null): Promise<SourceItem[]> {
  if (!url) throw new Error("Configure a feed URL");
  const feed = await new Parser().parseString(
    await readBounded(await fetchPublic(url)),
  );
  return feedItems(feed.items || [], url);
}
type FeedItem = {
  guid?: string;
  link?: string;
  title?: string;
  contentSnippet?: string;
  content?: string;
  summary?: string;
  creator?: string;
  author?: string;
  isoDate?: string;
};
/** Maps parsed RSS/Atom items to materials; the first 15 are kept. */
export function feedItems(items: FeedItem[], url: string): SourceItem[] {
  return items
    .slice(0, 15)
    .map((item) => ({
      externalId: hashId("rss", [
        url,
        item.guid || item.link || item.title || "",
      ]),
      title: item.title || "Untitled",
      // Atom feeds such as Stack Exchange carry the post body in <summary>
      // (HTML); it is stored as received and read through lib/source-text.
      content:
        item.contentSnippet ||
        item.content ||
        item.summary ||
        null,
      url: item.link || null,
      author: item.creator || item.author || null,
      publishedAt:
        item.isoDate && !Number.isNaN(Date.parse(item.isoDate))
          ? new Date(item.isoDate)
          : null,
    }));
}
