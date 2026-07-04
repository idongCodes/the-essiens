import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define the few routes that are safe for strangers
const publicRoutes = [
  '/', 
  '/login', 
  '/register', 
  '/forgot-password',
  '/reset-password',
  '/about', // Future-proofed as requested
  '/demo'
]

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session_id')
  const path = request.nextUrl.pathname

  // 1. Check if the current path is in our "Public List"
  const isPublic = publicRoutes.includes(path)

  // 2. If the route is NOT public and the user is NOT logged in...
  if (!isPublic && !session) {
    // ...kick them back to the login page
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

// 3. Update the Matcher to run on EVERYTHING
// (We exclude Next.js internal files, images, and API routes to keep things fast)
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
}