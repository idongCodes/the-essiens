'use server'

import { cookies } from 'next/headers'
import { generateSignature } from '@/lib/cloudinary'

export async function getUploadSignature(folder: string, transformation?: string) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('session_id')?.value

  if (!userId) {
    throw new Error('Unauthorized')
  }

  return generateSignature(folder, transformation)
}
