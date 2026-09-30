import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

export async function middleware(request: NextRequest) {
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  const path = request.nextUrl.pathname;

  if (path.startsWith("/admin")) {
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(path)}`;
      return NextResponse.redirect(url);
    }
    if (session.mustChange) {
      const url = request.nextUrl.clone();
      url.pathname = "/change-password";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }
  if (path === "/login" && session) {
    const url = request.nextUrl.clone();
    url.pathname = session.mustChange ? "/change-password" : "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (path === "/change-password" && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Public endpoints (/s, /b, /c) and static assets never touch the session.
  matcher: ["/admin/:path*", "/login", "/change-password"],
};
