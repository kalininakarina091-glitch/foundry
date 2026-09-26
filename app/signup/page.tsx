import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0B0B] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">
            Foundry<span className="text-[#FF6B00]">.</span>
          </h1>
          <p className="mt-2 text-neutral-400">
            От рыночной возможности до работающего бизнеса.
          </p>
        </div>

        <div className="foundry-card rounded-2xl p-8">
          <form className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-neutral-400">Имя</label>
              <input
                type="text"
                placeholder="Ракиб"
                className="w-full rounded-xl border border-[#2a2a2a] bg-[#121212] px-4 py-3 text-white placeholder-neutral-500 focus:border-[#FF6B00] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-400">
                Email
              </label>
              <input
                type="email"
                placeholder="you@email.com"
                className="w-full rounded-xl border border-[#2a2a2a] bg-[#121212] px-4 py-3 text-white placeholder-neutral-500 focus:border-[#FF6B00] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-400">
                Пароль
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#2a2a2a] bg-[#121212] px-4 py-3 text-white placeholder-neutral-500 focus:border-[#FF6B00] focus:outline-none"
              />
            </div>
            <Link
              href="/dashboard"
              className="block rounded-xl bg-[#FF6B00] py-3 text-center font-medium text-black hover:bg-[#ff7d1f]"
            >
              Открыть прототип
            </Link>
          </form>

          <p className="mt-4 text-center text-sm text-neutral-400">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-[#FF6B00] hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
