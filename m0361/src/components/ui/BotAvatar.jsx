import React, { useMemo } from 'react'
import { createAvatar } from '@dicebear/core'
import { bottts } from '@dicebear/collection'

/**
 * Deterministic robot avatar (DiceBear "bottts" style).
 * Same `seed` (e.g. user id or email) always renders the same bot.
 */
export function BotAvatar({ seed = 'venturebridge', size = 32, style = {}, alt = 'User avatar' }) {
  const src = useMemo(() => {
    try {
      return createAvatar(bottts, {
        seed: String(seed || 'venturebridge'),
        size: 128,
        backgroundColor: ['transparent'],
      }).toDataUri()
    } catch {
      return ''
    }
  }, [seed])

  if (!src) return null
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      style={{ width: size, height: size, objectFit: 'contain', flex: 'none', ...style }}
    />
  )
}

export default BotAvatar
