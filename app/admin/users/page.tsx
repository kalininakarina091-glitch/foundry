import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { PageHeader } from "@/components/product-ui";
import AdminToggle from "@/components/admin-toggle";
export const dynamic = "force-dynamic";
const dateFormat = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" });
// Administrator-only overview of accounts. Shows activity counts, never
// passwords, sessions tokens, notes or plan contents.
export default async function AdminUsersPage() {
  const me = await currentUser();
  if (!me?.isAdmin) notFound();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      isAdmin: true,
      createdAt: true,
      profile: { select: { onboardingCompleted: true } },
      _count: { select: { saved: true, decisions: true, plans: true } },
    },
  });
  const admins = users.filter((u) => u.isAdmin).length;
  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Администрирование"
        title="Пользователи"
        description={`Всего ${users.length}, администраторов ${admins}. Администраторы управляют источниками и обработкой; последнего администратора снять нельзя.`}
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="p-3">Пользователь</th>
              <th className="p-3">Регистрация</th>
              <th className="p-3">Профиль</th>
              <th className="p-3">Избранное · решения · планы</th>
              <th className="p-3">Роль</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border align-top">
                <td className="p-3">
                  <p className="font-medium">
                    {u.name}
                    {u.id === me.id ? " (вы)" : ""}
                  </p>
                  <p className="text-muted-foreground">{u.email}</p>
                </td>
                <td className="p-3">{dateFormat.format(u.createdAt)}</td>
                <td className="p-3">{u.profile?.onboardingCompleted ? "заполнен" : "не заполнен"}</td>
                <td className="p-3 tabular-nums">
                  {u._count.saved} · {u._count.decisions} · {u._count.plans}
                </td>
                <td className="p-3">{u.isAdmin ? "Администратор" : "Пользователь"}</td>
                <td className="p-3">
                  <AdminToggle userId={u.id} isAdmin={u.isAdmin} self={u.id === me.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
