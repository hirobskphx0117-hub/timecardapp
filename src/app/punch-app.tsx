"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import PunchButton from "./punch-button";
import {
  ACTIONS,
  PUNCH_LABELS,
  STATUS_LABELS,
  computeDurations,
  formatDuration,
  getStatus,
} from "@/lib/timecard-logic";
import { formatJstFullDate, formatJstTime, jstTodayKey } from "@/lib/date";
import { useNow } from "./use-now";
import type { Punch, PunchType, Staff, Status } from "@/lib/types";

const LAST_CODE_KEY = "simple-timecard-app:last-code";

function subscribeNoop() {
  return () => {};
}

function getLastCodeSnapshot(): string {
  return localStorage.getItem(LAST_CODE_KEY) ?? "";
}

function getLastCodeServerSnapshot(): string {
  return "";
}

const STATUS_BADGE: Record<Status, string> = {
  before_work: "bg-black/5 text-black/50 dark:bg-white/10 dark:text-white/50",
  working: "bg-teal-500/15 text-teal-700 dark:text-teal-400",
  on_break: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  done: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
};

export default function PunchApp() {
  const now = useNow();
  const lastCode = useSyncExternalStore(
    subscribeNoop,
    getLastCodeSnapshot,
    getLastCodeServerSnapshot
  );
  const [codeOverride, setCodeOverride] = useState<string | null>(null);
  const code = codeOverride ?? lastCode;
  const [staff, setStaff] = useState<Staff | null>(null);
  const [punches, setPunches] = useState<Punch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [punching, setPunching] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/punch?code=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        setError("スタッフコードが見つかりません");
        setStaff(null);
        return;
      }
      const data = await res.json();
      setStaff(data.staff);
      setPunches(data.punches);
      localStorage.setItem(LAST_CODE_KEY, trimmed);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function handlePunch(type: PunchType) {
    if (!staff || punching) return;
    setPunching(true);
    setError(null);
    try {
      const res = await fetch("/api/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: staff.code, type }),
      });
      if (!res.ok) {
        setError("打刻に失敗しました。もう一度お試しください");
        return;
      }
      const data = await res.json();
      setPunches(data.punches);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setPunching(false);
    }
  }

  function handleSwitchUser() {
    setStaff(null);
    setPunches([]);
    setError(null);
    setCodeOverride(null);
  }

  if (!staff) {
    return (
      <div className="w-full max-w-sm">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-black/90 dark:text-white/90">
            タイムカード
          </h1>
          <p className="mt-1.5 text-sm text-black/45 dark:text-white/40">
            {formatJstFullDate(jstTodayKey())}
          </p>
        </header>

        <form
          onSubmit={handleLookup}
          className="flex flex-col gap-3 rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-black/5 dark:bg-white/[0.06] dark:ring-white/10"
        >
          <label
            htmlFor="staff-code"
            className="text-sm font-medium text-black/70 dark:text-white/70"
          >
            スタッフコード
          </label>
          <input
            id="staff-code"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={code}
            onChange={(e) => setCodeOverride(e.target.value)}
            placeholder="例: 1234"
            className="rounded-xl bg-black/[0.03] px-4 py-3 text-lg tracking-wide text-black/85 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-teal-500 dark:bg-white/[0.05] dark:text-white/90 dark:ring-white/10"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={!code.trim() || loading}
            className="mt-1 rounded-xl bg-teal-500 py-3 text-sm font-medium text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/30 dark:disabled:bg-white/10 dark:disabled:text-white/30"
          >
            {loading ? "確認中…" : "確認する"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-black/30 dark:text-white/25">
          <Link href="/admin/login" className="hover:underline">
            管理者はこちら
          </Link>
        </p>
      </div>
    );
  }

  const status = getStatus(punches);
  const { workedMs, breakMs } = computeDurations(punches, now);

  return (
    <div className="w-full max-w-md">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-black/90 dark:text-white/90">
          タイムカード
        </h1>
        <p className="mt-1.5 text-sm text-black/45 dark:text-white/40">
          {formatJstFullDate(jstTodayKey())}
        </p>
      </header>

      <div className="mb-6 flex flex-col items-center gap-2 rounded-2xl bg-white/80 py-7 shadow-sm ring-1 ring-black/5 dark:bg-white/[0.06] dark:ring-white/10">
        <span className="text-lg font-semibold text-black/85 dark:text-white/90">
          {staff.name}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE[status]}`}
        >
          {STATUS_LABELS[status]}
        </span>
      </div>

      {error && (
        <p className="mb-4 text-center text-sm text-red-500">{error}</p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3">
        {ACTIONS.map((action) => (
          <PunchButton
            key={action.type}
            type={action.type}
            label={PUNCH_LABELS[action.type]}
            enabled={action.enabledOn.includes(status) && !punching}
            onClick={() => handlePunch(action.type)}
          />
        ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/70 px-4 py-3 text-center shadow-sm ring-1 ring-black/5 dark:bg-white/[0.04] dark:ring-white/10">
          <p className="text-xs text-black/40 dark:text-white/35">勤務時間</p>
          <p className="mt-0.5 text-lg font-semibold text-black/85 dark:text-white/90">
            {formatDuration(workedMs)}
          </p>
        </div>
        <div className="rounded-xl bg-white/70 px-4 py-3 text-center shadow-sm ring-1 ring-black/5 dark:bg-white/[0.04] dark:ring-white/10">
          <p className="text-xs text-black/40 dark:text-white/35">休憩時間</p>
          <p className="mt-0.5 text-lg font-semibold text-black/85 dark:text-white/90">
            {formatDuration(breakMs)}
          </p>
        </div>
      </div>

      {punches.length > 0 && (
        <ul className="mb-6 flex flex-col gap-2">
          {punches.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl bg-white/60 px-4 py-2.5 text-sm shadow-sm ring-1 ring-black/5 dark:bg-white/[0.03] dark:ring-white/10"
            >
              <span className="text-black/70 dark:text-white/70">
                {PUNCH_LABELS[p.type]}
              </span>
              <span className="font-mono text-black/45 tabular-nums dark:text-white/40">
                {formatJstTime(p.time)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={handleSwitchUser}
        className="w-full rounded-xl py-2.5 text-center text-sm text-black/40 transition-colors hover:bg-black/[0.03] hover:text-black/60 dark:text-white/35 dark:hover:bg-white/[0.04] dark:hover:text-white/60"
      >
        別のスタッフに切り替える
      </button>
    </div>
  );
}
