// "What to do next" on the dashboard, from the user's own decisions, plans
// and profile plus shared opportunity data. Pure: no DB access.
export interface ActionOpportunity {
  id: string;
  title: string;
  score: number;
  validated: boolean;
}
export interface NextAction {
  title: string;
  detail: string;
  href: string;
}
const MAX = 4;
export function nextActions(input: {
  opportunities: ActionOpportunity[];
  /** Personal decision status per opportunity id. */
  decisions: Record<string, string>;
  /** Opportunity ids the user already has a plan for. */
  planned: Set<string>;
  /** Opportunity ids the user marked «Не для меня». */
  dismissed: Set<string>;
  profileComplete: boolean;
  /** Pipeline warnings, shown to administrators only. */
  adminWarnings: number | null;
}): NextAction[] {
  const actions: NextAction[] = [];
  const add = (a: NextAction) => {
    if (actions.length < MAX && !actions.some((x) => x.href === a.href)) actions.push(a);
  };
  const byId = new Map(input.opportunities.map((o) => [o.id, o]));
  const active = (status: string) =>
    Object.entries(input.decisions)
      .filter(([id, s]) => s === status && byId.has(id))
      .map(([id]) => byId.get(id)!)
      .sort((a, b) => b.score - a.score);
  const working = [...active("building"), ...active("exploring")];

  if (input.adminWarnings)
    add({
      title: `Pipeline требует внимания: ${input.adminWarnings}`,
      detail: "Подробности и что нажать — в панели состояния на странице сигналов.",
      href: "/signals",
    });
  for (const o of working.filter((o) => !input.planned.has(o.id)))
    add({
      title: `Постройте план проверки: «${o.title}»`,
      detail: "Допущения, кого опросить и дешёвый тест спроса — до разработки.",
      href: `/plan/${encodeURIComponent(o.id)}`,
    });
  for (const o of working.filter((o) => !o.validated))
    add({
      title: `Проверьте на доказательствах: «${o.title}»`,
      detail: "AI-проверка покажет аргументы за и против и главный риск.",
      href: `/validation/${encodeURIComponent(o.id)}`,
    });
  const undecided = input.opportunities
    .filter((o) => !input.decisions[o.id] && !input.dismissed.has(o.id))
    .sort((a, b) => b.score - a.score)[0];
  if (undecided)
    add({
      title: `Посмотрите «${undecided.title}»`,
      detail: `Оценка ${undecided.score}/100, решение ещё не принято: изучать, развивать или отказаться.`,
      href: `/opportunities/${encodeURIComponent(undecided.id)}`,
    });
  if (!input.profileComplete)
    add({
      title: "Заполните профиль",
      detail: "Навыки, бюджет и время делают подборку «Для вас» точнее.",
      href: "/settings/personalization",
    });
  if (!input.opportunities.length)
    add({
      title: "Возможности ещё копятся",
      detail: "Автосбор каждый час добавляет материалы; возможности появляются, когда несколько людей описывают одну проблему.",
      href: "/opportunities?view=all",
    });
  return actions;
}
