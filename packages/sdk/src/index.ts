import type {
  AgentTurnRequest,
  AgentTurnResponse,
  CalendarEvent,
  ConfirmExecutionPlanRequest,
  ExecutionLedgerItem,
  ExecutionPlan,
  ExpenseRecord,
  FactoryStatus,
  HealthStatus,
  Reminder,
  VersionInfo,
} from "@ai-code/shared-types";

export type {
  AgentTurnRequest,
  AgentTurnResponse,
  CalendarEvent,
  ConfirmationCard,
  ConfirmExecutionPlanRequest,
  DomainAction,
  DomainActionStatus,
  DomainActionType,
  DomainName,
  ExecutionLedgerItem,
  ExecutionPlan,
  ExecutionPlanStatus,
  ExpenseRecord,
  FactoryCapability,
  FactoryCapabilityStatus,
  FactoryStatus,
  Reminder,
  RiskLevel,
} from "@ai-code/shared-types";

export type ApiClientOptions = {
  baseUrl: string;
  getAuthToken?: () => string | Promise<string>;
};

export class ApiClient {
  private readonly baseUrl: string;
  private readonly getAuthToken?: () => string | Promise<string>;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.getAuthToken = options.getAuthToken;
  }

  async getHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>("/health");
  }

  async getVersion(): Promise<VersionInfo> {
    return this.request<VersionInfo>("/version");
  }

  async getFactoryStatus(): Promise<FactoryStatus> {
    return this.request<FactoryStatus>("/factory/status");
  }

  async submitAgentTurn(request: AgentTurnRequest): Promise<AgentTurnResponse> {
    return this.request<AgentTurnResponse>("/agent/turns", {
      body: JSON.stringify(request),
      method: "POST",
    });
  }

  async confirmExecutionPlan(
    planId: string,
    request: ConfirmExecutionPlanRequest,
  ): Promise<AgentTurnResponse> {
    return this.request<AgentTurnResponse>(
      `/execution-plans/${encodeURIComponent(planId)}/confirm`,
      {
        body: JSON.stringify(request),
        method: "POST",
      },
    );
  }

  async rejectExecutionPlan(planId: string): Promise<ExecutionPlan> {
    return this.request<ExecutionPlan>(
      `/execution-plans/${encodeURIComponent(planId)}/reject`,
      {
        method: "POST",
      },
    );
  }

  async getExecutionPlan(planId: string): Promise<ExecutionPlan> {
    return this.request<ExecutionPlan>(
      `/execution-plans/${encodeURIComponent(planId)}`,
    );
  }

  async getExecutionLedger(): Promise<ExecutionLedgerItem[]> {
    return this.request<ExecutionLedgerItem[]>("/execution-ledger");
  }

  async getCalendarEvents(): Promise<CalendarEvent[]> {
    return this.request<CalendarEvent[]>("/calendar/events");
  }

  async getExpenses(): Promise<ExpenseRecord[]> {
    return this.request<ExpenseRecord[]>("/expenses");
  }

  async getReminders(): Promise<Reminder[]> {
    return this.request<Reminder[]>("/reminders");
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    };

    const token = await this.getAuthToken?.();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        ...headers,
        ...init.headers,
      },
    });
    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
    }

    return response.json() as Promise<T>;
  }
}
