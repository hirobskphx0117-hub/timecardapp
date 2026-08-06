"use client";

import type { PunchType } from "@/lib/types";

const ICONS: Record<PunchType, React.ReactNode> = {
  clock_in: (
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.53-11.03a.75.75 0 0 0-1.06 1.06L10.94 9.5H6a.75.75 0 0 0 0 1.5h4.94l-1.47 1.47a.75.75 0 1 0 1.06 1.06l2.75-2.75a.75.75 0 0 0 0-1.06l-2.75-2.75Z"
      clipRule="evenodd"
    />
  ),
  break_start: (
    <>
      <rect x="5" y="4.5" width="3" height="11" rx="1" />
      <rect x="12" y="4.5" width="3" height="11" rx="1" />
    </>
  ),
  break_end: (
    <path d="M6.5 4.5v11a1 1 0 0 0 1.53.85l8.1-5.5a1 1 0 0 0 0-1.7l-8.1-5.5A1 1 0 0 0 6.5 4.5Z" />
  ),
  clock_out: (
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-.53-11.03a.75.75 0 0 1 1.06 1.06L9.06 9.5H14a.75.75 0 0 1 0 1.5H9.06l1.47 1.47a.75.75 0 1 1-1.06 1.06l-2.75-2.75a.75.75 0 0 1 0-1.06l2.75-2.75Z"
      clipRule="evenodd"
    />
  ),
};

const ENABLED_STYLES: Record<PunchType, string> = {
  clock_in: "bg-teal-500 hover:bg-teal-600 text-white",
  break_start: "bg-amber-500 hover:bg-amber-600 text-white",
  break_end: "bg-sky-500 hover:bg-sky-600 text-white",
  clock_out: "bg-slate-700 hover:bg-slate-800 text-white",
};

type Props = {
  type: PunchType;
  label: string;
  enabled: boolean;
  onClick: () => void;
};

export default function PunchButton({ type, label, enabled, onClick }: Props) {
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl py-6 text-sm font-medium shadow-sm transition-all ${
        enabled
          ? `${ENABLED_STYLES[type]} active:scale-[0.97]`
          : "cursor-not-allowed bg-black/[0.04] text-black/25 dark:bg-white/[0.04] dark:text-white/20"
      }`}
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
        {ICONS[type]}
      </svg>
      {label}
    </button>
  );
}
