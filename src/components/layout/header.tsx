'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState, type FocusEvent } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/icon';
import { houseLinks, universes } from '@/data/navigation';
const links = [{ href: '/solaires', label: 'Les solaires' }, { href: '/marques', label: 'Nos marques' }, { href: '/magasins', label: 'Nos magasins' }, { href: '/contact', label: 'Contact' }];
const panelLinks = [...universes, ...houseLinks];
const mobileGroups = [
  { title: 'Nos univers', links: universes },
  { title: 'L’enseigne', links: houseLinks },
  { title: 'Marques, magasins et contact', links: links.filter(link => link.href !== '/solaires') },
];
export function Header() {
  const pathname = usePathname();
  const current = (href: string) => pathname === href || pathname.startsWith(`${href}/`) ? 'page' as const : undefined;
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [opened, setOpened] = useState(false);
  const close = () => dialog.current?.close();
  // Desktop universes panel: a disclosure, not a modal. Escape returns focus to its button;
  // a click outside, leaving it with Tab or following a link closes it.
  const universeMenu = useRef<HTMLDivElement>(null);
  const universeTrigger = useRef<HTMLButtonElement>(null);
  // Open state is tied to the page it was opened on, so any navigation (links, Back) closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const universesOpen = openOn === pathname;
  const setUniversesOpen = (open: boolean) => setOpenOn(open ? pathname : null);
  useEffect(() => {
    if (!universesOpen) return;
    const onPointer = (event: PointerEvent) => { if (!universeMenu.current?.contains(event.target as Node)) setOpenOn(null); };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpenOn(null); universeTrigger.current?.focus(); } };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey); };
  }, [universesOpen]);
  const onUniverseBlur = (event: FocusEvent<HTMLDivElement>) => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) setUniversesOpen(false); };
  const universeActive = panelLinks.some(link => link.href !== '/solaires' && current(link.href));
  return <header className="site-header">
    <div className="header-inner">
      <Link className="brand-lockup" href="/" aria-label="Optic 2000 Tahiti — Accueil">
        <Image src="/media/655699e241-logo-optic-2000-quadri.webp" alt="Optic 2000" width={200} height={71} preload />
        <span>Tahiti</span>
      </Link>
      <nav className="desktop-nav" aria-label="Navigation principale">
        <div className="universe-menu" ref={universeMenu} onBlur={onUniverseBlur}>
          <button ref={universeTrigger} type="button" className={`universe-trigger${universeActive ? ' is-current' : ''}`} aria-expanded={universesOpen} aria-controls="universe-panel" onClick={() => setUniversesOpen(!universesOpen)}>Nos univers<Icon name="chevron" /></button>
          <div id="universe-panel" className="universe-panel" hidden={!universesOpen}>
            <div className="universe-panel-inner">
              <div><h2>Nos univers</h2><ul>{universes.map(link => <li key={link.href}><Link href={link.href} aria-current={current(link.href)} onClick={() => setUniversesOpen(false)}><strong>{link.label}</strong><span>{link.summary}</span></Link></li>)}</ul></div>
              <div><h2>L’enseigne</h2><ul>{houseLinks.map(link => <li key={link.href}><Link href={link.href} aria-current={current(link.href)} onClick={() => setUniversesOpen(false)}><strong>{link.label}</strong><span>{link.summary}</span></Link></li>)}</ul></div>
            </div>
          </div>
        </div>
        {links.map(link => <Link key={link.href} href={link.href} aria-current={current(link.href)}>{link.label}</Link>)}
      </nav>
      <Link href="/magasins" className="header-store"><Icon name="pin" /><span>Trouver mon magasin</span></Link>
      <button ref={trigger} className="menu-trigger" type="button" aria-expanded={opened} aria-controls="mobile-navigation" onClick={() => { dialog.current?.showModal(); setOpened(true); }}>Menu<Icon name="menu" /></button>
    </div>
    <dialog ref={dialog} id="mobile-navigation" className="mobile-navigation" onClose={() => { setOpened(false); trigger.current?.focus(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div className="mobile-navigation-inner">
        <div className="mobile-menu-heading"><span>Optic 2000 Tahiti</span><button type="button" className="icon-button" onClick={close} aria-label="Fermer le menu"><Icon name="close" /></button></div>
        <nav aria-label="Navigation mobile">
          <Link className="mobile-home" href="/" onClick={close} aria-current={pathname === '/' ? 'page' : undefined}>Accueil<Icon name="arrow" /></Link>
          {mobileGroups.map(group => <div className="mobile-group" key={group.title}><h2>{group.title}</h2>{group.links.map(link => <Link key={link.href} href={link.href} onClick={close} aria-current={current(link.href)}>{link.label}<Icon name="arrow" /></Link>)}</div>)}
        </nav>
        <p>Centre-ville, Mamao et Taravao.<br />Nos opticiens vous accueillent à Tahiti.</p>
      </div>
    </dialog>
  </header>;
}
