import assert from "node:assert/strict";
import test from "node:test";

import { isCalendarPermissionDenialAvailable } from "./ios-acceptance-predicates.mjs";

test("calendar permission denial accepts native permission error even when status reads authorized", () => {
  assert.equal(
    isCalendarPermissionDenialAvailable({
      backendFactPersisted: true,
      errors: [],
      nativeErrorReason: "未获得日历权限，日程已保存但不会写入系统日历",
      postAuthorizationStatus: "authorized",
      screenshotAvailable: true,
      systemDiagnostics: {
        "calendar.lastSyncStatus": "failed",
      },
    }),
    true
  );
});

test("calendar permission denial still rejects missing native permission error", () => {
  assert.equal(
    isCalendarPermissionDenialAvailable({
      backendFactPersisted: true,
      errors: [],
      nativeErrorReason: null,
      postAuthorizationStatus: "authorized",
      screenshotAvailable: true,
      systemDiagnostics: {
        "calendar.lastSyncStatus": "failed",
      },
    }),
    false
  );
});
