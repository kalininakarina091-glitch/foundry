import { z } from "zod";
export const roles = {
  beginner: "Начинающий предприниматель",
  founder: "Действующий предприниматель",
  developer: "Разработчик",
  marketer: "Маркетолог",
  investor: "Инвестор",
  student: "Студент",
  other: "Другое",
};
export const goals = {
  first: "Идея для первого бизнеса",
  existing: "Новый проект для существующего бизнеса",
  income: "Дополнительный источник дохода",
  saas: "SaaS-продукт",
  marketplace: "Маркетплейс",
  service: "Сервисный бизнес",
  mobile: "Мобильное приложение",
  explore: "Просто изучаю рынок",
};
export const industries = {
  ai: "AI и машинное обучение",
  productivity: "Продуктивность",
  fintech: "Финтех",
  ecommerce: "E-commerce",
  healthcare: "Здравоохранение",
  education: "Образование",
  creator: "Creator Economy",
  marketing: "Маркетинг",
  realestate: "Недвижимость",
  sustainability: "Sustainability",
  hr: "HR и рекрутинг",
  legal: "Legal Tech",
  travel: "Travel",
  food: "Food & Beverage",
  gaming: "Gaming",
  deeptech: "Deep Tech",
  other: "Другое",
};
export const businessTypes = {
  saas: "SaaS",
  service: "Сервисный бизнес",
  tool: "Инструмент",
  automation: "Автоматизация",
  marketplace: "Маркетплейс",
  mobile: "Мобильное приложение",
};
export const budgets = {
  micro: "$0–$1K",
  small: "$1K–$10K",
  medium: "$10K–$100K",
  large: "$100K+",
};
export const teams = {
  solo: "Один / solo founder",
  cofounder: "Есть сооснователь",
  team: "Есть команда",
};
export const times = {
  part: "Part-time · 5–10 ч/нед",
  half: "Half-time · 10–20 ч/нед",
  full: "Full-time · 20+ ч/нед",
};
export const skills = {
  development: "Development",
  design: "Design",
  marketing: "Marketing",
  sales: "Sales",
  content: "Content Creation",
  product: "Product",
  data: "Data Analysis",
  operations: "Operations",
  strategy: "Business Strategy",
  project: "Project Management",
  community: "Community Building",
  finance: "Finance",
  nocode: "No-code Tools",
  other: "Other",
};
export const markets = {
  global: "Global",
  us: "US",
  europe: "Europe",
  asia: "Asia",
  other: "Other",
};
const choice = (options: Record<string, string>) =>
  z.string().refine((v) => Object.hasOwn(options, v), "Неизвестный вариант");
const many = (options: Record<string, string>) =>
  z
    .array(choice(options))
    .max(Object.keys(options).length)
    .transform((v) => [...new Set(v)]);
export const profileSchema = z
  .object({
    role: choice(roles).nullable(),
    goals: many(goals),
    industries: many(industries),
    businessTypes: many(businessTypes),
    budget: choice(budgets).nullable(),
    team: choice(teams).nullable(),
    time: choice(times).nullable(),
    skills: many(skills),
    markets: many(markets),
    onboardingStep: z.number().int().min(0).max(5),
    onboardingCompleted: z.boolean(),
    onboardingSkipped: z.boolean(),
  })
  .strict();
export type PersonalProfile = z.infer<typeof profileSchema>;
export const emptyProfile: PersonalProfile = {
  role: null,
  goals: [],
  industries: [],
  businessTypes: [],
  budget: null,
  team: null,
  time: null,
  skills: [],
  markets: [],
  onboardingStep: 0,
  onboardingCompleted: false,
  onboardingSkipped: false,
};
export function completeProfile(p: PersonalProfile) {
  return !!(
    p.role &&
    p.goals.length &&
    p.industries.length &&
    p.budget &&
    p.team &&
    p.time &&
    p.skills.length &&
    p.markets.length
  );
}
export function decodeProfile(
  row: Record<string, unknown> | null,
): PersonalProfile {
  if (!row) return { ...emptyProfile };
  const value = { ...emptyProfile };
  for (const key of Object.keys(value) as (keyof PersonalProfile)[]) {
    let v = row[key];
    if (
      ["goals", "industries", "businessTypes", "skills", "markets"].includes(
        key,
      )
    ) {
      try {
        v = JSON.parse(String(v));
      } catch {
        v = [];
      }
    }
    Object.assign(value, { [key]: v });
  }
  const parsed = profileSchema.safeParse(value);
  return parsed.success ? parsed.data : { ...emptyProfile };
}
export function encodeProfile(p: PersonalProfile) {
  return {
    ...p,
    goals: JSON.stringify(p.goals),
    industries: JSON.stringify(p.industries),
    businessTypes: JSON.stringify(p.businessTypes),
    skills: JSON.stringify(p.skills),
    markets: JSON.stringify(p.markets),
  };
}
