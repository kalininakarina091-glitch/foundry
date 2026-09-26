import Parser from "rss-parser";

const parser = new Parser();

export const RSS_FEEDS = [
  { name: "TechCrunch", url: "https://techcrunch.com/feed/" },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
  { name: "Indie Hackers", url: "https://www.indiehackers.com/feed" },
];

export async function fetchRSS(): Promise<
  Array<{
    externalId: string;
    title: string;
    content: string | null;
    url: string | null;
    author: string | null;
    publishedAt: Date;
  }>
> {
  const allItems: Array<{
    externalId: string;
    title: string;
    content: string | null;
    url: string | null;
    author: string | null;
    publishedAt: Date;
  }> = [];

  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);

      const items = (parsed.items || []).slice(0, 10).map((item) => ({
        externalId: `rss-${feed.name}-${item.guid || item.link || Date.now()}`,
        title: item.title || "Untitled",
        content: item.contentSnippet?.slice(0, 500) || null,
        url: item.link || null,
        author: item.creator || null,
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      }));

      allItems.push(...items);
    } catch (error) {
      console.error(`Failed to fetch RSS from ${feed.name}:`, error);
    }
  }

  return allItems;
}
