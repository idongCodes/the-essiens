'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function verifyPasscode(passcode: string) {
  const config = await prisma.appConfig.findUnique({ where: { id: 'global' } })
  const actualPasscode = config?.familyPasscode || 'ESSIEN2026'
  return passcode === actualPasscode
}

export async function deleteUser(userId: string, passcode?: string) {
  const cookieStore = await cookies()
  const currentUserId = cookieStore.get('session_id')?.value

  if (!currentUserId) {
    throw new Error('Unauthorized')
  }

  // Verify Admin
  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { email: true }
  })

  const isAdmin = currentUser?.email === 'idongesit_essien@ymail.com'

  if (!isAdmin && currentUserId !== userId) {
    throw new Error('Unauthorized: You can only delete your own account unless you are an admin')
  }

  if (currentUserId === userId) {
    // If self-deleting, require the current family passcode
    if (!passcode) {
      throw new Error('Passcode is required to delete your account')
    }
    const config = await prisma.appConfig.findUnique({ where: { id: 'global' } })
    const actualPasscode = config?.familyPasscode || 'ESSIEN2026'
    
    if (passcode !== actualPasscode) {
      throw new Error('Incorrect family passcode')
    }
  }

  if (isAdmin && currentUserId !== userId) {
    await hardDeleteUser(userId)
    revalidatePath('/')
    revalidatePath('/family')
    revalidatePath('/my-room')
    return
  }

  if (currentUserId === userId) {
    // Schedule deletion instead of deleting immediately
    await prisma.user.update({
      where: { id: userId },
      data: { deleteScheduledAt: new Date() }
    })
    
    cookieStore.delete('session_id')
    cookieStore.delete('user_session')

    revalidatePath('/')
    revalidatePath('/family')
    revalidatePath('/my-room')
  }
}

export async function hardDeleteUser(userId: string) {
  await prisma.$transaction(async (tx) => {
    const userMessages = await tx.chatMessage.findMany({
      where: { authorId: userId },
      select: { id: true }
    })
    const messageIds = userMessages.map(m => m.id)
    if (messageIds.length > 0) {
      await tx.chatMessage.updateMany({
        where: { replyToId: { in: messageIds } },
        data: { replyToId: null }
      })
    }

    await tx.chatMessage.deleteMany({ where: { authorId: userId } })
    await tx.testimonial.deleteMany({ where: { authorId: userId } })
    await tx.comment.deleteMany({ where: { authorId: userId } })
    await tx.post.deleteMany({ where: { authorId: userId } })
    await tx.albumMedia.deleteMany({ where: { uploaderId: userId } })
    await tx.user.delete({ where: { id: userId } })
  })


}
