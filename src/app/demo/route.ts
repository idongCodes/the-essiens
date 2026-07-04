import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    // 1. Find the Demo Guest user
    const demoUser = await prisma.user.findUnique({
      where: { email: 'guest@demo.com' }
    })

    if (!demoUser) {
      return NextResponse.json(
        { error: 'Demo user not found. Please run the seed script.' },
        { status: 404 }
      )
    }

    // 2. Set the session cookie
    const cookieStore = await cookies()
    cookieStore.set('session_id', demoUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })
    
    // Set a flag so the frontend knows this is the demo account
    cookieStore.set('is_demo', 'true', {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    })

    // 3. Redirect to the main app (Common Room)
    return NextResponse.redirect(new URL('/common-room', request.url))
  } catch (error) {
    console.error('Error logging into demo account:', error)
    return NextResponse.json(
      { error: 'Failed to access demo environment' },
      { status: 500 }
    )
  }
}
