import type { Punch, PunchType, Status } from "./types";

export const PUNCH_LABELS: Record<PunchType, string> = {
  clock_in: "出勤",
  break_start: "休憩入り",
  break_end: "休憩終わり",
  clock_out: "退勤",
};

export const STATUS_LABELS: Record<Status, string> = {
  before_work: "未出勤",
  working: "勤務中",
  on_break: "休憩中",
  done: "退勤済み",
};

export const ACTIONS: { type: PunchType; enabledOn: Status[] }[] = [
  { type: "clock_in", enabledOn: ["before_work"] },
  { type: "break_start", enabledOn: ["working"] },
  { type: "break_end", enabledOn: ["on_break"] },
  { type: "clock_out", enabledOn: ["working"] },
];

export function getStatus(punches: Pick<Punch, "type">[]): Status {
  const last = punches[punches.length - 1];
  if (!last) return "before_work";
  switch (last.type) {
    case "clock_in":
    case "break_end":
      return "working";
    case "break_start":
      return "on_break";
    case "clock_out":
      return "done";
  }
}

export function canPunch(punches: Pick<Punch, "type">[], type: PunchType): boolean {
  const status = getStatus(punches);
  const action = ACTIONS.find((a) => a.type === type);
  return action ? action.enabledOn.includes(status) : false;
}

export function computeDurations(punches: Pick<Punch, "type" | "time">[], nowMs: number) {
  let workStart: number | null = null;
  let workEnd: number | null = null;
  let finishedBreakMs = 0;
  let ongoingBreakStart: number | null = null;

  for (const p of punches) {
    if (p.type === "clock_in") workStart = p.time;
    if (p.type === "clock_out") workEnd = p.time;
    if (p.type === "break_start") ongoingBreakStart = p.time;
    if (p.type === "break_end" && ongoingBreakStart !== null) {
      finishedBreakMs += p.time - ongoingBreakStart;
      ongoingBreakStart = null;
    }
  }

  if (workStart === null) {
    return { workedMs: 0, breakMs: 0 };
  }

  const endPoint = workEnd ?? nowMs;
  const breakMs =
    finishedBreakMs + (ongoingBreakStart !== null ? endPoint - ongoingBreakStart : 0);
  const workedMs = Math.max(0, endPoint - workStart - breakMs);

  return { workedMs, breakMs };
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}時間${String(m).padStart(2, "0")}分`;
}
