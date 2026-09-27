import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  const sources = [
    {
      name: "Hacker News",
      type: "hackernews",
      url: "https://news.ycombinator.com",
      status: "active",
    },
    {
      name: "GitHub",
      type: "github",
      url: "https://github.com",
      status: "active",
    },
    {
      name: "RSS Feeds",
      type: "rss",
      url: "https://techcrunch.com/feed/",
      status: "active",
    },
    {
      name: "Reddit",
      type: "reddit",
      url: "https://reddit.com",
      status: "disabled",
    },
    {
      name: "Product Hunt",
      type: "producthunt",
      url: "https://producthunt.com",
      status: "disabled",
    },
  ];

  for (const source of sources) {
    await prisma.source.upsert({
      where: { id: source.name.toLowerCase().replace(/\s+/g, "-") },
      update: source,
      create: {
        id: source.name.toLowerCase().replace(/\s+/g, "-"),
        ...source,
      },
    });
  }

  console.log("Sources seeded!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
