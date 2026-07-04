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

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { success: false, message: "User not found" }

  const isAdmin = user.isAdmin || user.email === 'idongesit_essien@ymail.com'
  
  // Check 24 hour limit for non-admins
  if (!isAdmin && user.lastProfileUpdate) {
    const hoursSinceLastUpdate = (Date.now() - new Date(user.lastProfileUpdate).getTime()) / (1000 * 60 * 60)
    if (hoursSinceLastUpdate < 24) {
      const remainingHours = Math.ceil(24 - hoursSinceLastUpdate)
      return { success: false, message: `You can only update your profile once every 24 hours. Please wait ${remainingHours} more hours.` }
    }
  }

  const imageUrl = formData.get('imageUrl') as string | null

  if (!imageUrl) {
    return { success: false, message: "No image provided" }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        profileImage: imageUrl,
        lastProfileUpdate: new Date()
      }
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

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { success: false, message: "User not found" }

  const isAdmin = user.isAdmin || user.email === 'idongesit_essien@ymail.com'
  
  // Check 24 hour limit for non-admins
  if (!isAdmin && user.lastProfileUpdate) {
    const hoursSinceLastUpdate = (Date.now() - new Date(user.lastProfileUpdate).getTime()) / (1000 * 60 * 60)
    if (hoursSinceLastUpdate < 24) {
      const remainingHours = Math.ceil(24 - hoursSinceLastUpdate)
      return { success: false, message: `You can only update your profile once every 24 hours. Please wait ${remainingHours} more hours.` }
    }
  }

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
        status,
        lastProfileUpdate: new Date()
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

import bcrypt from 'bcryptjs'

// --- 5. ADMIN ADD USER ---
export async function adminAddUser(formData: FormData) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('session_id')?.value
  const ADMIN_EMAIL = 'idongesit_essien@ymail.com'

  if (!userId) return { success: false, message: "Unauthorized" }

  const adminUser = await prisma.user.findUnique({ where: { id: userId } })
  if (adminUser?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return { success: false, message: "Only Admin can add users." }
  }

  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const alias = formData.get('alias') as string || firstName
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const position = formData.get('position') as string
  const password = formData.get('password') as string

  if (!firstName || !lastName || !email || !position || !password) {
    return { success: false, message: "Missing required fields." }
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return { success: false, message: "A user with this email already exists." }
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = await prisma.user.create({
      data: { firstName, lastName, alias, email, phone, position, password: hashedPassword }
    })
    
    // Notify others
    const allOtherUsers = await prisma.user.findMany({
      where: { id: { not: newUser.id } },
      select: { id: true }
    })
    
    if (allOtherUsers.length > 0) {
      const userIds = allOtherUsers.map(u => u.id)
      const displayName = alias || firstName
      await sendNotification(userIds, `${displayName} was added to the family! 🎉`, '/family')
    }

    revalidatePath('/family')
    revalidatePath('/my-room')
    return { success: true }
  } catch (error) {
    console.error("Admin Add User Error:", error)
    return { success: false, message: "Failed to add user." }
  }
}

// --- 6. ADMIN UPDATE USER ---
export async function adminUpdateUser(formData: FormData) {
  const cookieStore = await cookies()
  const currentUserId = cookieStore.get('session_id')?.value
  const ADMIN_EMAIL = 'idongesit_essien@ymail.com'

  if (!currentUserId) return { success: false, message: "Unauthorized" }

  const adminUser = await prisma.user.findUnique({ where: { id: currentUserId } })
  if (adminUser?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return { success: false, message: "Only Admin can edit users." }
  }

  const targetUserId = formData.get('userId') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const alias = formData.get('alias') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const position = formData.get('position') as string

  if (!targetUserId || !firstName || !lastName || !email || !position) {
    return { success: false, message: "Missing required fields." }
  }

  // Check if the new email belongs to another user
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser && existingUser.id !== targetUserId) {
    return { success: false, message: "A user with this email already exists." }
  }

  try {
    await prisma.user.update({
      where: { id: targetUserId },
      data: { firstName, lastName, alias, email, phone, position }
    })
    
    revalidatePath('/family')
    revalidatePath('/my-room')
    return { success: true }
  } catch (error) {
    console.error("Admin Edit User Error:", error)
    return { success: false, message: "Failed to update user." }
  }
}

// --- 7. ADMIN UPDATE PASSCODE ---
export async function adminUpdatePasscode(newPasscode: string) {
  const cookieStore = await cookies()
  const currentUserId = cookieStore.get('session_id')?.value
  const ADMIN_EMAIL = 'idongesit_essien@ymail.com'

  if (!currentUserId) return { success: false, message: "Unauthorized" }

  const adminUser = await prisma.user.findUnique({ where: { id: currentUserId } })
  if (adminUser?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return { success: false, message: "Only Admin can edit the passcode." }
  }

  if (!newPasscode || newPasscode.trim() === "") {
    return { success: false, message: "Passcode cannot be empty." }
  }

  try {
    await prisma.appConfig.upsert({
      where: { id: 'global' },
      update: { familyPasscode: newPasscode },
      create: { id: 'global', familyPasscode: newPasscode }
    })
    
    revalidatePath('/my-room')
    return { success: true }
  } catch (error) {
    console.error("Admin Edit Passcode Error:", error)
    return { success: false, message: "Failed to update passcode." }
  }
}