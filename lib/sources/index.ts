import { fetchHackerNews } from "./hackernews";
import { fetchGitHub } from "./github";
import { fetchRSS } from "./rss";

export async function fetchSourceData(sourceType: string) {
  switch (sourceType) {
    case "hackernews":
      return fetchHackerNews();
    case "github":
      return fetchGitHub();
    case "rss":
      return fetchRSS();
    default:
      return [];
  }
}
