"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("パスワードが違います");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-3 rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-black/5 dark:bg-white/[0.06] dark:ring-white/10"
    >
      <label htmlFor="password" className="text-sm font-medium text-black/70 dark:text-white/70">
        管理者パスワード
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="rounded-xl bg-black/[0.03] px-4 py-3 text-lg text-black/85 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-teal-500 dark:bg-white/[0.05] dark:text-white/90 dark:ring-white/10"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={!password || loading}
        className="mt-1 rounded-xl bg-slate-700 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/30 dark:disabled:bg-white/10 dark:disabled:text-white/30"
      >
        {loading ? "確認中…" : "ログイン"}
      </button>
    </form>
  );
}
