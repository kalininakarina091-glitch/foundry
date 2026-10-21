// RawItem keeps the material exactly as fetched. Connectors whose payload is
// HTML (Hacker News `text`, RSS `content`) are read through this module so the
// model input and every exact-quote check see the same plain text.
const HTML_SOURCES = new Set(["hackernews", "rss"]);
const ENTITIES: Record<string, string> = {
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
};
function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (m, n) => codePoint(Number(n), m))
    .replace(/&#x([0-9a-f]+);/gi, (m, n) => codePoint(parseInt(n, 16), m))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
    .replace(/&amp;/gi, "&");
}
function codePoint(n: number, fallback: string) {
  return Number.isInteger(n) && n > 0 && n <= 0x10ffff
    ? String.fromCodePoint(n)
    : fallback;
}
/** Plain text from an HTML fragment. Only tag-shaped markup is removed. */
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/?(p|div|li|ul|ol|pre|blockquote|h[1-6])\b[^>]*>/gi, "\n")
      .replace(/<\/?[a-z][a-z0-9-]*\b[^>]*>/gi, ""),
  )
    .split("\n")
    .map((line) => line.replace(/[ \t ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
export interface SourceMaterial {
  title?: string | null;
  content: string | null;
  source?: { type: string } | null;
}
/** The text a model reads and quotes from. Markdown/plain sources are unchanged. */
export function sourceDocument(raw: SourceMaterial): string {
  const html = HTML_SOURCES.has(raw.source?.type ?? "");
  return [raw.title, raw.content]
    .filter((part): part is string => !!part)
    .map((part) => (html ? htmlToText(part) : part))
    .join("\n");
}
const collapse = (value: string) => value.replace(/\s+/g, " ").trim();
/**
 * A quote is traceable when it occurs verbatim in the stored material, or in
 * its readable text with whitespace differences only. Wording, punctuation and
 * letter case must still match exactly.
 */
export function quoteInSource(
  quote: string | null | undefined,
  raw: SourceMaterial,
): boolean {
  if (!quote || quote.trim().length < 12) return false;
  const stored = [raw.title, raw.content].filter(Boolean).join("\n");
  return (
    stored.includes(quote) ||
    collapse(sourceDocument(raw)).includes(collapse(quote))
  );
}
