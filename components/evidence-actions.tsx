"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EvidenceActions({
  opportunityId,
  count,
}: {
  opportunityId: string;
  count: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function update(action: "link-signals" | "clear-evidence") {
    if (
      action === "clear-evidence" &&
      !window.confirm(
        "Удалить связи с доказательствами этой возможности? Исходные сигналы сохранятся.",
      )
    )
      return;
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(
        `/api/opportunities/${encodeURIComponent(opportunityId)}/${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 5 }),
        },
      );
      const data = await response.json();
      if (!response.ok || data.error)
        throw new Error(data.error || "Не удалось обновить материалы.");
      setMessage(
        action === "link-signals"
          ? `Связано сигналов: ${data.linked}. Пропущено: ${data.skipped}.`
          : "Связи с доказательствами удалены.",
      );
      router.refresh();
    } catch {
      setError(
        "Не удалось обновить материалы. Проверьте подключение и повторите попытку.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <details className="mt-5 rounded-xl border border-border p-4 text-sm">
      <summary className="font-medium">Управление материалами</summary>
      <p className="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">
        Восстановите связи с сигналами сохранённого паттерна. Их релевантность
        нужно проверить по первоисточникам.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className="button-secondary"
          disabled={pending}
          onClick={() => update("link-signals")}
        >
          {pending ? "Обновляем материалы…" : "Восстановить исходные связи"}
        </button>
        {count > 0 && (
          <button
            className="button-secondary text-red-300"
            disabled={pending}
            onClick={() => update("clear-evidence")}
          >
            Удалить связи
          </button>
        )}
      </div>
      {message && (
        <p role="status" className="mt-3 text-muted-foreground">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-red-300">
          {error}
        </p>
      )}
    </details>
  );
}
