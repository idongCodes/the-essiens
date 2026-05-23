'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function resetPassword(formData: FormData) {
  const token = formData.get('token') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!token) {
    return { success: false, message: 'Invalid or missing token.' }
  }

  if (password !== confirmPassword) {
    return { success: false, message: 'Passwords do not match.' }
  }

  if (password.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters.' }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { resetToken: token }
    })

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return { success: false, message: 'Invalid or expired password reset token.' }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    })

    return { success: true, message: 'Password has been successfully reset.' }
  } catch (error) {
    console.error('Reset password error:', error)
    return { success: false, message: 'An error occurred. Please try again later.' }
  }
}
