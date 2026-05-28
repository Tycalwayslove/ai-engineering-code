import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { chromium, expect } = await import("@playwright/test");

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const apiPort = await getFreePort();
const h5Port = await getFreePort();
const conversationId = `conversation_h5_click_smoke_${Date.now()}`;
const childProcesses = [];

try {
  const apiBaseUrl = `http://127.0.0.1:${apiPort}`;
  const h5BaseUrl = `http://127.0.0.1:${h5Port}`;
  const pythonBin = existsSync(path.join(repoRoot, ".venv/bin/python"))
    ? path.join(repoRoot, ".venv/bin/python")
    : "python";

  startProcess(
    "api",
    pythonBin,
    [
      "-m",
      "uvicorn",
      "backend.app.main:app",
      "--app-dir",
      "python/backend",
      "--host",
      "127.0.0.1",
      "--port",
      String(apiPort),
    ],
    {
      AI_CODE_LOAD_ENV_LOCAL: "0",
      AI_PLANNER_MODE: "rule",
      DATABASE_URL: "",
      PATH: `${path.join(repoRoot, ".venv/bin")}:${process.env.PATH ?? ""}`,
    },
  );
  await waitForUrl(`${apiBaseUrl}/health`, "API health");

  startProcess(
    "h5",
    "pnpm",
    [
      "--filter",
      "@ai-code/h5",
      "exec",
      "next",
      "dev",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(h5Port),
    ],
    {
      NEXT_PUBLIC_API_BASE_URL: apiBaseUrl,
    },
  );
  await waitForUrl(h5BaseUrl, "H5 dev server");

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { height: 844, width: 390 } });
    await page.addInitScript(() => {
      window.__AI_NATIVE_MESSAGES__ = [];
      window.__AI_NATIVE_HOST__ = {
        bridgeVersion: "h5-click-smoke",
        platform: "ios",
      };
      window.webkit = {
        messageHandlers: {
          NativeBridge: {
            postMessage(message) {
              window.__AI_NATIVE_MESSAGES__.push(message);
            },
          },
        },
      };
    });

    await page.goto(
      `${h5BaseUrl}/?native=ios&bridgeDebug=1&conversationId=${conversationId}`,
    );
    await expect(page.getByLabel("后端元素渲染区")).toContainText(
      "AI 时间管理 Agent",
      { timeout: 15000 },
    );
    await sendNativeMessage(page, "native.hostContext", {
      bridgeVersion: "h5-click-smoke",
      h5URL: page.url(),
      platform: "ios",
    });

    await sendNativeMessage(page, "native.inputSubmitted", {
      inputKind: "text",
      text: "明天上午我要去开会",
    });
    await expect(page.getByLabel("后端元素渲染区")).toContainText(
      "明天上午几点开始开会",
      { timeout: 15000 },
    );

    await page.getByRole("button", { name: "明天上午10点" }).click();
    await expect(page.getByLabel("后端元素渲染区")).toContainText("确认", {
      timeout: 15000,
    });
    const beforeCalendarConfirmNativeMessages = await nativeMessageCount(page);
    await page.getByRole("button", { name: "确认" }).click();
    await expect(page.getByLabel("当前执行状态")).toContainText("completed", {
      timeout: 15000,
    });
    await waitForNativePayload(
      page,
      "calendar.events.sync",
      beforeCalendarConfirmNativeMessages,
      (payload) =>
        Array.isArray(payload.events) &&
        payload.events.some(
          (event) =>
            event.title === "开会" &&
            event.status === "scheduled" &&
            typeof event.startAt === "string" &&
            event.startAt.includes("T10:00:00") &&
            typeof event.endAt === "string" &&
            event.endAt.includes("T11:00:00") &&
            event.timezone === "Asia/Shanghai" &&
            typeof event.id === "string" &&
            event.id.length > 0 &&
            typeof event.sourceActionId === "string" &&
            event.sourceActionId.length > 0,
        ),
      "calendar native sync should include scheduled event",
    );

    await sendNativeMessage(page, "native.viewChanged", {
      source: "h5-click-smoke",
      view: "timeline",
    });
    await expect(page.getByLabel("后端元素渲染区")).toContainText("开会", {
      timeout: 15000,
    });
    await page.getByRole("button", { name: "编辑" }).first().click();
    const calendarDialog = page.getByRole("dialog", { name: "编辑日程" });
    await calendarDialog.getByLabel("标题").fill("产品评审会");
    await calendarDialog.getByLabel("开始").fill("2026-05-22T10:30");
    await calendarDialog.getByLabel("结束").fill("2026-05-22T11:30");
    const beforeCalendarEditNativeMessages = await nativeMessageCount(page);
    await calendarDialog.getByRole("button", { name: "保存" }).click();
    await expect(page.getByLabel("当前执行状态")).toContainText("已更新日程", {
      timeout: 15000,
    });
    await expect(page.getByLabel("后端元素渲染区")).toContainText("产品评审会", {
      timeout: 15000,
    });
    await waitForNativePayload(
      page,
      "calendar.events.sync",
      beforeCalendarEditNativeMessages,
      (payload) =>
        Array.isArray(payload.events) &&
        payload.events.some(
          (nativeEvent) =>
            nativeEvent.title === "产品评审会" &&
            nativeEvent.status === "scheduled" &&
            nativeEvent.startAt === "2026-05-22T10:30:00+08:00" &&
            nativeEvent.endAt === "2026-05-22T11:30:00+08:00" &&
            nativeEvent.timezone === "Asia/Shanghai" &&
            typeof nativeEvent.id === "string" &&
            nativeEvent.id.length > 0 &&
            typeof nativeEvent.sourceActionId === "string" &&
            nativeEvent.sourceActionId.length > 0,
        ),
      "calendar native sync should include edited scheduled event",
    );
    const beforeCalendarCancelNativeMessages = await nativeMessageCount(page);
    await page.getByRole("button", { name: "取消" }).first().click();
    await expect(page.getByLabel("当前执行状态")).toContainText("已取消日程", {
      timeout: 15000,
    });

    const events = await fetchJson(
      `${apiBaseUrl}/calendar/events?conversationId=${encodeURIComponent(
        conversationId,
      )}`,
    );
    const event = events.find((item) => item.title === "产品评审会");
    assert(
      event?.startAt === "2026-05-22T10:30:00+08:00",
      "calendar event should be updated",
    );
    assert(event?.status === "canceled", "calendar event should be canceled");
    await waitForNativePayload(
      page,
      "calendar.events.sync",
      beforeCalendarCancelNativeMessages,
      (payload) =>
        Array.isArray(payload.events) &&
        payload.events.some(
          (nativeEvent) =>
            nativeEvent.id === event.id &&
            nativeEvent.title === "产品评审会" &&
            nativeEvent.status === "canceled" &&
            nativeEvent.startAt === "2026-05-22T10:30:00+08:00" &&
            nativeEvent.endAt === "2026-05-22T11:30:00+08:00" &&
            nativeEvent.timezone === "Asia/Shanghai" &&
            nativeEvent.sourceActionId === event.sourceActionId,
        ),
      "calendar native sync should include canceled event",
    );

    await sendNativeMessage(page, "native.viewChanged", {
      source: "h5-click-smoke",
      view: "conversation",
    });
    await sendNativeMessage(page, "native.inputSubmitted", {
      inputKind: "text",
      text: "把昨天 58 元打车票报销",
    });
    await expect(page.getByLabel("后端元素渲染区")).toContainText("58", {
      timeout: 15000,
    });
    await page.getByRole("button", { name: "确认" }).click();
    await expect(page.getByLabel("当前执行状态")).toContainText("completed", {
      timeout: 15000,
    });

    await sendNativeMessage(page, "native.viewChanged", {
      source: "h5-click-smoke",
      view: "timeline",
    });
    await expect(page.getByLabel("后端元素渲染区")).toContainText("打车票", {
      timeout: 15000,
    });
    await page.getByRole("button", { name: "编辑" }).first().click();
    const expenseDialog = page.getByRole("dialog", { name: "编辑费用" });
    await expenseDialog.getByLabel("标题").fill("客户打车票");
    await expenseDialog.getByLabel("金额").fill("68");
    await expenseDialog.getByLabel("日期").fill("2026-05-20");
    await expenseDialog.getByRole("button", { name: "保存" }).click();
    await expect(page.getByLabel("当前执行状态")).toContainText("已更新费用", {
      timeout: 15000,
    });
    await expect(page.getByLabel("后端元素渲染区")).toContainText("客户打车票", {
      timeout: 15000,
    });
    await page.getByRole("button", { name: "提交" }).first().click();
    await expect(page.getByLabel("当前执行状态")).toContainText("已提交费用草稿", {
      timeout: 15000,
    });

    const expenses = await fetchJson(
      `${apiBaseUrl}/expenses?conversationId=${encodeURIComponent(
        conversationId,
      )}`,
    );
    const expense = expenses.find(
      (item) =>
        typeof item.title === "string" &&
        item.title.includes("客户打车票") &&
        item.amount === 68,
    );
    assert(expense?.occurredOn === "2026-05-20", "expense should be updated");
    assert(expense?.status === "submitted", "expense should be submitted");

    await sendNativeMessage(page, "native.viewChanged", {
      source: "h5-click-smoke",
      view: "conversation",
    });
    await sendNativeMessage(page, "native.inputSubmitted", {
      inputKind: "text",
      text: "明天上午九点提醒我带电脑",
    });
    await expect(page.getByLabel("后端元素渲染区")).toContainText("带电脑", {
      timeout: 15000,
    });
    const beforeReminderConfirmNativeMessages = await nativeMessageCount(page);
    await page.getByRole("button", { name: "确认" }).click();
    await expect(page.getByLabel("当前执行状态")).toContainText("completed", {
      timeout: 15000,
    });
    const scheduledReminderPayload = await waitForNativePayload(
      page,
      "notifications.reminders.sync",
      beforeReminderConfirmNativeMessages,
      (payload) =>
        Array.isArray(payload.reminders) &&
        payload.reminders.some(
          (nativeReminder) =>
            nativeReminder.title === "带电脑" &&
            nativeReminder.status === "scheduled" &&
            typeof nativeReminder.id === "string" &&
            nativeReminder.id.length > 0 &&
            typeof nativeReminder.dueAt === "string" &&
            nativeReminder.dueAt.includes("09:00:00"),
        ),
      "reminder native sync should include scheduled reminder",
    );
    const scheduledNativeReminder = scheduledReminderPayload.reminders.find(
      (nativeReminder) => nativeReminder.title === "带电脑",
    );
    assert(
      typeof scheduledNativeReminder?.dueAt === "string",
      "scheduled reminder native sync should include dueAt",
    );
    const reminderEditDate = scheduledNativeReminder.dueAt.slice(0, 10);

    await sendNativeMessage(page, "native.viewChanged", {
      source: "h5-click-smoke",
      view: "timeline",
    });
    await expect(page.getByLabel("后端元素渲染区")).toContainText("带电脑", {
      timeout: 15000,
    });
    await page.getByRole("button", { name: "编辑" }).first().click();
    const reminderDialog = page.getByRole("dialog", { name: "编辑提醒" });
    await reminderDialog.getByLabel("标题").fill("带电脑和水杯");
    await reminderDialog.getByLabel("时间").fill(`${reminderEditDate}T09:30`);
    const beforeReminderEditNativeMessages = await nativeMessageCount(page);
    await reminderDialog.getByRole("button", { name: "保存" }).click();
    await expect(page.getByLabel("当前执行状态")).toContainText("已更新提醒", {
      timeout: 15000,
    });
    await expect(page.getByLabel("后端元素渲染区")).toContainText("带电脑和水杯", {
      timeout: 15000,
    });
    await waitForNativePayload(
      page,
      "notifications.reminders.sync",
      beforeReminderEditNativeMessages,
      (payload) =>
        Array.isArray(payload.reminders) &&
        payload.reminders.some(
          (nativeReminder) =>
            nativeReminder.id === scheduledNativeReminder.id &&
            nativeReminder.title === "带电脑和水杯" &&
            nativeReminder.status === "scheduled" &&
            typeof nativeReminder.dueAt === "string" &&
            nativeReminder.dueAt.includes("09:30:00") &&
            Date.parse(nativeReminder.dueAt) > Date.now(),
        ),
      "reminder native sync should include edited scheduled reminder",
    );
    const beforeReminderCompleteNativeMessages = await nativeMessageCount(page);
    await page.getByRole("button", { name: "完成" }).first().click();
    await expect(page.getByLabel("当前执行状态")).toContainText("已完成提醒", {
      timeout: 15000,
    });

    const reminders = await fetchJson(
      `${apiBaseUrl}/reminders?conversationId=${encodeURIComponent(
        conversationId,
      )}`,
    );
    const reminder = reminders.find((item) => item.title === "带电脑和水杯");
    assert(
      typeof reminder?.dueAt === "string" &&
        reminder.dueAt.includes("09:30:00") &&
        Date.parse(reminder.dueAt) > Date.now(),
      "reminder should be updated",
    );
    assert(reminder?.status === "done", "reminder should be done");
    await waitForNativePayload(
      page,
      "notifications.reminders.sync",
      beforeReminderCompleteNativeMessages,
      (payload) =>
        Array.isArray(payload.reminders) &&
        payload.reminders.every(
          (nativeReminder) =>
            nativeReminder.id !== scheduledNativeReminder.id &&
            nativeReminder.title !== "带电脑和水杯",
        ),
      "reminder native sync should exclude done reminder",
    );
  } finally {
    await browser.close();
  }

  console.log("H5 click smoke validation passed.");
} finally {
  await stopProcesses();
}

async function sendNativeMessage(page, type, payload) {
  await page.evaluate(
    ({ payload: nativePayload, type: nativeType }) => {
      window.dispatchEvent(
        new CustomEvent("ai-native-message", {
          detail: {
            id: `${nativeType}-${Date.now()}`,
            payload: nativePayload,
            sentAt: new Date().toISOString(),
            type: nativeType,
          },
        }),
      );
    },
    { payload, type },
  );
}

async function nativeMessageCount(page) {
  return page.evaluate(() => window.__AI_NATIVE_MESSAGES__?.length ?? 0);
}

async function waitForNativePayload(page, type, afterCount, predicate, label) {
  const deadline = Date.now() + 15_000;
  let latestMessages = [];
  while (Date.now() < deadline) {
    latestMessages = await page.evaluate(
      ({ count, messageType }) =>
        (window.__AI_NATIVE_MESSAGES__ ?? [])
          .slice(count)
          .filter((message) => message.type === messageType)
          .map((message) => message.payload ?? {}),
      { count: afterCount, messageType: type },
    );
    const match = latestMessages.find(predicate);
    if (match) {
      return match;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`${label}: ${JSON.stringify(latestMessages.at(-1) ?? null)}`);
}

async function fetchJson(url) {
  const response = await fetch(url);
  assert(response.ok, `expected ${url} to return 2xx, got ${response.status}`);
  return response.json();
}

function startProcess(label, command, args, env = {}) {
  const child = spawn(command, args, {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  childProcesses.push({ child, label });
  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[${label}] ${chunk}`);
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[${label}] ${chunk}`);
  });
}

async function waitForUrl(url, label) {
  const deadline = Date.now() + 60_000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
      lastError = new Error(`${label} returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${label}: ${lastError}`);
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === "object") {
          resolve(address.port);
        } else {
          reject(new Error("Could not allocate a free port"));
        }
      });
    });
  });
}

async function stopProcesses() {
  await Promise.all(
    childProcesses.map(
      ({ child }) =>
        new Promise((resolve) => {
          if (child.exitCode !== null || child.signalCode !== null) {
            resolve();
            return;
          }
          child.once("exit", resolve);
          child.kill("SIGTERM");
          setTimeout(() => {
            if (child.exitCode === null && child.signalCode === null) {
              child.kill("SIGKILL");
            }
          }, 3_000).unref();
        }),
    ),
  );
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
