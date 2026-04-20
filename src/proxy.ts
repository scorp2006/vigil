import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/crypto";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedPrefix = ["/dashboard", "/campaigns", "/employees", "/templates", "/settings", "/risk", "/lms"];
  const isProtected = protectedPrefix.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("vigil_session")?.value;
  const session = await verifyToken(token);
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/campaigns/:path*",
    "/employees/:path*",
    "/templates/:path*",
    "/settings/:path*",
    "/risk/:path*",
    "/lms/:path*",
  ],
};
