'use client'

import { useState } from 'react'
import { createAppUpdate } from '@/app/actions/whatsNew'
import EmojiButton from './EmojiButton'

export default function AdminAppUpdateForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('feature')
  const [status, setStatus] = useState('just-released')
  const [version, setVersion] = useState('')
  const [icon, setIcon] = useState('✨')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    formData.append('category', category)
    formData.append('status', status)
    formData.append('version', version)
    formData.append('icon', icon)

    const result = await createAppUpdate(formData)
    setIsSubmitting(false)

    if (result.success) {
      alert('Update published successfully!')
      setTitle('')
      setDescription('')
      setVersion('')
    } else {
      alert(result.message || 'Failed to publish update')
    }
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-brand-pink/20">
      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span>📢</span> Publish App Update
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
          <div className="w-24">
            <label className="block text-xs font-bold text-slate-500 mb-1">ICON</label>
            <div className="relative flex items-center">
              <input 
                value={icon}
                readOnly
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-center text-xl cursor-default"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <EmojiButton onEmojiSelect={(e) => setIcon(e)} />
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 mb-1">TITLE</label>
            <input 
              required
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-pink outline-none bg-slate-50"
              placeholder="e.g. New Chat Feature!"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">DESCRIPTION</label>
          <textarea 
            required
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            rows={3} 
            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-pink outline-none bg-slate-50 resize-none"
            placeholder="Explain what's new..."
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 mb-1">CATEGORY</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-pink outline-none bg-slate-50"
            >
              <option value="feature">Feature</option>
              <option value="fix">Fix</option>
              <option value="update">Update</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 mb-1">STATUS</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-pink outline-none bg-slate-50"
            >
              <option value="just-released">Just Released</option>
              <option value="recently-updated">Recently Updated</option>
              <option value="coming-soon">Coming Soon</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 mb-1">VERSION (Optional)</label>
            <input 
              value={version} 
              onChange={(e) => setVersion(e.target.value)} 
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-pink outline-none bg-slate-50"
              placeholder="e.g. v2.0"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-pink text-white px-8 py-2.5 rounded-full font-bold text-sm hover:bg-pink-500 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Publishing...' : 'Publish Update'}
          </button>
        </div>
      </form>
    </div>
  )
}
