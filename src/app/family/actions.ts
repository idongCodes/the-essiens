'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

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

  // Transaction to clean up data
  await prisma.$transaction(async (tx) => {
    // 1. Unlink chat replies
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

    // 2. Delete data that doesn't cascade automatically (if any)
    // Note: Most relations (PushSubscription, Notification, Like, CommentLike, PostDismissal, MessageReaction)
    // are set to onDelete: Cascade in schema.
    
    // Explicit deletions for non-cascading relations:
    
    // Delete ChatMessages
    await tx.chatMessage.deleteMany({ where: { authorId: userId } })
    
    // Delete Testimonials
    await tx.testimonial.deleteMany({ where: { authorId: userId } })

    // Delete Comments (children cascade)
    await tx.comment.deleteMany({ where: { authorId: userId } })

    // Delete Posts (comments and likes cascade)
    await tx.post.deleteMany({ where: { authorId: userId } })
    
    // Delete AlbumMedia
    await tx.albumMedia.deleteMany({ where: { uploaderId: userId } })

    // 3. Finally delete the User
    await tx.user.delete({ where: { id: userId } })
  })

  if (currentUserId === userId) {
    cookieStore.delete('session_id')
    cookieStore.delete('user_session')
  }

  revalidatePath('/')
  revalidatePath('/family')
  revalidatePath('/my-room')
}
