'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { sendNotification } from '@/app/actions/push'
import { prisma } from '@/lib/prisma'

// --- HELPER: GET CURRENT USER ID ---
async function getCurrentUserId() {
  const cookieStore = await cookies()
  return cookieStore.get('session_id')?.value
}

// =======================================================
// 1. POST ACTIONS
// =======================================================

export async function createPost(formData: FormData) {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false, message: 'Unauthorized' }

  const content = formData.get('content') as string || ""
  const imageUrl = formData.get('imageUrl') as string | null
  const videoUrl = formData.get('videoUrl') as string | null

  const hasText = content.trim().length > 0
  const hasMedia = !!imageUrl || !!videoUrl

  if (!hasText && !hasMedia) {
    return { success: false, message: "Post cannot be empty" }
  }

  const post = await prisma.post.create({
    data: {
      content,
      imageUrl,
      videoUrl,
      authorId: userId
    },
    include: { author: true }
  })

  // --- NOTIFY EVERYONE ---
  const allUsers = await prisma.user.findMany({
    where: { id: { not: userId } },
    select: { id: true }
  })
  
  if (allUsers.length > 0) {
    const authorName = post.author.alias || post.author.firstName
    const notificationText = `New post from ${authorName}: ${content.substring(0, 40)}${content.length > 40 ? '...' : ''}`
    await sendNotification(allUsers.map(u => u.id), notificationText, '/common-room')
  }

  revalidatePath('/common-room')
  return { success: true }
}

export async function deletePost(postId: string) {
  const userId = await getCurrentUserId()
  const ADMIN_EMAIL = 'idongesit_essien@ymail.com'
  
  if (!userId) return { success: false, message: 'Unauthorized' }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  const post = await prisma.post.findUnique({ where: { id: postId } })
  
  if (!post) return { success: false, message: 'Post not found' }

  // Allow if author OR admin
  if (post.authorId !== userId && user?.email !== ADMIN_EMAIL) {
    return { success: false, message: 'Unauthorized' }
  }

  await prisma.post.delete({ where: { id: postId } })
  revalidatePath('/common-room')
  return { success: true }
}

// --- UPDATED: EDIT POST (Supports Title/Urgency for Announcements) ---
export async function editPost(
  postId: string, 
  newContent: string, 
  newTitle?: string, 
  newIsUrgent?: boolean
) {
  const userId = await getCurrentUserId()
  const ADMIN_EMAIL = 'idongesit_essien@ymail.com'

  const user = await prisma.user.findUnique({ where: { id: userId } })
  const post = await prisma.post.findUnique({ where: { id: postId } })
  
  if (!post || !userId) return { success: false, message: 'Unauthorized' }

  const isAdmin = user?.email === ADMIN_EMAIL
  
  // Allow if author OR admin
  if (post.authorId !== userId && !isAdmin) {
    return { success: false, message: 'Unauthorized' }
  }
  
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
  
  // Rule: Regular posts have a 10-minute edit limit. Announcements (Admin) do not.
  // Admin can edit any post at any time.
  if (!post.isAnnouncement && !isAdmin && post.createdAt < tenMinutesAgo) {
      return { success: false, message: 'Edit time limit expired.' }
  }

  // Prepare update data
  const data: any = { content: newContent, isEdited: true }
  
  // Only update title/urgent if provided (for announcements)
  if (newTitle !== undefined) data.title = newTitle
  if (newIsUrgent !== undefined) data.isUrgent = newIsUrgent

  await prisma.post.update({
    where: { id: postId },
    data
  })

  revalidatePath('/common-room')
  return { success: true }
}

export async function toggleLike(postId: string) {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false, message: "Unauthorized" }

  const existingLike = await prisma.like.findUnique({
    where: {
      userId_postId: {
        userId,
        postId
      }
    }
  })

  if (existingLike) {
    await prisma.like.delete({ where: { id: existingLike.id } })
  } else {
    await prisma.like.create({ data: { userId, postId } })
    
    // --- NOTIFY POST AUTHOR ---
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } })
    if (post && post.authorId !== userId) {
      const liker = await prisma.user.findUnique({ where: { id: userId } })
      const likerName = liker?.alias || liker?.firstName || 'Someone'
      await sendNotification([post.authorId], `${likerName} liked your post ❤️`, '/common-room')
    }
  }

  revalidatePath('/common-room')
  return { success: true }
}

// =======================================================
// 2. COMMENT ACTIONS
// =======================================================

export async function addComment(postId: string, content: string, parentId?: string) {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false, message: "Unauthorized" }

  if (!content || content.trim().length === 0) return { success: false }

  const comment = await prisma.comment.create({
    data: {
      content,
      postId,
      authorId: userId,
      parentId: parentId || null
    }
  })

  // --- NOTIFY RELEVANT PEOPLE ---
  const commenter = await prisma.user.findUnique({ where: { id: userId } })
  const commenterName = commenter?.alias || commenter?.firstName || 'Someone'

  const notifications = []

  // 1. Notify Post Author (if not self)
  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (post && post.authorId !== userId) {
    notifications.push({
      userId: post.authorId,
      message: `${commenterName} commented on your post: "${content.substring(0, 30)}..."`
    })
  }

  // 2. Notify Parent Comment Author (if reply and not self)
  if (parentId) {
    const parentComment = await prisma.comment.findUnique({ where: { id: parentId } })
    if (parentComment && parentComment.authorId !== userId && parentComment.authorId !== post?.authorId) {
       // Avoid double notification if parent author is also post author
       notifications.push({
         userId: parentComment.authorId,
         message: `${commenterName} replied to your comment: "${content.substring(0, 30)}..."`
       })
    }
  }

  // Dispatch all notifications
  await Promise.all(notifications.map(n => sendNotification([n.userId], n.message, '/common-room')))

  revalidatePath('/common-room')
  return { success: true }
}

export async function toggleCommentLike(commentId: string) {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false, message: "Unauthorized" }

  const existingLike = await prisma.commentLike.findUnique({
    where: {
      userId_commentId: {
        userId,
        commentId
      }
    }
  })

  if (existingLike) {
    await prisma.commentLike.delete({ where: { id: existingLike.id } })
  } else {
    await prisma.commentLike.create({ data: { userId, commentId } })

    // --- NOTIFY COMMENT AUTHOR ---
    const comment = await prisma.comment.findUnique({ where: { id: commentId }, select: { authorId: true } })
    if (comment && comment.authorId !== userId) {
      const liker = await prisma.user.findUnique({ where: { id: userId } })
      const likerName = liker?.alias || liker?.firstName || 'Someone'
      await sendNotification([comment.authorId], `${likerName} liked your comment 👍`, '/common-room')
    }
  }

  revalidatePath('/common-room')
  return { success: true }
}

export async function deleteComment(commentId: string) {
  const userId = await getCurrentUserId()
  const ADMIN_EMAIL = 'idongesit_essien@ymail.com'
  
  if (!userId) return { success: false, message: 'Unauthorized' }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  const comment = await prisma.comment.findUnique({ where: { id: commentId } })
  
  if (!comment) return { success: false, message: 'Comment not found' }

  // Allow if author OR admin
  if (comment.authorId !== userId && user?.email !== ADMIN_EMAIL) {
    return { success: false, message: 'Unauthorized' }
  }

  await prisma.comment.delete({ where: { id: commentId } })
  revalidatePath('/common-room')
  return { success: true }
}

export async function editComment(commentId: string, newContent: string) {
  const userId = await getCurrentUserId()
  const comment = await prisma.comment.findUnique({ where: { id: commentId } })
  
  if (!comment || comment.authorId !== userId) return { success: false, message: 'Unauthorized' }
  if (comment.isEdited) return { success: false, message: 'Comment can only be edited once.' }

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
  if (comment.createdAt < tenMinutesAgo) return { success: false, message: 'Edit time limit expired.' }

  await prisma.comment.update({
    where: { id: commentId },
    data: { content: newContent, isEdited: true }
  })

  revalidatePath('/common-room')
  return { success: true }
}

// =======================================================
// 3. ANNOUNCEMENT ACTIONS
// =======================================================

export async function createAnnouncement(formData: FormData) {
  const userId = await getCurrentUserId()
  const ADMIN_EMAIL = 'idongesit_essien@ymail.com'

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user?.email !== ADMIN_EMAIL) {
    return { success: false, message: "Only Admin can post announcements." }
  }

  const title = formData.get('title') as string
  const message = formData.get('message') as string
  const isUrgent = formData.get('isUrgent') === 'true'

  if (!message || !title) return { success: false, message: "Title and Message are required." }

  await prisma.post.create({
    data: {
      title,
      content: message,
      authorId: userId!,
      isAnnouncement: true,
      isUrgent: isUrgent
    }
  })

  // --- NOTIFY EVERYONE ---
  const allUsers = await prisma.user.findMany({
    where: { id: { not: userId } },
    select: { id: true }
  })
  
  if (allUsers.length > 0) {
    const notificationText = `📢 Announcement: ${title}`
    await sendNotification(allUsers.map(u => u.id), notificationText, '/common-room')
  }

  revalidatePath('/common-room')
  return { success: true }
}

export async function dismissAnnouncement(postId: string) {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false }

  await prisma.postDismissal.create({
    data: {
      userId,
      postId
    }
  })

  revalidatePath('/common-room')
  return { success: true }
}

export async function getAnnouncements() {
  return await prisma.post.findMany({
    where: { isAnnouncement: true },
    orderBy: { createdAt: 'desc' },
    take: 5
  })
}

// =======================================================
// 4. FEED FETCHING (Split Urgent vs Regular)
// =======================================================

export async function getFeedData() {
  const userId = await getCurrentUserId()
  const ADMIN_EMAIL = 'idongesit_essien@ymail.com'
  
  let isAdmin = false
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.email === ADMIN_EMAIL) isAdmin = true
  }

  // Include structure for comments (support 1 level of nesting for now as per schema)
  const commentInclude = {
    author: true,
    likes: true,
    children: {
      include: {
        author: true,
        likes: true
      }
    }
  }
  
  // 1. Get Urgent Announcements (Not dismissed by me)
  const urgentPosts = await prisma.post.findMany({
    where: {
      isAnnouncement: true,
      isUrgent: true,
      dismissals: {
        none: { userId: userId } 
      }
    },
    include: {
      author: true,
      likes: { include: { user: true } },
      comments: { include: commentInclude }
    },
    orderBy: { createdAt: 'desc' }
  })

  // 2. Get Regular Posts (Not announcements)
  const regularPosts = await prisma.post.findMany({
    where: {
      isAnnouncement: false
    },
    include: {
      author: true,
      likes: { include: { user: true } },
      comments: { include: commentInclude }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Recursive helper to process comments
  const processComment = (c: any): any => ({
    ...c,
    author: {
      ...c.author,
      isAdmin: c.author.email === ADMIN_EMAIL
    },
    children: c.children ? c.children.map(processComment) : []
  })

  // Helper to map data structure for frontend
  const mapPost = (p: any) => ({
    ...p,
    author: {
      ...p.author,
      isAdmin: p.author.email === ADMIN_EMAIL
    },
    likeCount: p.likes.length,
    isLikedByMe: userId ? p.likes.some((l: any) => l.userId === userId) : false,
    topLevelComments: p.comments
      .filter((c: any) => !c.parentId)
      .map(processComment)
  })

  return {
    urgentPosts: urgentPosts.map(mapPost),
    regularPosts: regularPosts.map(mapPost),
    currentUserId: userId,
    isAdmin // Return admin status for current user
  }
}