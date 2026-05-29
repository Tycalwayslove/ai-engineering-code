import assert from "node:assert/strict";
import test from "node:test";

import { buildManualEvidenceReview } from "./manual-evidence-review.mjs";

function item(id, title, requiredEvidence) {
  return {
    id,
    title,
    status: "pending",
    evidence: {
      screenshots: [],
      recordings: [],
      apiSummaries: [],
      bridgeMarkers: [],
      systemArtifacts: [],
      operatorNotes: "",
      blocker: "",
    },
    requiredEvidence,
  };
}

test("manual evidence review fills objective evidence without passing items", () => {
  const record = {
    acceptanceVerdict: "not_evaluated",
    items: [
      item("system_calendar_write", "系统日历写入", {
        screenshots: ["H5 日历页 scheduled 结果"],
        recordings: [],
        apiSummaries: ["/calendar/events?conversationId=..."],
        bridgeMarkers: ["calendar.events.sync"],
        systemArtifacts: ["iOS 系统日历事件截图"],
      }),
      item("system_sync_degradation", "系统同步降级", {
        screenshots: ["权限拒绝"],
        recordings: [],
        apiSummaries: ["/calendar/events?conversationId=..."],
        bridgeMarkers: ["native.error"],
        systemArtifacts: ["iOS 权限拒绝截图"],
      }),
    ],
  };
  const evidence = {
    backendFactSnapshot: {
      conversationId: "conversation_ios_123",
      counts: { calendarEvents: 2 },
    },
    calendarPermissionDenialSeed: {
      available: true,
      nativeErrorReason: "未获得日历权限，日程已保存但不会写入系统日历",
      screenshotPath: "/tmp/calendar-permission-denial.png",
    },
    calendarSystemAppEvidence: {
      available: true,
      screenshotPath: "/tmp/system-calendar-app.png",
      targetEventId: "calendar_event_1",
    },
    h5SurfaceScreenshots: {
      surfaces: {
        calendar: { path: "/tmp/calendar.png" },
      },
    },
  };

  const review = buildManualEvidenceReview(record, evidence);
  const calendarItem = review.items.find((candidate) => candidate.id === "system_calendar_write");
  const degradationItem = review.items.find((candidate) => candidate.id === "system_sync_degradation");

  assert.equal(review.generatedFromDraft, "manual-evidence-record.draft.json");
  assert.equal(review.acceptanceVerdict, "not_evaluated");
  assert.equal(calendarItem.status, "pending");
  assert.equal(degradationItem.status, "pending");
  assert.match(calendarItem.evidence.systemArtifacts.join("\n"), /iOS 系统日历事件截图/);
  assert.match(calendarItem.evidence.bridgeMarkers.join("\n"), /calendar\.events\.sync/);
  assert.match(degradationItem.evidence.screenshots.join("\n"), /权限拒绝/);
  assert.match(degradationItem.evidence.bridgeMarkers.join("\n"), /native\.error/);
  assert.match(degradationItem.evidence.operatorNotes, /候选证据/);
});
