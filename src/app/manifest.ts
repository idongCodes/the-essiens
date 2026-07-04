import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'The Essiens',
    short_name: 'The Essiens',
    description: 'A private, safe space for our family to share life\'s precious moments, photos, and updates.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#87CEEB',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
