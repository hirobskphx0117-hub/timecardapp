const JST_TIME_ZONE = "Asia/Tokyo";

const dateKeyFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: JST_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: JST_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

const fullDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: JST_TIME_ZONE,
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
});

export function jstDateKey(epochMs: number): string {
  return dateKeyFormatter.format(new Date(epochMs));
}

export function jstTodayKey(): string {
  return jstDateKey(Date.now());
}

export function formatJstTime(epochMs: number): string {
  return timeFormatter.format(new Date(epochMs));
}

export function formatJstFullDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return fullDateFormatter.format(new Date(Date.UTC(y, m - 1, d, 3)));
}
