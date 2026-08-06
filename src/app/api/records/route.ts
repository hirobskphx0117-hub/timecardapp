import { NextRequest, NextResponse } from "next/server";
import { jstTodayKey } from "@/lib/date";
import { getPunchesForDate, listStaff } from "@/lib/repo";

export async function GET(request: NextRequest) {
  const dateKey = request.nextUrl.searchParams.get("date") ?? jstTodayKey();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  const [staff, punchesByStaff] = await Promise.all([
    listStaff(),
    getPunchesForDate(dateKey),
  ]);

  const records = staff.map((s) => ({
    staff: s,
    punches: punchesByStaff.get(s.id) ?? [],
  }));

  return NextResponse.json({ date: dateKey, records });
}
