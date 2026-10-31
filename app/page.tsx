import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { databaseConfigured, DATABASE_DEPLOYMENT_MESSAGE } from "@/lib/deployment";
const steps = [
  {
    n: "01",
    title: "Поиск",
    body: "Foundry каждый час собирает публикации, где люди сами описывают проблему или ищут решение: Ask HN, Reddit, Stack Exchange и другие источники.",
  },
  {
    n: "02",
    title: "Анализ",
    body: "AI выделяет сигналы с дословной цитатой, отбрасывает баг-репорты, новости и рекламу и объединяет похожие проблемы по смыслу.",
  },
  {
    n: "03",
    title: "Проверка",
    body: "Для повторяющейся проблемы формируется гипотеза, а проверка показывает аргументы за и против, главный риск и что изменит вывод.",
  },
  {
    n: "04",
    title: "Решение",
    body: "Сравните возможности, отметьте «Изучаю», «Развиваю» или «Отказ» и получите план дешёвой проверки до разработки.",
  },
];
const scores = [
  {
    title: "Оценка возможности",
    body: "Насколько возможность подкреплена данными: доказательства, спрос, актуальность, упоминания трат. Одинакова для всех.",
  },
  {
    title: "Уверенность проверки",
    body: "Насколько доказательства поддерживают вывод. Это не вероятность успеха бизнеса.",
  },
  {
    title: "Соответствие вам",
    body: "Насколько возможность подходит именно вам: навыки, бюджет, время, команда. Неизвестное не считается совпадением.",
  },
];
export default async function Home() {
  if (await currentUser()) redirect("/dashboard");
  return (
    <main className="account-screen">
      <div className="mx-auto w-full max-w-5xl px-5 py-8">
        <nav className="flex items-center justify-between gap-3">
          <span className="account-brand">✦ Foundry</span>
          <span className="flex gap-2">
            <Link className="button-secondary" href="/login">
              Войти
            </Link>
            <Link className="button-primary" href="/signup">
              Создать аккаунт
            </Link>
          </span>
        </nav>

        <section className="mt-16 max-w-3xl">
          <p className="eyebrow">Поиск и проверка бизнес-возможностей</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Находите идеи там, где люди уже описывают свои проблемы
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Foundry собирает реальные публикации, находит повторяющиеся проблемы
            и честно показывает, каких доказательств хватает, а каких нет, —
            чтобы вы проверили идею до того, как потратить на неё время и деньги.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="button-primary">
              Начать исследование →
            </Link>
            <Link href="/login" className="button-secondary">
              У меня есть аккаунт
            </Link>
          </div>
          {!databaseConfigured() && (
            <p role="status" className="mt-4 text-sm text-amber-300">
              {DATABASE_DEPLOYMENT_MESSAGE}
            </p>
          )}
        </section>

        <section className="foundry-card mt-16 rounded-2xl p-6 md:p-8">
          <h2 className="text-2xl font-semibold">Сигнал ≠ возможность</h2>
          <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
            Одна жалоба или баг-репорт не доказывают, что рынок существует.
            Foundry превращает сигналы в возможность только тогда, когда
            несколько людей из разных мест описывают одну проблему, а если
            данных мало — прямо говорит «недостаточно доказательств».
          </p>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold">Как это работает</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-2">
            {steps.map((s) => (
              <li key={s.n} className="foundry-card rounded-2xl p-5">
                <span className="text-sm text-primary">{s.n}</span>
                <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold">Три оценки, которые не смешиваются</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {scores.map((s) => (
              <div key={s.title} className="foundry-card rounded-2xl p-5">
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">Каждый вывод можно проверить</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              От возможности до первоисточника: сигнал, дословная цитата и
              ссылка на публикацию. Выдуманные цитаты отклоняются автоматически.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Для кого</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Начинающие предприниматели, соло-фаундеры, независимые
              разработчики и небольшие команды, которым нужно проверить идею до
              серьёзных вложений.
            </p>
          </div>
        </section>

        <section className="mt-16 rounded-2xl border border-border p-6 text-center md:p-10">
          <h2 className="text-2xl font-semibold">Начните с реальных проблем, а не с догадок</h2>
          <p className="mt-3 text-muted-foreground">
            Рекомендации помогают принимать решения, но не гарантируют
            коммерческий успех.
          </p>
          <Link href="/signup" className="button-primary mt-6 inline-flex">
            Создать аккаунт →
          </Link>
        </section>
      </div>
    </main>
  );
}
