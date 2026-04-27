export interface UpdateItem {
  id: string
  title: string
  description: string
  icon: string
  category: 'feature' | 'fix' | 'update'
  status: 'just-released' | 'recently-updated' | 'coming-soon'
  date: Date
  version?: string
}

export const whatsNewData: UpdateItem[] = [
                                                          {
    id: 'update feature:-tap-on-family-postion-text-to-view-user\'s-...',
    title: 'Update Feature: Tap on Family Postion Text to View User\'s ...',
    description: 'We added some sparkle and magic to make things better!',
    icon: '⚡',
    category: 'update',
    status: 'recently-updated',
    date: new Date('2026-02-01T10:57:57.524Z'),
    version: '0.1.0'
  },
  {
    id: 'auto-updating-whatsnew-section-based-on-commits',
    title: 'Auto-updating WhatsNew section based on  commits',
    description: 'Add auto-updating WhatsNew section based on  commits',
    icon: '🚀',
    category: 'feature',
    status: 'just-released',
    date: new Date('2026-01-21T13:34:49.032Z'),
    version: '0.1.0'
  },
  {
    id: 'login-button-to-navigation-for-logged-out-users',
    title: 'Login button to navigation for logged out users',
    description: 'Improvements to the login experience for better security and convenience.',
    icon: '🚀',
    category: 'feature',
    status: 'just-released',
    date: new Date('2026-01-21T13:33:42.856Z'),
    version: '0.1.0'
  },
  {
    id: 'whats-new-dynamic',
    title: 'Dynamic What\'s New',
    description: 'The What\'s New section now automatically updates whenever new features, fixes, or improvements are added to the app.',
    icon: '🔄',
    category: 'feature',
    status: 'just-released',
    date: new Date('2025-01-18'),
    version: 'v4.6'
  },
  {
    id: 'modern-navigation',
    title: 'Modern Navigation',
    description: 'Our new floating pill navigation makes getting around easier than ever. Clean, intuitive, and always at your fingertips.',
    icon: '🧭',
    category: 'feature',
    status: 'just-released',
    date: new Date('2025-01-18'),
    version: 'v4.5'
  },
  {
    id: 'my-mirror',
    title: 'My Mirror',
    description: 'See yourself through family\'s eyes. The new My Mirror tab shows exactly how others see your profile.',
    icon: '🪞',
    category: 'feature',
    status: 'just-released',
    date: new Date('2025-01-18'),
    version: 'v4.5'
  },
  {
    id: 'enhanced-profiles',
    title: 'Enhanced Profiles',
    description: 'Better position display with interactive tooltips. Cleaner, more intuitive family member information.',
    icon: '👤',
    category: 'update',
    status: 'recently-updated',
    date: new Date('2025-01-18'),
    version: 'v4.5'
  }
]

// Helper functions for managing updates
export function addUpdate(update: Omit<UpdateItem, 'id'>): UpdateItem {
  const newUpdate: UpdateItem = {
    ...update,
    id: update.title.toLowerCase().replace(/\s+/g, '-')
  }
  whatsNewData.unshift(newUpdate)
  return newUpdate
}

export function getRecentUpdates(limit: number = 3): UpdateItem[] {
  return whatsNewData
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit)
}

export function getUpdatesByCategory(category: UpdateItem['category']): UpdateItem[] {
  return whatsNewData
    .filter(update => update.category === category)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}

export function getUpdatesByStatus(status: UpdateItem['status']): UpdateItem[] {
  return whatsNewData
    .filter(update => update.status === status)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}
