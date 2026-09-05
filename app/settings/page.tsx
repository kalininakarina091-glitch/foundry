export default function SettingsPage() {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-white">Settings</h1>
      <p className="mt-2 text-neutral-400">Manage your account and preferences</p>

      <div className="mt-8 space-y-6">
        <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Name</label>
              <input
                type="text"
                defaultValue="Alex"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Email</label>
              <input
                type="email"
                defaultValue="alex@email.com"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button className="bg-emerald-500 text-black font-medium px-6 py-2 rounded-lg hover:bg-emerald-400 transition-colors">
              Save
            </button>
          </div>
        </section>

        <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Preferences</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 text-neutral-300">
              <input type="checkbox" defaultChecked className="rounded bg-neutral-800" />
              Daily opportunity digest
            </label>
            <label className="flex items-center gap-3 text-neutral-300">
              <input type="checkbox" defaultChecked className="rounded bg-neutral-800" />
              Email notifications
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}