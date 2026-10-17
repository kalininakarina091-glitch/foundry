import Link from "next/link";
import { prisma } from "@/lib/db";
import SettingsWorkspace from "@/components/settings-workspace";
export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  const sources = await prisma.source.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      _count: { select: { rawItems: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return (
    <div className="page-container settings-page">
      <header className="settings-heading">
        <h1 className="page-title">Настройки</h1>
        <p>Ваш профиль, предпочтения и источники данных.</p>
      </header>
      <Link className="button-primary mb-6" href="/settings/personalization">
        Персонализация →
      </Link>
      <SettingsWorkspace
        sources={sources.map((s) => ({
          id: s.id,
          name: s.name,
          type: s.type,
          status: s.status,
          count: s._count.rawItems,
        }))}
        aiConfigured={Boolean(process.env.OPENROUTER_API_KEY)}
      />
    </div>
  );
}
