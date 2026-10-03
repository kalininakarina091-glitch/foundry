import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
export default async function Ready() {
  const user = await requireUser();
  const p = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  if (!p?.onboardingCompleted) redirect("/onboarding");
  return (
    <main className="account-screen">
      <section className="account-panel">
        <span className="account-brand">✦ Foundry</span>
        <h1>Ваш профиль готов</h1>
        <p>
          Предпочтения сохранены. Во вкладке «Для вас» возможности ранжируются
          по вашему профилю.
        </p>
        <p>
          Match Score показывает соответствие. Opportunity Score и Validation
          оцениваются независимо.
        </p>
        <Link className="button-primary" href="/opportunities?view=for-you">
          Перейти к возможностям →
        </Link>
        <Link className="account-skip" href="/settings/personalization">
          Открыть настройки
        </Link>
      </section>
    </main>
  );
}
