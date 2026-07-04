'use client'

import { useState } from 'react'
import { createAnnouncement, editPost } from '@/app/common-room/actions'
import { useToast } from '@/context/ToastContext'

interface AnnouncementModalProps {
  onClose: () => void
  initialData?: {
    id: string
    title: string
    content: string
    isUrgent: boolean
  }
}

export default function AnnouncementModal({ onClose, initialData }: AnnouncementModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showToast } = useToast()
  
  // Initialize state with props if editing, otherwise defaults
  const [isUrgent, setIsUrgent] = useState(initialData?.isUrgent || false)
  const [title, setTitle] = useState(initialData?.title || '')
  const [message, setMessage] = useState(initialData?.content || '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    let result
    
    if (initialData) {
      // EDIT MODE: Reuse existing editPost action
      result = await editPost(initialData.id, message, title, isUrgent)
    } else {
      // CREATE MODE: Use createAnnouncement action
      const formData = new FormData()
      formData.append('title', title)
      formData.append('message', message)
      formData.append('isUrgent', isUrgent.toString())
      
      result = await createAnnouncement(formData)
    }

    setIsSubmitting(false)

    if (result.success) {
      onClose()
    } else {
      showToast(result.message || "Failed to save announcement.", "error")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          {initialData ? 'Edit Announcement' : 'New Announcement'}
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">TITLE</label>
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required 
              placeholder="e.g. Family Reunion" 
              className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-sky outline-none"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">MESSAGE</label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required 
              rows={4}
              placeholder="What's happening?" 
              className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-sky outline-none resize-none"
            />
          </div>

          {/* Urgent Toggle */}
          <div 
            onClick={() => setIsUrgent(!isUrgent)}
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isUrgent ? 'border-red-500' : 'border-slate-300'}`}>
              {isUrgent && <div className="w-2.5 h-2.5 rounded-full bg-red-500" />}
            </div>
            <span className={`font-bold ${isUrgent ? 'text-red-500' : 'text-slate-500'}`}>Mark as Urgent</span>
          </div>

          <div className="flex gap-2 justify-end mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-slate-600 font-bold">Cancel</button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-brand-sky text-white px-6 py-2 rounded-lg font-bold hover:bg-sky-500 shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Post')}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}