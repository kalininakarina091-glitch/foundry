import { test } from "node:test";
import assert from "node:assert/strict";
import { feedItems } from "../lib/sources/rss.ts";

const feed = "https://softwarerecs.stackexchange.com/feeds";

test("Atom entries with the body only in <summary> keep their text", () => {
  const [item] = feedItems(
    [
      {
        title: "Tool to reconcile orders across marketplaces?",
        link: "https://softwarerecs.stackexchange.com/questions/1/tool",
        summary: "<p>I run a small shop and spend hours matching orders.</p>",
        author: "someone",
        isoDate: "2026-10-30T10:00:00Z",
      },
    ],
    feed,
  );
  assert.match(item.content!, /spend hours matching orders/);
  assert.equal(item.author, "someone");
  assert.equal(item.publishedAt?.toISOString(), "2026-10-30T10:00:00.000Z");
});

test("snippet wins over raw content; missing fields stay empty; at most 15 items", () => {
  const [a] = feedItems([{ title: "x", link: "https://a.example.org/1", contentSnippet: "plain", content: "<p>html</p>" }], feed);
  assert.equal(a.content, "plain");
  const [b] = feedItems([{ link: "https://a.example.org/2", isoDate: "not a date" }], feed);
  assert.equal(b.title, "Untitled");
  assert.equal(b.content, null);
  assert.equal(b.publishedAt, null);
  assert.equal(feedItems(Array.from({ length: 20 }, (_, i) => ({ link: `https://a.example.org/${i}` })), feed).length, 15);
});

test("sources cannot resolve to internal or reserved addresses", async () => {
  const { isPrivateAddress } = await import("../lib/sources/http.ts");
  for (const a of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "100.127.255.1", "198.18.0.1", "0.0.0.0", "224.0.0.1", "255.255.255.255", "::1", "::ffff:10.0.0.1", "fd00::1", "fe80::1"])
    assert.equal(isPrivateAddress(a), true, a);
  for (const a of ["93.184.216.34", "100.63.0.1", "100.128.0.1", "172.32.0.1", "198.20.0.1", "2606:4700::1111"])
    assert.equal(isPrivateAddress(a), false, a);
});
