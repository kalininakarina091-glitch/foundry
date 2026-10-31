"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function AdminToggle({
  userId,
  isAdmin,
  self,
}: {
  userId: string;
  isAdmin: boolean;
  self: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function toggle() {
    if (
      self &&
      isAdmin &&
      !window.confirm("Снять права администратора с себя? Вы потеряете доступ к этой странице.")
    )
      return;
    setPending(true);
    setError("");
    try {
      const r = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: !isAdmin }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Не удалось изменить права.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setPending(false);
    }
  }
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button className="button-secondary" disabled={pending} onClick={toggle}>
        {pending ? "…" : isAdmin ? "Снять администратора" : "Сделать администратором"}
      </button>
      {error && (
        <span role="alert" className="text-xs text-red-300">
          {error}
        </span>
      )}
    </span>
  );
}
