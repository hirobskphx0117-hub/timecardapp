import { NextRequest, NextResponse } from "next/server";
import { deleteStaff, updateStaff } from "@/lib/repo";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/staff/[id]">
) {
  const { id } = await ctx.params;
  const staffId = Number(id);
  if (!Number.isInteger(staffId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const fields: { code?: string; name?: string; active?: boolean } = {};
  if (typeof body?.code === "string" && body.code.trim()) fields.code = body.code.trim();
  if (typeof body?.name === "string" && body.name.trim()) fields.name = body.name.trim();
  if (typeof body?.active === "boolean") fields.active = body.active;

  try {
    const staff = await updateStaff(staffId, fields);
    if (!staff) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ staff });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("UNIQUE")) {
      return NextResponse.json({ error: "code_already_exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "unknown_error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/staff/[id]">
) {
  const { id } = await ctx.params;
  const staffId = Number(id);
  if (!Number.isInteger(staffId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }
  await deleteStaff(staffId);
  return NextResponse.json({ ok: true });
}
