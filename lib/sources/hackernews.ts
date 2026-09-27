import { fetchPublic, readBounded, type SourceItem } from "./http";
export async function fetchHackerNews(): Promise<SourceItem[]> {
  const ids = JSON.parse(
    await readBounded(
      await fetchPublic(
        "https://hacker-news.firebaseio.com/v0/topstories.json",
      ),
    ),
  );
  if (!Array.isArray(ids)) throw new Error("Invalid HN response");
  const stories = [];
  for (const id of ids.slice(0, 15)) {
    const s = JSON.parse(
      await readBounded(
        await fetchPublic(
          `https://hacker-news.firebaseio.com/v0/item/${Number(id)}.json`,
        ),
      ),
    );
    if (!s || s.deleted || s.dead || !s.title) continue;
    stories.push({
      externalId: `hn-${s.id}`,
      title: s.title,
      content: s.text || null,
      url: `https://news.ycombinator.com/item?id=${s.id}`,
      author: s.by || null,
      publishedAt: s.time ? new Date(s.time * 1000) : null,
    });
  }
  return stories;
}
