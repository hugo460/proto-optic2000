'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Media } from '@/data/types';
import { MediaImage } from '@/components/ui/media-image';
import { ActionLink } from '@/components/ui/action-link';
export interface MarqueeBrand { id: string; name: string; logo: Media }
// Optical balance: every mark gets about the same visual weight rather than the same box. The area follows the logo's
// own proportions (wide marks get longer, square ones taller), then shrinks for dense marks (solid badges, bold
// monograms) and grows for fine linework. Ink coverage was measured once on the shipped files; unknown logos use 0.25.
const ink: Record<string, number> = { 'maui-jim': .19, 'ray-ban': .88, oakley: .29, gucci: .18, persol: .26, versace: .16, demetz: .29, vuarnet: .47, 'michael-kors': .48, julbo: .26, 'vogue-eyewear': .14, freshlook: .22, celestron: .75 };
function opticalSize({ id, logo }: MarqueeBrand): CSSProperties {
  const ratio = logo.width / logo.height;
  const area = 5000 * (.25 / (ink[id] ?? .25)) ** .45;
  const height = Math.min(Math.sqrt(area / ratio), 54, 144 / ratio);
  return { '--logo-w': Math.round(height * ratio), '--logo-h': Math.round(height) } as CSSProperties;
}
// A slow loop of real logos. The links are the original list; the second copy only closes the loop: hidden from
// assistive technologies and outside the tab order, without IDs. Its visible logos still work with a pointer. No pause
// control: hover, keyboard focus, an off-screen strip or a hidden tab stop the motion by themselves; focus also brings
// the original list back to a still, scrollable row, and reduced motion shows that row from the start (CSS).
export function BrandMarquee({ brands }: { brands: MarqueeBrand[] }) {
  const root = useRef<HTMLElement>(null);
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
  const logo = (brand: MarqueeBrand, alt: string) => <span className="marquee-logo" style={opticalSize(brand)}><MediaImage media={brand.logo} alt={alt} sizes="150px" loading="eager" /></span>;
  return <section ref={root} className="brand-marquee container" aria-labelledby="brand-marquee-title" data-away={away || undefined} style={{ '--marquee-count': brands.length } as CSSProperties}>
    <h2 id="brand-marquee-title" className="sr-only">Quelques-unes de nos marques</h2>
    {/* Focus stops the loop (CSS); once the row is still, the focused logo is scrolled fully into view. */}
    <div className="marquee-viewport" onFocus={event => { if (event.target.matches(':focus-visible')) event.target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' }); }}>
      <div className="marquee-track">
        <ul className="marquee-group">{brands.map(brand => <li key={brand.id}><Link href={`/marques/${brand.id}`} aria-label={`Découvrir ${brand.name}`}>{logo(brand, brand.name)}</Link></li>)}</ul>
        <div className="marquee-group marquee-clone" aria-hidden="true">{brands.map(brand => <Link key={brand.id} href={`/marques/${brand.id}`} tabIndex={-1} aria-label={`Découvrir ${brand.name}`}>{logo(brand, '')}</Link>)}</div>
      </div>
    </div>
    <ActionLink href="/marques" variant="text" className="marquee-directory">Toutes les marques</ActionLink>
  </section>;
}
