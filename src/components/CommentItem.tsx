'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addComment, toggleCommentLike, deleteComment, editComment } from '@/app/common-room/actions'
import LikeButton from './LikeButton'
import EmojiButton from './EmojiButton'
import StatusBadge from './StatusBadge'

export default function CommentItem({ comment, currentUserId, postId, isAdmin = false }: { comment: any, currentUserId: string, postId: string, isAdmin?: boolean }) {
  const router = useRouter()
  const [isReplying, setIsReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)

  const isAuthor = currentUserId === comment.authorId
  const canDelete = isAuthor || isAdmin
  // Admin can always edit. Authors restricted by time/edit count (logic in server action handles details, frontend just allows access)
  const canEdit = isAuthor || isAdmin 
  
  // Status Logic
  const statusEmoji = comment.author?.status ? Array.from(comment.author.status)[0] : null
  
  const displayName = comment.author?.alias || comment.author?.firstName || 'Family Member'
  const firstLetter = displayName[0]?.toUpperCase() || '?'
  const profileImage = comment.author?.profileImage

  const handleAuthorClick = () => {
    if (comment.author?.firstName) {
      router.push(`/${comment.author.firstName.toLowerCase()}s-room`)
    }
  }

  async function handleReplySubmit(e: React.FormEvent) {
    e.preventDefault(); if(!replyText.trim()) return; await addComment(postId, replyText, comment.id); setReplyText(''); setIsReplying(false);
  }
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault(); if(!editContent.trim()) return; const res = await editComment(comment.id, editContent); if(res.success) setIsEditing(false);
  }
  async function handleDelete() { if(confirm('Delete comment?')) await deleteComment(comment.id) }

  return (
    <div className="flex gap-3 mt-4 w-full group">
      {/* AVATAR + STATUS BADGE */}
      <div className="relative shrink-0">
        <button 
          onClick={handleAuthorClick}
          className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-brand-sky/20 text-brand-sky font-bold text-xs hover:opacity-80 transition-opacity"
        >
          {profileImage ? (
             <img src={profileImage} alt={displayName} className="w-full h-full object-cover" />
          ) : (
             <span>{firstLetter}</span>
          )}
        </button>
        
        <StatusBadge status={comment.author?.status} size="small" />
      </div>

      <div className="flex-1">
        {/* Content Bubble */}
        <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none border border-slate-100 relative">
           <div className="flex justify-between items-start mb-1">
             <div className="flex items-center gap-2">
               <button 
                 onClick={handleAuthorClick}
                 className="text-xs font-bold text-slate-700 hover:text-brand-sky transition-colors"
               >
                 {displayName}
               </button>
               {comment.author?.isAdmin && (
                  <span className="bg-slate-700 text-white text-[8px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2 h-2"><path fillRule="evenodd" d="M10.362 1.093a.75.75 0 0 0-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925ZM18 6.443l-7.25 4v8.25l6.862-3.786A.75.75 0 0 0 18 14.25V6.443Zm-8.75 12.25v-8.25l-7.25-4v7.807a.75.75 0 0 0 .388.657l6.862 3.786Z" clipRule="evenodd" /></svg>
                    Admin
                  </span>
               )}
             </div>
             <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
           </div>
           
           {isEditing ? (
             <form onSubmit={handleEditSubmit}>
                <input value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full p-2 text-xs border rounded mb-2"/>
                <div className="flex gap-2 text-[10px]">
                  <button type="button" onClick={() => setIsEditing(false)} className="text-slate-400">Cancel</button>
                  <button type="submit" className="text-brand-sky font-bold">Save</button>
                </div>
             </form>
           ) : (
             <p className="text-sm text-slate-600 leading-snug">{comment.content}</p>
           )}
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-4 mt-1 pl-2">
          {/* Like Button */}
          <div className="scale-75 origin-left">
            <LikeButton 
              initialLikes={comment.likes} 
              currentUserId={currentUserId} 
              // ✅ FIXED: Wrapped in braces { } to ensure return type is void
              onToggle={async () => { await toggleCommentLike(comment.id) }} 
            />
          </div>
          
          <button onClick={() => setIsReplying(!isReplying)} className="text-xs font-bold text-slate-400 hover:text-brand-sky">Reply</button>
          
          {canEdit && (
             <button onClick={() => setIsEditing(!isEditing)} className="text-xs text-slate-400 hover:text-slate-600">Edit</button>
          )}
          {canDelete && (
             <button onClick={handleDelete} className="text-xs text-slate-400 hover:text-red-500">Delete</button>
          )}
        </div>

        {/* Reply Input */}
        {isReplying && (
          <form onSubmit={handleReplySubmit} className="mt-2 flex gap-2">
            <div className="relative flex-1">
              <input autoFocus value={replyText} onChange={(e) => setReplyText(e.target.value)} className="w-full text-xs p-2 border rounded-lg pr-8" placeholder="Write a reply..."/>
               <div className="absolute right-1 top-1/2 -translate-y-1/2"><EmojiButton onEmojiSelect={(emoji) => setReplyText(p => p + emoji)} /></div>
            </div>
            <button type="submit" disabled={!replyText.trim()} className="text-xs bg-brand-sky text-white px-3 py-1 rounded-lg">Reply</button>
          </form>
        )}

        {/* Nested Comments */}
        {comment.children && comment.children.length > 0 && (
          <div className="mt-2 border-l-2 border-slate-100 pl-3">
            {comment.children.map((child: any) => (
              <CommentItem key={child.id} comment={child} currentUserId={currentUserId} postId={postId} isAdmin={isAdmin}/>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}