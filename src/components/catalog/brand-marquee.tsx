'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Media } from '@/data/types';
import { MediaImage } from '@/components/ui/media-image';
import { ActionLink } from '@/components/ui/action-link';
import { Icon } from '@/components/ui/icon';
export interface MarqueeBrand { id: string; name: string; logo: Media }
// A slow loop of real logos. The links are the original list; the second copy only closes the loop: hidden from
// assistive technologies and outside the tab order, without IDs. Its visible logos still work with a pointer. Hover,
// keyboard focus, the pause button, an off-screen strip or
// a hidden tab stop the motion; focus also brings the original list back to a still, scrollable row (CSS).
export function BrandMarquee({ brands }: { brands: MarqueeBrand[] }) {
  const root = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  const [away, setAway] = useState(false);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let visible = true;
    let shown = document.visibilityState === 'visible';
    const sync = () => setAway(!visible || !shown);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(element);
    const onVisibility = () => { shown = document.visibilityState === 'visible'; sync(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);
  const logo = (brand: MarqueeBrand, alt: string) => <MediaImage media={brand.logo} alt={alt} sizes="132px" loading="eager" />;
  return <section ref={root} className="brand-marquee container" aria-labelledby="brand-marquee-title" data-paused={paused || undefined} data-away={away || undefined} style={{ '--marquee-count': brands.length } as CSSProperties}>
    <h2 id="brand-marquee-title" className="sr-only">Quelques-unes de nos marques</h2>
    {/* Focus stops the loop (CSS); once the row is still, the focused logo is scrolled fully into view. */}
    <div className="marquee-viewport" onFocus={event => { if (event.target.matches(':focus-visible')) event.target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' }); }}>
      <div className="marquee-track">
        <ul className="marquee-group">{brands.map(brand => <li key={brand.id}><Link href={`/marques/${brand.id}`} aria-label={`Découvrir ${brand.name}`}>{logo(brand, brand.name)}</Link></li>)}</ul>
        <div className="marquee-group marquee-clone" aria-hidden="true">{brands.map(brand => <Link key={brand.id} href={`/marques/${brand.id}`} tabIndex={-1} aria-label={`Découvrir ${brand.name}`}>{logo(brand, '')}</Link>)}</div>
      </div>
    </div>
    <div className="marquee-controls">
      <button type="button" className="marquee-toggle" onClick={() => setPaused(!paused)}><Icon name={paused ? 'play' : 'pause'} />{paused ? 'Reprendre' : 'Pause'}<span className="sr-only">{paused ? ' le défilement des marques' : ' du défilement des marques'}</span></button>
      <ActionLink href="/marques" variant="text">Toutes les marques</ActionLink>
    </div>
  </section>;
}
