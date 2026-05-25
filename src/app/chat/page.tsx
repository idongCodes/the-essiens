'use client'

import EmojiButton from '@/components/EmojiButton'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowUturnLeftIcon, PhotoIcon, XMarkIcon, PencilIcon, TrashIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { getChatMessages, sendChatMessage, toggleReaction, editChatMessage, deleteChatMessage, getChatMedia } from '@/app/chat/actions'
import { pusherClient } from '@/lib/pusherClient'
import { getUploadSignature } from '@/app/actions/cloudinary'
import { useToast } from '@/context/ToastContext'
import { useConfirm } from '@/context/ConfirmContext'

export default function ChatPage() {
  const router = useRouter()
  const toast = useToast()
  const { confirm } = useConfirm()
  const [joinMessage, setJoinMessage] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [visibleTimestampId, setVisibleTimestampId] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<{ id: string, content: string, authorName: string } | null>(null)
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [typingUsers, setTypingUsers] = useState<{[key: string]: string}>({})
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  
  // Media Upload State
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [profileModal, setProfileModal] = useState<{ author: any, x: number, y: number } | null>(null)
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
  const [chatMedia, setChatMedia] = useState<any[]>([])
  const [popoverPosition, setPopoverPosition] = useState<'top' | 'bottom'>('top')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const videoCameraInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const timestampTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const channelRef = useRef<any>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Available reactions
  const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢']

  const fetchChatMedia = async () => {
    const result = await getChatMedia()
    if (result.success && result.media) {
      setChatMedia(result.media)
    }
  }

  useEffect(() => {
    if (isInfoModalOpen) {
      fetchChatMedia()
    }
  }, [isInfoModalOpen])

  // Check popover position
  useEffect(() => {
    if (selectedMessageId && popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect()
      if (rect.top < 60) { // 60 is roughly the header height
        setPopoverPosition('bottom')
      } else {
        setPopoverPosition('top')
      }
    } else {
      setPopoverPosition('top')
    }
  }, [selectedMessageId])

  const fetchCurrentUser = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/user/${userId}`)
      if (response.ok) {
        const userData = await response.json()
        setCurrentUser(userData)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }, [])

  const fetchInitialMessages = async () => {
    const result = await getChatMessages()
    if (result.success && result.messages) {
      setMessages(result.messages)
      setNextCursor(result.nextCursor)
      setHasMore(!!result.nextCursor)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 10)
    }
  }

  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMore || !nextCursor) return
    
    setIsLoadingMore(true)
    const prevScrollHeight = scrollContainerRef.current?.scrollHeight || 0
    
    const result = await getChatMessages(nextCursor)
    if (result.success && result.messages) {
      setMessages(prev => [...result.messages, ...prev])
      setNextCursor(result.nextCursor)
      setHasMore(!!result.nextCursor)
      
      // Maintain scroll position
      setTimeout(() => {
        if (scrollContainerRef.current) {
          const newScrollHeight = scrollContainerRef.current.scrollHeight
          scrollContainerRef.current.scrollTop = newScrollHeight - prevScrollHeight
        }
      }, 0)
    }
    setIsLoadingMore(false)
  }, [isLoadingMore, hasMore, nextCursor])

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
        loadMoreMessages()
      }
    }, { threshold: 0.1 })
    
    if (topRef.current) {
      observer.observe(topRef.current)
    }
    
    return () => observer.disconnect()
  }, [loadMoreMessages, hasMore, isLoadingMore])

  useEffect(() => {
    const message = document.cookie
      .split('; ')
      .find(row => row.startsWith('new_user_join_message='))
      ?.split('=')[1]
    
    if (message) {
      setTimeout(() => setJoinMessage(decodeURIComponent(message)), 0)
      document.cookie = 'new_user_join_message=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    }
    
    if (!message) {
      setJoinMessage("Idong has joined the app! 🎉")
    }

    fetchInitialMessages()
    
    const getSessionId = () => {
      const cookies = document.cookie.split('; ')
      const possibleNames = ['user_session', 'session_id', 'sessionId', 'session', 'auth_token']
      
      for (const name of possibleNames) {
        const cookie = cookies.find(row => row.startsWith(`${name}=`))
        if (cookie) {
          return cookie.split('=')[1]
        }
      }
      return null
    }
    
    const sessionId = getSessionId()
    const userId = sessionId
    setCurrentUserId(userId)
    
    if (userId) {
      fetchCurrentUser(userId)
    }
  }, [fetchCurrentUser])

  // Pusher Subscription
  useEffect(() => {
    if (!currentUserId || currentUserId === 'test-user-id' || !pusherClient) return

    console.log('Subscribing to presence-chat with user:', currentUserId);
    const channel = pusherClient.subscribe('presence-chat')
    channelRef.current = channel

    channel.bind('pusher:subscription_succeeded', (members: any) => {
      const users = Object.keys(members.members).map(id => members.members[id])
      setOnlineUsers(users)
    })

    channel.bind('pusher:member_added', (member: any) => {
      setOnlineUsers(prev => [...prev, member.info])
    })

    channel.bind('pusher:member_removed', (member: any) => {
      setOnlineUsers(prev => prev.filter(u => u.user_id !== member.id))
    })

    channel.bind('new-message', (data: any) => {
      setMessages(prev => {
        // If message already exists (optimistic), replace it
        if (prev.some(m => m.id === data.id || m.content === data.content && m.author.id === data.author.id && new Date(m.createdAt).getTime() > Date.now() - 5000)) {
          return prev.map(m => m.id === data.id || (m.content === data.content && m.author.id === data.author.id) ? data : m)
        }
        return [...prev, data]
      })
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 10)
    })

    channel.bind('reaction-toggled', (data: any) => {
      // Don't process our own reactions again (they were handled optimistically)
      if (data.userId === currentUserId) return

      setMessages(prev => prev.map(msg => {
        if (msg.id === data.messageId) {
          const reactions = msg.reactions || []
          // Check if this exact reaction exists
          const existing = reactions.find((r: any) => r.userId === data.userId && r.emoji === data.emoji)
          
          if (existing) {
            // Remove it
            return { ...msg, reactions: reactions.filter((r: any) => r.id !== existing.id) }
          } else {
            // Add it
            return {
              ...msg,
              reactions: [...reactions, {
                id: 'pusher-' + Date.now(),
                emoji: data.emoji,
                userId: data.userId,
                user: data.user
              }]
            }
          }
        }
        return msg
      }))
    })

    channel.bind('message-edited', (updatedMessage: any) => {
      setMessages(prev => prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg))
    })

    channel.bind('message-deleted', (data: { messageId: string }) => {
      setMessages(prev => prev.filter(msg => msg.id !== data.messageId))
    })

    channel.bind('client-typing', (data: { userId: string, name: string }) => {
      setTypingUsers(prev => ({ ...prev, [data.userId]: data.name }))
      setTimeout(() => {
        setTypingUsers(prev => {
          const newTyping = { ...prev }
          delete newTyping[data.userId]
          return newTyping
        })
      }, 3000)
    })

    return () => {
      pusherClient.unsubscribe('presence-chat')
    }
  }, [currentUserId])

  // Close reaction picker or profile modal when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setSelectedMessageId(null)
      setProfileModal(null)
    }
    if (selectedMessageId || profileModal) {
      document.addEventListener('click', handleClickOutside)
    }
    return () => document.removeEventListener('click', handleClickOutside)
  }, [selectedMessageId, profileModal])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const isVideo = file.type.startsWith('video/')
      const isImage = file.type.startsWith('image/')

      if (isImage) {
        setMediaType('image')
        setMediaFile(file)
        setPreviewUrl(URL.createObjectURL(file))
      } else if (isVideo) {
        // Video duration check (max 59s)
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = function() {
          window.URL.revokeObjectURL(video.src);
          if (video.duration > 60) {
            toast.warning("Videos must be 60 seconds or less.")
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
          }
          setMediaType('video')
          setMediaFile(file)
          setPreviewUrl(URL.createObjectURL(file))
        }
        video.src = URL.createObjectURL(file);
      } else {
        toast.error("Unsupported file type.")
      }
    }
  }

  const removeMedia = () => {
    setMediaFile(null)
    setMediaType(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!currentUserId) return;
    
    if (await confirm({
      title: 'Delete Message',
      message: 'Are you sure you want to delete this message? This action cannot be undone.',
      confirmText: 'Delete',
      type: 'danger'
    })) {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      try {
        const result = await deleteChatMessage(messageId, currentUserId);
        if (!result.success) {
           toast.error(result.message || "Failed to delete message");
        }
      } catch(err) {
        console.error(err);
      }
    }
  }

  const handleSendMessage = async () => {
    if ((inputMessage.trim() || mediaFile) && currentUserId) {
      setIsSending(true)
      const messageContent = inputMessage.trim()
      
      if (editingMessageId) {
        // Handle Edit
        const targetId = editingMessageId
        const previousMessage = messages.find(m => m.id === targetId)
        const previousContent = previousMessage?.content
        
        setMessages(prev => prev.map(m => m.id === targetId ? { ...m, content: messageContent, isEdited: true } : m))
        setInputMessage('')
        setEditingMessageId(null)
        
        try {
           const result = await editChatMessage(targetId, currentUserId, messageContent)
           if (!result.success) {
              toast.error(typeof result.message === 'string' ? result.message : "Failed to edit message");
              // Revert
              setMessages(prev => prev.map(m => m.id === targetId ? { ...m, content: previousContent, isEdited: previousMessage?.isEdited || false } : m))
           }
        } catch(e: any) {
           console.error(e)
           // Revert
           setMessages(prev => prev.map(m => m.id === targetId ? { ...m, content: previousContent, isEdited: previousMessage?.isEdited || false } : m))
           toast.error(e?.message || "An unexpected error occurred while editing");
        } finally {
           setIsSending(false)
        }
        return;
      }

      const tempId = 'temp-' + Date.now()
      
      let uploadedImageUrl = ''
      let uploadedVideoUrl = ''

      // Handle Media Upload if present
      if (mediaFile) {
        try {
          const transformation = mediaType === 'video' ? 'vc_h264,ac_aac' : undefined
          const { signature, timestamp, cloudName, apiKey, folder, eager } = await getUploadSignature(
            'chat-media',
            transformation
          )

          const uploadFormData = new FormData()
          uploadFormData.append('file', mediaFile)
          uploadFormData.append('api_key', apiKey!)
          uploadFormData.append('timestamp', timestamp.toString())
          uploadFormData.append('signature', signature)
          uploadFormData.append('folder', folder)
          if (eager) {
            uploadFormData.append('eager', eager)
            uploadFormData.append('eager_async', 'true')
          }

          const resourceType = mediaType === 'video' ? 'video' : 'image'
          const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`

          const response = await fetch(uploadUrl, {
            method: 'POST',
            body: uploadFormData
          })

          if (!response.ok) throw new Error('Upload failed')

          const data = await response.json()
          if (mediaType === 'video') {
            uploadedVideoUrl = data.secure_url
          } else {
            uploadedImageUrl = data.secure_url
          }
        } catch (error) {
          console.error("Upload error", error)
          toast.error("Failed to upload media.")
          setIsSending(false)
          return
        }
      }

      const replyContext = replyingTo ? {
        id: replyingTo.id,
        content: replyingTo.content,
        author: {
          firstName: replyingTo.authorName.split(' ')[0], 
          alias: replyingTo.authorName
        }
      } : null

      const tempMessage = {
        id: tempId,
        content: messageContent,
        imageUrl: uploadedImageUrl || null,
        videoUrl: uploadedVideoUrl || null,
        author: {
          id: currentUserId,
          firstName: currentUser?.firstName || 'Me',
          lastName: currentUser?.lastName || '',
          alias: currentUser?.alias,
          profileImage: currentUser?.profileImage
        },
        createdAt: new Date(),
        reactions: [],
        replyTo: replyContext
      }

      setMessages(prev => [...prev, tempMessage])
      setInputMessage('')
      setReplyingTo(null)
      removeMedia()
      
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 10)

      try {
        const result = await sendChatMessage(messageContent, currentUserId, replyingTo?.id, uploadedImageUrl, uploadedVideoUrl)
        
        if (!result.success) {
          console.error('Failed to send message:', result.message)
          setMessages(prev => prev.filter(m => m.id !== tempId))
          setInputMessage(messageContent) 
          alert("Failed to send message. Please try again.")
        } else {
          // Replace temp message with actual message from server
          setMessages(prev => prev.map(m => m.id === tempId ? result.message : m))
        }
      } catch (error) {
        console.error('Error sending message:', error)
        setMessages(prev => prev.filter(m => m.id !== tempId))
        setInputMessage(messageContent)
      } finally {
        setIsSending(false)
      }
    }
  }

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value)
    
    if (channelRef.current && currentUser) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      
      channelRef.current.trigger('client-typing', {
        userId: currentUserId,
        name: currentUser.alias || currentUser.firstName
      })
      
      typingTimeoutRef.current = setTimeout(() => {}, 3000)
    }
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!currentUserId || !currentUser) return
    
    // Save current user info locally to avoid closure issues
    const userSnapshot = { 
      id: currentUserId, 
      firstName: currentUser.firstName, 
      alias: currentUser.alias,
      profileImage: currentUser.profileImage 
    }

    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || []
        const existingReaction = reactions.find((r: any) => r.userId === currentUserId && r.emoji === emoji)
        
        if (existingReaction) {
           return {
             ...msg,
             reactions: reactions.filter((r: any) => r.id !== existingReaction.id)
           }
        } else {
           return {
             ...msg,
             reactions: [...reactions, {
               id: 'temp-' + Date.now(),
               emoji,
               userId: currentUserId,
               user: userSnapshot
             }]
           }
        }
      }
      return msg
    }))

    try {
      const result = await toggleReaction(messageId, currentUserId, emoji)
      if (!result.success) {
        toast.error("Failed to update reaction")
        // Note: In a true production app, we would revert the optimistic update here
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleReply = (message: any) => {
    setReplyingTo({
      id: message.id,
      content: message.content,
      authorName: message.author.alias || message.author.firstName
    })
    setSelectedMessageId(null)
    inputRef.current?.focus()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatDate = (date: Date) => {
    const d = new Date(date)
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const year = d.getFullYear()
    return `${month}-${day}-${year}`
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const now = new Date()
  const sampleDate1 = new Date(now.getTime() - 2 * 60 * 60 * 1000)

  const users = {
    you: {
      name: 'You',
      firstName: 'You',
      alias: null,
      profileImage: null,
      initial: 'Y',
      color: 'bg-brand-sky'
    }
  }

  const getDisplayName = (author: any) => {
    return author.alias || `${author.firstName} ${author.lastName}`
  }

  const renderAvatar = (author: any, size: 'small' | 'medium' = 'small', onClick: (e: React.MouseEvent) => void = () => {}) => {
    const sizeClasses = size === 'small' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base'
    
    if (author.profileImage) {
      return (
        <img 
          src={author.profileImage} 
          alt={author.firstName} 
          className={`${sizeClasses} rounded-full object-cover cursor-pointer`}
          onClick={onClick}
        />
      )
    }
    
    const initial = (author.alias || author.firstName || 'U')[0].toUpperCase()
    return (
      <div 
        className={`${sizeClasses} rounded-full bg-brand-sky text-white flex items-center justify-center font-bold cursor-pointer`}
        onClick={onClick}
      >
        {initial}
      </div>
    )
  }

  const handleAvatarClick = (e: React.MouseEvent, author: any) => {
    e.stopPropagation()
    // Small offset so it doesn't appear exactly under the cursor
    setProfileModal({
      author,
      x: e.clientX,
      y: e.clientY
    })
  }

  const renderSystemMessage = (message: string, time: Date) => {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-slate-200 px-3 py-1 rounded-full">
          <p className="text-xs text-slate-600 font-medium">{message}</p>
          <p className="text-[10px] text-slate-400 text-center mt-1">{formatTime(time)}</p>
        </div>
      </div>
    )
  }

  const getGroupedReactions = (reactions: any[]) => {
    if (!reactions || reactions.length === 0) return []
    const groups: {[key: string]: any[]} = {}
    reactions.forEach(r => {
      if (!groups[r.emoji]) groups[r.emoji] = []
      groups[r.emoji].push(r)
    })
    return Object.entries(groups).map(([emoji, users]) => ({ emoji, count: users.length, users }))
  }

  return (
    <div className="fixed top-14 left-0 right-0 bottom-0 flex flex-col bg-slate-50 z-30">
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full bg-white shadow-xl sm:border-x border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-brand-sky to-brand-sky text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <h2 className="text-lg font-bold">Family Chat</h2>
            <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full ml-2">
              {onlineUsers.length} Online
            </span>
          </div>
          <button 
            onClick={() => setIsInfoModalOpen(true)}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <InformationCircleIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* Chat Messages Area */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          
          <div ref={topRef} className="h-4 w-full" />
          {isLoadingMore && <div className="text-center text-xs text-slate-400">Loading older messages...</div>}

          {/* Welcome Message */}
          {!hasMore && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Welcome to Family Chat</h3>
              <p className="text-slate-600 max-w-md mx-auto text-sm">
                Start conversations with your family members. This is a safe space for family discussions.
              </p>
              <p className="text-xs text-slate-400 mt-2">{formatDate(now)} • {formatTime(now)}</p>
            </div>
          )}
          
          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-xs text-slate-400 font-medium">{formatDate(sampleDate1)}</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>
          
          {/* Messages */}
          <div className="space-y-6 pb-2">
            {joinMessage && renderSystemMessage(joinMessage, new Date())}
            
            {messages.map((message) => {
              const isCurrentUser = message.author.id === currentUserId
              const groupedReactions = getGroupedReactions(message.reactions || [])
              const showReactionPicker = selectedMessageId === message.id

              return (
                <div key={message.id} className={`flex gap-3 relative group scroll-mt-32 ${isCurrentUser ? 'justify-end' : ''}`}>
                  {!isCurrentUser && renderAvatar(message.author, 'small', (e) => handleAvatarClick(e, message.author))}
                  
                  <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
                    
                    {/* Reply Context (Faded, behind) */}
                    {message.replyTo && (
                       <div className={`text-xs text-slate-400 mb-1 px-2 border-l-2 border-slate-300 bg-slate-100 p-1 rounded opacity-70 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                         <span className="font-bold">Replying to {message.replyTo.author.alias || message.replyTo.author.firstName}:</span> {message.replyTo.content.substring(0, 30)}{message.replyTo.content.length > 30 ? '...' : ''}
                       </div>
                    )}

                    {/* Message Bubble */}
                    <div 
                      className={`relative p-3 rounded-2xl shadow-sm cursor-pointer transition-all active:scale-95 min-w-[60px] ${isCurrentUser ? 'bg-brand-sky text-white rounded-br-sm' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-sm'}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        const willShow = !showReactionPicker
                        setSelectedMessageId(willShow ? message.id : null)
                        
                        if (willShow) {
                          // Scroll the message into a better view if needed
                          e.currentTarget.parentElement?.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                        }

                        // Show timestamp temporarily
                        setVisibleTimestampId(message.id)
                        if (timestampTimeoutRef.current) clearTimeout(timestampTimeoutRef.current)
                        timestampTimeoutRef.current = setTimeout(() => {
                          setVisibleTimestampId(null)
                        }, 4000)
                      }}
                    >
                      {message.imageUrl && (
                        <div className="relative mb-2 rounded-lg overflow-hidden bg-slate-200/50 min-h-[100px] flex items-center justify-center">
                          <img 
                            src={message.imageUrl} 
                            alt="Shared image" 
                            className="max-w-full rounded-lg border border-white/20 shadow-sm pointer-events-none select-none" 
                          />
                        </div>
                      )}
                      {message.videoUrl && (
                        <div className="relative mb-2 rounded-lg overflow-hidden bg-slate-200/50 min-h-[150px] flex items-center justify-center group/video">
                          <video 
                            src={message.videoUrl} 
                            controls 
                            className="max-w-full rounded-lg border border-white/20 shadow-sm" 
                          />
                        </div>
                      )}
                      {message.content && <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>}
                      
                      {/* Reaction Picker Popover */}
                      {showReactionPicker && (
                        <div 
                          ref={popoverRef}
                          className={`absolute z-20 bg-white shadow-xl rounded-2xl p-2 flex flex-col gap-2 border border-slate-200 animate-in zoom-in-95 duration-200 ${
                            popoverPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
                          } ${isCurrentUser ? 'right-0' : 'left-0'}`}
                        >
                          {/* Reaction Summary (NEW) */}
                          {message.reactions && message.reactions.length > 0 && (
                            <div className="px-2 py-1 mb-1 border-b border-slate-100 flex items-center justify-between gap-4">
                              <div className="flex -space-x-2 overflow-hidden">
                                {Array.from(new Map(message.reactions.map((r: any) => [r.user?.id, r.user])).values())
                                  .slice(0, 5)
                                  .map((user: any, idx: number) => (
                                    <div 
                                      key={user?.id || idx} 
                                      className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-brand-sky text-[8px] flex items-center justify-center text-white font-bold overflow-hidden"
                                    >
                                      {user?.profileImage ? (
                                        <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
                                      ) : (
                                        <span>{(user?.alias || user?.firstName || '?')[0].toUpperCase()}</span>
                                      )}
                                    </div>
                                  ))
                                }
                                {new Set(message.reactions.map((r: any) => r.userId)).size > 5 && (
                                  <div className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-slate-100 text-[8px] flex items-center justify-center text-slate-500 font-bold">
                                    +{new Set(message.reactions.map((r: any) => r.userId)).size - 5}
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                {new Set(message.reactions.map((r: any) => r.userId)).size} {new Set(message.reactions.map((r: any) => r.userId)).size === 1 ? 'person' : 'people'}
                              </span>
                            </div>
                          )}

                          {/* Reactions */}
                          <div className="flex gap-1">
                            {REACTION_EMOJIS.map(emoji => (
                              <button
                                key={emoji}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleReaction(message.id, emoji)
                                  setSelectedMessageId(null)
                                }}
                                className="w-8 h-8 flex items-center justify-center text-xl hover:bg-slate-100 rounded-full transition-transform hover:scale-125"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                          
                          {/* Reply Button */}
                          <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleReply(message)
                            }}
                            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:bg-slate-50 p-2 rounded-lg w-full"
                          >
                             <ArrowUturnLeftIcon className="w-4 h-4" />
                             Reply
                          </button>
                          
                          {/* Delete and Edit Logic */}
                          {(() => {
                            const isAdmin = currentUser?.isAdmin === true
                            const isAuthor = message.author.id === currentUserId
                            const isWithinTimeLimit = (Date.now() - new Date(message.createdAt).getTime() <= 15 * 60 * 1000)
                            const isTemp = message.id.startsWith('temp-')

                            return (
                              <div className="flex flex-col gap-2 w-full">
                                {isAuthor && isWithinTimeLimit && !isTemp && !message.isEdited && (
                                  <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setEditingMessageId(message.id)
                                        setInputMessage(message.content || '')
                                        setSelectedMessageId(null)
                                        inputRef.current?.focus()
                                    }}
                                    className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:bg-slate-50 p-2 rounded-lg w-full transition-colors"
                                  >
                                    <PencilIcon className="w-4 h-4" />
                                    Edit
                                  </button>
                                )}
                                
                                {(isAdmin || (isAuthor && isWithinTimeLimit)) && !isTemp && (
                                  <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteMessage(message.id)
                                        setSelectedMessageId(null)
                                    }}
                                    className="flex items-center gap-2 text-xs font-bold text-red-500 hover:bg-red-50 p-2 rounded-lg w-full transition-colors"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                    Delete
                                  </button>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      )}

                      {/* Display Reactions Sitting on Bubble */}
                      {groupedReactions.length > 0 && (
                        <div className={`absolute -bottom-3 ${isCurrentUser ? 'right-2' : 'left-2'} flex flex-wrap gap-1 z-10`}>
                          {groupedReactions.map(({ emoji, count, users }) => {
                             const userReacted = users.some((u: any) => u.userId === currentUserId)
                             return (
                               <button
                                 key={emoji}
                                 onClick={(e) => {
                                   e.stopPropagation()
                                   handleReaction(message.id, emoji)
                                 }}
                                 className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border shadow-sm transition-transform active:scale-90 ${
                                   userReacted 
                                     ? 'bg-brand-sky border-brand-sky text-white' 
                                     : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                 }`}
                               >
                                 <span>{emoji}</span>
                                 <span className="font-bold text-[10px]">{count}</span>
                               </button>
                             )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Meta */}
                    <div className={`flex flex-col gap-1 ${groupedReactions.length > 0 ? 'mt-6' : 'mt-1'} min-h-[14px]`}>
                      {visibleTimestampId === message.id && (
                        <div className={`flex items-center gap-2 px-1 animate-in fade-in slide-in-from-top-1 duration-200 ${isCurrentUser ? 'justify-end' : ''}`}>
                            <p className={`text-[10px] ${isCurrentUser ? 'text-slate-400' : 'text-slate-400'}`}>
                              {formatTime(message.createdAt)}
                              {message.isEdited && <span className="ml-1 italic text-slate-400">(edited)</span>}
                            </p>
                        </div>
                      )}
                    </div>

                  </div>

                  {isCurrentUser && renderAvatar(message.author, 'small', (e) => handleAvatarClick(e, message.author))}
                </div>
              )
            })}
            
            {/* Typing Indicator */}
            {Object.keys(typingUsers).length > 0 && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic px-4">
                <span>{Object.values(typingUsers).join(', ')} {Object.values(typingUsers).length === 1 ? 'is' : 'are'} typing</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Message Input */}
        <div className="p-4 border-t border-slate-200 bg-white shrink-0">
          {/* Media Preview */}
          {previewUrl && (
            <div className="relative mb-3 w-fit">
              {mediaType === 'image' ? (
                <img src={previewUrl} alt="Preview" className="h-24 w-auto rounded-xl object-cover border-2 border-brand-sky/20" />
              ) : (
                <video src={previewUrl} className="h-24 w-auto rounded-xl object-cover border-2 border-brand-sky/20" />
              )}
              <button 
                onClick={removeMedia}
                className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 hover:bg-red-500 transition-colors shadow-lg"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Replying Indicator */}
          {replyingTo && (
             <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg mb-2 text-xs border-l-4 border-brand-sky">
                <div className="flex flex-col">
                   <span className="font-bold text-brand-sky">Replying to {replyingTo.authorName}</span>
                   <span className="text-slate-500 truncate max-w-xs">{replyingTo.content}</span>
                </div>
                <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-slate-200 rounded-full">
                   <XMarkIcon className="w-4 h-4 text-slate-500" />
                </button>
             </div>
          )}

          {/* Editing Indicator */}
          {editingMessageId && (
             <div className="flex items-center justify-between bg-amber-50 p-2 rounded-lg mb-2 text-xs border-l-4 border-amber-400">
                <div className="flex flex-col">
                   <span className="font-bold text-amber-600">Editing Message</span>
                   <span className="text-slate-500 truncate max-w-xs">{messages.find(m => m.id === editingMessageId)?.content}</span>
                </div>
                <button onClick={() => { setEditingMessageId(null); setInputMessage(''); }} className="p-1 hover:bg-amber-200 rounded-full">
                   <XMarkIcon className="w-4 h-4 text-slate-500" />
                </button>
             </div>
          )}
        
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <div className="relative flex items-center gap-2 bg-slate-100 rounded-3xl px-4 py-2 focus-within:ring-2 focus-within:ring-brand-sky transition-shadow">
                <button 
                  onClick={() => setIsMediaModalOpen(true)}
                  className="shrink-0 p-1.5 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                  disabled={isSending}
                >
                  <PhotoIcon className="w-6 h-6" />
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={inputMessage}
                  onChange={handleTyping}
                  onKeyUp={handleKeyPress}
                  className="flex-1 bg-transparent text-sm focus:outline-none min-h-[2.5rem]"
                  disabled={isSending}
                />
                
                <div className="shrink-0">
                  <EmojiButton onEmojiSelect={(emoji: string) => setInputMessage((prev: string) => prev + emoji)} />
                </div>

                <button 
                  onClick={handleSendMessage}
                  className="shrink-0 w-8 h-8 flex items-center justify-center hover:bg-white/50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={(isSending) || (!inputMessage.trim() && !mediaFile) || !currentUserId}
                >
                  {isSending ? (
                    <div className="w-5 h-5 border-2 border-brand-sky border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-brand-sky">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.771 59.771 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Hidden File Inputs */}
              <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/*"
                onChange={handleFileChange}
              />
              <input 
                type="file"
                ref={cameraInputRef}
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
              />
              <input 
                type="file"
                ref={videoCameraInputRef}
                className="hidden"
                accept="video/*"
                capture="environment"
                onChange={handleFileChange}
              />

              <p className="text-[10px] text-slate-400 mt-2 text-center">{formatDate(now)} • {formatTime(now)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {profileModal && (
        <div
          className="fixed z-[110] bg-white rounded-xl shadow-2xl p-4 w-64 animate-in fade-in zoom-in-95 duration-200 border border-slate-100"
          style={{ 
            top: `${Math.min(profileModal.y + 10, typeof window !== 'undefined' ? window.innerHeight - 250 : 500)}px`, 
            left: `${Math.min(profileModal.x + 10, typeof window !== 'undefined' ? window.innerWidth - 260 : 10)}px` 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-3">
             <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
               {profileModal.author.profileImage ? (
                 <img src={profileModal.author.profileImage} alt={profileModal.author.firstName} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full bg-brand-sky flex items-center justify-center font-bold text-white text-lg">
                   {(profileModal.author.alias || profileModal.author.firstName || 'U')[0].toUpperCase()}
                 </div>
               )}
             </div>
             <div>
                <div className="font-bold text-slate-800 text-sm">
                  {profileModal.author.alias || profileModal.author.firstName}
                </div>
                <div className="text-xs text-brand-sky font-medium">
                  {profileModal.author.position || 'Family Member'}
                </div>
             </div>
          </div>
          {profileModal.author.bio && (
             <p className="text-xs text-slate-600 italic border-t border-slate-100 pt-2 mb-3">
                &quot;{profileModal.author.bio.substring(0, 75)}{profileModal.author.bio.length > 75 ? '...' : ''}&quot;
             </p>
          )}

          <div className="pt-2 border-t border-slate-50">
            <button 
              onClick={() => {
                router.push(`/${profileModal.author.firstName.toLowerCase()}s-room`)
                setProfileModal(null)
              }}
              className="text-xs font-bold text-brand-sky hover:text-sky-600 flex items-center gap-1 transition-colors"
            >
              View Profile
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Chat Info Modal */}
      {isInfoModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setIsInfoModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-700">Chat Info</h3>
              <button 
                onClick={() => setIsInfoModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full shadow-sm"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* 1. Active Users Summary */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Users</h4>
                  <span className="bg-brand-sky/10 text-brand-sky text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {onlineUsers.length} Online
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {onlineUsers.map((user, idx) => (
                    <div key={user.user_id || idx} className="flex flex-col items-center gap-1 w-14">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-brand-sky flex items-center justify-center text-white font-bold border-2 border-white shadow-sm overflow-hidden">
                          {user.profileImage ? (
                            <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span>{(user.name || '?')[0].toUpperCase()}</span>
                          )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <span className="text-[10px] text-slate-600 font-medium truncate w-full text-center">
                        {user.name}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* 2. Media Gallery */}
              <section>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Shared Media</h4>
                {chatMedia.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {chatMedia.map((m) => (
                      <div key={m.id} className="aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200 group relative">
                        {m.imageUrl ? (
                          <img 
                            src={m.imageUrl} 
                            alt="" 
                            className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform" 
                            onClick={() => window.open(m.imageUrl, '_blank')}
                          />
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center cursor-pointer group"
                            onClick={() => window.open(m.videoUrl, '_blank')}
                          >
                            <video src={m.videoUrl} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                              <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center">
                                <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-brand-sky border-b-[5px] border-b-transparent ml-0.5" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-2xl p-8 text-center border border-dashed border-slate-200">
                    <PhotoIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 italic">No media shared yet</p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Media Selection Modal */}
      {isMediaModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" 
          onClick={() => setIsMediaModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" 
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-700">Add Media</h3>
              <button 
                onClick={() => setIsMediaModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full shadow-sm"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <button 
                onClick={() => { setIsMediaModalOpen(false); fileInputRef.current?.click(); }}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-all text-left border border-slate-100 shadow-sm hover:shadow active:scale-[0.98]"
              >
                <div className="bg-brand-sky/10 p-3 rounded-full text-brand-sky">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-slate-700">Upload Pic/Vid</div>
                  <div className="text-xs text-slate-500">Choose from your library</div>
                </div>
              </button>
              
              <button 
                onClick={() => { setIsMediaModalOpen(false); cameraInputRef.current?.click(); }}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-all text-left border border-slate-100 shadow-sm hover:shadow active:scale-[0.98]"
              >
                <div className="bg-brand-sky/10 p-3 rounded-full text-brand-sky">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-slate-700">Take Photo</div>
                  <div className="text-xs text-slate-500">Take a photo using your camera</div>
                </div>
              </button>

              <button 
                onClick={() => { setIsMediaModalOpen(false); videoCameraInputRef.current?.click(); }}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-all text-left border border-slate-100 shadow-sm hover:shadow active:scale-[0.98]"
              >
                <div className="bg-brand-sky/10 p-3 rounded-full text-brand-sky">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-slate-700">Record Video</div>
                  <div className="text-xs text-slate-500">Record a video using your camera</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
