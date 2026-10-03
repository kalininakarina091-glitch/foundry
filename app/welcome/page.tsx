import Link from "next/link";
import { requireUser } from "@/lib/auth";
export default async function Welcome() {
  const user = await requireUser();
  return (
    <main className="account-screen">
      <section className="account-panel">
        <span className="account-brand">✦ Foundry</span>
        <h1>Добро пожаловать, {user.name}!</h1>
        <p>
          Несколько коротких шагов помогут подобрать возможности под ваши
          интересы и ресурсы.
        </p>
        <ol className="welcome-steps">
          {[
            "Кто вы",
            "Что вы ищете",
            "Интересы и индустрии",
            "Ресурсы",
            "Навыки",
            "Целевые рынки",
          ].map((s, i) => (
            <li key={s}>
              <span>{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
        <Link className="button-primary" href="/onboarding">
          Давайте начнём →
        </Link>
        <p>На любом шаге можно сохранить ответы и пропустить настройку.</p>
      </section>
    </main>
  );
}
