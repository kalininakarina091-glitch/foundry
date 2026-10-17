"use client";
import { useState } from "react";
export default function LogoutButton() {
  const [error, setError] = useState("");
  return (
    <>
      <button
        className="button-secondary"
        onClick={async () => {
          try {
            const r = await fetch("/api/auth/logout", { method: "POST" });
            if (!r.ok) throw new Error();
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Discard all account-scoped client memory on logout.
            window.location.assign("/login");
          } catch {
            setError("Не удалось выйти. Повторите.");
          }
        }}
      >
        Выйти
      </button>
      {error && <span role="alert">{error}</span>}
    </>
  );
}
