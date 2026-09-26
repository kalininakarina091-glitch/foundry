import Link from "next/link";
import { PageHeader } from "@/components/product-ui";
export const dynamic = "force-dynamic";
export default function SettingsPage() {
  const configured = Boolean(process.env.OPENROUTER_API_KEY);
  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Система"
        title="Настройки проекта"
        description="Состояние подключения и инструменты исследования."
      />
      <section className="foundry-card max-w-3xl rounded-2xl p-6">
        <h2 className="font-semibold">AI-проверка</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          {configured
            ? "OpenRouter настроен. Доступность провайдера проверяется при запросе."
            : "Ключ OpenRouter не настроен. Для AI-проверки добавьте OPENROUTER_API_KEY в окружение сервера."}
        </p>
        <p className="mt-3 text-xs leading-6 text-muted-foreground">
          Результаты проверки отображаются в текущей сессии страницы. История
          проверок пока не сохраняется.
        </p>
      </section>
      <section className="mt-8 max-w-3xl">
        <h2 className="font-semibold">Данные и исследование</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Существующие инструменты для подготовки данных. Сигнал сам по себе ещё
          не является возможностью.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {[
            ["Источники", "/sources"],
            ["Сигналы", "/signals"],
            ["Кластеры", "/clusters"],
            ["Паттерны", "/patterns"],
            ["Доказательства", "/evidence"],
          ].map(([name, href]) => (
            <Link key={href} className="button-secondary" href={href}>
              {name} →
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
