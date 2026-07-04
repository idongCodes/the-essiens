'use client'

import { useState, useEffect } from 'react'
import AnnouncementModal from './AnnouncementModal'
import { deletePost } from '@/app/common-room/actions'
import { useRouter } from 'next/navigation'
import { useConfirm } from '@/context/ConfirmContext'

export default function AnnouncementCarousel({ 
  announcements, 
  currentUserEmail 
}: { 
  announcements: any[], 
  currentUserEmail?: string 
}) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  
  // State for modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const { confirm } = useConfirm()

  const isAdmin = currentUserEmail === 'idongesit_essien@ymail.com'

  // Auto-scroll logic
  useEffect(() => {
    // Don't scroll if paused OR if we are currently editing something
    if (announcements.length <= 1 || isPaused || editingItem) return

    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % announcements.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [announcements.length, isPaused, editingItem])

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (await confirm({ title: 'Delete Announcement', message: "Are you sure you want to delete this announcement?" })) {
      await deletePost(id)
      setIndex(0) // Reset index so we don't get stuck on a deleted item
      router.refresh()
    }
  }

  const currentAnnouncement = announcements[index]

  if (announcements.length === 0 && !isAdmin) return null

  return (
    <div className="mb-8">
      
      {/* CAROUSEL CONTAINER */}
      {announcements.length > 0 && currentAnnouncement && (
        <div 
          className="relative overflow-hidden bg-brand-sky rounded-2xl shadow-sm border border-brand-sky/20 text-white p-6 cursor-pointer group"
          onClick={() => setIsPaused(true)} 
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* CONTENT */}
          <div className="relative h-28 flex items-center">
             {announcements.map((ann, i) => (
               <div 
                 key={ann.id}
                 className={`absolute inset-0 transition-all duration-500 ease-in-out flex flex-col justify-center
                   ${i === index ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'}
                 `}
               >
                 <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                   {ann.isUrgent && <span>🚨</span>}
                   {ann.title}
                 </h3>
                 <p className="text-white/90 text-sm line-clamp-2 leading-relaxed">
                   {ann.content}
                 </p>
                 {ann.createdAt && (
                   <span className="text-xs text-white/70 mt-1 block">
                     {new Date(ann.createdAt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                   </span>
                 )}
               </div>
             ))}
          </div>

          {/* ADMIN CONTROLS (Overlay) */}
          {isAdmin && (
            <div className="absolute top-2 right-2 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingItem(currentAnnouncement)
                }}
                className="bg-white/20 hover:bg-white/40 text-white p-1.5 rounded-full backdrop-blur-md transition-colors"
                title="Edit"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(currentAnnouncement.id)
                }}
                className="bg-white/20 hover:bg-red-500/80 text-white p-1.5 rounded-full backdrop-blur-md transition-colors"
                title="Delete"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </div>
          )}

          {/* Dots */}
          <div className="absolute bottom-3 right-4 flex gap-1.5">
            {announcements.map((_, i) => (
              <div 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? 'bg-white' : 'bg-white/30'}`} 
              />
            ))}
          </div>
        </div>
      )}

      {/* ADMIN ADD BUTTON */}
      {isAdmin && (
        <div className="text-right mt-2">
          <button 
            onClick={() => setShowAddModal(true)}
            className="text-xs font-bold text-brand-sky hover:text-sky-600 flex items-center justify-end gap-1 ml-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            Add Announcement
          </button>
        </div>
      )}

      {/* CREATE MODAL */}
      {showAddModal && (
        <AnnouncementModal onClose={() => setShowAddModal(false)} />
      )}

      {/* EDIT MODAL */}
      {editingItem && (
        <AnnouncementModal 
          initialData={{
            id: editingItem.id,
            title: editingItem.title,
            content: editingItem.content,
            isUrgent: editingItem.isUrgent
          }}
          onClose={() => setEditingItem(null)} 
        />
      )}
    </div>
  )
}