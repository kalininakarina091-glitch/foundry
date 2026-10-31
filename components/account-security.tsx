"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { DELETE_CONFIRMATION } from "@/lib/account";
const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeStyle: "short",
});
interface SessionRow {
  createdAt: string;
  expiresAt: string;
  current: boolean;
}
async function send(path: string, method: string, body?: object) {
  const r = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "Операция не выполнена.");
  return data;
}
function Status({ text, error }: { text: string; error: boolean }) {
  if (!text) return null;
  return (
    <p role={error ? "alert" : "status"} className={error ? "settings-error" : "settings-success"}>
      {text}
    </p>
  );
}
export function PasswordPanel() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState({ text: "", error: false });
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (next !== repeat)
      return setStatus({ text: "Новые пароли не совпадают.", error: true });
    setPending(true);
    try {
      const data = await send("/api/me/password", "PUT", { current, next });
      setCurrent("");
      setNext("");
      setRepeat("");
      setStatus({
        text: `Пароль изменён.${data.revoked ? ` Выполнен выход на других устройствах: ${data.revoked}.` : ""}`,
        error: false,
      });
    } catch (e) {
      setStatus({ text: e instanceof Error ? e.message : "Ошибка", error: true });
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <label>
        Текущий пароль
        <input className="field" type="password" autoComplete="current-password" required maxLength={128} value={current} onChange={(e) => setCurrent(e.target.value)} />
      </label>
      <label>
        Новый пароль <span>(12–128 символов)</span>
        <input className="field" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={next} onChange={(e) => setNext(e.target.value)} />
      </label>
      <label>
        Повторите новый пароль
        <input className="field" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={repeat} onChange={(e) => setRepeat(e.target.value)} />
      </label>
      <Status {...status} />
      <button className="button-primary" type="submit" disabled={pending}>
        {pending ? "Сохранение…" : "Изменить пароль"}
      </button>
    </form>
  );
}
export function SessionsPanel() {
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState({ text: "", error: false });
  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/sessions")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((rows: SessionRow[]) => !cancelled && setSessions(rows))
      .catch(() => !cancelled && setStatus({ text: "Не удалось загрузить сессии.", error: true }));
    return () => {
      cancelled = true;
    };
  }, [revision]);
  async function revokeOthers() {
    try {
      const data = await send("/api/me/sessions", "DELETE");
      setStatus({ text: `Завершено сессий: ${data.revoked}.`, error: false });
      setRevision((v) => v + 1);
    } catch (e) {
      setStatus({ text: e instanceof Error ? e.message : "Ошибка", error: true });
    }
  }
  const others = sessions?.filter((s) => !s.current).length ?? 0;
  return (
    <div className="space-y-3">
      {!sessions ? (
        <p>Загрузка…</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {sessions.map((s, i) => (
            <li key={i}>
              Вход {dateFormat.format(new Date(s.createdAt))}
              {s.current ? " · это устройство" : ""} · действует до{" "}
              {dateFormat.format(new Date(s.expiresAt))}
            </li>
          ))}
        </ul>
      )}
      <Status {...status} />
      <button className="button-secondary" disabled={!others} onClick={revokeOthers}>
        Выйти на всех других устройствах{others ? ` (${others})` : ""}
      </button>
    </div>
  );
}
export function DeleteAccountPanel() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState({ text: "", error: false });
  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await send("/api/me/delete", "POST", { password, confirm });
      router.replace("/");
      router.refresh();
    } catch (e) {
      setStatus({ text: e instanceof Error ? e.message : "Ошибка", error: true });
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm">
        Будут удалены профиль, настройки, избранное, отметки «Не для меня», ваши
        решения, заметки и планы проверки, а также все
        сессии. Общие рыночные данные останутся. Восстановить аккаунт нельзя.
      </p>
      <label>
        Пароль
        <input className="field" type="password" autoComplete="current-password" required maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <label>
        Введите слово «{DELETE_CONFIRMATION}»
        <input className="field" required maxLength={40} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </label>
      <Status {...status} />
      <button
        className="button-secondary text-red-300"
        type="submit"
        disabled={pending || confirm.trim().toLowerCase() !== DELETE_CONFIRMATION}
      >
        {pending ? "Удаление…" : "Удалить аккаунт навсегда"}
      </button>
    </form>
  );
}
