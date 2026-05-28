"use client";

export function dateTimeIsoToLocalInputValue(value?: string) {
  if (!value) {
    return "";
  }

  const match = value.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  return match?.[1] ?? "";
}

function dateTimeLocalValueWithSeconds(value: string) {
  return value.length === 16 ? `${value}:00` : value;
}

function isoOffsetFromValue(value?: string) {
  const match = value?.match(/(Z|[+-]\d{2}:\d{2})$/);
  if (!match) {
    return undefined;
  }

  return match[1] === "Z" ? "+00:00" : match[1];
}

function formatOffsetMinutes(offsetMinutes: number) {
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, "0");
  const minutes = String(absolute % 60).padStart(2, "0");

  return `${sign}${hours}:${minutes}`;
}

function browserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai";
}

function timeZoneOffsetMinutes(timeZone: string, localValue: string) {
  const referenceDate = new Date(`${dateTimeLocalValueWithSeconds(localValue)}Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(referenceDate);
  const partValue = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(
    partValue("year"),
    partValue("month") - 1,
    partValue("day"),
    partValue("hour") % 24,
    partValue("minute"),
    partValue("second"),
  );

  return Math.round((asUtc - referenceDate.getTime()) / 60000);
}

export function dateTimeLocalValueToIso(
  value: string,
  timeZone?: string,
  previousIsoValue?: string,
) {
  const localValue = dateTimeLocalValueWithSeconds(value);
  const offset =
    isoOffsetFromValue(timeZone) ??
    isoOffsetFromValue(previousIsoValue) ??
    formatOffsetMinutes(timeZoneOffsetMinutes(timeZone || browserTimeZone(), value));

  return `${localValue}${offset}`;
}
