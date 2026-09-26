export const mockOpportunities = [
  {
    id: "1",
    title: "AI-ассистент по комплаенсу для малого бизнеса",
    industry: "AI",
    score: 91,
    summary:
      "Новое регулирование + рост спроса + почти нет доступных решений для малого бизнеса.",
    problem:
      "Малые компании не понимают, какие требования к ним применяются и что именно нужно сделать.",
    customer: "Компании 10–100 сотрудников",
    whyNow:
      "Новые регуляторные требования + рост спроса + отсутствие доступных решений для SMB.",
    mvp: "Анкета компании → база требований → AI-оценка → план действий → генерация документов.",
    risks: [
      "Юридическая ответственность",
      "Точность рекомендаций",
      "Изменения регулирования",
    ],
    recommendation: "BUILD",
    painLevel: 9,
    timing: "Очень сильный",
    competition: "Средняя",
    marketGap: "Большинство решений ориентированы на enterprise.",
    businessModel: "SaaS: €49–199 / месяц",
    complexity: "Средняя",
    existingSolutions: 12,
  },
  {
    id: "2",
    title: "AI-инструмент прибыльности для фриланс-агентств",
    industry: "SaaS",
    score: 87,
    summary:
      "Фрилансеры и агентства не видят, какие проекты реально приносят прибыль.",
    problem: "Нет прозрачности по юнит-экономике проектов и загрузке команды.",
    customer: "Фрилансеры и небольшие агентства",
    whyNow: "Рост gig-экономики и давление на маржу агентств.",
    mvp: "Учёт времени → себестоимость проекта → дашборд прибыльности.",
    risks: ["Рынок трекеров времени уже плотный"],
    recommendation: "RESEARCH MORE",
    painLevel: 8,
    timing: "Сильный",
    competition: "Высокая",
    marketGap: "Мало продуктов, которые считают прибыль, а не часы.",
    businessModel: "SaaS: €19–79 / месяц",
    complexity: "Низкая",
    existingSolutions: 28,
  },
  {
    id: "3",
    title: "Автоматическое исследование клиентов для micro-SaaS",
    industry: "AI",
    score: 84,
    summary:
      "Инди-основателям нужны инсайты клиентов без отдельной research-команды.",
    problem: "Продукты запускают без разговоров с клиентами.",
    customer: "Indie-хакеры и основатели micro-SaaS",
    whyNow: "AI сделал дешёвый customer research реалистичным.",
    mvp: "Сбор сигналов → извлечение болей → скрипт интервью.",
    risks: ["Качество данных", "Ограничения API"],
    recommendation: "BUILD",
    painLevel: 8,
    timing: "Сильный",
    competition: "Средняя",
    marketGap: "Большинство инструментов — для корпоративных research-команд.",
    businessModel: "SaaS: €29–99 / месяц",
    complexity: "Средняя",
    existingSolutions: 9,
  },
  {
    id: "4",
    title: "Автоматизация администрирования в здравоохранении",
    industry: "Здравоохранение",
    score: 81,
    summary: "Клиники тратят часы на бумажную работу и страховые процессы.",
    problem: "Административная нагрузка съедает время на пациентов.",
    customer: "Небольшие клиники и частные практики",
    whyNow: "Дефицит персонала после пандемии.",
    mvp: "Формы приёма → обработка документов → помощник по страховке.",
    risks: ["Высокая регуляторная сложность", "Длинный цикл продаж"],
    recommendation: "SKIP",
    painLevel: 9,
    timing: "Средний",
    competition: "Средняя",
    marketGap: "Мало простых решений для небольших клиник.",
    businessModel: "SaaS: €199–799 / месяц",
    complexity: "Высокая",
    existingSolutions: 16,
  },
  {
    id: "5",
    title: "Автоматизация закупок ПО для SMB",
    industry: "SaaS",
    score: 78,
    summary:
      "Малый бизнес переплачивает за софт из-за отсутствия процесса закупок.",
    problem: "Нет единого места, чтобы управлять подписками и использованием.",
    customer: "SMB 20–200 сотрудников",
    whyNow: "Разрастание софтового стека стало массовой болью.",
    mvp: "Обнаружение подписок → анализ использования → рекомендации по экономии.",
    risks: ["Сложность интеграций"],
    recommendation: "RESEARCH MORE",
    painLevel: 7,
    timing: "Сильный",
    competition: "Средняя",
    marketGap: "Enterprise-инструменты слишком тяжёлые для SMB.",
    businessModel: "SaaS: €39–149 / месяц",
    complexity: "Средняя",
    existingSolutions: 14,
  },
];

export const industries = ["Все", "SaaS", "AI", "Финтех", "Здравоохранение"];

export const recommendationLabels: Record<string, string> = {
  BUILD: "Строить",
  SKIP: "Не рекомендуется",
  "RESEARCH MORE": "Исследовать",
};

export const kpis = [
  {
    label: "Общая выручка",
    value: "$248,320",
    delta: "+18%",
    positive: true,
    prev: "Пред: $210,450",
  },
  {
    label: "Активные пользователи",
    value: "12,840",
    delta: "+9%",
    positive: true,
    prev: "Пред: 11,780",
  },
  {
    label: "Коэффициент конверсии",
    value: "3.8%",
    delta: "+0.6%",
    positive: true,
    prev: "Пред: 3.2%",
  },
  {
    label: "Средний чек",
    value: "$72.40",
    delta: "-4%",
    positive: false,
    prev: "Пред: $75.40",
  },
  {
    label: "Уверенность AI",
    value: "87%",
    delta: "+3%",
    positive: true,
    prev: "Пред: 84%",
  },
];

export const trafficSources = [
  { name: "Органика", value: 38, color: "#FF6B00" },
  { name: "Платный трафик", value: 26, color: "#6B6B6B" },
  { name: "Прямой", value: 18, color: "#C8C8C8" },
  { name: "Прочее", value: 18, color: "#3A3A3A" },
];

export const aiRecommendations = [
  {
    id: "pricing",
    title: "Повысить цену продукта A на 5%",
    confidence: 91,
    impact: "+$12,400 выручки",
    impactPositive: true,
    reason: "Высокий спрос + низкая чувствительность к цене",
    cta: "Применить изменения",
    href: "/opportunities/1",
  },
  {
    id: "ads",
    title: "Снизить расходы на кампанию X",
    confidence: 84,
    impact: "−$3,200 затрат",
    impactPositive: false,
    reason: "Низкий ROI за последние 14 дней",
    cta: "Открыть кампанию",
    href: "/reports",
  },
  {
    id: "segment",
    title: "Сфокусироваться на сегменте вернувшихся",
    confidence: 88,
    impact: "+18% потенциал конверсии",
    impactPositive: true,
    reason: "Выше вовлечённость и намерение купить",
    cta: "Изучить сегмент",
    href: "/insights",
  },
];

export const dataSources = [
  { name: "Reddit", items: 1840, status: "Активен", health: 98 },
  { name: "Hacker News", items: 412, status: "Активен", health: 96 },
  { name: "Product Hunt", items: 228, status: "Активен", health: 94 },
  { name: "GitHub", items: 670, status: "Активен", health: 91 },
  { name: "Google Trends", items: 156, status: "Активен", health: 99 },
  { name: "Новости / RSS", items: 890, status: "Активен", health: 88 },
  { name: "App Store отзывы", items: 540, status: "Активен", health: 85 },
  { name: "Google Play", items: 490, status: "Активен", health: 84 },
  { name: "G2", items: 120, status: "Ограничен", health: 72 },
  { name: "Capterra", items: 96, status: "Ограничен", health: 70 },
  { name: "Вакансии", items: 310, status: "Активен", health: 90 },
  { name: "Публичные датасеты", items: 64, status: "Активен", health: 93 },
];

export const alerts = [
  {
    id: "a1",
    title: "Новый регуляторный сигнал в ЕС",
    body: "Рост упоминаний GDPR-смежных требований для SMB на 46% за 7 дней.",
    level: "high",
    time: "12 мин назад",
  },
  {
    id: "a2",
    title: "Кластер жалоб на G2",
    body: "Пользователи массово жалуются на цену и сложность текущих compliance-инструментов.",
    level: "medium",
    time: "1 ч назад",
  },
  {
    id: "a3",
    title: "GitHub: рост стека вокруг X",
    body: "Звёзды и issues по категории выросли на 120% за месяц.",
    level: "low",
    time: "3 ч назад",
  },
];

export const teamMembers = [
  { name: "Ракиб Исмаилов", role: "Основатель", email: "rakib@foundry.ai" },
  {
    name: "Анна Ковалёва",
    role: "Исследователь рынка",
    email: "anna@foundry.ai",
  },
  { name: "Илья Петров", role: "Product", email: "ilya@foundry.ai" },
];

export function chartSeries(range: "24H" | "7D" | "30D" | "90D") {
  const points =
    range === "24H" ? 12 : range === "7D" ? 7 : range === "30D" ? 12 : 16;

  const revenue = Array.from({ length: points }, (_, i) => {
    const wave = Math.sin(i / 2.2) * 18 + i * 3.2 + 42;
    return Math.round(wave + (i % 3) * 4);
  });

  const conversion = Array.from({ length: points }, (_, i) => {
    const wave = Math.sin(i / 1.7 + 0.6) * 14 + 28 + i * 1.4;
    return Math.round(wave);
  });

  return { revenue, conversion };
}
