'use client'

import { useEffect, useRef } from 'react'
import { logout } from '@/app/actions' // Ensure this path is correct for your project!

const TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000 // 7 Days

export default function AutoLogout() {
  // Use a ref to store the timestamp without triggering re-renders
  const lastActivity = useRef(Date.now())

  useEffect(() => {
    // 1. The Checker: Runs every minute to check strictly against the clock
    const intervalId = setInterval(() => {
      checkInactivity()
    }, 10000) // Check every 10 seconds

    const checkInactivity = () => {
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivity.current

      if (timeSinceLastActivity > TIMEOUT_MS) {
        performLogout()
      }
    }

    const performLogout = async () => {
      console.log("⏳ Session expired (Timestamp check). Logging out...")
      try {
        await logout()
      } catch (e) {
        console.error("Logout failed", e)
      } finally {
        window.location.href = '/' // Force reload to home/login
      }
    }

    const updateActivity = () => {
      // Before resetting, check if we SHOULD have logged out already
      // This catches the "Computer Waking Up" edge case
      const now = Date.now()
      if (now - lastActivity.current > TIMEOUT_MS) {
        performLogout()
      } else {
        lastActivity.current = now
      }
    }

    // 2. Event Listeners
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach(event => window.addEventListener(event, updateActivity))

    // 3. Tab/Window Close Handler
    const handleTabClose = async (event: BeforeUnloadEvent | PageTransitionEvent) => {
      // Only logout if user is actually logged in and there's meaningful activity
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivity.current
      
      // Don't logout if user was inactive for more than the timeout (they're already "logged out")
      if (timeSinceLastActivity < TIMEOUT_MS) {
        try {
          // For beforeunload, we can't make async calls reliably, but we can try
          if ('event' in event && event.type === 'beforeunload') {
            // Use navigator.sendBeacon for reliable logout during page unload
            const data = new FormData()
            data.append('action', 'logout')
            navigator.sendBeacon('/api/logout', data)
          } else {
            // For pagehide, we can try async logout
            await logout()
          }
        } catch (e) {
          console.error("Tab close logout failed", e)
        }
      }
    }

    // Add tab close listeners
    window.addEventListener('beforeunload', handleTabClose)
    window.addEventListener('pagehide', handleTabClose)

    // Cleanup
    return () => {
      clearInterval(intervalId)
      events.forEach(event => window.removeEventListener(event, updateActivity))
      window.removeEventListener('beforeunload', handleTabClose)
      window.removeEventListener('pagehide', handleTabClose)
    }
  }, [])

  return null
}