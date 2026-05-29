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

function apiSummary(evidence, label) {
  const conversationId = evidence?.backendFactSnapshot?.conversationId ?? "unknown";
  const counts = evidence?.backendFactSnapshot?.counts ?? {};
  return `${label}: conversationId=${conversationId}, counts=${JSON.stringify(counts)}`;
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
      if (persistence.stableAcrossRelaunch === true) {
        addUnique(
          suggestions.apiSummaries,
          `/agent/conversations/{conversationId}/turns: ${apiSummary(evidence, "turns")}`
        );
      }
      break;
    }
    case "local_notification": {
      if (evidence?.notificationDelivery?.available) {
        addUnique(suggestions.apiSummaries, `/reminders?conversationId=...: ${apiSummary(evidence, "reminders")}`);
        addUnique(
          suggestions.bridgeMarkers,
          `notifications.reminders.sync: ${evidence.notificationDelivery.notificationIdentifier ?? "available"}`
        );
        const remindersPath = pathForSurface(evidence, "reminders");
        if (remindersPath) {
          addUnique(suggestions.screenshots, `H5 提醒页 scheduled 结果: ${remindersPath}`);
        }
      }
      break;
    }
    case "notification_click_backflow": {
      if (evidence?.notificationClickBackflow?.available) {
        const path = evidence.notificationClickBackflow.h5OpenedScreenshotPath;
        addUnique(suggestions.screenshots, `通知点击后 H5 reminders 视图: ${path}`);
        addUnique(suggestions.screenshots, `高亮提醒行: ${path}`);
        addUnique(suggestions.apiSummaries, `/reminders?conversationId=...: ${apiSummary(evidence, "reminders")}`);
        addUnique(
          suggestions.bridgeMarkers,
          `source=native.notifications.reminders.opened: reminderId=${evidence.notificationClickBackflow.reminderId}`
        );
      }
      break;
    }
    case "keyboard_input": {
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
        addUnique(
          suggestions.bridgeMarkers,
          `inputKind=attachment: source=${sample.source}, attachment=${sample.name}`
        );
      }
      break;
    }
    case "system_calendar_write": {
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
        addUnique(
          suggestions.systemArtifacts,
          `iOS 系统日历事件消失截图: ${evidence.calendarCleanupSeed.systemCalendarAppScreenshots?.afterPath}`
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
