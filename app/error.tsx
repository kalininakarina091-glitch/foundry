"use client";
import Link from "next/link";
import { EmptyState } from "@/components/product-ui";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-container" role="alert">
      <EmptyState
        title="Не удалось загрузить данные"
        description="Проверьте доступность базы проекта и повторите попытку. Ошибка загрузки не означает, что возможностей нет."
      >
        <button className="button-primary" onClick={reset}>
          Попробовать снова
        </button>
        <Link href="/opportunities?mode=demo" className="button-secondary">
          Открыть демо
        </Link>
      </EmptyState>
    </div>
  );
}
