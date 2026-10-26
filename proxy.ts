import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Optimistic cookie check only; pages and API routes verify the session fully.
export function proxy(request: NextRequest) {
  const hasSession = Boolean(getSessionCookie(request));
  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    return hasSession ? NextResponse.redirect(new URL("/home", request.url)) : NextResponse.next();
  }
  if (!hasSession) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/home/:path*",
    "/profile/:path*",
    "/generate/:path*",
    "/playlists/:path*",
    "/api/music/:path*",
    "/api/playlists/:path*",
    "/api/preferences/:path*",
    "/api/generate/:path*",
  ],
};
