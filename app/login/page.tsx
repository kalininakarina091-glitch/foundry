import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Opportunity<span className="text-emerald-400">Scanner</span>
          </h1>
          <p className="mt-2 text-neutral-400">Find what's worth building. Then build it.</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
          <form className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Email</label>
              <input
                type="email"
                placeholder="you@email.com"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button className="w-full bg-emerald-500 text-black font-medium py-3 rounded-lg hover:bg-emerald-400 transition-colors">
              Sign In
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-neutral-400">
            Don't have an account?{" "}
            <Link href="/signup" className="text-emerald-400 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}