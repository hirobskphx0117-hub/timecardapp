"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatJstTime, jstTodayKey } from "@/lib/date";
import {
  PUNCH_LABELS,
  STATUS_LABELS,
  computeDurations,
  formatDuration,
  getStatus,
} from "@/lib/timecard-logic";
import { useNow } from "../use-now";
import type { Punch, Staff } from "@/lib/types";

type Record = { staff: Staff; punches: Punch[] };

async function fetchStaffList(): Promise<Staff[]> {
  const res = await fetch("/api/staff");
  if (!res.ok) return [];
  const data = await res.json();
  return data.staff as Staff[];
}

async function fetchRecords(targetDate: string): Promise<Record[]> {
  const res = await fetch(`/api/records?date=${targetDate}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.records as Record[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const now = useNow();
  const today = jstTodayKey();

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const [date, setDate] = useState(today);
  const [records, setRecords] = useState<Record[]>([]);
  const [recordsDate, setRecordsDate] = useState<string | null>(null);
  const recordsLoading = recordsDate !== date;

  async function loadStaff() {
    setStaffList(await fetchStaffList());
  }

  async function loadRecords(targetDate: string) {
    const data = await fetchRecords(targetDate);
    setRecords(data);
    setRecordsDate(targetDate);
  }

  useEffect(() => {
    let ignore = false;
    fetchStaffList().then((list) => {
      if (!ignore) setStaffList(list);
    });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    fetchRecords(date).then((data) => {
      if (!ignore) {
        setRecords(data);
        setRecordsDate(date);
      }
    });
    return () => {
      ignore = true;
    };
  }, [date]);

  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    const code = newCode.trim();
    const name = newName.trim();
    if (!code || !name) return;
    setCreating(true);
    setStaffError(null);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStaffError(
          data?.error === "code_already_exists"
            ? "このスタッフコードは既に使われています"
            : "登録に失敗しました"
        );
        return;
      }
      setNewCode("");
      setNewName("");
      await loadStaff();
      await loadRecords(date);
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(staff: Staff) {
    await fetch(`/api/staff/${staff.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !staff.active }),
    });
    await loadStaff();
    await loadRecords(date);
  }

  async function handleDeleteStaff(staff: Staff) {
    if (!confirm(`${staff.name}さんを完全に削除しますか？打刻履歴も削除されます。`)) return;
    await fetch(`/api/staff/${staff.id}`, { method: "DELETE" });
    await loadStaff();
    await loadRecords(date);
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-black/90 dark:text-white/90">
          管理画面
        </h1>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg px-3 py-1.5 text-sm text-black/50 transition-colors hover:bg-black/[0.04] hover:text-black/70 dark:text-white/45 dark:hover:bg-white/[0.06] dark:hover:text-white/70"
        >
          ログアウト
        </button>
      </header>

      <section className="mb-10 rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-black/5 dark:bg-white/[0.06] dark:ring-white/10">
        <h2 className="mb-4 text-lg font-semibold text-black/85 dark:text-white/90">
          スタッフ管理
        </h2>

        <form onSubmit={handleCreateStaff} className="mb-5 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-black/50 dark:text-white/40">スタッフコード</label>
            <input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="例: 1234"
              className="w-32 rounded-lg bg-black/[0.03] px-3 py-2 text-sm text-black/85 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-teal-500 dark:bg-white/[0.05] dark:text-white/90 dark:ring-white/10"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-black/50 dark:text-white/40">氏名</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="例: 山田太郎"
              className="w-44 rounded-lg bg-black/[0.03] px-3 py-2 text-sm text-black/85 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-teal-500 dark:bg-white/[0.05] dark:text-white/90 dark:ring-white/10"
            />
          </div>
          <button
            type="submit"
            disabled={!newCode.trim() || !newName.trim() || creating}
            className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/30 dark:disabled:bg-white/10 dark:disabled:text-white/30"
          >
            追加
          </button>
        </form>
        {staffError && <p className="mb-4 text-sm text-red-500">{staffError}</p>}

        <div className="flex flex-col gap-2">
          {staffList.length === 0 && (
            <p className="py-4 text-center text-sm text-black/35 dark:text-white/30">
              スタッフが登録されていません
            </p>
          )}
          {staffList.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-xl bg-white/60 px-4 py-2.5 text-sm shadow-sm ring-1 ring-black/5 dark:bg-white/[0.03] dark:ring-white/10"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-black/40 dark:text-white/35">{s.code}</span>
                <span className="text-black/80 dark:text-white/85">{s.name}</span>
                {!s.active && (
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-black/40 dark:bg-white/10 dark:text-white/40">
                    無効
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleActive(s)}
                  className="rounded-lg px-2.5 py-1 text-xs text-black/50 transition-colors hover:bg-black/[0.05] dark:text-white/45 dark:hover:bg-white/[0.08]"
                >
                  {s.active ? "無効にする" : "有効にする"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteStaff(s)}
                  className="rounded-lg px-2.5 py-1 text-xs text-red-500/70 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-black/5 dark:bg-white/[0.06] dark:ring-white/10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black/85 dark:text-white/90">記録</h2>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg bg-black/[0.03] px-3 py-1.5 text-sm text-black/80 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-teal-500 dark:bg-white/[0.05] dark:text-white/85 dark:ring-white/10"
          />
        </div>

        {recordsLoading ? (
          <p className="py-6 text-center text-sm text-black/35 dark:text-white/30">
            読み込み中…
          </p>
        ) : records.length === 0 ? (
          <p className="py-6 text-center text-sm text-black/35 dark:text-white/30">
            スタッフが登録されていません
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left text-xs text-black/40 dark:border-white/10 dark:text-white/35">
                  <th className="py-2 pr-3 font-medium">氏名</th>
                  <th className="py-2 pr-3 font-medium">状態</th>
                  <th className="py-2 pr-3 font-medium">打刻</th>
                  <th className="py-2 pr-3 font-medium">勤務時間</th>
                  <th className="py-2 font-medium">休憩時間</th>
                </tr>
              </thead>
              <tbody>
                {records.map(({ staff, punches }) => {
                  const status = getStatus(punches);
                  const showDuration =
                    status === "done" || status === "before_work" || date === today;
                  const { workedMs, breakMs } = showDuration
                    ? computeDurations(punches, now)
                    : { workedMs: 0, breakMs: 0 };
                  return (
                    <tr
                      key={staff.id}
                      className="border-b border-black/5 text-black/75 last:border-0 dark:border-white/5 dark:text-white/75"
                    >
                      <td className="py-2.5 pr-3">{staff.name}</td>
                      <td className="py-2.5 pr-3">{STATUS_LABELS[status]}</td>
                      <td className="py-2.5 pr-3">
                        {punches.length === 0 ? (
                          <span className="text-black/30 dark:text-white/25">—</span>
                        ) : (
                          <span className="font-mono text-xs text-black/50 dark:text-white/40">
                            {punches
                              .map((p) => `${PUNCH_LABELS[p.type]} ${formatJstTime(p.time)}`)
                              .join(" / ")}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3">
                        {showDuration ? formatDuration(workedMs) : "—"}
                      </td>
                      <td className="py-2.5">
                        {showDuration ? formatDuration(breakMs) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
