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
      item("keyboard_input", "键盘输入", {
        screenshots: ["H5 确认卡", "提醒页 scheduled 结果"],
        recordings: [],
        apiSummaries: ["/reminders?conversationId=..."],
        bridgeMarkers: ["source=native.composer.keyboard"],
        systemArtifacts: [],
      }),
      item("photo_attachment", "照片附件", {
        screenshots: ["H5 附件摘要卡"],
        recordings: [],
        apiSummaries: ["/attachments?conversationId=..."],
        bridgeMarkers: ["source=native.composer.attachment.photo"],
        systemArtifacts: ["PhotosPicker 权限与选择器截图"],
      }),
      item("file_attachment", "文件附件", {
        screenshots: ["H5 附件摘要卡"],
        recordings: [],
        apiSummaries: ["/attachments?conversationId=..."],
        bridgeMarkers: ["source=native.composer.attachment.file"],
        systemArtifacts: ["Files 选择器截图"],
      }),
      item("pdf_text_extraction", "PDF 文本提取", {
        screenshots: ["后续追问或确认卡"],
        recordings: [],
        apiSummaries: ["/attachments?conversationId=..."],
        bridgeMarkers: ["source=native.composer.attachment.file"],
        systemArtifacts: ["PDF 样本文本摘要截图"],
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
    nativeKeyboardInput: {
      available: true,
      bridgeInboundLabel:
        "native.inputSubmitted · source=native.composer.keyboard · view=conversation",
      reminderId: "reminder_1",
      screenshotPath: "/tmp/native-keyboard-input.png",
    },
    nativeAttachmentInputs: {
      available: true,
      screenshotPath: "/tmp/native-attachment-inputs.png",
      samples: [
        {
          attachmentId: "attachment_photo",
          itemId: "photo_attachment",
          name: "receipt.jpg",
          source: "native.composer.attachment.photo",
        },
        {
          attachmentId: "attachment_file",
          itemId: "file_attachment",
          name: "invoice.txt",
          source: "native.composer.attachment.file",
        },
        {
          attachmentId: "attachment_pdf",
          itemId: "pdf_text_extraction",
          name: "agenda.pdf",
          source: "native.composer.attachment.file",
        },
      ],
    },
  };

  const review = buildManualEvidenceReview(record, evidence);
  const calendarItem = review.items.find((candidate) => candidate.id === "system_calendar_write");
  const degradationItem = review.items.find((candidate) => candidate.id === "system_sync_degradation");
  const keyboardItem = review.items.find((candidate) => candidate.id === "keyboard_input");
  const photoItem = review.items.find((candidate) => candidate.id === "photo_attachment");
  const fileItem = review.items.find((candidate) => candidate.id === "file_attachment");
  const pdfItem = review.items.find((candidate) => candidate.id === "pdf_text_extraction");

  assert.equal(review.generatedFromDraft, "manual-evidence-record.draft.json");
  assert.equal(review.acceptanceVerdict, "not_evaluated");
  assert.equal(calendarItem.status, "pending");
  assert.equal(degradationItem.status, "pending");
  assert.match(calendarItem.evidence.systemArtifacts.join("\n"), /iOS 系统日历事件截图/);
  assert.match(calendarItem.evidence.bridgeMarkers.join("\n"), /calendar\.events\.sync/);
  assert.match(degradationItem.evidence.screenshots.join("\n"), /权限拒绝/);
  assert.match(degradationItem.evidence.bridgeMarkers.join("\n"), /native\.error/);
  assert.match(degradationItem.evidence.operatorNotes, /候选证据/);
  assert.match(keyboardItem.evidence.screenshots.join("\n"), /native-keyboard-input/);
  assert.match(keyboardItem.evidence.apiSummaries.join("\n"), /reminder_1/);
  assert.match(keyboardItem.evidence.bridgeMarkers.join("\n"), /source=native\.composer\.keyboard/);
  assert.match(keyboardItem.evidence.operatorNotes, /候选证据/);
  assert.match(photoItem.evidence.screenshots.join("\n"), /native-attachment-inputs/);
  assert.match(photoItem.evidence.apiSummaries.join("\n"), /attachment_photo/);
  assert.match(photoItem.evidence.bridgeMarkers.join("\n"), /source=native\.composer\.attachment\.photo/);
  assert.match(fileItem.evidence.apiSummaries.join("\n"), /attachment_file/);
  assert.match(fileItem.evidence.bridgeMarkers.join("\n"), /source=native\.composer\.attachment\.file/);
  assert.match(pdfItem.evidence.apiSummaries.join("\n"), /attachment_pdf/);
  assert.match(pdfItem.evidence.screenshots.join("\n"), /PDF 文本/);
});
