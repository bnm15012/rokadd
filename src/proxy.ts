import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Route classification helpers
// ---------------------------------------------------------------------------

/** Routes that anyone (unauthenticated) may access. */
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/privacy",
  "/terms",
  "/refund-policy",
  "/contact",
  "/about",
];

/** Prefix patterns that are always public (API auth, webhooks, static). */
const PUBLIC_PREFIXES = [
  "/api/auth",
  "/api/webhooks",
  "/api/snapshots",
  "/_next",
  "/favicon.ico",
  "/public",
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// ---------------------------------------------------------------------------
// Proxy function (Node.js runtime — do NOT add `export const runtime` here)
// ---------------------------------------------------------------------------
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public routes through without a session check
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Retrieve the session (reads the NextAuth JWT cookie)
  const session = await auth();

  // ── /admin/* — requires an authenticated super-admin ──────────────────────
  if (pathname.startsWith("/admin")) {
    if (!session) {
      const homeUrl = new URL("/", request.url);
      homeUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(homeUrl);
    }

    const user = session.user as any;
    if (!user?.isSuperAdmin) {
      // Authenticated but not a super-admin → send to dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  }

  // ── /dashboard/* (and any other protected route) ──────────────────────────
  if (!session) {
    const homeUrl = new URL("/", request.url);
    homeUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

// ---------------------------------------------------------------------------
// Matcher — run proxy on every route except Next.js internals and static files
// ---------------------------------------------------------------------------
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *   - _next/static  (static files)
     *   - _next/image   (image optimization)
     *   - favicon.ico
     *   - files with an extension (e.g. .png, .svg, .js, .css)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|woff2?|ttf|otf|map)$).*)",
  ],
};
