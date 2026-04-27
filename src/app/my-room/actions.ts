'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendNotification } from '@/app/actions/push'
import { prisma } from '@/lib/prisma'

// --- 1. UPDATE PROFILE PHOTO ---
export async function updateProfilePhoto(formData: FormData) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('session_id')?.value

  if (!userId) return { success: false, message: "Unauthorized" }

  const imageUrl = formData.get('imageUrl') as string | null

  if (!imageUrl) {
    return { success: false, message: "No image provided" }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { profileImage: imageUrl }
    })

    revalidatePath('/my-room')
    revalidatePath('/common-room')
    revalidatePath('/family')
    revalidatePath('/') 

    return { success: true, url: imageUrl }
  } catch (error: any) {
    console.log("Server Error Log:", error);
    // console.error("Upload failed:", error)
    return { success: false, message: `Server Error: ${error.message || JSON.stringify(error)}` }
  }
}

// --- 2. UPDATE PROFILE DETAILS (Updated with Status) ---
export async function updateProfileDetails(formData: FormData) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('session_id')?.value

  if (!userId) return { success: false, message: "Unauthorized" }

  const bio = formData.get('bio') as string
  const location = formData.get('location') as string
  const alias = formData.get('alias') as string 
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const position = formData.get('position') as string
  const status = formData.get('status') as string // <--- NEW

  if (!firstName || !lastName || !position) {
    return { success: false, message: "Name and Position are required." }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        bio,
        location,
        alias,
        firstName,
        lastName,
        position,
        status // <--- Save Status
      }
    })

    revalidatePath('/my-room')
    revalidatePath('/family') 
    revalidatePath('/common-room')
    
    return { success: true }
  } catch (error) {
    console.error("Update failed:", error)
    return { success: false, message: "Failed to update profile" }
  }
}

// --- 3. UPDATE FAMILY SECRET (Admin Only) ---
export async function updateFamilySecret(newSecret: string) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('session_id')?.value
  const ADMIN_EMAIL = 'idongesit_essien@ymail.com'

  if (!userId) return { success: false, message: "Unauthorized" }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  
  if (user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return { success: false, message: "Only Admin can change the family secret." }
  }

  if (!newSecret || newSecret.trim().length < 4) {
    return { success: false, message: "Secret must be at least 4 characters." }
  }

  // Update or Create the settings row
  await prisma.systemSettings.upsert({
    where: { id: 'global' },
    update: { familySecret: newSecret },
    create: { id: 'global', familySecret: newSecret }
  })

  // --- NOTIFY EVERYONE ---
  const allUsers = await prisma.user.findMany({ select: { id: true } })
  
  if (allUsers.length > 0) {
    await sendNotification(
      allUsers.map(u => u.id),
      `🔑 Family Secret updated to: ${newSecret}`,
      '/my-room'
    )
  }

  revalidatePath('/my-room')
  return { success: true }
}

// --- 4. GET USER ACTIVITY ---
export async function getUserActivity() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('session_id')?.value
  if (!userId) return null

  try {
    const [posts, comments, likes] = await Promise.all([
      // 1. My Posts
      prisma.post.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
        include: { 
          author: true, 
          likes: true, 
          comments: true 
        }
      }),
      // 2. My Comments (Replies)
      prisma.comment.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
        include: { 
          post: { 
            select: { 
              id: true,
              title: true, 
              content: true,
              author: { select: { firstName: true, alias: true } }
            } 
          } 
        }
      }),
      // 3. My Likes
      prisma.like.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        include: { 
          post: { 
            include: { 
              author: true,
              comments: true,
              likes: true
            } 
          } 
        }
      })
    ])

    return { success: true, data: { posts, comments, likes } }
  } catch (error) {
    console.error("Failed to fetch activity:", error)
    return { success: false, message: "Failed to load activity" }
  }
}