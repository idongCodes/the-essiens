'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

const ADMIN_EMAIL = 'idongesit_essien@ymail.com'

async function getCurrentUserId() {
  const cookieStore = await cookies()
  return cookieStore.get('session_id')?.value
}

async function checkIsAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  })
  return user?.email === ADMIN_EMAIL
}

export async function getRecentAppUpdates(limit: number = 3) {
  try {
    return await prisma.appUpdate.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  } catch (error) {
    console.error('Error fetching app updates:', error)
    return []
  }
}

export async function createAppUpdate(formData: FormData) {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false, message: 'Unauthorized' }

  const isAdmin = await checkIsAdmin(userId)
  if (!isAdmin) return { success: false, message: 'Only admins can create updates' }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const icon = formData.get('icon') as string
  const category = formData.get('category') as string
  const status = formData.get('status') as string
  const version = formData.get('version') as string

  if (!title || !description || !category || !status) {
    return { success: false, message: 'Missing required fields' }
  }

  try {
    await prisma.appUpdate.create({
      data: {
        title,
        description,
        icon: icon || '✨',
        category,
        status,
        version: version || null,
      }
    })

    revalidatePath('/') // Revalidate wherever WhatsNewSection is used
    return { success: true }
  } catch (error) {
    console.error('Error creating app update:', error)
    return { success: false, message: 'Failed to create update' }
  }
}

export async function deleteAppUpdate(id: string) {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false, message: 'Unauthorized' }

  const isAdmin = await checkIsAdmin(userId)
  if (!isAdmin) return { success: false, message: 'Only admins can delete updates' }

  try {
    await prisma.appUpdate.delete({
      where: { id }
    })

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Error deleting app update:', error)
    return { success: false, message: 'Failed to delete update' }
  }
}
