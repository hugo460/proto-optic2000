import Link from 'next/link';
import { stores } from '@/data/stores';
import { houseLinks, legalLinks, universes } from '@/data/navigation';
import { Icon } from '@/components/ui/icon';
import { FooterVisitAction } from './footer-visit-action';
const siteLinks = [...houseLinks, { href: '/marques', label: 'Nos marques' }, { href: '/magasins', label: 'Nos magasins' }, { href: '/catalogue', label: 'Tout le catalogue' }, { href: '/contact', label: 'Préparer une demande' }, { href: '/rendez-vous', label: 'Préparer un rendez-vous' }];
export function Footer() {
  return <footer className="site-footer"><div className="container">
    <div className="footer-top"><h2>On se voit<br />en magasin ?</h2><div className="footer-actions"><FooterVisitAction /><Link className="action action-text" href="/magasins">Nos trois adresses<Icon name="arrow" /></Link></div></div>
    <div className="footer-stores">{stores.map(store => <div key={store.slug}><Link className="footer-store-name" href={`/magasins/${store.slug}`}>{store.name}<Icon name="arrow" /></Link><a href={`tel:${store.phone}`}>{store.phoneLabel}</a></div>)}</div>
    <nav className="footer-links" aria-label="Plan du site">
      <div><h2>Nos univers</h2><ul>{universes.map(link => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul></div>
      <div><h2>Optic 2000 Tahiti</h2><ul>{siteLinks.map(link => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul></div>
      <div><h2>Informations</h2><ul>{legalLinks.map(link => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul></div>
    </nav>
    <div className="footer-bottom"><span>Optic 2000 Tahiti</span><span>Prototype de présentation · Prix et informations à confirmer en magasin.</span></div>
  </div></footer>;
}
