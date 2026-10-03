import { fetchHackerNews } from "./hackernews";
import { fetchGitHub } from "./github";
import { fetchRSS } from "./rss";
export async function fetchSourceData(type: string, url: string | null) {
  switch (type) {
    case "hackernews":
      return fetchHackerNews();
    case "github":
      return fetchGitHub(url);
    case "rss":
      return fetchRSS(url);
    default:
      throw new Error("Unsupported source type");
  }
}
