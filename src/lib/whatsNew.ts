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
    id: 'admin-testimonial-management',
    title: 'Easy Content Management',
    description: 'Family admins can now easily manage testimonials to keep our family space positive and appropriate for everyone.',
    icon: '🛡️',
    category: 'feature',
    status: 'just-released',
    date: new Date('2025-01-20'),
    version: 'v5.6'
  },
  {
    id: 'vercel-prisma-postgres',
    title: 'Faster & More Reliable',
    description: 'Our family app is now faster and more reliable than ever, with better performance for sharing memories and staying connected.',
    icon: '🗄️',
    category: 'feature',
    status: 'just-released',
    date: new Date('2025-01-20'),
    version: 'v5.6'
  },
  {
    id: 'prisma-connection-fix',
    title: 'Smoother Experience',
    description: 'Fixed connection issues so you can enjoy a smoother, more stable experience when using our family features.',
    icon: '🔧',
    category: 'fix',
    status: 'just-released',
    date: new Date('2025-01-20'),
    version: 'v5.6'
  },
  {
    id: 'enhanced-security',
    title: 'Enhanced Privacy & Safety',
    description: 'Improved security measures to keep your family information safe and ensure only authorized family members can manage content.',
    icon: '🔒',
    category: 'update',
    status: 'just-released',
    date: new Date('2025-01-20'),
    version: 'v5.6'
  },
  {
    id: 'whats-new-dynamic',
    title: 'Always Up-to-Date',
    description: 'Our updates section now automatically shows the newest features and improvements, so you always know what\'s new.',
    icon: '🔄',
    category: 'feature',
    status: 'recently-updated',
    date: new Date('2025-01-18'),
    version: 'v4.6'
  },
  {
    id: 'modern-navigation',
    title: 'Easy Navigation',
    description: 'Getting around the app is now easier than ever with our new simple and intuitive navigation menu.',
    icon: '🧭',
    category: 'feature',
    status: 'recently-updated',
    date: new Date('2025-01-18'),
    version: 'v4.5'
  },
  {
    id: 'my-mirror',
    title: 'See How Others See You',
    description: 'Curious how your family sees your profile? The new My Mirror feature shows you exactly how others view your information.',
    icon: '🪞',
    category: 'feature',
    status: 'recently-updated',
    date: new Date('2025-01-18'),
    version: 'v4.5'
  },
  {
    id: 'enhanced-profiles',
    title: 'Better Family Profiles',
    description: 'Family member profiles now show information more clearly with helpful details and an improved layout.',
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
