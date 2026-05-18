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

export default async function AdminPage() {
  const factoryStatus = await loadFactoryStatus();

  return (
    <main className="admin-shell">
      <section className="admin-header" aria-labelledby="admin-title">
        <p className="eyebrow">Operator console</p>
        <h1 id="admin-title">AI Code Admin</h1>
        <p>
          {factoryStatus
            ? `${factoryStatus.name} ${factoryStatus.version} reports ${factoryStatus.status}.`
            : "Factory API is not reachable from the admin console yet."}
        </p>
      </section>

      <section className="status-panel" aria-label="Factory capability status">
        <div className="panel-heading">
          <h2>Factory Status</h2>
          <span>{factoryStatus?.status ?? "offline"}</span>
        </div>
        <div className="capability-table">
          {(factoryStatus?.capabilities ?? []).map((capability) => (
            <div className="capability-row" key={capability.id}>
              <span>{capability.label}</span>
              <strong>{capability.status}</strong>
            </div>
          ))}
          {!factoryStatus ? (
            <p className="empty-state">
              Start the backend to inspect capabilities.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
