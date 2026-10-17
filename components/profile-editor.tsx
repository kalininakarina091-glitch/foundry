"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  type PersonalProfile,
  roles,
  goals,
  industries,
  businessTypes,
  budgets,
  teams,
  times,
  skills,
  markets,
  completeProfile,
} from "@/lib/personal-profile";
const steps = [
  "Кто вы?",
  "Что вы ищете?",
  "Интересы и индустрии",
  "Ресурсы и предпочтения",
  "Ваши навыки",
  "Целевые рынки",
];
export default function ProfileEditor({
  initial,
  settings = false,
}: {
  initial: PersonalProfile;
  settings?: boolean;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState(initial),
    [step, setStep] = useState(initial.onboardingStep),
    [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  function single(
    key: "role" | "budget" | "team" | "time",
    options: Record<string, string>,
  ) {
    return (
      <div className="onboard-options">
        {Object.entries(options).map(([id, label]) => (
          <button
            type="button"
            key={id}
            aria-pressed={profile[key] === id}
            className={profile[key] === id ? "selected" : ""}
            onClick={() => setProfile({ ...profile, [key]: id })}
          >
            {label}
            <span>{profile[key] === id ? "✓" : "+"}</span>
          </button>
        ))}
      </div>
    );
  }
  function multi(
    key: "goals" | "industries" | "businessTypes" | "skills" | "markets",
    options: Record<string, string>,
  ) {
    return (
      <div className="onboard-options chips">
        {Object.entries(options).map(([id, label]) => (
          <button
            type="button"
            key={id}
            aria-pressed={profile[key].includes(id)}
            className={profile[key].includes(id) ? "selected" : ""}
            onClick={() =>
              setProfile({
                ...profile,
                [key]: profile[key].includes(id)
                  ? profile[key].filter((v) => v !== id)
                  : [...profile[key], id],
              })
            }
          >
            {label}
            <span>{profile[key].includes(id) ? "✓" : "+"}</span>
          </button>
        ))}
      </div>
    );
  }
  async function save(next: number, finish = false, skip = false) {
    setPending(true);
    setMessage("");
    const body = {
      ...profile,
      onboardingStep: next,
      onboardingCompleted: finish,
      onboardingSkipped: skip,
    };
    try {
      const r = await fetch("/api/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setProfile(body);
      // Restart is a one-time entry action; reload must resume the saved step.
      if (!settings && new URLSearchParams(window.location.search).get("restart") === "1")
        window.history.replaceState(null, "", "/onboarding");
      if (skip) router.push("/opportunities?view=for-you");
      else if (finish && !settings) router.push("/profile-ready");
      else {
        setStep(next);
        setMessage("Ответы сохранены в аккаунте.");
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ошибка сети");
    } finally {
      setPending(false);
    }
  }
  const valid = [
    !!profile.role,
    profile.goals.length > 0,
    profile.industries.length > 0,
    !!(profile.budget && profile.team && profile.time),
    profile.skills.length > 0,
    profile.markets.length > 0,
  ][step];
  const sections = [
    single("role", roles),
    <div key="goals">
      {multi("goals", goals)}
      <h3>Предпочтительные типы бизнеса · необязательно</h3>
      {multi("businessTypes", businessTypes)}
    </div>,
    multi("industries", industries),
    <div key="resources">
      <h3>Доступный бюджет</h3>
      {single("budget", budgets)}
      <h3>Команда</h3>
      {single("team", teams)}
      <h3>Доступное время</h3>
      {single("time", times)}
    </div>,
    multi("skills", skills),
    multi("markets", markets),
  ];
  return (
    <section className="account-panel onboarding-panel">
      <Link className="account-brand" href="/opportunities">
        ✦ Foundry
      </Link>
      <p>{settings ? "Персонализация аккаунта" : `Шаг ${step + 1} из 6`}</p>
      {!settings && (
        <progress value={step + 1} max={6} aria-label="Прогресс настройки" />
      )}
      <h1>{settings ? "Ваш профиль возможностей" : steps[step]}</h1>
      <p>
        Выбирайте то, что важно вам. Эти ответы влияют только на Match Score.
      </p>
      {settings
        ? sections.map((section, i) => (
            <section className="profile-section" key={steps[i]}>
              <h2>{steps[i]}</h2>
              {section}
            </section>
          ))
        : sections[step]}
      <p role="status" className="account-hint">
        {message}
      </p>
      <div className="onboard-actions">
        {!settings && step > 0 && (
          <button
            disabled={pending}
            className="button-secondary"
            onClick={() => save(step - 1)}
          >
            ← Назад
          </button>
        )}
        <button
          disabled={pending || (!settings && !valid)}
          className="button-primary"
          onClick={() =>
            save(
              settings ? step : Math.min(5, step + 1),
              settings ? completeProfile(profile) : step === 5,
            )
          }
        >
          {pending
            ? "Сохранение…"
            : settings
              ? "Сохранить профиль"
              : step === 5
                ? "Завершить настройку →"
                : "Продолжить →"}
        </button>
      </div>
      {!settings && (
        <button
          disabled={pending}
          className="account-skip"
          onClick={() => save(step, false, true)}
        >
          Сохранить и пропустить пока
        </button>
      )}
      {settings && (
        <Link className="account-skip" href="/onboarding?restart=1">
          Пройти onboarding заново →
        </Link>
      )}
      <p className="account-hint">
        Незаполненный профиль даёт ограниченную персонализацию. Ответы можно
        изменить в настройках.
      </p>
    </section>
  );
}
