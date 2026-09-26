"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar";

const AUTH_PATHS = ["/login", "/signup"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = AUTH_PATHS.includes(pathname);

  if (isAuth) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background md:flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-background focus:p-4"
      >
        К содержимому
      </a>
      <Sidebar />
      <main id="main-content" className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}
