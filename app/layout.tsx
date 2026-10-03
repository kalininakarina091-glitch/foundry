import type { Metadata } from "next";
import "./globals.css";
import { currentUser } from "@/lib/auth";
import { PreferencesProvider } from "@/lib/use-preferences";
import AppShell from "@/components/app-shell";
export const metadata: Metadata = {
  title: "Foundry — возможности на основе доказательств",
  description:
    "Найдите проблему, изучите рыночные сигналы и проверьте бизнес-возможность.",
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  return (
    <html lang="ru" className="dark">
      <body className="font-sans antialiased">
        <PreferencesProvider key={user?.id || "guest"} user={user}>
          <AppShell>{children}</AppShell>
        </PreferencesProvider>
      </body>
    </html>
  );
}
