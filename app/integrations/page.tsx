import { DemoNotice } from "@/components/product-ui";
const integrations = [
  { name: "Slack", status: "Подключено" },
  { name: "Notion", status: "Подключено" },
  { name: "Stripe", status: "Не подключено" },
  { name: "Linear", status: "Не подключено" },
  { name: "HubSpot", status: "Не подключено" },
  { name: "Google Analytics", status: "Подключено" },
];

export default function IntegrationsPage() {
  return (
    <div className="px-8 py-7">
      <DemoNotice />
      <h1 className="text-3xl font-semibold text-white">Интеграции</h1>
      <p className="mt-2 text-neutral-400">
        Подключайте источники и каналы исполнения с подтверждением человека.
      </p>

      <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((item) => (
          <article
            key={item.name}
            className="foundry-card flex items-center justify-between rounded-2xl p-5"
          >
            <div>
              <p className="font-semibold text-white">{item.name}</p>
              <p className="mt-1 text-sm text-neutral-500">{item.status}</p>
            </div>
            <span className="text-xs text-neutral-500">Демо</span>
          </article>
        ))}
      </div>
    </div>
  );
}
