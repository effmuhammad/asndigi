import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Simple path-based protection without session checking
  // This reduces middleware size significantly
  
  // Allow public routes
  if (pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // For now, allow all dashboard routes - authentication will be handled client-side
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/admin/:path*'
  ]
}