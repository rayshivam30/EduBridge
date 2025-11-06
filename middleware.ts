import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const PUBLIC_PATHS = ["/", "/login", "/signup", "/api/auth", "/api/health"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths and Next internal
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) || pathname.startsWith("/_next") || pathname.startsWith("/static") || pathname.startsWith("/images")) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAuth = !!token

  // Redirect unauthenticated users to login
  if (!isAuth && (pathname.startsWith("/student") || pathname.startsWith("/teacher") || pathname.startsWith("/onboarding"))) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("callbackUrl", req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  if (!isAuth) return NextResponse.next()

  // If already authenticated, redirect away from login/signup
  if (pathname === "/login" || pathname === "/signup") {
    if (token?.role === "TEACHER") {
      const url = req.nextUrl.clone(); url.pathname = "/teacher"; return NextResponse.redirect(url)
    }
    if (token?.role === "STUDENT") {
      const url = req.nextUrl.clone(); url.pathname = "/student"; return NextResponse.redirect(url)
    }
    const url = req.nextUrl.clone(); url.pathname = "/onboarding"; return NextResponse.redirect(url)
  }

  // Enforce role-based access
  // Note: If role is null, allow access to dashboard pages - they will handle the redirect
  // This prevents redirect loops when user just set their role
  if (pathname.startsWith("/student-dashboard") || pathname.startsWith("/teacher-dashboard")) {
    // Allow access - let the page component handle role checking and redirects
    // This prevents middleware from creating redirect loops
    return NextResponse.next()
  }

  if (pathname.startsWith("/student")) {
    if (token?.role === "STUDENT") return NextResponse.next()
    const url = req.nextUrl.clone(); url.pathname = token?.role === "TEACHER" ? "/teacher-dashboard" : "/onboarding"; return NextResponse.redirect(url)
  }

  if (pathname.startsWith("/teacher")) {
    if (token?.role === "TEACHER") return NextResponse.next()
    const url = req.nextUrl.clone(); url.pathname = token?.role === "STUDENT" ? "/student-dashboard" : "/onboarding"; return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg).*)",
  ],
}
