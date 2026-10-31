"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Lightbulb,
  LayoutDashboard,
  Settings2,
  Sparkles,
  ArrowRight,
  ListChecks,
  Rss,
  Radar,
  Network,
  type LucideIcon,
} from "lucide-react";
interface Item {
  href: string;
  label: string;
  icon: LucideIcon;
  active: (path: string, view: string | null) => boolean;
}
const main: Item[] = [
  { href: "/dashboard", label: "Обзор", icon: LayoutDashboard, active: (p) => p === "/dashboard" },
  {
    href: "/opportunities",
    label: "Возможности",
    icon: Lightbulb,
    active: (p, v) =>
      (/^\/(opportunities|validation|insights|plan|compare)(\/|$)/.test(p) && v !== "mine"),
  },
  {
    href: "/opportunities?view=mine",
    label: "Мои решения",
    icon: ListChecks,
    active: (p, v) => p === "/opportunities" && v === "mine",
  },
  { href: "/settings", label: "Настройки", icon: Settings2, active: (p) => p.startsWith("/settings") },
];
// Pipeline tools: mutations there are admin-only, so the group is hidden for
// ordinary users rather than offering buttons that refuse them.
const data: Item[] = [
  { href: "/sources", label: "Источники", icon: Rss, active: (p) => p === "/sources" },
  { href: "/signals", label: "Сигналы", icon: Radar, active: (p) => p === "/signals" || p === "/clusters" },
  { href: "/patterns", label: "Паттерны", icon: Network, active: (p) => p === "/patterns" },
];
function Links({ items, path, view }: { items: Item[]; path: string; view: string | null }) {
  return items.map(({ href, label, icon: Icon, active }) => {
    const on = active(path, view);
    return (
      <Link key={href} href={href} aria-current={on ? "page" : undefined} className={on ? "active" : ""}>
        <Icon size={19} strokeWidth={1.5} />
        {label}
      </Link>
    );
  });
}
export default function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const view = useSearchParams().get("view");
  return (
    <aside className="foundry-sidebar">
      <Link href="/dashboard" className="brand">
        <Sparkles size={27} strokeWidth={1.5} />
        Foundry
      </Link>
      <nav aria-label="Основная навигация">
        <Links items={main} path={pathname} view={view} />
        {isAdmin && (
          <>
            <p className="sidebar-group" id="sidebar-data">
              Данные
            </p>
            <Links items={data} path={pathname} view={view} />
          </>
        )}
      </nav>
      <div className="sidebar-note">
        <span className="sidebar-note-icon">
          <Sparkles size={20} />
        </span>
        <h2>
          Сигналы становятся
          <br />
          возможностями
        </h2>
        <p>Находите реальные проблемы и решайте, что стоит создавать.</p>
        <Link className="button-secondary" href={isAdmin ? "/sources" : "/opportunities?view=for-you"}>
          {isAdmin ? "Изучить источники" : "Подборка для вас"} <ArrowRight size={14} />
        </Link>
      </div>
    </aside>
  );
}
