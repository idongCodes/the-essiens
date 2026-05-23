'use client'

import { useState } from 'react'

interface FamilyPositionIconProps {
  position: string
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export default function FamilyPositionIcon({ position, size = 'medium', className = '' }: FamilyPositionIconProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowTooltip(prev => !prev)
  }

  const textSizes = {
    small: 'text-[10px]',
    medium: 'text-[11px]', 
    large: 'text-[12px]'
  }

  const tooltipPosition = size === 'small' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' : 'bottom-full left-1/2 -translate-x-1/2 mb-3'

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <div
        className={`${textSizes[size]} text-brand-sky font-bold cursor-pointer transition-all duration-200 hover:text-brand-sky hover:underline`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={handleClick}
      >
        Family Position
      </div>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className={`absolute ${tooltipPosition} z-50 pointer-events-none`}>
          <div className="bg-slate-800 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
            <div className="relative">
              {position}
              {/* Tooltip arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                <div className="border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
