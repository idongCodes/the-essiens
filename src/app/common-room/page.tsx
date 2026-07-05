import { cookies } from "next/headers";
import PostInput from "@/components/PostInput";
import PostCard from "@/components/PostCard";
import AnnouncementCarousel from "@/components/AnnouncementCarousel";
import WeatherBriefing from "@/components/WeatherBriefing";
import { getFeedData, getAnnouncements } from "./actions";
import { prisma } from "@/lib/prisma";

async function getUser() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session_id')?.value
  if (!sessionId) return null

  return await prisma.user.findUnique({
    where: { id: sessionId }
  })
}

export default async function CommonRoom() {
  const user = await getUser()
  const announcements = await getAnnouncements()
  const { urgentPosts, regularPosts, isAdmin } = await getFeedData()

  const welcomeName = user?.alias || user?.firstName || "Family Member";

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-2xl mx-auto p-4 mt-8 pb-20">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between md:items-end mb-6 gap-2">
          <h1 className="text-3xl font-bold text-brand-sky tracking-tight">
            The Common Room
          </h1>
          <h2 className="text-slate-500 font-medium text-sm md:text-lg pb-1 md:text-right">
            Welcome home, <span className="text-brand-sky font-bold">{welcomeName}</span>.
          </h2>
        </div>

        {/* WEATHER BRIEFING */}
        <WeatherBriefing />

        {/* ANNOUNCEMENTS CAROUSEL */}
        <AnnouncementCarousel 
          announcements={announcements} 
          currentUserEmail={user?.email} 
        />

        {/* INPUT FORM */}
        <PostInput />

        {/* FEED */}
        <div className="space-y-6">
          
          {/* 1. URGENT ANNOUNCEMENTS (Pinned at top) */}
          {urgentPosts.map((post) => (
             <PostCard 
              key={post.id} 
              post={post} 
              currentUserId={user?.id || ''}
              isAdmin={isAdmin}
            />
          ))}

          {/* 2. REGULAR POSTS */}
          {regularPosts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUserId={user?.id || ''}
              isAdmin={isAdmin}
            />
          ))}

        </div>
      </div>
    </main>
  );
}