'use server'
import { cookies } from 'next/headers'
import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:support@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function subscribeUser(sub: any) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('session_id')?.value
  
  if (!userId) {
    return { success: false, message: 'Not authenticated' }
  }

  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      update: {
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        userId: userId
      },
      create: {
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        userId: userId
      }
    })
    return { success: true }
  } catch (error) {
    console.error('Subscription error:', error)
    return { success: false, message: 'Failed to subscribe' }
  }
}

export async function sendNotification(userIds: string[], message: string, url: string = '/') {
  // If userIds is empty or not array, return
  if (!Array.isArray(userIds) || userIds.length === 0) return

  try {
    // 1. Create In-App Notifications for ALL recipients
    // We do this regardless of whether they have a push subscription
    await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        content: message,
        link: url,
        isRead: false
      }))
    })

    // 2. Send Push Notifications (only to those with subscriptions)
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: { in: userIds } }
    })

    if (subscriptions.length > 0) {
      const notifications = subscriptions.map(sub => {
        const pushConfig = {
          endpoint: sub.endpoint,
          keys: { auth: sub.auth, p256dh: sub.p256dh }
        }
        
        const payload = JSON.stringify({
          title: 'The Essiens',
          body: message,
          url: url
        })

        return webpush.sendNotification(pushConfig, payload).catch(error => {
          // console.error('Error sending notification to', sub.userId, error)
          if (error.statusCode === 410 || error.statusCode === 404) {
            // Subscription is gone, delete it
            prisma.pushSubscription.delete({ where: { id: sub.id } })
          }
        })
      })

      await Promise.all(notifications)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Notification dispatch error:', error)
    return { success: false }
  }
}