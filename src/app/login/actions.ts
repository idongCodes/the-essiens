'use server'

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    // 1. CHECK USER
    const user = await prisma.user.findUnique({
      where: { email: email }
    })

    if (!user) {
      return { success: false, message: 'Invalid email or password.' }
    }

    // 2. CHECK PASSWORD
    const passwordMatch = await bcrypt.compare(password, user.password)
    
    if (!passwordMatch) {
      return { success: false, message: 'Invalid email or password.' }
    }

    // 3. SET COOKIES
    const cookieStore = await cookies()
    cookieStore.set('session_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    })

    // Also set a client-readable cookie for chat functionality
    cookieStore.set('user_session', user.id, {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    })

    // Remove demo cookie if it exists
    cookieStore.delete('is_demo')

    return { success: true }
  } catch (error: any) {
    console.error('Login error:', error)
    if (error.message?.includes("Can't reach database server")) {
       return { success: false, message: "Database connection failed. Please check your internet or configuration." }
    }
    return { success: false, message: "System error. Please try again later." }
  }
}