"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/opportunities", label: "Opportunities", icon: "🔎" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-neutral-950 border-r border-neutral-800 flex flex-col">
      <div className="p-6">
        <Link href="/dashboard" className="text-xl font-bold text-white">
          Opportunity<span className="text-emerald-400">Scanner</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === item.href
                ? "bg-neutral-800 text-white"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-medium">
            A
          </div>
          <div>
            <p className="text-sm text-white">Alex</p>
            <p className="text-xs text-neutral-500">alex@email.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}