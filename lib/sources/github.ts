import { fetchPublic, readBounded, type SourceItem } from "./http";
export async function fetchGitHub(url: string | null): Promise<SourceItem[]> {
  let scope = "";
  if (url) {
    const u = new URL(url);
    if (u.hostname !== "github.com")
      throw new Error("GitHub source requires github.com URL");
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) scope = ` repo:${parts[0]}/${parts[1]}`;
  }
  const endpoint = `https://api.github.com/search/issues?q=${encodeURIComponent(`is:issue is:open${scope}`)}&sort=created&order=desc&per_page=15`;
  const data = JSON.parse(await readBounded(await fetchPublic(endpoint)));
  if (!Array.isArray(data.items)) throw new Error("Invalid GitHub response");
  return data.items.map(
    (item: {
      id: number;
      title: string;
      body: string | null;
      html_url: string;
      user: { login: string } | null;
      created_at: string;
    }) => ({
      externalId: `gh-${item.id}`,
      title: item.title,
      content: item.body,
      url: item.html_url,
      author: item.user?.login || null,
      publishedAt: new Date(item.created_at),
    }),
  );
}
