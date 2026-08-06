import { NextRequest, NextResponse } from "next/server";
import { jstTodayKey } from "@/lib/date";
import { getPunches, getStaffByCode, insertPunch } from "@/lib/repo";
import { canPunch } from "@/lib/timecard-logic";
import type { PunchType } from "@/lib/types";

const PUNCH_TYPES: PunchType[] = ["clock_in", "break_start", "break_end", "clock_out"];

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")?.trim();
  if (!code) {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }

  const staff = await getStaffByCode(code);
  if (!staff || !staff.active) {
    return NextResponse.json({ error: "staff_not_found" }, { status: 404 });
  }

  const punches = await getPunches(staff.id, jstTodayKey());
  return NextResponse.json({ staff, punches });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const type = body?.type as PunchType;

  if (!code || !PUNCH_TYPES.includes(type)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const staff = await getStaffByCode(code);
  if (!staff || !staff.active) {
    return NextResponse.json({ error: "staff_not_found" }, { status: 404 });
  }

  const dateKey = jstTodayKey();
  const punches = await getPunches(staff.id, dateKey);

  if (!canPunch(punches, type)) {
    return NextResponse.json({ error: "invalid_transition" }, { status: 409 });
  }

  await insertPunch(staff.id, type, Date.now(), dateKey);
  const updated = await getPunches(staff.id, dateKey);
  return NextResponse.json({ staff, punches: updated });
}
