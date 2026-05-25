'use client'

import { useState } from 'react'

interface FamilyPositionIconProps {
  position: string
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export default function FamilyPositionIcon({ position, size = 'medium', className = '' }: FamilyPositionIconProps) {
  const textSizes = {
    small: 'text-[10px]',
    medium: 'text-sm md:text-base', 
    large: 'text-lg'
  }

  return (
    <div className={`inline-flex items-center font-bold text-slate-500 ${textSizes[size]} ${className}`}>
      {position}
    </div>
  )
}
