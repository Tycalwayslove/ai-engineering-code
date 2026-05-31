export function finalizeNativeKeyboardInputEvidence(keyboard) {
  const bridgeMarkerFound =
    typeof keyboard?.bridgeInboundLabel === "string" &&
    keyboard.bridgeInboundLabel.includes("source=native.composer.keyboard");
  const backendBridgeAvailable =
    keyboard?.confirmationCardFound === true &&
    Boolean(keyboard?.reminderId) &&
    bridgeMarkerFound;

  return {
    ...keyboard,
    backendBridgeAvailable,
    available:
      backendBridgeAvailable &&
      keyboard?.h5ReminderVisible === true &&
      Array.isArray(keyboard?.errors) &&
      keyboard.errors.length === 0,
  };
}
