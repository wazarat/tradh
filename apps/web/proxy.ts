import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "tradh_session";
/** Routes that need a server session. Markets and Trade are browsable; Trade gates actions client-side. */
const PROTECTED = ["/overview", "/strategies", "/activity", "/settings", "/notifications"];

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const needsSession = PROTECTED.some((p) => path === p || path.startsWith(p + "/"));
  if (needsSession && !req.cookies.get(SESSION_COOKIE)?.value) {
    const url = new URL("/", req.nextUrl);
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|brand|robots.txt|sitemap.xml).*)"],
};
