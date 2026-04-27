'use server'

import { revalidatePath } from 'next/cache'
import { sendNotification } from '@/app/actions/push'
import { prisma } from '@/lib/prisma'

import { pusherServer } from '@/lib/pusher'

export async function getChatMessages(cursor?: string) {
  try {
    const limit = 50;
    const messages = await prisma.chatMessage.findMany({
      take: limit + 1, // Fetch one extra to check if there's a next page
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            alias: true,
            profileImage: true,
            email: true,
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                alias: true,
              }
            }
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                firstName: true,
                alias: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // Fetch newest first for pagination, we will reverse on client
      }
    })
    
    let nextCursor: string | undefined = undefined;
    if (messages.length > limit) {
      const nextItem = messages.pop(); // Remove the extra item
      nextCursor = nextItem?.id;
    }
    
    return { success: true, messages: messages.reverse(), nextCursor }
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    return { success: false, message: 'Failed to fetch messages' }
  }
}

export async function sendChatMessage(content: string, authorId: string, replyToId?: string) {
  try {
    if (!content.trim()) {
      return { success: false, message: 'Message cannot be empty' }
    }

    const message = await prisma.chatMessage.create({
      data: {
        content: content.trim(),
        authorId,
        replyToId: replyToId || null
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            alias: true,
            profileImage: true,
            email: true,
          }
        },
        reactions: true,
        replyTo: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                firstName: true,
                alias: true
              }
            }
          }
        }
      }
    })

    // --- SEND NOTIFICATION TO EVERYONE ELSE ---
    const allUsers = await prisma.user.findMany({
      where: {
        id: { not: authorId } // Don't notify the sender
      },
      select: { id: true }
    })
    
    const recipientIds = allUsers.map(u => u.id)
    const authorName = message.author.alias || message.author.firstName
    
    // Trigger pusher event
    await pusherServer.trigger('presence-chat', 'new-message', message);

    await sendNotification(
      recipientIds, 
      `${authorName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
      '/chat' // Assuming chat modal opens on root or specific chat page
    )

    revalidatePath('/chat')
    return { success: true, message }
  } catch (error) {
    console.error('Error sending chat message:', error)
    return { success: false, message: 'Failed to send message' }
  }
}

export async function toggleReaction(messageId: string, userId: string, emoji: string) {
  try {
    // Check if reaction exists
    const existingReaction = await prisma.messageReaction.findFirst({
      where: {
        messageId,
        userId,
        emoji
      }
    })

    if (existingReaction) {
      // Remove reaction
      await prisma.messageReaction.delete({
        where: {
          id: existingReaction.id
        }
      })
    } else {
      // Add reaction
      await prisma.messageReaction.create({
        data: {
          messageId,
          userId,
          emoji
        }
      })

      // --- NOTIFY MESSAGE AUTHOR ---
      const message = await prisma.chatMessage.findUnique({ where: { id: messageId }, select: { authorId: true } })
      if (message && message.authorId !== userId) {
        const reactor = await prisma.user.findUnique({ where: { id: userId } })
        const reactorName = reactor?.alias || reactor?.firstName || 'Someone'
        await sendNotification([message.authorId], `${reactorName} reacted ${emoji} to your message`, '/chat')
      }
    }

    await pusherServer.trigger('presence-chat', 'reaction-toggled', { messageId, userId, emoji })

    revalidatePath('/chat')
    return { success: true }
  } catch (error) {
    console.error('Error toggling reaction:', error)
    return { success: false, message: 'Failed to toggle reaction' }
  }
}
