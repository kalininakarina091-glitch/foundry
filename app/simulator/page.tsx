"use client";
import { DemoNotice } from "@/components/product-ui";

import { useState } from "react";

export default function SimulatorPage() {
  const [price, setPrice] = useState(5);
  const [budget, setBudget] = useState(24000);
  const [traffic, setTraffic] = useState(12);

  const revenueLift = Math.round(
    12400 * (price / 5) + budget * 0.08 + traffic * 180,
  );
  const conversionLift = (0.6 + traffic * 0.04 - price * 0.03).toFixed(1);

  return (
    <div className="px-8 py-7">
      <DemoNotice />
      <h1 className="text-3xl font-semibold text-white">Симулятор стратегии</h1>
      <p className="mt-2 max-w-2xl text-neutral-400">
        Смотрите, как изменение цены, бюджета и трафика влияет на гипотезу
        запуска. Это модель, а не гарантия результата.
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="foundry-card rounded-2xl p-6">
          <Control
            label="Изменение цены (%)"
            value={`+${price}%`}
            min={0}
            max={20}
            current={price}
            onChange={setPrice}
          />
          <Control
            label="Рекламный бюджет"
            value={`$${budget.toLocaleString("en-US")}`}
            min={5000}
            max={50000}
            step={1000}
            current={budget}
            onChange={setBudget}
          />
          <Control
            label="Рост трафика (%)"
            value={`+${traffic}%`}
            min={0}
            max={40}
            current={traffic}
            onChange={setTraffic}
          />
        </article>

        <article className="foundry-card rounded-2xl p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Прогноз эффекта
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-neutral-500">Потенциальная выручка</p>
              <p className="text-3xl font-semibold text-emerald-400">
                +${revenueLift.toLocaleString("en-US")}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Изменение конверсии</p>
              <p className="text-3xl font-semibold text-white">
                {conversionLift} п.п.
              </p>
            </div>
            <p className="text-sm leading-relaxed text-neutral-500">
              AI использует текущие сигналы спроса и чувствительность к цене.
              Перед запуском проверьте гипотезу интервью и лендингом.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}

function Control({
  label,
  value,
  min,
  max,
  step = 1,
  current,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step?: number;
  current: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-neutral-400">{label}</span>
        <span className="font-medium text-white">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
        className="foundry-range w-full"
      />
    </div>
  );
}
