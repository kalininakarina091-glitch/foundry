export async function fetchHackerNews(): Promise<
  Array<{
    externalId: string;
    title: string;
    content: string | null;
    url: string | null;
    author: string | null;
    publishedAt: Date;
  }>
> {
  const response = await fetch(
    "https://hacker-news.firebaseio.com/v0/topstories.json",
  );
  const storyIds: number[] = await response.json();

  const topStories = storyIds.slice(0, 30);

  const stories = await Promise.all(
    topStories.map(async (id) => {
      const storyRes = await fetch(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
      );
      const story = await storyRes.json();

      return {
        externalId: `hn-${story.id}`,
        title: story.title || "Untitled",
        content: story.text || null,
        url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
        author: story.by || null,
        publishedAt: new Date(story.time * 1000),
      };
    }),
  );

  return stories;
}
