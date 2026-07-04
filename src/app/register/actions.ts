'use server'

import { cookies } from 'next/headers'
import { sendNotification } from '@/app/actions/push'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function registerUser(formData: FormData) {
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const alias = formData.get('alias') as string || firstName
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const password = formData.get('password') as string
  
  // 1. GRAB THE POSITION AND PASSCODE FROM THE FORM
  const position = formData.get('position') as string 
  const passcode = formData.get('passcode') as string

  const config = await prisma.appConfig.findUnique({
    where: { id: 'global' }
  })
  
  const validPasscode = config?.familyPasscode || "ESSIEN2026"

  if (passcode !== validPasscode) {
    return { success: false, message: "Incorrect Family Passcode. Please check the group chat." }
  }

  if (!password || password.length < 6) {
    return { success: false, message: "Password must be at least 6 characters." }
  }

  // 2. HASH THE PASSWORD
  const hashedPassword = await bcrypt.hash(password, 10)

  // 3. CHECK IF USER EXISTS
  const existingUser = await prisma.user.findUnique({
    where: { email: email }
  })

  if (existingUser) {
    return { success: false, message: "This email is already registered. Please Login." }
  }

  // 4. CREATE THE USER
  const newUser = await prisma.user.create({
    data: {
      firstName,
      lastName,
      alias,
      email,
      phone,
      position,
      password: hashedPassword,
    }
  })

  // 5. SET SESSION COOKIE
  const cookieStore = await cookies()
  cookieStore.set('session_id', newUser.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  })

  // Also set a client-readable cookie for chat functionality
  cookieStore.set('user_session', newUser.id, {
    httpOnly: false, // Allow client-side access
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  })

  // 6. STORE JOIN MESSAGE IN COOKIE FOR CHAT MODAL
  const displayName = alias || firstName
  cookieStore.set('new_user_join_message', `${displayName} has joined the app! 🎉`, {
    httpOnly: false, // Allow client-side access
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  })

  // --- 7. NOTIFY EVERYONE ABOUT NEW USER ---
  const allOtherUsers = await prisma.user.findMany({
    where: { id: { not: newUser.id } },
    select: { id: true }
  })
  
    if (allOtherUsers.length > 0) {
    await sendNotification(
      allOtherUsers.map(u => u.id),
      `${displayName} has joined the family! 🎉`,
      '/family'
    )
  }

  // Remove demo cookie if it exists
  cookieStore.delete('is_demo')

  return { success: true }
}