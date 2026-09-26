import { DemoNotice } from "@/components/product-ui";
import { mockOpportunities, recommendationLabels } from "@/lib/mock-data";
import Link from "next/link";

export default function ReportsPage() {
  return (
    <div className="px-8 py-7">
      <DemoNotice />
      <h1 className="text-3xl font-semibold text-white">Отчёты</h1>
      <p className="mt-2 text-neutral-400">
        Сводка возможностей, оценок и рекомендаций.
      </p>

      <div className="foundry-card mt-8 overflow-hidden rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#121212] text-neutral-500">
            <tr>
              <th className="px-5 py-3 font-medium">Возможность</th>
              <th className="px-5 py-3 font-medium">Отрасль</th>
              <th className="px-5 py-3 font-medium">Оценка</th>
              <th className="px-5 py-3 font-medium">Рекомендация</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {mockOpportunities.map((item) => (
              <tr key={item.id} className="border-t border-[#2a2a2a]">
                <td className="px-5 py-4 text-white">{item.title}</td>
                <td className="px-5 py-4 text-neutral-400">{item.industry}</td>
                <td className="px-5 py-4 font-semibold text-[#FF6B00]">
                  {item.score}
                </td>
                <td className="px-5 py-4 text-neutral-300">
                  {recommendationLabels[item.recommendation]}
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/opportunities/${item.id}?mode=demo`}
                    className="text-[#FF6B00]"
                  >
                    Открыть
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
