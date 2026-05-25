'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitTestimonial } from '@/app/testimonials/actions'

export default function FeedbackSection() {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim()) return

    setIsSubmitting(true)
    const result = await submitTestimonial(content)
    setIsSubmitting(false)

    if (result.success) {
      setContent('')
      alert("Thank you! Your message has been posted.")
      router.refresh()
    } else {
      if (result.message === "Must be logged in") {
        if (confirm("Please log in to share your love!")) {
          router.push('/login')
        }
      } else {
        alert(result.message || "Something went wrong.")
      }
    }
  }

  return (
    <section className="bg-slate-50 border-t border-slate-200 py-12 px-4 mt-auto">
      <div className="max-w-2xl mx-auto">
        
        {/* HEADING */}
        <h3 className="text-xl font-bold text-slate-800 mb-2 text-left md:text-center">
          What do you love about this app?
        </h3>
        
        {/* SUBTEXT (Added Here) */}
        <p className="text-slate-500 text-sm text-left md:text-center mb-8">
          The encouragement you share here will be visible in the Testimonials section on the homepage ♥️
        </p>
        
        {/* FORM */}
        <div className="flex flex-col gap-4">
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts..."
            rows={3}
            className="w-full p-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-sky outline-none transition-all resize-y shadow-sm text-slate-700 disabled:opacity-50"
            disabled={isSubmitting}
          />
          
          <div className="flex justify-end">
            <button 
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !content.trim()}
              className="bg-brand-sky text-white font-bold py-2.5 px-6 rounded-lg hover:bg-sky-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Posting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}