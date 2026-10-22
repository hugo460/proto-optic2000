import Link from 'next/link';
import Image from 'next/image';
import { stores } from '@/data/stores';
import { houseLinks, legalLinks, universes } from '@/data/navigation';
import { Icon } from '@/components/ui/icon';
import { FooterVisitAction } from './footer-visit-action';
const siteLinks = [...houseLinks, { href: '/marques', label: 'Nos marques' }, { href: '/magasins', label: 'Nos magasins' }, { href: '/catalogue', label: 'Tout le catalogue' }, { href: '/contact', label: 'Préparer une demande' }, { href: '/rendez-vous', label: 'Préparer un rendez-vous' }];
// Compact footer: identity and the visit action on one line, then the three stores beside the site map, then the notes.
export function Footer() {
  return <footer className="site-footer"><div className="container">
    <div className="footer-top">
      <Link className="footer-brand" href="/" aria-label="Optic 2000 Tahiti — Accueil"><Image src="/media/655699e241-logo-optic-2000-quadri.webp" alt="Optic 2000" width={200} height={71} /><span>Tahiti</span></Link>
      <div className="footer-actions"><FooterVisitAction /><Link className="action action-text" href="/magasins">Nos trois adresses<Icon name="arrow" /></Link></div>
    </div>
    <div className="footer-main">
      <section className="footer-stores" aria-labelledby="footer-stores-title"><h2 id="footer-stores-title">Nos magasins</h2>
        <ul>{stores.map(store => <li key={store.slug}><Link className="footer-store-name" href={`/magasins/${store.slug}`}>{store.name}</Link><span>{store.address}</span><a href={`tel:${store.phone}`}><Icon name="phone" />{store.phoneLabel}</a></li>)}</ul>
      </section>
      <nav className="footer-links" aria-label="Plan du site">
        <div><h2>Nos univers</h2><ul>{universes.map(link => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul></div>
        <div><h2>Optic 2000 Tahiti</h2><ul>{siteLinks.map(link => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul></div>
        <div><h2>Informations</h2><ul>{legalLinks.map(link => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul></div>
      </nav>
    </div>
    <div className="footer-bottom"><span>Optic 2000 Tahiti</span><span>Prototype de présentation · Prix et informations à confirmer en magasin.</span></div>
  </div></footer>;
}
