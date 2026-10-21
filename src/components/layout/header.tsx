'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/icon';
const links = [{ href: '/solaires', label: 'Les solaires' }, { href: '/marques', label: 'Nos marques' }, { href: '/magasins', label: 'Nos magasins' }];
export function Header() {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [opened, setOpened] = useState(false);
  const close = () => dialog.current?.close();
  return <header className="site-header">
    <div className="header-inner">
      <Link className="brand-lockup" href="/" aria-label="Optic 2000 Tahiti — Accueil">
        <Image src="/media/655699e241-logo-optic-2000-quadri.webp" alt="Optic 2000" width={200} height={71} preload />
        <span>Tahiti</span>
      </Link>
      <nav className="desktop-nav" aria-label="Navigation principale">{links.map(link => <Link key={link.href} href={link.href} aria-current={pathname.startsWith(link.href) ? 'page' : undefined}>{link.label}</Link>)}</nav>
      <Link href="/magasins" className="header-store"><Icon name="pin" /><span>Trouver mon magasin</span></Link>
      <button ref={trigger} className="menu-trigger" type="button" aria-expanded={opened} aria-controls="mobile-navigation" onClick={() => { dialog.current?.showModal(); setOpened(true); }}>Menu<Icon name="menu" /></button>
    </div>
    <dialog ref={dialog} id="mobile-navigation" className="mobile-navigation" onClose={() => { setOpened(false); trigger.current?.focus(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div className="mobile-navigation-inner">
        <div className="mobile-menu-heading"><span>Optic 2000 Tahiti</span><button type="button" className="icon-button" onClick={close} aria-label="Fermer le menu"><Icon name="close" /></button></div>
        <nav aria-label="Navigation mobile"><Link href="/" onClick={close}>Accueil<Icon name="arrow" /></Link>{links.map(link => <Link key={link.href} href={link.href} onClick={close} aria-current={pathname.startsWith(link.href) ? 'page' : undefined}>{link.label}<Icon name="arrow" /></Link>)}</nav>
        <p>Centre-ville, Mamao et Taravao.<br />Nos opticiens vous accueillent à Tahiti.</p>
      </div>
    </dialog>
  </header>;
}
