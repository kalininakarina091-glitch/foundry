import Link from "next/link";
import { EmptyState } from "@/components/product-ui";
export default function NotFound() {
  return (
    <div className="page-container">
      <EmptyState
        title="Страница не найдена"
        description="Возможность могла быть удалена или ссылка относится к демонстрационному примеру."
      >
        <Link href="/opportunities" className="button-primary">
          К возможностям
        </Link>
        <Link href="/opportunities?mode=demo" className="button-secondary">
          Демо-примеры
        </Link>
      </EmptyState>
    </div>
  );
}
