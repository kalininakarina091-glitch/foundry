"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
export default function AuthForm({
  signup = false,
  unavailable,
}: { signup?: boolean; unavailable?: string }) {
  const [error, setError] = useState(""),
    [pending, setPending] = useState(false),
    [show, setShow] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (unavailable) return;
    setPending(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await fetch(`/api/auth/${signup ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error);
      window.location.assign(result.next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сети");
      setPending(false);
    }
  }
  return (
    <main className="account-screen">
      <section className="account-panel">
        <Link href="/" className="account-brand">
          ✦ Foundry
        </Link>
        <h1>{signup ? "Создайте аккаунт" : "С возвращением"}</h1>
        <p>
          Исследуйте возможности. Сохраняйте решения на основе доказательств.
        </p>
        {unavailable && <p role="status">{unavailable}</p>}
        <form onSubmit={submit} className="account-form">
          {signup && (
            <label>
              Имя
              <input
                name="name"
                required
                maxLength={80}
                autoComplete="name"
                className="field"
              />
            </label>
          )}
          <label>
            Email
            <input
              name="email"
              required
              type="email"
              maxLength={254}
              autoComplete="email"
              className="field"
            />
          </label>
          <label>
            Пароль
            <div className="password-field">
              <input
                name="password"
                required
                type={show ? "text" : "password"}
                minLength={signup ? 12 : 1}
                maxLength={128}
                autoComplete={signup ? "new-password" : "current-password"}
                className="field"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? "Скрыть пароль" : "Показать пароль"}
              >
                {show ? "Скрыть" : "Показать"}
              </button>
            </div>
          </label>
          {signup && (
            <small>
              Не менее 12 символов. Подтверждение email и восстановление пароля
              пока не подключены.
            </small>
          )}
          {error && (
            <p role="alert" className="text-red-300">
              {error}
            </p>
          )}
          <button className="button-primary" disabled={pending || !!unavailable}>
            {pending ? "Подождите…" : signup ? "Создать аккаунт →" : "Войти →"}
          </button>
        </form>
        <p>
          {signup ? "Уже есть аккаунт?" : "Первый раз здесь?"}{" "}
          <Link href={signup ? "/login" : "/signup"}>
            {signup ? "Войти" : "Создать аккаунт"}
          </Link>
        </p>
      </section>
    </main>
  );
}
