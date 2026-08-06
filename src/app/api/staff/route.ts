import { NextRequest, NextResponse } from "next/server";
import { createStaff, listStaff } from "@/lib/repo";

export async function GET() {
  const staff = await listStaff();
  return NextResponse.json({ staff });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!code || !name) {
    return NextResponse.json({ error: "code_and_name_required" }, { status: 400 });
  }

  try {
    const staff = await createStaff(code, name);
    return NextResponse.json({ staff }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("UNIQUE")) {
      return NextResponse.json({ error: "code_already_exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "unknown_error" }, { status: 500 });
  }
}
