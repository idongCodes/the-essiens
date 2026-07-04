'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// Utility to get a nice name for paths
function getPathName(path: string) {
  if (path === '/') return 'Home'
  if (path === '/common-room') return 'Common Room'
  if (path === '/family') return 'Directory'
  if (path === '/family-album') return 'Family Album'
  if (path === '/my-room') return 'My Room'
  if (path === '/register') return 'Join Family'
  if (path === '/login') return 'Login'
  if (path.endsWith('s-room')) {
    const name = path.split('/')[1].replace('s-room', '')
    return name.charAt(0).toUpperCase() + name.slice(1) + "'s Room"
  }
  return 'Previous Page'
}

export default function DynamicBackButton({ 
  fallbackHref = '/common-room', 
  fallbackText = 'Common Room',
  className = "text-sm font-bold text-slate-400 hover:text-brand-sky transition-colors flex items-center gap-1",
  icon = <>&larr;</>
}: { 
  fallbackHref?: string, 
  fallbackText?: string,
  className?: string,
  icon?: React.ReactNode
}) {
  const router = useRouter()
  const [backText, setBackText] = useState(fallbackText)
  const [canGoBack, setCanGoBack] = useState(false)

  useEffect(() => {
    try {
      const history = JSON.parse(sessionStorage.getItem('navHistory') || '[]')
      // If we have history, history[length - 1] is the current page, history[length - 2] is the previous page
      if (history.length >= 2) {
        const prevPath = history[history.length - 2]
        setBackText(getPathName(prevPath))
        setCanGoBack(true)
      }
    } catch (e) {
      console.error('Error reading navigation history', e)
    }
  }, [])

  return (
    <button 
      onClick={() => canGoBack ? router.back() : router.push(fallbackHref)}
      className={className}
    >
      {icon} Back to {backText}
    </button>
  )
}
