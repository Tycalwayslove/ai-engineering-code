import { ApiClient, type FactoryStatus } from "@ai-code/sdk";

const api = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000",
});

async function loadFactoryStatus(): Promise<FactoryStatus | null> {
  try {
    return await api.getFactoryStatus();
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const factoryStatus = await loadFactoryStatus();

  return (
    <main className="status-shell">
      <section className="status-summary" aria-labelledby="factory-title">
        <p className="eyebrow">Mobile factory surface</p>
        <h1 id="factory-title">AI Code H5</h1>
        <p>
          {factoryStatus
            ? `${factoryStatus.name} ${factoryStatus.version} is ${factoryStatus.status}.`
            : "Factory API is not reachable from this surface yet."}
        </p>
      </section>

      <section className="capability-list" aria-label="Factory capabilities">
        {(factoryStatus?.capabilities ?? []).map((capability) => (
          <article className="capability-card" key={capability.id}>
            <span
              className={`status-dot status-dot-${capability.status}`}
              aria-hidden="true"
            />
            <div>
              <h2>{capability.label}</h2>
              <p>{capability.summary}</p>
            </div>
          </article>
        ))}
        {!factoryStatus ? (
          <p className="empty-state">Start the backend to load capabilities.</p>
        ) : null}
      </section>
    </main>
  );
}
