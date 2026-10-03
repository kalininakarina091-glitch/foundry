import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { databaseConfigured, DATABASE_DEPLOYMENT_MESSAGE } from "@/lib/deployment";
export default async function Home() {
  if (await currentUser()) redirect("/opportunities?view=for-you");
  return (
    <main className="account-screen">
      <section className="account-panel landing-panel">
        <nav>
          <span className="account-brand">✦ Foundry</span>
          <Link className="button-secondary" href="/login">
            Войти
          </Link>
        </nav>
        <h1>
          Превращайте рыночные сигналы <em>в возможности для вас</em>
        </h1>
        <p>
          Исследуйте реальные материалы, проверяйте гипотезы и выбирайте идеи,
          соответствующие вашим интересам и ресурсам.
        </p>
        <ul>
          <li>Источники и проверяемые доказательства</li>
          <li>Прозрачная персонализация</li>
          <li>Ваши сохранённые возможности</li>
        </ul>
        <Link href="/signup" className="button-primary">
          Начать исследование →
        </Link>
        <p className="account-hint">
          Match Score помогает выбирать. Доказательства помогают проверять.
        </p>
        {!databaseConfigured() && <p role="status">{DATABASE_DEPLOYMENT_MESSAGE}</p>}
      </section>
    </main>
  );
}
