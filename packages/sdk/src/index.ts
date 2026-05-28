import type {
  AgentConversationDebug,
  AgentPendingConfirmations,
  AgentConversationTurn,
  AgentConversationTurns,
  AgentTurnRequest,
  AgentTurnResponse,
  AttachmentIntake,
  AttachmentIntakeRequest,
  AttachmentUploadRequest,
  CalendarEvent,
  CalendarEventUpdate,
  ConfirmExecutionPlanRequest,
  ExecutionLedgerItem,
  ExecutionPlan,
  ExpenseRecord,
  ExpenseRecordUpdate,
  FactoryStatus,
  HealthStatus,
  Reminder,
  ReminderUpdate,
  VersionInfo,
} from "@ai-code/shared-types";

export type {
  AgentConversationDebug,
  AgentPendingConfirmations,
  AgentConversationTurn,
  AgentConversationTurns,
  AgentDebugDecisionTrace,
  AgentDebugEvent,
  AgentDebugPendingClarification,
  AgentTurnRequest,
  AgentTurnResponse,
  AttachmentIntake,
  AttachmentIntakeRequest,
  AttachmentUploadRequest,
  CalendarEvent,
  CalendarEventUpdate,
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
  ExpenseRecordUpdate,
  FactoryCapability,
  FactoryCapabilityStatus,
  FactoryStatus,
  QuickReplyOption,
  Reminder,
  ReminderUpdate,
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

  async intakeAttachment(
    request: AttachmentIntakeRequest,
  ): Promise<AttachmentIntake> {
    return this.request<AttachmentIntake>("/attachments/intake", {
      body: JSON.stringify(request),
      method: "POST",
    });
  }

  async uploadAttachment(
    request: AttachmentUploadRequest,
  ): Promise<AttachmentIntake> {
    return this.request<AttachmentIntake>("/attachments/upload", {
      body: JSON.stringify(request),
      method: "POST",
    });
  }

  async getAttachments(
    conversationId: string,
    limit = 10,
  ): Promise<AttachmentIntake[]> {
    const params = new URLSearchParams({
      conversationId,
      limit: String(limit),
    });
    return this.request<AttachmentIntake[]>(`/attachments?${params.toString()}`);
  }

  async getAgentConversationDebug(
    conversationId: string,
  ): Promise<AgentConversationDebug> {
    return this.request<AgentConversationDebug>(
      `/agent/conversations/${encodeURIComponent(conversationId)}/debug`,
    );
  }

  async getAgentConversationTurns(
    conversationId: string,
    limit = 50,
  ): Promise<AgentConversationTurns> {
    const params = new URLSearchParams({
      limit: String(limit),
    });
    return this.request<AgentConversationTurns>(
      `/agent/conversations/${encodeURIComponent(conversationId)}/turns?${params.toString()}`,
    );
  }

  async getAgentPendingConfirmations(
    conversationId: string,
  ): Promise<AgentPendingConfirmations> {
    return this.request<AgentPendingConfirmations>(
      `/agent/conversations/${encodeURIComponent(conversationId)}/pending-confirmations`,
    );
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

  async getExecutionLedger(
    conversationId?: string,
  ): Promise<ExecutionLedgerItem[]> {
    return this.request<ExecutionLedgerItem[]>(
      this.pathWithConversationId("/execution-ledger", conversationId),
    );
  }

  async getCalendarEvents(conversationId?: string): Promise<CalendarEvent[]> {
    return this.request<CalendarEvent[]>(
      this.pathWithConversationId("/calendar/events", conversationId),
    );
  }

  async updateCalendarEvent(
    eventId: string,
    request: CalendarEventUpdate,
    conversationId: string,
  ): Promise<CalendarEvent> {
    return this.request<CalendarEvent>(
      this.pathWithRequiredConversationId(
        `/calendar/events/${encodeURIComponent(eventId)}`,
        conversationId,
      ),
      {
        body: JSON.stringify(request),
        method: "PATCH",
      },
    );
  }

  async cancelCalendarEvent(
    eventId: string,
    conversationId: string,
  ): Promise<CalendarEvent> {
    return this.request<CalendarEvent>(
      this.pathWithRequiredConversationId(
        `/calendar/events/${encodeURIComponent(eventId)}/cancel`,
        conversationId,
      ),
      {
        method: "POST",
      },
    );
  }

  async getExpenses(conversationId?: string): Promise<ExpenseRecord[]> {
    return this.request<ExpenseRecord[]>(
      this.pathWithConversationId("/expenses", conversationId),
    );
  }

  async updateExpense(
    expenseId: string,
    request: ExpenseRecordUpdate,
    conversationId: string,
  ): Promise<ExpenseRecord> {
    return this.request<ExpenseRecord>(
      this.pathWithRequiredConversationId(
        `/expenses/${encodeURIComponent(expenseId)}`,
        conversationId,
      ),
      {
        body: JSON.stringify(request),
        method: "PATCH",
      },
    );
  }

  async submitExpense(
    expenseId: string,
    conversationId: string,
  ): Promise<ExpenseRecord> {
    return this.request<ExpenseRecord>(
      this.pathWithRequiredConversationId(
        `/expenses/${encodeURIComponent(expenseId)}/submit`,
        conversationId,
      ),
      {
        method: "POST",
      },
    );
  }

  async cancelExpense(
    expenseId: string,
    conversationId: string,
  ): Promise<ExpenseRecord> {
    return this.request<ExpenseRecord>(
      this.pathWithRequiredConversationId(
        `/expenses/${encodeURIComponent(expenseId)}/cancel`,
        conversationId,
      ),
      {
        method: "POST",
      },
    );
  }

  async getReminders(conversationId?: string): Promise<Reminder[]> {
    return this.request<Reminder[]>(
      this.pathWithConversationId("/reminders", conversationId),
    );
  }

  async updateReminder(
    reminderId: string,
    request: ReminderUpdate,
    conversationId: string,
  ): Promise<Reminder> {
    return this.request<Reminder>(
      this.pathWithRequiredConversationId(
        `/reminders/${encodeURIComponent(reminderId)}`,
        conversationId,
      ),
      {
        body: JSON.stringify(request),
        method: "PATCH",
      },
    );
  }

  async completeReminder(
    reminderId: string,
    conversationId: string,
  ): Promise<Reminder> {
    return this.request<Reminder>(
      this.pathWithRequiredConversationId(
        `/reminders/${encodeURIComponent(reminderId)}/complete`,
        conversationId,
      ),
      {
        method: "POST",
      },
    );
  }

  async cancelReminder(
    reminderId: string,
    conversationId: string,
  ): Promise<Reminder> {
    return this.request<Reminder>(
      this.pathWithRequiredConversationId(
        `/reminders/${encodeURIComponent(reminderId)}/cancel`,
        conversationId,
      ),
      {
        method: "POST",
      },
    );
  }

  private pathWithConversationId(path: string, conversationId?: string): string {
    if (!conversationId) {
      return path;
    }
    const params = new URLSearchParams({ conversationId });
    return `${path}?${params.toString()}`;
  }

  private pathWithRequiredConversationId(
    path: string,
    conversationId: string,
  ): string {
    if (!conversationId) {
      throw new Error("conversationId is required for direct UI actions");
    }
    return this.pathWithConversationId(path, conversationId);
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
      const errorDetail = await this.readErrorDetail(response);
      const detailSuffix = errorDetail ? `: ${errorDetail}` : "";
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}${detailSuffix}`,
      );
    }

    return response.json() as Promise<T>;
  }

  private async readErrorDetail(response: Response): Promise<string | undefined> {
    try {
      const contentType = response.headers.get("Content-Type") ?? "";
      if (contentType.includes("application/json")) {
        return this.errorDetailFromJson(await response.json());
      }

      const text = await response.text();
      return text.trim() || undefined;
    } catch {
      return undefined;
    }
  }

  private errorDetailFromJson(payload: unknown): string | undefined {
    if (!this.isRecord(payload)) {
      return undefined;
    }

    const detail = payload.detail;
    if (typeof detail === "string") {
      return detail.trim() || undefined;
    }
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => this.errorDetailItemToMessage(item))
        .filter((message): message is string => Boolean(message));
      return messages.join("; ") || undefined;
    }
    if (this.isRecord(detail)) {
      return JSON.stringify(detail);
    }

    return undefined;
  }

  private errorDetailItemToMessage(item: unknown): string | undefined {
    if (typeof item === "string") {
      return item.trim() || undefined;
    }
    if (!this.isRecord(item)) {
      return undefined;
    }

    if (typeof item.msg === "string") {
      return item.msg.trim() || undefined;
    }
    if (typeof item.message === "string") {
      return item.message.trim() || undefined;
    }

    return undefined;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }
}
