import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { demotionBlocked } from "@/lib/account";
// Grants or removes administrator rights. Proxy already limits mutations to
// admins; the route checks again so it never relies on one layer only.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await currentUser();
  if (!actor?.isAdmin)
    return NextResponse.json({ error: "Только для администратора." }, { status: 403 });
  const body = z
    .object({ isAdmin: z.boolean() })
    .strict()
    .safeParse(await request.json().catch(() => null));
  if (!body.success)
    return NextResponse.json({ error: "Укажите isAdmin." }, { status: 400 });
  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id }, select: { isAdmin: true } });
  if (!target) return NextResponse.json({ error: "Пользователь не найден." }, { status: 404 });
  if (
    !body.data.isAdmin &&
    demotionBlocked(target.isAdmin, await prisma.user.count({ where: { isAdmin: true } }))
  )
    return NextResponse.json(
      { error: "Это единственный администратор. Сначала назначьте другого." },
      { status: 409 },
    );
  await prisma.user.update({ where: { id }, data: { isAdmin: body.data.isAdmin } });
  return NextResponse.json({ id, isAdmin: body.data.isAdmin });
}
