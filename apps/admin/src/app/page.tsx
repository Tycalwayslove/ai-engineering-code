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
  const capabilities = factoryStatus?.capabilities ?? [];
  const readyCount = capabilities.filter(
    (capability) => capability.status === "ready",
  ).length;
  const plannedCount = capabilities.filter(
    (capability) => capability.status === "planned",
  ).length;

  return (
    <main className="admin-shell">
      <section className="admin-header" aria-labelledby="admin-title">
        <p className="eyebrow">Software factory console</p>
        <h1 id="admin-title">AI Code Admin</h1>
        <p>
          {factoryStatus
            ? `${factoryStatus.name} ${factoryStatus.version} 当前状态为 ${factoryStatus.status}。`
            : "Factory API 当前不可达，请先启动后端服务。"}
        </p>
      </section>

      <section className="metric-grid" aria-label="Factory summary">
        <article>
          <span>能力总数</span>
          <strong>{capabilities.length}</strong>
        </article>
        <article>
          <span>Ready</span>
          <strong>{readyCount}</strong>
        </article>
        <article>
          <span>Planned</span>
          <strong>{plannedCount}</strong>
        </article>
      </section>

      <section className="status-panel" aria-label="Factory capability status">
        <div className="panel-heading">
          <h2>能力清单</h2>
          <span>{factoryStatus?.status ?? "offline"}</span>
        </div>
        <div className="capability-grid">
          {capabilities.map((capability) => (
            <article className="capability-card" key={capability.id}>
              <div className="capability-card-header">
                <h3>{capability.label}</h3>
                <strong>{capability.status}</strong>
              </div>
              <p>{capability.summary}</p>
              <code>{capability.source}</code>
            </article>
          ))}
          {!factoryStatus ? (
            <p className="empty-state">
              运行 `pnpm dev:api` 提示的 FastAPI 命令后即可查看能力清单。
            </p>
          ) : null}
        </div>
      </section>

      {factoryStatus ? (
        <section className="status-panel" aria-label="Recommended next actions">
          <div className="panel-heading">
            <h2>下一步行动</h2>
          </div>
          <ol className="action-list">
            {factoryStatus.nextActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ol>
        </section>
      ) : null}
    </main>
  );
}
