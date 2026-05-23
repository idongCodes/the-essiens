'use server'

import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'
import { headers } from 'next/headers'

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string

  if (!email) {
    return { success: false, message: 'Please provide an email address.' }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email }
    })

    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return { success: true, message: 'If an account exists, a password reset link has been sent.' }
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry
      }
    })

    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const resetLink = `${protocol}://${host}/reset-password?token=${resetToken}`

    await sendEmail({
      to: email,
      subject: 'Reset Your Family App Password',
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hi ${user.firstName},</p>
          <p>You requested to reset your password for the Family App.</p>
          <p>Click the link below to set a new password. This link will expire in 1 hour.</p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #38bdf8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #64748b; font-size: 0.9em;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `
    })

    return { success: true, message: 'If an account exists, a password reset link has been sent.' }
  } catch (error: any) {
    console.error('Password reset request error:', error)
    return { success: false, message: `An error occurred: ${error?.message || String(error)}` }
  }
}
