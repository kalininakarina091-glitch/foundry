export function traceableUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    const host = u.hostname.toLowerCase();
    if (
      !["http:", "https:"].includes(u.protocol) ||
      u.username ||
      u.password ||
      !host.includes(".") ||
      host === "localhost" ||
      /(^|\.)(example\.(com|org|net)|example|test|invalid|localhost)$/.test(
        host,
      ) ||
      /^(127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.)/.test(
        host,
      ) ||
      host.includes(":")
    )
      return null;
    u.hash = "";
    for (const key of [...u.searchParams.keys()])
      if (/^(utm_|fbclid$|gclid$)/.test(key)) u.searchParams.delete(key);
    u.searchParams.sort();
    return u.href;
  } catch {
    return null;
  }
}
