import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/app-shell";
export const metadata: Metadata = {
  title: "Foundry — возможности на основе доказательств",
  description:
    "Найдите проблему, изучите рыночные сигналы и проверьте бизнес-возможность.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark">
      <body className="font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
