'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function NavigationTracker() {
  const pathname = usePathname()

  useEffect(() => {
    try {
      const history = JSON.parse(sessionStorage.getItem('navHistory') || '[]')
      
      // Handle back navigation: if the new path is the second to last item, it means we went back
      if (history.length >= 2 && history[history.length - 2] === pathname) {
        history.pop()
      } else if (history[history.length - 1] !== pathname) {
        history.push(pathname)
      }
      
      // Keep only last 20 paths
      if (history.length > 20) history.shift()
      
      sessionStorage.setItem('navHistory', JSON.stringify(history))
    } catch (e) {
      console.error('Error managing navigation history', e)
    }
  }, [pathname])

  return null
}
