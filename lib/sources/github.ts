export async function fetchGitHub(): Promise<
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
    "https://api.github.com/search/issues?q=label:bug+state:open&sort=created&order=desc&per_page=30",
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    },
  );

  const data = await response.json();

  const items = (data.items || []).map(
    (item: {
      id: number;
      title?: string;
      body?: string;
      html_url?: string;
      user?: { login?: string };
      created_at: string;
    }) => ({
      externalId: `gh-${item.id}`,
      title: item.title || "Untitled",
      content: item.body?.slice(0, 500) || null,
      url: item.html_url || null,
      author: item.user?.login || null,
      publishedAt: new Date(item.created_at),
    }),
  );

  return items;
}
