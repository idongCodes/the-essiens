'use client'

import { useState } from 'react'
import useLongPress from '@/hooks/useLongPress'
import StatusBadge from './StatusBadge' // <--- Import

interface UserLike {
  userId: string;
  user: {
    id: string;
    firstName: string;
    alias?: string | null;
    profileImage?: string | null;
    status?: string | null; // <--- Added Status
  }
}

interface LikeButtonProps {
  initialLikes: UserLike[];
  currentUserId: string;
  onToggle: () => Promise<void>;
}

export default function LikeButton({ initialLikes = [], currentUserId, onToggle }: LikeButtonProps) {
  const [likes, setLikes] = useState<UserLike[]>(initialLikes)
  const isLikedByMe = likes.some(l => l.userId === currentUserId)
  const [showList, setShowList] = useState(false)

  const handleToggle = async () => {
    if (isLikedByMe) {
      setLikes(prev => prev.filter(l => l.userId !== currentUserId))
    } else {
      setLikes(prev => [...prev, { userId: currentUserId, user: { id: currentUserId, firstName: 'Me', alias: 'Me', profileImage: null } }])
    }
    await onToggle()
  }

  const handleLongPress = () => { if (likes.length > 0) setShowList(true) }
  const longPressProps = useLongPress(handleLongPress, handleToggle, { delay: 500 })

  return (
    <div className="relative inline-block">
      
      {/* BUTTON (Same as before) */}
      <button 
        {...longPressProps}
        className={`flex items-center gap-1.5 transition-all font-bold text-sm select-none ${isLikedByMe ? 'text-sky-500' : 'text-slate-400 active:scale-95 [@media(hover:hover)]:hover:text-slate-600'}`}
      >
        {isLikedByMe ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 animate-in zoom-in duration-200 text-sky-500"><path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" /></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
        )}
        <span>{likes.length || 'Like'}</span>
      </button>

      {/* POPUP LIST */}
      {showList && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowList(false) }} />
          <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-50 p-1 animate-in zoom-in-95 duration-150 origin-bottom-left">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2 border-b border-slate-50">Liked By</div>
            <div className="max-h-40 overflow-y-auto py-1">
              {likes.map((like) => {
                 const statusEmoji = like.user.status ? Array.from(like.user.status)[0] : null
                 return (
                  <div key={like.userId} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 rounded-md">
                     <div className="relative">
                       <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden bg-brand-sky/20 text-brand-sky shrink-0">
                          {like.user.profileImage ? (
                            <img src={like.user.profileImage} alt="User" className="w-full h-full object-cover" />
                          ) : (
                            (like.user.alias || like.user.firstName)[0]
                          )}
                       </div>

                       {/* ✅ REPLACED MANUAL BADGE WITH COMPONENT (size="small") */}
                     <StatusBadge status={like.user.status} size="small" />
                     </div>
                     <span className="text-xs text-slate-700 truncate font-medium">{like.user.alias || like.user.firstName}</span>
                  </div>
                 )
              })}
            </div>
            <div className="absolute top-full left-4 -mt-[1px] border-8 border-transparent border-t-white" />
          </div>
        </>
      )}
    </div>
  )
}