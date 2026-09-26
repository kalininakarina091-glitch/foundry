"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Plus, Settings2 } from "lucide-react";
import Sidebar from "@/components/sidebar";
const AUTH_PATHS = ["/login", "/signup"];
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (AUTH_PATHS.includes(pathname)) return <>{children}</>;
  return (
    <div className="min-h-screen bg-background md:flex">
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
              title="Рабочее пространство Foundry"
            >
              F
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
