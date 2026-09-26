"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, LayoutDashboard, Settings2, Hexagon } from "lucide-react";
const items = [
  { href: "/dashboard", label: "Обзор", icon: LayoutDashboard },
  { href: "/opportunities", label: "Возможности", icon: Compass },
  { href: "/settings", label: "Настройки", icon: Settings2 },
];
export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="border-b border-border bg-sidebar md:sticky md:top-0 md:flex md:h-screen md:w-56 md:shrink-0 md:flex-col md:border-r md:border-b-0">
      <Link
        href="/dashboard"
        className="flex items-center gap-3 px-5 py-6 text-xl font-semibold tracking-tight"
      >
        <Hexagon className="size-7 text-primary" strokeWidth={1.5} />
        Foundry<span className="text-primary">.</span>
      </Link>
      <p className="eyebrow hidden px-5 pb-4 pt-5 md:block">
        Рабочее пространство
      </p>
      <nav
        aria-label="Основная навигация"
        className="flex gap-1 px-3 pb-3 md:flex-col"
      >
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
              className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm md:justify-start ${active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <Icon
                className="hidden size-4 shrink-0 min-[380px]:block"
                aria-hidden
              />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto hidden p-5 md:block">
        <div className="border-t border-border pt-5">
          <p className="text-xs font-medium">Сначала доказательства.</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Найдите проблему, изучите сигналы и примите решение.
          </p>
        </div>
      </div>
    </aside>
  );
}
