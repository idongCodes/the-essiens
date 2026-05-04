import { cookies } from 'next/headers'
import MyRoomClient from '@/components/MyRoomClient'
import { prisma } from '@/lib/prisma'

async function getUser() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('session_id')?.value
  if (!userId) return null

  return await prisma.user.findUnique({
    where: { id: userId }
  })
}

async function getSystemSettings() {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: 'global' }
  })
  return settings?.familySecret || 'familyfirst'
}

export default async function MyRoom() {
  const user = await getUser()
  const familySecret = await getSystemSettings() // <--- Fetch Secret

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center font-sans">
        <p>Please log in to view your room.</p>
      </main>
    )
  }
  
  let allUsers: any[] = []
  if (user.email === 'idongesit_essien@ymail.com') {
      allUsers = await prisma.user.findMany({
          orderBy: { createdAt: 'asc' },
          select: { id: true, firstName: true, lastName: true, alias: true, email: true, position: true, profileImage: true }
      })
  }

  return (
    <main className="min-h-screen bg-slate-50 font-sans p-8">
      {/* Pass secret and all users to client */}
      <MyRoomClient user={user} familySecret={familySecret} allUsers={allUsers} />
    </main>
  )
}