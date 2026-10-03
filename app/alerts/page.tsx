import { DemoNotice } from "@/components/product-ui";
import { alerts } from "@/lib/mock-data";

export default function AlertsPage() {
  return (
    <div className="px-8 py-7">
      <DemoNotice />
      <h1 className="text-3xl font-semibold text-white">Оповещения</h1>
      <p className="mt-2 text-neutral-400">
        Свежие рыночные сигналы, которые могут стать возможностями.
      </p>

      <div className="mt-8 space-y-3">
        {alerts.map((alert) => (
          <article key={alert.id} className="foundry-card rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-white">{alert.title}</p>
                <p className="mt-1 text-sm text-neutral-400">{alert.body}</p>
              </div>
              <span className="shrink-0 text-xs text-neutral-500">
                {alert.time}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
