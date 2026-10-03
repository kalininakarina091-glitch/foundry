"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Lightbulb,
  LayoutDashboard,
  Settings2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
const items = [
  { href: "/dashboard", label: "Обзор", icon: LayoutDashboard },
  { href: "/opportunities", label: "Возможности", icon: Lightbulb },
  { href: "/settings", label: "Настройки", icon: Settings2 },
];
export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="foundry-sidebar">
      <Link href="/dashboard" className="brand">
        <Sparkles size={27} strokeWidth={1.5} />
        Foundry
      </Link>
      <nav aria-label="Основная навигация">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href === "/opportunities" &&
              /^\/(opportunities|validation|insights)(\/|$)/.test(pathname));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={active ? "active" : ""}
            >
              <Icon size={19} strokeWidth={1.5} />
              {label}
            </Link>
          );
        })}
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
        <Link className="button-secondary" href="/sources">
          Изучить источники <ArrowRight size={14} />
        </Link>
      </div>
    </aside>
  );
}
