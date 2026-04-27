'use server'

import { prisma } from '@/lib/prisma'
import { generateSignature } from '@/lib/cloudinary'
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

export async function getUploadSignature(transformation?: string) {
  const userId = await getCurrentUserId()
  if (!userId) {
    throw new Error('Unauthorized')
  }
  return generateSignature('family-album', transformation)
}

export async function saveAlbumMedia(data: { url: string, type: string, altText: string }) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, message: 'Unauthorized' }
  }

  let thumbnailUrl = data.url;
  const parts = data.url.split('/upload/');
  if (parts.length === 2) {
      thumbnailUrl = parts[0] + '/upload/c_fill,w_300,h_300/' + parts[1];
      if (data.type === 'video') {
          thumbnailUrl = thumbnailUrl.replace(/\.[^/.]+$/, ".jpg");
      }
  }

  try {
    await prisma.albumMedia.create({
      data: {
        url: data.url,
        thumbnailUrl: thumbnailUrl,
        type: data.type,
        altText: data.altText,
        uploaderId: userId
      }
    })
    
    revalidatePath('/family-album')
    return { success: true }
  } catch (error) {
    console.error('Error saving media to DB:', error)
    return { success: false, message: 'Failed to save media record' }
  }
}

export async function updateMediaAltText(mediaId: string, newAltText: string) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const media = await prisma.albumMedia.findUnique({
      where: { id: mediaId }
    })

    if (!media) {
      return { success: false, message: 'Media not found' }
    }

    const isAdmin = await checkIsAdmin(userId)

    // Check ownership or admin status
    if (media.uploaderId !== userId && !isAdmin) {
      return { success: false, message: 'You can only edit your own uploads' }
    }

    // Check time limit (15 minutes) - Admin bypasses this
    if (!isAdmin) {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
      if (media.createdAt < fifteenMinutesAgo) {
        return { success: false, message: 'Edit time limit (15 mins) exceeded' }
      }
    }

    await prisma.albumMedia.update({
      where: { id: mediaId },
      data: { altText: newAltText }
    })

    revalidatePath('/family-album')
    return { success: true }
  } catch (error) {
    console.error('Error updating media:', error)
    return { success: false, message: 'Update failed' }
  }
}

export async function deleteAlbumMedia(mediaId: string) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const media = await prisma.albumMedia.findUnique({
      where: { id: mediaId }
    })

    if (!media) {
      return { success: false, message: 'Media not found' }
    }

    const isAdmin = await checkIsAdmin(userId)

    // Check ownership or admin status
    if (media.uploaderId !== userId && !isAdmin) {
      return { success: false, message: 'You can only delete your own uploads' }
    }

    // Delete from DB
    await prisma.albumMedia.delete({
      where: { id: mediaId }
    })

    // Note: Ideally we should also delete from Cloudinary here, 
    // but that requires extracting the public_id from the URL.
    // For now, we just remove the reference from our DB.

    revalidatePath('/family-album')
    return { success: true }
  } catch (error) {
    console.error('Error deleting media:', error)
    return { success: false, message: 'Delete failed' }
  }
}

export async function getAlbumMedia(
  page: number = 1, 
  limit: number = 50, 
  search: string = '',
  year?: string,
  month?: string,
  holiday?: string
) {
  try {
    const currentUserId = await getCurrentUserId()
    const isAdmin = currentUserId ? await checkIsAdmin(currentUserId) : false
    
    const skip = (page - 1) * limit
    
    const where: any = { AND: [] }

    // Text Search (combines search and holiday)
    if (search || holiday) {
      const searchTerms = []
      if (search) searchTerms.push(search)
      if (holiday) searchTerms.push(holiday)
      
      // If both exist, we can require both or just one. 
      // Usually filters are reductive (AND), so let's use AND.
      // But holiday is essentially a preset search term.
      
      searchTerms.forEach(term => {
        where.AND.push({
          altText: {
            contains: term,
            mode: 'insensitive'
          }
        })
      })
    }

    // Date Filtering
    if (year) {
      const yearInt = parseInt(year)
      let startDate, endDate

      if (month) {
        const monthInt = parseInt(month) - 1 // JS months are 0-indexed
        startDate = new Date(yearInt, monthInt, 1)
        endDate = new Date(yearInt, monthInt + 1, 1)
      } else {
        startDate = new Date(yearInt, 0, 1)
        endDate = new Date(yearInt + 1, 0, 1)
      }

      where.AND.push({
        createdAt: {
          gte: startDate,
          lt: endDate
        }
      })
    } else if (month) {
        // If month is selected but no year, default to current year
        const currentYear = new Date().getFullYear()
        const monthInt = parseInt(month) - 1
        const startDate = new Date(currentYear, monthInt, 1)
        const endDate = new Date(currentYear, monthInt + 1, 1)

        where.AND.push({
            createdAt: {
            gte: startDate,
            lt: endDate
            }
        })
    }
    
    const media = await prisma.albumMedia.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        uploader: {
          select: { firstName: true, lastName: true }
        }
      }
    })

    const mappedMedia = media.map(item => ({
      id: item.id,
      type: item.type,
      src: item.url,
      thumbnail: item.thumbnailUrl || item.url,
      altText: item.altText,
      uploader: item.uploader,
      uploaderId: item.uploaderId,
      createdAt: item.createdAt.toISOString()
    }))

    return { success: true, data: mappedMedia, currentUserId, isAdmin }
  } catch (error) {
    console.error('Error fetching album media:', error)
    return { success: false, data: [] }
  }
}

