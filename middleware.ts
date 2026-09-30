import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Public endpoints (/s, /b, /c) and static assets never touch the session.
  matcher: ["/admin/:path*", "/login"],
};
