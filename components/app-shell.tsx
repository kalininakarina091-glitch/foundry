"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Plus, Settings2 } from "lucide-react";
import LogoutButton from "@/components/logout-button";
import Sidebar from "@/components/sidebar";
import { usePreferences } from "@/lib/use-preferences";
const AUTH_PATHS = [
  "/",
  "/login",
  "/signup",
  "/welcome",
  "/onboarding",
  "/profile-ready",
];
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const preferences = usePreferences();
  if (AUTH_PATHS.includes(pathname)) return <>{children}</>;
  return (
    <div
      className="min-h-screen bg-background md:flex"
      data-density={preferences.compact ? "compact" : "comfortable"}
      data-descriptions={preferences.showDescriptions ? "visible" : "hidden"}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-background focus:p-4"
      >
        К содержимому
      </a>
      <Sidebar />
      <div className="min-w-0 flex-1">
        <header className="app-topbar">
          <form action="/opportunities" className="global-search" role="search">
            <Search size={17} aria-hidden="true" />
            <input
              name="q"
              type="search"
              aria-label="Поиск по возможностям"
              placeholder="Поиск возможностей, тем и идей…"
            />
            <button type="submit" aria-label="Найти">
              <ArrowSearch />
            </button>
          </form>
          <div className="topbar-actions">
            <LogoutButton />
            <Link href="/sources" className="button-primary">
              <Plus size={16} />
              <span>Собрать сигналы</span>
            </Link>
            <Link
              href="/settings"
              className="settings-link"
              aria-label="Настройки проекта"
            >
              <Settings2 size={18} />
            </Link>
            <span
              className="workspace-avatar"
              title={preferences.name || "Рабочее пространство Foundry"}
            >
              {preferences.name.trim().slice(0, 1).toUpperCase() || "F"}
            </span>
          </div>
        </header>
        <main id="main-content">{children}</main>
      </div>
    </div>
  );
}
function ArrowSearch() {
  return <span aria-hidden="true">↵</span>;
}
