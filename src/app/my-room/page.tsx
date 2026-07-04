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

export default async function MyRoom() {
  const user = await getUser()

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center font-sans">
        <p>Please log in to view your room.</p>
      </main>
    )
  }
  
  let allUsers: any[] = []
  let familyPasscode = ""

  if (user.email === 'idongesit_essien@ymail.com') {
      allUsers = await prisma.user.findMany({
          orderBy: { createdAt: 'asc' },
          select: { id: true, firstName: true, lastName: true, alias: true, email: true, position: true, profileImage: true }
      })
      
      const config = await prisma.appConfig.findUnique({
        where: { id: 'global' }
      })
      familyPasscode = config?.familyPasscode || "ESSIEN2026"
  }

  return (
    <main className="min-h-screen bg-slate-50 font-sans p-8">
      {/* Pass all users to client */}
      <MyRoomClient user={user} allUsers={allUsers} initialPasscode={familyPasscode} />
    </main>
  )
}