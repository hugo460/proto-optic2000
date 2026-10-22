'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState, type FocusEvent, type MouseEvent } from 'react';
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
  const home = pathname === '/';
  const current = (href: string) => pathname === href || pathname.startsWith(`${href}/`) ? 'page' as const : undefined;
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [opened, setOpened] = useState(false);
  const appointmentOnClose = useRef(false);
  const close = () => dialog.current?.close();
  const focusAppointment = () => {
    const title = document.getElementById('rdv-step-title');
    title?.focus({ preventScroll: true });
    title?.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  const revisitAppointment = (event: MouseEvent<HTMLAnchorElement>, fromMenu = false) => {
    if (pathname !== '/rendez-vous' || location.search || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (fromMenu) appointmentOnClose.current = true;
    else focusAppointment();
  };
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
  // On the home page only, the bar lies over the hero's film; every other route keeps the plain black bar.
  return <header className={`site-header${home ? ' is-home' : ''}`}>
    <div className="header-inner">
      <Link className="brand-lockup" href="/" aria-label="Optic 2000 Tahiti — Accueil">
        <Image src={home ? "/media/brand/optic2000-white.svg" : "/media/655699e241-logo-optic-2000-quadri.webp"} alt="Optic 2000" width={home ? 160 : 200} height={home ? 33 : 71} preload />
        <span>Tahiti</span>
      </Link>
      <nav className="desktop-nav" aria-label="Navigation principale">
        <div className="universe-menu" ref={universeMenu} onBlur={onUniverseBlur}>
          <button ref={universeTrigger} type="button" className={`universe-trigger${universeActive ? ' is-current' : ''}`} aria-expanded={universesOpen} aria-controls="universe-panel" onClick={() => setUniversesOpen(!universesOpen)}>Nos univers<Icon name="chevron" /></button>
          {/* Compact paper panel under the bar: the six universes on two columns, the house pages in a narrower one. */}
          <div id="universe-panel" className="universe-panel" hidden={!universesOpen}>
            <div className="universe-panel-group"><h2 id="universe-panel-universes">Nos univers</h2><ul aria-labelledby="universe-panel-universes">{universes.map(link => <li key={link.href}><Link href={link.href} aria-current={current(link.href)} onClick={() => setUniversesOpen(false)}>{link.label}</Link></li>)}</ul></div>
            <div className="universe-panel-group"><h2 id="universe-panel-house">L’enseigne</h2><ul aria-labelledby="universe-panel-house">{houseLinks.map(link => <li key={link.href}><Link href={link.href} aria-current={current(link.href)} onClick={() => setUniversesOpen(false)}>{link.label}</Link></li>)}</ul></div>
          </div>
        </div>
        {/* « Les solaires » repeats an entry of the universes panel: it gives way only on the narrowest bar (801–960 px). */}
        {links.map(link => <Link key={link.href} href={link.href} aria-current={current(link.href)} className={link.href === '/solaires' ? 'nav-repeat' : undefined}>{link.label}</Link>)}
      </nav>
      <Link href="/rendez-vous" className="header-cta" aria-current={current('/rendez-vous')} onClick={revisitAppointment}><Icon name="calendar" /><span><span className="header-cta-long">Préparer un </span>RDV</span></Link>
      <button ref={trigger} className="menu-trigger" type="button" aria-expanded={opened} aria-controls="mobile-navigation" onClick={() => { dialog.current?.showModal(); setOpened(true); }}>Menu<Icon name="menu" /></button>
    </div>
    <dialog ref={dialog} id="mobile-navigation" className="mobile-navigation" aria-labelledby="mobile-navigation-title" onClose={() => { setOpened(false); if (appointmentOnClose.current) { appointmentOnClose.current = false; focusAppointment(); } else trigger.current?.focus(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div className="mobile-navigation-inner">
        <div className="mobile-menu-heading"><h2 id="mobile-navigation-title">Menu</h2><button type="button" className="icon-button" onClick={close} aria-label="Fermer le menu"><Icon name="close" /></button></div>
        <nav aria-label="Navigation mobile">
          <Link className="mobile-home" href="/" onClick={close} aria-current={pathname === '/' ? 'page' : undefined}>Accueil</Link>
          <Link className="mobile-cta" href="/rendez-vous" onClick={event => { revisitAppointment(event, true); close(); }} aria-current={current('/rendez-vous')}><Icon name="calendar" />Préparer un RDV<Icon name="arrow" /></Link>
          {mobileGroups.map(group => <div className="mobile-group" key={group.title}><h3>{group.title}</h3>{group.links.map(link => <Link key={link.href} href={link.href} onClick={close} aria-current={current(link.href)}>{link.label}</Link>)}</div>)}
        </nav>
        <p>Centre-ville, Mamao et Taravao : nos opticiens vous accueillent à Tahiti.</p>
      </div>
    </dialog>
  </header>;
}
