const evidenceCategories = [
  "screenshots",
  "recordings",
  "apiSummaries",
  "bridgeMarkers",
  "systemArtifacts",
];

function addUnique(values, nextValue) {
  if (!nextValue) {
    return values;
  }
  if (!values.includes(nextValue)) {
    values.push(nextValue);
  }
  return values;
}

function pathForSurface(evidence, surface) {
  return evidence?.h5SurfaceScreenshots?.surfaces?.[surface]?.path ?? null;
}

function capturedPathForSurface(evidence, surface) {
  const surfaceEvidence = evidence?.h5SurfaceScreenshots?.surfaces?.[surface];
  return surfaceEvidence?.captured ? surfaceEvidence.path : null;
}

function apiSummary(evidence, label) {
  const conversationId = evidence?.backendFactSnapshot?.conversationId ?? "unknown";
  const counts = evidence?.backendFactSnapshot?.counts ?? {};
  return `${label}: conversationId=${conversationId}, counts=${JSON.stringify(counts)}`;
}

function isPrivateLanUrl(value) {
  if (!value) {
    return false;
  }
  let hostname = "";
  try {
    hostname = new URL(value).hostname;
  } catch {
    return false;
  }
  const octets = hostname.split(".").map((part) => Number.parseInt(part, 10));
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }
  const [first, second] = octets;
  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254)
  );
}

function evidenceSuggestionsForItem(item, evidence) {
  const suggestions = {
    screenshots: [],
    recordings: [],
    apiSummaries: [],
    bridgeMarkers: [],
    systemArtifacts: [],
  };

  switch (item.id) {
    case "h5_address_override": {
      if (evidence?.ios?.screenshotPath) {
        addUnique(
          suggestions.screenshots,
          `默认地址 App 启动截图: ${evidence.ios.screenshotPath}`
        );
      }
      if (evidence?.ios?.h5DevServerUrl) {
        if (evidence?.ios?.screenshotPath && isPrivateLanUrl(evidence.ios.h5DevServerUrl)) {
          addUnique(
            suggestions.screenshots,
            `局域网地址 App 启动截图: ${evidence.ios.screenshotPath}`
          );
        }
        addUnique(
          suggestions.bridgeMarkers,
          `H5DevServerURL: ${evidence.ios.h5DevServerUrl}`
        );
        addUnique(
          suggestions.systemArtifacts,
          `构建产物 Info.plist 的 H5DevServerURL: ${evidence.ios.h5DevServerUrl}`
        );
      }
      if (evidence?.serviceHealth?.h5NativeTargetMarkerFound) {
        addUnique(suggestions.bridgeMarkers, "h5NativeTargetMarkerFound=true");
      }
      break;
    }
    case "conversation_persistence": {
      const persistence = evidence?.ios?.conversationPersistence ?? {};
      if (persistence.beforeRelaunch) {
        addUnique(
          suggestions.bridgeMarkers,
          `conversationId=conversation_ios_*: ${persistence.beforeRelaunch}`
        );
      }
      if (persistence.beforeRelaunch && persistence.beforeRelaunchScreenshotPath) {
        addUnique(
          suggestions.screenshots,
          `重启前 conversationId: ${persistence.beforeRelaunch}, screenshot: ${persistence.beforeRelaunchScreenshotPath}`
        );
      }
      if (persistence.afterRelaunch && persistence.afterRelaunchScreenshotPath) {
        addUnique(
          suggestions.screenshots,
          `重启后 conversationId: ${persistence.afterRelaunch}, screenshot: ${persistence.afterRelaunchScreenshotPath}`
        );
      }
      if (persistence.stableAcrossRelaunch === true) {
        addUnique(
          suggestions.apiSummaries,
          `/agent/conversations/{conversationId}/turns: ${apiSummary(evidence, "turns")}`
        );
      }
      break;
    }
    case "navigation_surfaces": {
      const navigationUiTest = evidence?.navigationUiTest;
      if (navigationUiTest?.available) {
        if (navigationUiTest.screenshotAttachments?.headerTimeline) {
          addUnique(
            suggestions.screenshots,
            `Header Timeline 切换截图: ${navigationUiTest.screenshotAttachments.headerTimeline} (${navigationUiTest.resultBundlePath})`
          );
        }
        if (navigationUiTest.screenshotAttachments?.drawerSettings) {
          addUnique(
            suggestions.screenshots,
            `Drawer 设置切换截图: ${navigationUiTest.screenshotAttachments.drawerSettings} (${navigationUiTest.resultBundlePath})`
          );
        }
        addUnique(
          suggestions.bridgeMarkers,
          "source=native.header.timeline: validate:ios-navigation-ui-test"
        );
        addUnique(
          suggestions.bridgeMarkers,
          "source=native.drawer.quick-switch: validate:ios-navigation-ui-test"
        );
        if (navigationUiTest.logPath || navigationUiTest.resultBundlePath) {
          addUnique(
            suggestions.systemArtifacts,
            `pnpm validate:ios-navigation-ui-test 输出或 xcresult: log=${navigationUiTest.logPath ?? "未采集"}, xcresult=${navigationUiTest.resultBundlePath ?? "未采集"}`
          );
        }
      }
      const surfaces = [
        ["对话页", "conversation"],
        ["Timeline 页面", "timeline"],
        ["日程页", "calendar"],
        ["费用页", "expenses"],
        ["提醒页", "reminders"],
        ["执行记录页", "ledger"],
        ["设置页", "settings"],
      ];
      for (const [label, surface] of surfaces) {
        const surfacePath = capturedPathForSurface(evidence, surface);
        if (surfacePath) {
          addUnique(suggestions.screenshots, `${label}: ${surfacePath}`);
        }
      }
      if (evidence?.h5SurfaceScreenshots?.available) {
        const capturedSurfacePaths = surfaces
          .map(([, surface]) => capturedPathForSurface(evidence, surface))
          .filter(Boolean);
        if (capturedSurfacePaths.length > 0) {
          addUnique(
            suggestions.screenshots,
            `H5 七页面切换截图或录屏: ${capturedSurfacePaths.join(", ")}`
          );
        }
        addUnique(suggestions.bridgeMarkers, "view=timeline: H5 同会话页面截图已采集");
        addUnique(suggestions.bridgeMarkers, "view=settings: H5 同会话页面截图已采集");
      }
      break;
    }
    case "local_notification": {
      const reminderConfirmation =
        evidence?.acceptanceFactSeed?.confirmationScreenshots?.reminder;
      if (reminderConfirmation?.available && reminderConfirmation.path) {
        addUnique(
          suggestions.screenshots,
          `提醒确认卡: ${reminderConfirmation.path}`
        );
      }
      const notificationDelivery = evidence?.notificationDelivery;
      if (notificationDelivery?.available || notificationDelivery?.reminderId) {
        addUnique(
          suggestions.apiSummaries,
          `/reminders?conversationId=...: reminderId=${notificationDelivery.reminderId ?? "unknown"}, ${apiSummary(evidence, "reminders")}`
        );
        const remindersPath = pathForSurface(evidence, "reminders");
        if (remindersPath) {
          addUnique(suggestions.screenshots, `H5 提醒页 scheduled 结果: ${remindersPath}`);
        }
      }
      if (
        notificationDelivery?.available ||
        notificationDelivery?.pendingNotificationFound ||
        notificationDelivery?.deliveredNotificationFound
      ) {
        addUnique(
          suggestions.bridgeMarkers,
          `notifications.reminders.sync: ${notificationDelivery.notificationIdentifier ?? "available"}`
        );
      }
      break;
    }
    case "notification_click_backflow": {
      const backflow = evidence?.notificationClickBackflow;
      if (backflow) {
        const path = backflow.h5OpenedScreenshotPath;
        if (path) {
          addUnique(suggestions.screenshots, `通知点击后 H5 reminders 视图: ${path}`);
        }
        if (path && backflow.highlightedReminderFound) {
          addUnique(suggestions.screenshots, `高亮提醒行: ${path}`);
        }
        if (backflow.reminderId) {
          addUnique(
            suggestions.apiSummaries,
            `/reminders?conversationId=...: reminderId=${backflow.reminderId}, ${apiSummary(evidence, "reminders")}`
          );
        }
        if (backflow.bridgeInboundLabel) {
          addUnique(
            suggestions.bridgeMarkers,
            `source=native.notifications.reminders.opened: ${backflow.bridgeInboundLabel}`
          );
        } else if (backflow.reminderId) {
          addUnique(
            suggestions.bridgeMarkers,
            `source=native.notifications.reminders.opened: reminderId=${backflow.reminderId}`
          );
        }
      }
      if (backflow?.available) {
        addUnique(suggestions.apiSummaries, `/reminders?conversationId=...: ${apiSummary(evidence, "reminders")}`);
        addUnique(
          suggestions.bridgeMarkers,
          `source=native.notifications.reminders.opened: reminderId=${backflow.reminderId}`
        );
      }
      break;
    }
    case "keyboard_input": {
      const keyboardUiTest = evidence?.keyboardUiTest;
      if (keyboardUiTest?.available && keyboardUiTest.screenshotAttachments?.inputText) {
        addUnique(
          suggestions.screenshots,
          `输入框文本: ${keyboardUiTest.screenshotAttachments.inputText} (${keyboardUiTest.resultBundlePath})`
        );
      }
      if (evidence?.nativeKeyboardInput?.available) {
        addUnique(
          suggestions.screenshots,
          `H5 确认卡和提醒页 scheduled 结果: ${evidence.nativeKeyboardInput.screenshotPath}`
        );
        addUnique(
          suggestions.apiSummaries,
          `/reminders?conversationId=...: reminderId=${evidence.nativeKeyboardInput.reminderId}`
        );
        addUnique(
          suggestions.bridgeMarkers,
          `source=native.composer.keyboard: ${evidence.nativeKeyboardInput.bridgeInboundLabel}`
        );
      }
      break;
    }
    case "voice_input": {
      const voiceUiTest = evidence?.voiceUiTest;
      if (voiceUiTest?.available) {
        if (voiceUiTest.screenshotAttachments?.recognizedText) {
          addUnique(
            suggestions.screenshots,
            `识别文本: ${voiceUiTest.screenshotAttachments.recognizedText} (${voiceUiTest.resultBundlePath})`
          );
        }
        if (voiceUiTest.screenshotAttachments?.confirmationCard) {
          addUnique(
            suggestions.screenshots,
            `H5 确认卡: ${voiceUiTest.screenshotAttachments.confirmationCard} (${voiceUiTest.resultBundlePath})`
          );
        }
        addUnique(
          suggestions.apiSummaries,
          `/reminders?conversationId=...: validate:ios-voice-ui-test`
        );
        addUnique(
          suggestions.bridgeMarkers,
          "source=native.composer.voice: validate:ios-voice-ui-test"
        );
        if (voiceUiTest.logPath || voiceUiTest.resultBundlePath) {
          addUnique(
            suggestions.systemArtifacts,
            `pnpm validate:ios-voice-ui-test 输出或 xcresult: log=${voiceUiTest.logPath ?? "未采集"}, xcresult=${voiceUiTest.resultBundlePath ?? "未采集"}`
          );
        }
      }
      break;
    }
    case "photo_attachment":
    case "file_attachment":
    case "pdf_text_extraction": {
      const sample = evidence?.nativeAttachmentInputs?.samples?.find(
        (candidate) => candidate.itemId === item.id
      );
      if (evidence?.nativeAttachmentInputs?.available && sample) {
        const screenshotLabel =
          item.id === "pdf_text_extraction"
            ? "PDF 文本提取后 H5 附件摘要卡"
            : "H5 附件摘要卡";
        addUnique(
          suggestions.screenshots,
          `${screenshotLabel}: ${evidence.nativeAttachmentInputs.screenshotPath}`
        );
        addUnique(
          suggestions.apiSummaries,
          `/attachments?conversationId=...: attachmentId=${sample.attachmentId}, backendId=${sample.backendAttachmentId}`
        );
        if (item.id === "photo_attachment" && sample.expenseFollowUp?.available) {
          addUnique(
            suggestions.screenshots,
            `费用确认卡或金额追问: ${sample.expenseFollowUp.screenshotPath}`
          );
          if (sample.expenseFollowUp.expenseRecordId) {
            addUnique(
              suggestions.apiSummaries,
              `/expenses?conversationId=...: expenseRecordId=${sample.expenseFollowUp.expenseRecordId}, responseKind=${sample.expenseFollowUp.responseKind ?? "unknown"}`
            );
          }
        }
        addUnique(
          suggestions.bridgeMarkers,
          `inputKind=attachment: source=${sample.source}, attachment=${sample.name}`
        );
        if (sample.kind) {
          addUnique(suggestions.bridgeMarkers, `attachmentKind=${sample.kind}`);
        }
      }
      break;
    }
    case "system_calendar_write": {
      const calendarConfirmation =
        evidence?.acceptanceFactSeed?.confirmationScreenshots?.calendar;
      if (calendarConfirmation?.available && calendarConfirmation.path) {
        addUnique(
          suggestions.screenshots,
          `日程确认卡: ${calendarConfirmation.path}`
        );
      }
      if (evidence?.calendarSystemAppEvidence?.available) {
        addUnique(
          suggestions.systemArtifacts,
          `iOS 系统日历事件截图: ${evidence.calendarSystemAppEvidence.screenshotPath}`
        );
        addUnique(
          suggestions.bridgeMarkers,
          `calendar.events.sync: eventId=${evidence.calendarSystemAppEvidence.targetEventId}`
        );
        addUnique(suggestions.apiSummaries, `/calendar/events?conversationId=...: ${apiSummary(evidence, "calendarEvents")}`);
        const calendarPath = pathForSurface(evidence, "calendar");
        if (calendarPath) {
          addUnique(suggestions.screenshots, `H5 日历页 scheduled 结果: ${calendarPath}`);
        }
      }
      break;
    }
    case "system_calendar_cleanup": {
      if (evidence?.calendarCleanupSeed?.available) {
        const canceledEvent = evidence.calendarCleanupSeed.canceledEvent;
        const canceledEventId =
          canceledEvent?.id ?? evidence.calendarCleanupSeed.targetEventId ?? "unknown";
        const canceledStatus =
          canceledEvent?.status ?? evidence.calendarCleanupSeed.postCancelStatus ?? "unknown";
        const h5Cancel =
          evidence.calendarCleanupSeed.h5CancelActionScreenshot;
        if (h5Cancel?.available && h5Cancel.path) {
          addUnique(
            suggestions.screenshots,
            `H5 日程取消动作: ${h5Cancel.path}`
          );
        }
        addUnique(
          suggestions.systemArtifacts,
          `iOS 系统日历事件消失截图: ${evidence.calendarCleanupSeed.systemCalendarAppScreenshots?.afterPath}`
        );
        addUnique(
          suggestions.apiSummaries,
          `后端 canceled 状态: eventId=${canceledEventId}, status=${canceledStatus}`
        );
        addUnique(
          suggestions.bridgeMarkers,
          `calendar.events.sync: eventId=${evidence.calendarCleanupSeed.targetEventId}`
        );
        addUnique(
          suggestions.bridgeMarkers,
          `status=canceled: ${evidence.calendarCleanupSeed.postCancelStatus}`
        );
        addUnique(suggestions.apiSummaries, `/calendar/events?conversationId=...: ${apiSummary(evidence, "calendarEvents")}`);
      }
      break;
    }
    case "backend_fact_confirmation": {
      const surfaces = [
        ["Timeline 页面", "timeline"],
        ["日程页", "calendar"],
        ["提醒页", "reminders"],
        ["费用页", "expenses"],
        ["执行记录页", "ledger"],
      ];
      for (const [label, surface] of surfaces) {
        const surfacePath = pathForSurface(evidence, surface);
        if (surfacePath) {
          addUnique(suggestions.screenshots, `${label}: ${surfacePath}`);
        }
      }
      for (const label of [
        "/calendar/events?conversationId=...",
        "/reminders?conversationId=...",
        "/expenses?conversationId=...",
        "/execution-ledger?conversationId=...",
      ]) {
        addUnique(suggestions.apiSummaries, `${label}: ${apiSummary(evidence, label)}`);
      }
      if (evidence?.acceptanceFactSeed?.available) {
        addUnique(suggestions.bridgeMarkers, "action_executed: acceptanceFactSeed");
      }
      if (evidence?.calendarCleanupSeed?.available || evidence?.calendarPermissionDenialSeed?.available) {
        addUnique(suggestions.bridgeMarkers, "direct_action_executed: system evidence seed");
      }
      break;
    }
    case "system_sync_degradation": {
      if (evidence?.calendarPermissionDenialSeed?.available) {
        addUnique(
          suggestions.screenshots,
          `权限拒绝: ${evidence.calendarPermissionDenialSeed.screenshotPath}`
        );
        addUnique(
          suggestions.screenshots,
          `H5 状态栏降级文案: ${evidence.calendarPermissionDenialSeed.h5StatusExpectation}`
        );
        addUnique(
          suggestions.screenshots,
          `后端事实接口成功响应: targetEventId=${evidence.calendarPermissionDenialSeed.targetEventId}`
        );
        addUnique(suggestions.apiSummaries, `/calendar/events?conversationId=...: ${apiSummary(evidence, "calendarEvents")}`);
        addUnique(suggestions.apiSummaries, `/reminders?conversationId=...: ${apiSummary(evidence, "reminders")}`);
        addUnique(
          suggestions.bridgeMarkers,
          `native.error: ${evidence.calendarPermissionDenialSeed.nativeErrorSource}`
        );
        addUnique(
          suggestions.systemArtifacts,
          `iOS 权限拒绝截图: ${evidence.calendarPermissionDenialSeed.screenshotPath}`
        );
      }
      break;
    }
    default:
      break;
  }

  return suggestions;
}

export function buildManualEvidenceReview(record, evidence) {
  return {
    ...record,
    generatedFromDraft: "manual-evidence-record.draft.json",
    instructions:
      "本文件是自动整理后的人工复核草稿。候选证据已填入 evidence 字段，但 status 仍保持 pending；人工复核截图、录屏、接口摘要和系统证据后，才能改为 passed/failed/blocked。",
    items: record.items.map((item) => {
      const suggestions = evidenceSuggestionsForItem(item, evidence);
      const nextEvidence = { ...item.evidence };
      for (const category of evidenceCategories) {
        nextEvidence[category] = [...(Array.isArray(nextEvidence[category]) ? nextEvidence[category] : [])];
        for (const value of suggestions[category]) {
          addUnique(nextEvidence[category], value);
        }
      }
      const suggestionCount = evidenceCategories.reduce(
        (count, category) => count + suggestions[category].length,
        0
      );
      nextEvidence.operatorNotes =
        suggestionCount > 0
          ? `${item.evidence?.operatorNotes ? `${item.evidence.operatorNotes}\n` : ""}候选证据已自动整理 ${suggestionCount} 条，需人工复核后再改状态。`
          : item.evidence?.operatorNotes ?? "";
      return {
        ...item,
        status: "pending",
        acceptanceNote: "候选证据不等于人工验收通过。",
        evidence: nextEvidence,
      };
    }),
  };
}
