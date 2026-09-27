"use client";
import { useState } from "react";
import Link from "next/link";
export default function GenerateFromPattern({
  patternId,
}: {
  patternId: string;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [id, setId] = useState<string | null>(null);
  async function generate() {
    setPending(true);
    setMessage("");
    try {
      const r = await fetch("/api/opportunities/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patternId }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setId(data.savedId);
      setMessage(
        data.reused
          ? "Возможность уже существует."
          : "Гипотеза создана. Проверьте исходные материалы.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="mt-4">
      <button className="button-primary" disabled={pending} onClick={generate}>
        {pending ? "Создание…" : "Создать гипотезу"}
      </button>
      <p role="status" className="my-2 text-sm">
        {message}
      </p>
      {id && (
        <Link
          href={`/opportunities/${encodeURIComponent(id)}`}
          className="text-primary"
        >
          Открыть возможность →
        </Link>
      )}
    </div>
  );
}
