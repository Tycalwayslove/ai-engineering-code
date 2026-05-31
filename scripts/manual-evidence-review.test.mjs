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
      item("conversation_persistence", "会话持久 ID", {
        screenshots: ["重启前 conversationId", "重启后 conversationId"],
        recordings: [],
        apiSummaries: ["/agent/conversations/{conversationId}/turns"],
        bridgeMarkers: ["conversationId=conversation_ios_*"],
        systemArtifacts: [],
      }),
      item("system_calendar_write", "系统日历写入", {
        screenshots: ["日程确认卡", "H5 日历页 scheduled 结果"],
        recordings: [],
        apiSummaries: ["/calendar/events?conversationId=..."],
        bridgeMarkers: ["calendar.events.sync"],
        systemArtifacts: ["iOS 系统日历事件截图"],
      }),
      item("local_notification", "本地通知", {
        screenshots: ["提醒确认卡", "H5 提醒页 scheduled 结果", "系统通知截图"],
        recordings: [],
        apiSummaries: ["/reminders?conversationId=..."],
        bridgeMarkers: ["notifications.reminders.sync"],
        systemArtifacts: ["iOS 通知权限弹窗截图或录屏"],
      }),
      item("system_calendar_cleanup", "系统日历取消清理", {
        screenshots: ["H5 日程取消动作"],
        recordings: [],
        apiSummaries: ["/calendar/events?conversationId=...", "后端 canceled 状态"],
        bridgeMarkers: ["calendar.events.sync", "status=canceled"],
        systemArtifacts: ["iOS 系统日历事件消失截图"],
      }),
      item("h5_address_override", "H5 地址覆盖", {
        screenshots: ["默认地址 App 启动截图", "局域网地址 App 启动截图"],
        recordings: [],
        apiSummaries: [],
        bridgeMarkers: ["H5DevServerURL", "h5NativeTargetMarkerFound=true"],
        systemArtifacts: ["构建产物 Info.plist 的 H5DevServerURL"],
      }),
      item("system_sync_degradation", "系统同步降级", {
        screenshots: ["权限拒绝"],
        recordings: [],
        apiSummaries: ["/calendar/events?conversationId=..."],
        bridgeMarkers: ["native.error"],
        systemArtifacts: ["iOS 权限拒绝截图"],
      }),
      item("keyboard_input", "键盘输入", {
        screenshots: ["输入框文本", "H5 确认卡", "提醒页 scheduled 结果"],
        recordings: [],
        apiSummaries: ["/reminders?conversationId=..."],
        bridgeMarkers: ["source=native.composer.keyboard"],
        systemArtifacts: [],
      }),
      item("navigation_surfaces", "原生导航 / 页面切换", {
        screenshots: [
          "Header Timeline 切换截图",
          "Drawer 设置切换截图",
          "H5 七页面切换截图或录屏",
        ],
        recordings: [],
        apiSummaries: [],
        bridgeMarkers: [
          "source=native.header.timeline",
          "source=native.drawer.quick-switch",
        ],
        systemArtifacts: ["pnpm validate:ios-navigation-ui-test 输出或 xcresult"],
      }),
      item("photo_attachment", "照片附件", {
        screenshots: ["H5 附件摘要卡"],
        recordings: [],
        apiSummaries: ["/attachments?conversationId=..."],
        bridgeMarkers: [
          "source=native.composer.attachment.photo",
          "attachmentKind=image",
        ],
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
    ios: {
      h5DevServerUrl: "http://192.168.1.238:3000/?native=ios",
      screenshotPath: "/tmp/simulator-launch.png",
      conversationPersistence: {
        afterRelaunch: "conversation_ios_123",
        afterRelaunchScreenshotPath: "/tmp/conversation-after-relaunch.png",
        beforeRelaunch: "conversation_ios_123",
        beforeRelaunchScreenshotPath: "/tmp/conversation-before-relaunch.png",
        stableAcrossRelaunch: true,
      },
    },
    serviceHealth: {
      h5NativeTargetMarkerFound: true,
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
    notificationDelivery: {
      available: true,
      notificationIdentifier: "ai-code.reminder.reminder_1",
    },
    acceptanceFactSeed: {
      available: true,
      confirmationScreenshots: {
        calendar: {
          available: true,
          path: "/tmp/acceptance-calendar-confirmation-card.png",
        },
        reminder: {
          available: true,
          path: "/tmp/acceptance-reminder-confirmation-card.png",
        },
      },
    },
    calendarCleanupSeed: {
      available: true,
      canceledEvent: {
        id: "calendar_event_1",
        status: "canceled",
        title: "开会",
      },
      h5CancelActionScreenshot: {
        available: true,
        path: "/tmp/calendar-cleanup-h5-cancel-action.png",
      },
      postCancelStatus: "canceled",
      targetEventId: "calendar_event_1",
      systemCalendarAppScreenshots: {
        afterPath: "/tmp/calendar-cleanup-after.png",
      },
    },
    h5SurfaceScreenshots: {
      available: true,
      surfaces: {
        conversation: { captured: true, path: "/tmp/conversation.png" },
        timeline: { captured: true, path: "/tmp/timeline.png" },
        calendar: { path: "/tmp/calendar.png" },
        expenses: { captured: true, path: "/tmp/expenses.png" },
        reminders: { captured: true, path: "/tmp/reminders.png" },
        ledger: { captured: true, path: "/tmp/ledger.png" },
        settings: { captured: true, path: "/tmp/settings.png" },
      },
    },
    nativeKeyboardInput: {
      available: true,
      bridgeInboundLabel:
        "native.inputSubmitted · source=native.composer.keyboard · view=conversation",
      reminderId: "reminder_1",
      screenshotPath: "/tmp/native-keyboard-input.png",
    },
    keyboardUiTest: {
      available: true,
      logPath: "/tmp/ios-keyboard-ui-test.log",
      resultBundlePath: "/tmp/ios-keyboard-ui-test.xcresult",
      screenshotAttachments: {
        inputText: "输入框文本",
      },
    },
    navigationUiTest: {
      available: true,
      logPath: "/tmp/ios-navigation-ui-test.log",
      resultBundlePath: "/tmp/ios-navigation-ui-test.xcresult",
      screenshotAttachments: {
        drawerSettings: "Drawer 设置切换截图",
        headerTimeline: "Header Timeline 切换截图",
      },
    },
    nativeAttachmentInputs: {
      available: true,
      screenshotPath: "/tmp/native-attachment-inputs.png",
      samples: [
        {
          attachmentId: "attachment_photo",
          backendAttachmentId: "backend_attachment_photo",
          expenseFollowUp: {
            available: true,
            expenseRecordId: "expense_photo",
            responseKind: "confirmation_required",
            screenshotPath: "/tmp/native-attachment-photo-expense-follow-up.png",
          },
          itemId: "photo_attachment",
          kind: "image",
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
          backendAttachmentId: "backend_attachment_pdf",
          itemId: "pdf_text_extraction",
          name: "agenda.pdf",
          scheduleFollowUp: {
            available: true,
            responseKind: "clarification_request",
            screenshotPath: "/tmp/native-attachment-pdf-schedule-follow-up.png",
          },
          source: "native.composer.attachment.file",
          textSummary: "PDF 日程材料 明天上午十点项目会",
        },
      ],
    },
  };

  const review = buildManualEvidenceReview(record, evidence);
  const persistenceItem = review.items.find((candidate) => candidate.id === "conversation_persistence");
  const calendarItem = review.items.find((candidate) => candidate.id === "system_calendar_write");
  const localNotificationItem = review.items.find((candidate) => candidate.id === "local_notification");
  const cleanupItem = review.items.find((candidate) => candidate.id === "system_calendar_cleanup");
  const h5AddressItem = review.items.find((candidate) => candidate.id === "h5_address_override");
  const degradationItem = review.items.find((candidate) => candidate.id === "system_sync_degradation");
  const keyboardItem = review.items.find((candidate) => candidate.id === "keyboard_input");
  const navigationItem = review.items.find((candidate) => candidate.id === "navigation_surfaces");
  const photoItem = review.items.find((candidate) => candidate.id === "photo_attachment");
  const fileItem = review.items.find((candidate) => candidate.id === "file_attachment");
  const pdfItem = review.items.find((candidate) => candidate.id === "pdf_text_extraction");

  assert.equal(review.generatedFromDraft, "manual-evidence-record.draft.json");
  assert.equal(review.acceptanceVerdict, "not_evaluated");
  assert.equal(persistenceItem.status, "pending");
  assert.equal(calendarItem.status, "pending");
  assert.equal(cleanupItem.status, "pending");
  assert.equal(degradationItem.status, "pending");
  assert.match(persistenceItem.evidence.screenshots.join("\n"), /重启前 conversationId: conversation_ios_123/);
  assert.match(persistenceItem.evidence.screenshots.join("\n"), /conversation-before-relaunch/);
  assert.match(persistenceItem.evidence.screenshots.join("\n"), /重启后 conversationId: conversation_ios_123/);
  assert.match(persistenceItem.evidence.screenshots.join("\n"), /conversation-after-relaunch/);
  assert.match(persistenceItem.evidence.apiSummaries.join("\n"), /turns/);
  assert.match(persistenceItem.evidence.bridgeMarkers.join("\n"), /conversation_ios_123/);
  assert.match(calendarItem.evidence.systemArtifacts.join("\n"), /iOS 系统日历事件截图/);
  assert.match(calendarItem.evidence.bridgeMarkers.join("\n"), /calendar\.events\.sync/);
  assert.match(calendarItem.evidence.screenshots.join("\n"), /日程确认卡/);
  assert.match(calendarItem.evidence.screenshots.join("\n"), /acceptance-calendar-confirmation-card/);
  assert.equal(localNotificationItem.status, "pending");
  assert.match(localNotificationItem.evidence.screenshots.join("\n"), /提醒确认卡/);
  assert.match(localNotificationItem.evidence.screenshots.join("\n"), /acceptance-reminder-confirmation-card/);
  assert.match(localNotificationItem.evidence.apiSummaries.join("\n"), /reminders/);
  assert.match(localNotificationItem.evidence.bridgeMarkers.join("\n"), /notifications\.reminders\.sync/);
  assert.match(cleanupItem.evidence.screenshots.join("\n"), /H5 日程取消动作/);
  assert.match(cleanupItem.evidence.screenshots.join("\n"), /calendar-cleanup-h5-cancel-action/);
  assert.match(cleanupItem.evidence.systemArtifacts.join("\n"), /iOS 系统日历事件消失截图/);
  assert.match(cleanupItem.evidence.apiSummaries.join("\n"), /后端 canceled 状态: eventId=calendar_event_1, status=canceled/);
  assert.match(cleanupItem.evidence.bridgeMarkers.join("\n"), /status=canceled/);
  assert.equal(h5AddressItem.status, "pending");
  assert.match(h5AddressItem.evidence.screenshots.join("\n"), /默认地址 App 启动截图/);
  assert.match(h5AddressItem.evidence.screenshots.join("\n"), /局域网地址 App 启动截图/);
  assert.match(h5AddressItem.evidence.screenshots.join("\n"), /simulator-launch/);
  assert.match(h5AddressItem.evidence.bridgeMarkers.join("\n"), /H5DevServerURL: http:\/\/192\.168\.1\.238:3000/);
  assert.match(h5AddressItem.evidence.bridgeMarkers.join("\n"), /h5NativeTargetMarkerFound=true/);
  assert.match(h5AddressItem.evidence.systemArtifacts.join("\n"), /构建产物 Info\.plist 的 H5DevServerURL/);
  assert.match(degradationItem.evidence.screenshots.join("\n"), /权限拒绝/);
  assert.match(degradationItem.evidence.bridgeMarkers.join("\n"), /native\.error/);
  assert.match(degradationItem.evidence.operatorNotes, /候选证据/);
  assert.match(keyboardItem.evidence.screenshots.join("\n"), /native-keyboard-input/);
  assert.match(keyboardItem.evidence.screenshots.join("\n"), /输入框文本/);
  assert.match(keyboardItem.evidence.screenshots.join("\n"), /ios-keyboard-ui-test\.xcresult/);
  assert.match(keyboardItem.evidence.apiSummaries.join("\n"), /reminder_1/);
  assert.match(keyboardItem.evidence.bridgeMarkers.join("\n"), /source=native\.composer\.keyboard/);
  assert.match(keyboardItem.evidence.operatorNotes, /候选证据/);
  assert.match(navigationItem.evidence.screenshots.join("\n"), /H5 七页面切换截图或录屏/);
  assert.match(navigationItem.evidence.screenshots.join("\n"), /conversation/);
  assert.match(navigationItem.evidence.screenshots.join("\n"), /settings/);
  assert.match(navigationItem.evidence.screenshots.join("\n"), /Header Timeline 切换截图/);
  assert.match(navigationItem.evidence.screenshots.join("\n"), /Drawer 设置切换截图/);
  assert.match(navigationItem.evidence.bridgeMarkers.join("\n"), /source=native\.header\.timeline/);
  assert.match(navigationItem.evidence.bridgeMarkers.join("\n"), /source=native\.drawer\.quick-switch/);
  assert.match(navigationItem.evidence.systemArtifacts.join("\n"), /ios-navigation-ui-test\.log/);
  assert.match(navigationItem.evidence.systemArtifacts.join("\n"), /ios-navigation-ui-test\.xcresult/);
  assert.match(navigationItem.evidence.systemArtifacts.join("\n"), /输出或 xcresult/);
  assert.match(photoItem.evidence.screenshots.join("\n"), /native-attachment-inputs/);
  assert.match(photoItem.evidence.screenshots.join("\n"), /费用确认卡或金额追问/);
  assert.match(photoItem.evidence.screenshots.join("\n"), /native-attachment-photo-expense-follow-up/);
  assert.match(photoItem.evidence.apiSummaries.join("\n"), /attachment_photo/);
  assert.match(photoItem.evidence.apiSummaries.join("\n"), /\/expenses\?conversationId=.*expense_photo/);
  assert.match(photoItem.evidence.bridgeMarkers.join("\n"), /source=native\.composer\.attachment\.photo/);
  assert.match(photoItem.evidence.bridgeMarkers.join("\n"), /attachmentKind=image/);
  assert.match(fileItem.evidence.apiSummaries.join("\n"), /attachment_file/);
  assert.match(fileItem.evidence.bridgeMarkers.join("\n"), /source=native\.composer\.attachment\.file/);
  assert.match(pdfItem.evidence.apiSummaries.join("\n"), /attachment_pdf/);
  assert.match(pdfItem.evidence.screenshots.join("\n"), /PDF 文本/);
  assert.match(pdfItem.evidence.screenshots.join("\n"), /后续追问或确认卡/);
  assert.match(pdfItem.evidence.screenshots.join("\n"), /native-attachment-pdf-schedule-follow-up/);
  assert.match(pdfItem.evidence.systemArtifacts.join("\n"), /PDF 样本文本摘要截图/);
  assert.match(pdfItem.evidence.systemArtifacts.join("\n"), /PDF 日程材料/);
});

test("manual evidence review keeps partial notification evidence when system delivery is missing", () => {
  const record = {
    acceptanceVerdict: "not_evaluated",
    items: [
      item("local_notification", "本地通知", {
        screenshots: ["提醒确认卡", "H5 提醒页 scheduled 结果", "系统通知截图"],
        recordings: [],
        apiSummaries: ["/reminders?conversationId=..."],
        bridgeMarkers: ["notifications.reminders.sync"],
        systemArtifacts: ["iOS 通知权限弹窗截图或录屏"],
      }),
      item("notification_click_backflow", "通知点击回流", {
        screenshots: ["通知点击后 H5 reminders 视图", "高亮提醒行"],
        recordings: [],
        apiSummaries: ["/reminders?conversationId=..."],
        bridgeMarkers: ["source=native.notifications.reminders.opened"],
        systemArtifacts: ["系统通知点击录屏"],
      }),
    ],
  };
  const evidence = {
    backendFactSnapshot: {
      conversationId: "conversation_ios_partial",
      counts: { reminders: 3 },
    },
    h5SurfaceScreenshots: {
      available: true,
      surfaces: {
        reminders: { captured: true, path: "/tmp/reminders.png" },
      },
    },
    acceptanceFactSeed: {
      confirmationScreenshots: {
        reminder: {
          available: true,
          path: "/tmp/acceptance-reminder-confirmation-card.png",
        },
      },
    },
    notificationDelivery: {
      available: false,
      reminderId: "reminder_delivery",
      notificationIdentifier: "ai-code.reminder.reminder_delivery",
      pendingNotificationFound: false,
      deliveredNotificationFound: false,
      errors: ["pending local notification not found before delivery wait"],
    },
    notificationClickBackflow: {
      available: false,
      bridgeInboundLabel:
        "native.viewChanged · source=native.notifications.reminders.opened · view=reminders · reminderId=reminder_backflow",
      h5OpenedScreenshotPath: "/tmp/notification-click-backflow.png",
      highlightedReminderFound: true,
      h5StatusText: "已从系统通知打开提醒",
      reminderId: "reminder_backflow",
      errors: ["pending local notification not found"],
    },
  };

  const review = buildManualEvidenceReview(record, evidence);
  const localNotificationItem = review.items.find((candidate) => candidate.id === "local_notification");
  const backflowItem = review.items.find((candidate) => candidate.id === "notification_click_backflow");

  assert.equal(localNotificationItem.status, "pending");
  assert.match(localNotificationItem.evidence.screenshots.join("\n"), /提醒确认卡/);
  assert.match(localNotificationItem.evidence.screenshots.join("\n"), /H5 提醒页 scheduled 结果/);
  assert.match(localNotificationItem.evidence.apiSummaries.join("\n"), /reminder_delivery/);
  assert.doesNotMatch(localNotificationItem.evidence.bridgeMarkers.join("\n"), /notifications\.reminders\.sync/);
  assert.equal(backflowItem.status, "pending");
  assert.match(backflowItem.evidence.screenshots.join("\n"), /通知点击后 H5 reminders 视图/);
  assert.match(backflowItem.evidence.screenshots.join("\n"), /高亮提醒行/);
  assert.match(backflowItem.evidence.apiSummaries.join("\n"), /reminder_backflow/);
  assert.match(backflowItem.evidence.bridgeMarkers.join("\n"), /source=native\.notifications\.reminders\.opened/);
  assert.doesNotMatch(backflowItem.evidence.systemArtifacts.join("\n"), /系统通知点击录屏/);
});
