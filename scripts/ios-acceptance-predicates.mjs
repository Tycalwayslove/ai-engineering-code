export function isCalendarPermissionDenialAvailable({
  backendFactPersisted,
  errors,
  nativeErrorReason,
  screenshotAvailable,
  systemDiagnostics,
}) {
  const reason = typeof nativeErrorReason === "string" ? nativeErrorReason : "";
  return (
    Array.isArray(errors) &&
    errors.length === 0 &&
    backendFactPersisted === true &&
    systemDiagnostics?.["calendar.lastSyncStatus"] === "failed" &&
    reason.includes("日历权限") &&
    screenshotAvailable === true
  );
}
