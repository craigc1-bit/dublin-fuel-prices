import { useState, useEffect } from 'react'
import { getSignedPhotoUrl } from './api/reports'

/**
 * Returns a URL suitable for displaying the report photo in an <img>.
 * For Supabase storage photos we use a signed URL so the image loads
 * even when the public URL is blocked (CORS/referrer).
 */
export function usePhotoDisplayUrl(photoUrl: string | null | undefined): string | null {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!photoUrl || photoUrl === 'demo' || !photoUrl.startsWith('http')) {
      setDisplayUrl(null)
      return
    }
    let cancelled = false
    getSignedPhotoUrl(photoUrl).then((url) => {
      if (!cancelled && url) setDisplayUrl(url)
    })
    return () => { cancelled = true }
  }, [photoUrl])

  return displayUrl
}
