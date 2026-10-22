'use client';
import Image from 'next/image';
import { useState } from 'react';
import type { Media } from '@/data/types';
export function MediaImage({ media, alt, className = '', sizes, priority = false, loading }: { media: Media; alt: string; className?: string; sizes: string; priority?: boolean; loading?: 'eager' | 'lazy' }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (failedSrc === media.src) return <div role={alt ? "img" : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true} className={`image-fallback ${className}`}>{alt && <><span>Photo indisponible</span><small>Retrouvez ce modèle en magasin.</small></>}</div>;
  return <Image className={className} src={media.src} alt={alt} width={media.width} height={media.height} sizes={sizes} preload={priority} loading={loading} onError={() => setFailedSrc(media.src)} />;
}
