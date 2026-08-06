import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/auth";

const PROTECTED_API_PREFIXES = ["/api/staff", "/api/records"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthed = verifyAdminToken(request.cookies.get(ADMIN_COOKIE)?.value);

  if (PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!isAuthed) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!isAuthed) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/staff/:path*", "/api/records/:path*"],
};
