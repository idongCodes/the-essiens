'use client'

import { useState } from 'react'

export default function StatusBadge({ 
  status, 
  size = 'normal' 
}: { 
  status?: string | null, 
  size?: 'small' | 'normal' | 'large' 
}) {
  if (!status) return null

  // Get first character (emoji)
  const firstChar = Array.from(status)[0]

  const sizeClasses = {
    small:  { 
      position: '-top-1 left-6', 
      base: 'w-4 h-4 text-[8px]', 
    },
    normal: { 
      position: '-top-1 left-7', 
      base: 'w-6 h-6 text-[12px]',     
    },
    large:  { 
      position: 'top-2 left-28',          
      base: 'w-10 h-10 text-xl',          
    }
  }

  const current = sizeClasses[size]

  return (
    <div 
      className={`absolute flex items-center justify-center transition-all duration-300 ease-out z-10 overflow-hidden rounded-full shadow-md border-white/30 bg-white/60 backdrop-blur-md border text-slate-900 ring-1 ring-white/40
        ${current.position} ${current.base}
      `}
    >
      <span className="leading-none select-none">
        {firstChar}
      </span>
    </div>
  )
}