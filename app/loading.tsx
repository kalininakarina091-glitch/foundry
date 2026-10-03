export default function Loading() {
  return (
    <div className="page-container" role="status" aria-live="polite">
      <p className="eyebrow">Foundry</p>
      <p className="mt-4 text-sm text-muted-foreground">Загружаем данные…</p>
      <div aria-hidden className="mt-8 space-y-4 motion-safe:animate-pulse">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 rounded-2xl border border-border bg-card"
          />
        ))}
      </div>
    </div>
  );
}
