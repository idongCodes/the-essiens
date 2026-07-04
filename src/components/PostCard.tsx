'use client'

import { useState, useOptimistic, useEffect, useRef } from 'react'
import { deletePost, editPost, toggleLike, addComment, dismissAnnouncement } from '@/app/common-room/actions'
import CommentItem from './CommentItem'
import LikeButton from './LikeButton'
import EmojiButton from './EmojiButton'
import { useRouter } from 'next/navigation'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'

export default function PostCard({ post, currentUserId, isAdmin = false }: { post: any, currentUserId: string, isAdmin?: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const { confirm } = useConfirm()
  
  // ... (Keep existing state: isEditing, editContent, etc.)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [editTitle, setEditTitle] = useState(post.title || '')
  const [editIsUrgent, setEditIsUrgent] = useState(post.isUrgent || false)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === `#post-${post.id}`) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        cardRef.current?.classList.add('ring-2', 'ring-brand-sky', 'ring-offset-2')
        setTimeout(() => cardRef.current?.classList.remove('ring-2', 'ring-brand-sky', 'ring-offset-2'), 2000)
      }, 500)
    }
  }, [post.id])

  // OPTIMISTIC COMMENTS
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    post.topLevelComments || [],
    (state: any[], newComment: any) => [...state, newComment]
  )

  // ... (Keep permissions logic)
  const isAuthor = currentUserId === post.authorId
  const canDelete = isAuthor || isAdmin
  const createdAt = new Date(post.createdAt).getTime()
  const timeDiff = Date.now() - createdAt
  // Admin can always edit. Authors are restricted by time and edit count.
  const canEdit = isAdmin || (isAuthor && (post.isAnnouncement || (!post.isEdited && timeDiff < 10 * 60 * 1000)))

  // ... (Keep handlers: handleDelete, handleSave, etc.)
  async function handleDelete() { 
    if (await confirm({ 
      title: 'Delete Post', 
      message: 'Are you sure you want to delete this post?', 
      confirmText: 'Delete', 
      type: 'danger' 
    })) {
      await deletePost(post.id)
      toast.success('Post deleted')
    }
  }

  async function handleSave() {
    const result = await editPost(post.id, editContent, post.isAnnouncement ? editTitle : undefined, post.isAnnouncement ? editIsUrgent : undefined)
    if (result.success) { 
      setIsEditing(false); 
      router.refresh(); 
      toast.success('Post updated')
    } else { 
      toast.error(result.message || 'Failed to update post'); 
    }
  }
  
  async function handleToggleLike() { await toggleLike(post.id) }
  
  async function handleMainCommentSubmit(e: React.FormEvent) {
    e.preventDefault(); 
    if(!commentText.trim()) return; 
    
    // 1. Add Optimistic Comment
    const tempComment = {
      id: 'temp-' + Date.now(),
      content: commentText,
      createdAt: new Date(),
      authorId: currentUserId,
      author: {
        id: currentUserId,
        firstName: 'Me', // We don't have full user details here, relying on "Me" or fetching context if needed. 
                         // For better UX, we could pass current user details to PostCard.
        alias: null,
        profileImage: null // Placeholder
      },
      likes: [],
      isOptimistic: true // Flag for styling
    }
    addOptimisticComment(tempComment)
    
    const textToSend = commentText
    setCommentText(''); // Clear input immediately

    // 2. Server Action
    await addComment(post.id, textToSend);
  }

  async function handleDismiss() { 
    await dismissAnnouncement(post.id); 
    router.refresh(); 
    toast.info('Announcement dismissed')
  }

  const displayName = post.author.alias || post.author.firstName
  const firstLetter = displayName[0].toUpperCase()
  const profileImage = post.author.profileImage
  
  // --- NEW: STATUS ICON LOGIC ---
  const handleAuthorClick = () => {
    router.push(`/${post.author.firstName.toLowerCase()}s-room`)
  }
  const statusEmoji = post.author.status ? Array.from(post.author.status)[0] : null

  // Styles
  const isUrgent = post.isUrgent
  const displayUrgent = isEditing ? editIsUrgent : isUrgent
  const cardStyle = displayUrgent ? "bg-red-500/5 border-red-200/50 backdrop-blur-sm shadow-md" : "bg-white border-slate-100 shadow-sm"

  return (
    <div id={`post-${post.id}`} ref={cardRef} className={`p-6 rounded-xl border mb-6 transition-all duration-500 hover:border-slate-300 ${cardStyle}`}>
      
      {/* 1. HEADER */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          
          {/* AVATAR CONTAINER */}
          <div className="relative">
            <button 
              onClick={handleAuthorClick}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm overflow-hidden bg-brand-sky text-slate-700 font-bold text-lg hover:opacity-80 transition-opacity"
            >
              {profileImage ? (
                 <img src={profileImage} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                 <span>{firstLetter}</span>
              )}
            </button>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <button 
                onClick={handleAuthorClick}
                className="font-bold text-slate-800 leading-tight hover:text-brand-sky transition-colors"
              >
                {displayName}
              </button>
            </div>
            {post.author.isAdmin && (
              <span className="bg-slate-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded w-fit flex items-center gap-1 mt-1 shadow-sm">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5"><path fillRule="evenodd" d="M10.362 1.093a.75.75 0 0 0-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925ZM18 6.443l-7.25 4v8.25l6.862-3.786A.75.75 0 0 0 18 14.25V6.443Zm-8.75 12.25v-8.25l-7.25-4v7.807a.75.75 0 0 0 .388.657l6.862 3.786Z" clipRule="evenodd" /></svg>
                 Admin
              </span>
            )}
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(post.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              {post.isEdited && <span className="italic ml-1">(Edited)</span>}
            </p>
          </div>
        </div>

        {/* Buttons (Edit/Delete) */}
        {(canDelete || canEdit) && (
           <div className="flex gap-3 text-slate-400">
             {canEdit && !isEditing && (
               <button onClick={() => setIsEditing(true)} className="hover:text-brand-sky p-1 rounded-full hover:bg-slate-50">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
               </button>
             )}
             {canDelete && (
               <button onClick={handleDelete} className="hover:text-red-500 p-1 rounded-full hover:bg-red-50">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
               </button>
             )}
           </div>
        )}
      </div>

      {/* 2. CONTENT (Keep existing logic) */}
      {isEditing ? (
        <div className="mt-2 flex flex-col gap-3">
          {post.isAnnouncement && (
            <div className="flex flex-col gap-3 animate-in slide-in-from-top-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Title</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-brand-sky outline-none font-bold text-slate-700" placeholder="Announcement Title"/>
              </div>
              <div onClick={() => setEditIsUrgent(!editIsUrgent)} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-colors ${editIsUrgent ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                 <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${editIsUrgent ? 'border-red-500' : 'border-slate-300'}`}>
                    {editIsUrgent && <div className="w-2 h-2 rounded-full bg-red-500" />}
                 </div>
                 <span className={`text-xs font-bold ${editIsUrgent ? 'text-red-500' : 'text-slate-500'}`}>Mark as Urgent</span>
              </div>
            </div>
          )}
          <div className="relative">
            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-sky outline-none text-slate-700 pr-10" rows={3}/>
            <div className="absolute bottom-2 right-2"><EmojiButton onEmojiSelect={(emoji) => setEditContent((p:string) => p + emoji)} /></div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setIsEditing(false)} className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2">Cancel</button>
            <button onClick={handleSave} className="text-xs bg-brand-sky text-white px-4 py-1.5 rounded-full hover:bg-sky-500 font-bold shadow-sm">Save Changes</button>
          </div>
        </div>
      ) : (
        <div>
          {post.title && <h3 className="font-bold text-lg text-slate-800 mb-1">{post.title}</h3>}
          <p className="text-slate-700 leading-relaxed text-base whitespace-pre-wrap mb-3">{post.content}</p>
          {post.imageUrl && (
            <div className="mt-3 rounded-lg overflow-hidden border border-slate-100">
              <img src={post.imageUrl} alt="Post attachment" className="w-full max-h-96 object-cover bg-slate-50" loading="lazy"/>
            </div>
          )}
          {post.videoUrl && (
            <div className="mt-3 rounded-lg overflow-hidden border border-slate-100 bg-black">
              <video 
                src={post.videoUrl} 
                controls 
                playsInline 
                preload="metadata"
                className="w-full max-h-[600px] object-contain" 
              />
            </div>
          )}
        </div>
      )}

      {/* 3. ACTION BAR */}
      <div className="mt-5 pt-4 border-t border-slate-50/50 flex justify-between items-center">
        <LikeButton initialLikes={post.likes} currentUserId={currentUserId} onToggle={handleToggleLike} />
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              const url = `${window.location.origin}/common-room#post-${post.id}`;
              navigator.clipboard.writeText(url);
              toast.success('Link copied to clipboard!');
            }}
            className="flex items-center gap-2 text-slate-400 hover:text-brand-sky transition-colors font-medium text-sm group"
            title="Share Post"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" /></svg>
            <span className="hidden sm:inline">Share</span>
          </button>

          <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 text-slate-400 hover:text-brand-sky transition-colors font-medium text-sm group">
            <span>{optimisticComments?.length || 0} Replies</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
          </button>
          {post.isUrgent && (
            <button onClick={handleDismiss} className="text-xs font-bold text-red-400 hover:text-red-600 hover:underline transition-colors">Dismiss</button>
          )}
        </div>
      </div>

      {/* 4. COMMENTS */}
      {showComments && (
        <div className="mt-6 animate-in slide-in-from-top-2 border-t border-slate-50 pt-4">
          <form onSubmit={handleMainCommentSubmit} className="flex gap-2 mb-6 items-center">
            <div className="relative flex-1">
              <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-4 pr-10 py-3 text-sm focus:ring-2 focus:ring-brand-sky outline-none transition-all"/>
              <div className="absolute right-2 top-1/2 -translate-y-1/2"><EmojiButton onEmojiSelect={(emoji) => setCommentText((p:string) => p + emoji)} /></div>
            </div>
            <button type="submit" disabled={!commentText.trim()} className="bg-brand-sky text-white font-bold px-4 py-2 rounded-lg hover:bg-sky-500 disabled:opacity-50 transition-colors">Post</button>
          </form>
          <div className="space-y-4">
            {optimisticComments?.map((comment: any) => (
              <div key={comment.id} className={comment.isOptimistic ? "opacity-50" : ""}>
                 <CommentItem comment={comment} currentUserId={currentUserId} postId={post.id} isAdmin={isAdmin}/>
              </div>
            ))}
            {(!optimisticComments || optimisticComments.length === 0) && <p className="text-center text-slate-400 text-xs italic">No comments yet.</p>}
          </div>
        </div>
      )}
    </div>
  )
}