import Link from "next/link";
export default function LoginPage() {
  return (
    <div className="page-container">
      <h1 className="page-title">Локальный прототип</h1>
      <p className="my-6 text-muted-foreground">
        Авторизация и аккаунты пока не реализованы. Не вводите пароли: рабочее
        пространство открывается без входа.
      </p>
      <Link className="button-primary" href="/dashboard">
        Открыть рабочее пространство
      </Link>
    </div>
  );
}
