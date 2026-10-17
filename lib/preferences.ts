export interface Preferences {
  name: string;
  email: string;
  about: string;
  catalogLayout: "grid" | "list";
  catalogSort: "score" | "evidence" | "recent";
  pageSize: 6 | 12 | 24;
  compact: boolean;
  showDescriptions: boolean;
}
export const defaultPreferences: Preferences = {
  name: "",
  email: "",
  about: "",
  catalogLayout: "grid",
  catalogSort: "score",
  pageSize: 12,
  compact: false,
  showDescriptions: true,
};
export function parsePreferences(raw: string): Preferences {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value))
      return { ...defaultPreferences };
    const p = value as Record<string, unknown>;
    return {
      name: typeof p.name === "string" ? p.name.slice(0, 80) : "",
      email: typeof p.email === "string" ? p.email.slice(0, 254) : "",
      about: typeof p.about === "string" ? p.about.slice(0, 200) : "",
      catalogLayout: p.catalogLayout === "list" ? "list" : "grid",
      catalogSort:
        p.catalogSort === "evidence" || p.catalogSort === "recent"
          ? p.catalogSort
          : "score",
      pageSize: p.pageSize === 6 || p.pageSize === 24 ? p.pageSize : 12,
      compact: p.compact === true,
      showDescriptions: p.showDescriptions !== false,
    };
  } catch {
    return { ...defaultPreferences };
  }
}
