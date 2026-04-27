'use client'

import EmojiButton from './EmojiButton'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { XMarkIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline'
import { getChatMessages, sendChatMessage, toggleReaction } from '@/app/chat/actions'
import { pusherClient } from '@/lib/pusherClient'

export default function ChatModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter()
  const [joinMessage, setJoinMessage] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<{ id: string, content: string, authorName: string } | null>(null)
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [typingUsers, setTypingUsers] = useState<{[key: string]: string}>({})
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const channelRef = useRef<any>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Available reactions
  const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢']

  const fetchCurrentUser = async () => {
    if (currentUserId) {
      try {
        const response = await fetch(`/api/user/${currentUserId}`)
        if (response.ok) {
          const userData = await response.json()
          setCurrentUser(userData)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }
  }

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
    if (!isOpen) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
        loadMoreMessages()
      }
    }, { threshold: 0.1 })
    
    if (topRef.current) {
      observer.observe(topRef.current)
    }
    
    return () => observer.disconnect()
  }, [loadMoreMessages, hasMore, isLoadingMore, isOpen])

  useEffect(() => {
    if (isOpen) {
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
      const userId = sessionId || 'test-user-id'
      setCurrentUserId(userId)
      
      fetchCurrentUser()
    }
  }, [isOpen])

  // Pusher Subscription
  useEffect(() => {
    if (!isOpen || !currentUserId) return

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
      setMessages(prev => prev.map(msg => {
        if (msg.id === data.messageId) {
          const existing = msg.reactions?.find((r: any) => r.userId === data.userId && r.emoji === data.emoji)
          if (existing) {
            return { ...msg, reactions: msg.reactions.filter((r: any) => r.id !== existing.id) }
          } else {
            return {
              ...msg,
              reactions: [...(msg.reactions || []), {
                id: 'temp-' + Date.now(),
                emoji: data.emoji,
                userId: data.userId,
                // Partial user data, real data syncs on next reload or we can fetch, but we only need it for counting
              }]
            }
          }
        }
        return msg
      }))
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
  }, [isOpen, currentUserId])

  // Close reaction picker when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setSelectedMessageId(null)
    if (selectedMessageId) {
      document.addEventListener('click', handleClickOutside)
    }
    return () => document.removeEventListener('click', handleClickOutside)
  }, [selectedMessageId])

  const handleSendMessage = async () => {
    if (inputMessage.trim() && currentUserId) {
      const tempId = 'temp-' + Date.now()
      const messageContent = inputMessage.trim()
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
      
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 10)

      try {
        const result = await sendChatMessage(messageContent, currentUserId, replyingTo?.id)
        
        if (!result.success) {
          console.error('Failed to send message:', result.message)
          setMessages(prev => prev.filter(m => m.id !== tempId))
          setInputMessage(messageContent) 
          alert("Failed to send message. Please try again.")
        }
      } catch (error) {
        console.error('Error sending message:', error)
        setMessages(prev => prev.filter(m => m.id !== tempId))
        setInputMessage(messageContent)
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
    if (!currentUserId) return
    
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions?.find((r: any) => r.userId === currentUserId && r.emoji === emoji)
        if (existingReaction) {
           return {
             ...msg,
             reactions: msg.reactions.filter((r: any) => r.id !== existingReaction.id)
           }
        } else {
           return {
             ...msg,
             reactions: [...(msg.reactions || []), {
               id: 'temp-' + Date.now(),
               emoji,
               userId: currentUserId,
               user: { id: currentUserId, firstName: currentUser?.firstName || 'Me', alias: currentUser?.alias }
             }]
           }
        }
      }
      return msg
    }))

    await toggleReaction(messageId, currentUserId, emoji)
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
  
  if (!isOpen) return null

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

  const renderAvatar = (author: any, size: 'small' | 'medium' = 'small', onClick: () => void = () => {}) => {
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
      <div className={`${sizeClasses} rounded-full bg-brand-sky text-white flex items-center justify-center font-bold cursor-pointer`} onClick={onClick}>
        {initial}
      </div>
    )
  }

  const handleUserClick = (author: any) => {
    onClose()
    const displayName = author.alias || author.firstName
    if(displayName){
        const user = displayName.toLowerCase().replace(/\s+/g, '-').trim()
        router.push(`/${user}s-room`)
    }
  }

  const renderSystemMessage = (message: string, time: Date) => {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-slate-100 px-3 py-1 rounded-full">
          <p className="text-xs text-slate-500 font-medium">{message}</p>
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
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-white/30 backdrop-blur-md border border-white/40"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 w-[90vw] max-w-6xl h-[80vh] bg-white rounded-t-3xl shadow-2xl border border-slate-200 flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-brand-sky to-brand-pink text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <h2 className="text-lg font-bold">Family Chat</h2>
            <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full ml-2">
              {onlineUsers.length} Online
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Chat Messages Area */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          
          <div ref={topRef} className="h-4 w-full" />
          {isLoadingMore && <div className="text-center text-xs text-slate-400">Loading older messages...</div>}

          {/* Welcome Message */}
          {!hasMore && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Welcome to Family Chat</h3>
              <p className="text-slate-600 max-w-md mx-auto">
                Start conversations with your family members. This is a safe space for family discussions.
              </p>
              <p className="text-xs text-slate-400 mt-2">{formatDate(now)} • {formatTime(now)}</p>
            </div>
          )}
          
          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-slate-300"></div>
            <span className="text-xs text-slate-500 font-medium">{formatDate(sampleDate1)}</span>
            <div className="flex-1 h-px bg-slate-300"></div>
          </div>
          
          {/* Messages */}
          <div className="space-y-6 pb-2">
            {joinMessage && renderSystemMessage(joinMessage, new Date())}
            
            {messages.map((message) => {
              const isCurrentUser = message.author.id === currentUserId
              const groupedReactions = getGroupedReactions(message.reactions || [])
              const showReactionPicker = selectedMessageId === message.id

              return (
                <div key={message.id} className={`flex gap-3 relative group ${isCurrentUser ? 'justify-end' : ''}`}>
                  {!isCurrentUser && renderAvatar(message.author, 'small', () => handleUserClick(message.author))}
                  
                  <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
                    
                    {/* Reply Context (Faded, behind) */}
                    {message.replyTo && (
                       <div className={`text-xs text-slate-400 mb-1 px-2 border-l-2 border-slate-300 bg-slate-50/50 p-1 rounded opacity-70 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                         <span className="font-bold">Replying to {message.replyTo.author.alias || message.replyTo.author.firstName}:</span> {message.replyTo.content.substring(0, 30)}{message.replyTo.content.length > 30 ? '...' : ''}
                       </div>
                    )}

                    {/* Message Bubble */}
                    <div 
                      className={`relative p-3 rounded-2xl shadow-sm cursor-pointer transition-all active:scale-95 ${isCurrentUser ? 'bg-brand-sky text-white' : 'bg-white text-slate-700'}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedMessageId(showReactionPicker ? null : message.id)
                      }}
                    >
                      <p className="text-sm">{message.content}</p>
                      
                      {/* Reaction Picker Popover */}
                      {showReactionPicker && (
                        <div className={`absolute bottom-full mb-2 z-10 bg-white shadow-xl rounded-2xl p-2 flex flex-col gap-2 border border-slate-100 animate-in zoom-in-95 duration-200 ${isCurrentUser ? 'right-0' : 'left-0'}`}>
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
                        </div>
                      )}
                    </div>

                    {/* Meta & Reactions */}
                    <div className="flex flex-col gap-1 mt-1">
                      <div className={`flex items-center gap-2 px-2 ${isCurrentUser ? 'justify-end' : ''}`}>
                         <button 
                            onClick={() => handleUserClick(message.author)}
                            className={`text-xs font-medium hover:text-brand-pink transition-colors cursor-pointer ${isCurrentUser ? 'text-brand-sky/80' : 'text-slate-400'}`}
                          >
                            {getDisplayName(message.author)}
                          </button>
                          {(message.author as any).email === 'idongesit_essien@ymail.com' && (
                             <span className="bg-slate-700 text-white text-[8px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2 h-2"><path fillRule="evenodd" d="M10.362 1.093a.75.75 0 0 0-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925ZM18 6.443l-7.25 4v8.25l6.862-3.786A.75.75 0 0 0 18 14.25V6.443Zm-8.75 12.25v-8.25l-7.25-4v7.807a.75.75 0 0 0 .388.657l6.862 3.786Z" clipRule="evenodd" /></svg>
                               Admin
                             </span>
                          )}
                          <span className={`text-xs ${isCurrentUser ? 'text-brand-sky/60' : 'text-slate-300'}`}>•</span>
                          <p className={`text-xs ${isCurrentUser ? 'text-brand-sky/80' : 'text-slate-400'}`}>{formatTime(message.createdAt)}</p>
                      </div>

                      {/* Display Reactions */}
                      {groupedReactions.length > 0 && (
                        <div className={`flex flex-wrap gap-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                          {groupedReactions.map(({ emoji, count, users }) => {
                             const userReacted = users.some((u: any) => u.userId === currentUserId)
                             return (
                               <button
                                 key={emoji}
                                 onClick={() => handleReaction(message.id, emoji)}
                                 className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border ${
                                   userReacted 
                                     ? 'bg-brand-sky/10 border-brand-sky/30 text-brand-sky' 
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

                  </div>

                  {isCurrentUser && renderAvatar(message.author, 'small', () => handleUserClick(message.author))}
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
        <div className="p-4 border-t border-slate-200 bg-white">
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
        
          <div className="flex gap-2 items-start">
            <div className="transform -translate-y-0">
              {currentUser ? renderAvatar(currentUser, 'medium', () => handleUserClick(currentUser)) : renderAvatar(users.you, 'medium')}
            </div>
            <div className="flex-1">
              <div className="relative flex items-center gap-2 bg-slate-100 rounded-3xl px-4 py-2 focus-within:ring-2 focus-within:ring-brand-sky transition-shadow">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={inputMessage}
                  onChange={handleTyping}
                  onKeyUp={handleKeyPress}
                  className="flex-1 bg-transparent text-sm focus:outline-none min-h-[2.5rem]"
                />
                
                <div className="shrink-0">
                  <EmojiButton onEmojiSelect={(emoji) => setInputMessage(prev => prev + emoji)} />
                </div>

                <button 
                  onClick={handleSendMessage}
                  className="shrink-0 w-8 h-8 flex items-center justify-center hover:bg-white/50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!inputMessage.trim() || !currentUserId}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-brand-sky">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.771 59.771 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">{formatDate(now)} • {formatTime(now)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}