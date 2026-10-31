"use client";
import { useState } from "react";
import {
  DECISION_STATUSES,
  NOTE_MAX,
  type DecisionStatus,
} from "@/lib/decisions";
const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeStyle: "short",
});
export default function DecisionPanel({
  opportunityId,
  initial,
}: {
  opportunityId: string;
  initial: { status: string | null; note: string; updatedAt: string | null };
}) {
  const [status, setStatus] = useState<string | null>(initial.status);
  const [note, setNote] = useState(initial.note);
  const [updatedAt, setUpdatedAt] = useState(initial.updatedAt);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState({ text: "", error: false });
  async function save(nextStatus: string | null, nextNote: string) {
    setPending(true);
    try {
      const r = await fetch("/api/me/decisions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId, status: nextStatus, note: nextNote }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Не удалось сохранить.");
      setStatus(data.status);
      setNote(data.note);
      setUpdatedAt(data.updatedAt ?? null);
      setMessage({ text: "Сохранено.", error: false });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : "Ошибка", error: true });
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="rounded-xl border border-border p-5">
      <h2 className="text-lg font-semibold">Моё решение</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Видно только вам. Не меняет оценку возможности, доказательства и проверку.
      </p>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Статус решения">
        {(Object.keys(DECISION_STATUSES) as DecisionStatus[]).map((s) => (
          <button
            key={s}
            className={status === s ? "button-primary" : "button-secondary"}
            aria-pressed={status === s}
            disabled={pending}
            onClick={() => save(status === s ? null : s, note)}
          >
            {DECISION_STATUSES[s]}
          </button>
        ))}
      </div>
      <label className="mt-4 block text-sm">
        Заметки
        <textarea
          className="field mt-1 w-full"
          rows={4}
          maxLength={NOTE_MAX}
          placeholder="Почему интересно или почему нет; что проверить дальше…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          className="button-secondary"
          disabled={pending || note === initial.note && note === ""}
          onClick={() => save(status, note)}
        >
          {pending ? "Сохранение…" : "Сохранить заметку"}
        </button>
        <span className="text-xs text-muted-foreground">
          {note.length}/{NOTE_MAX}
          {updatedAt ? ` · изменено ${dateFormat.format(new Date(updatedAt))}` : ""}
        </span>
        {message.text && (
          <span role={message.error ? "alert" : "status"} className={message.error ? "text-red-300 text-xs" : "text-xs"}>
            {message.text}
          </span>
        )}
      </div>
    </section>
  );
}
