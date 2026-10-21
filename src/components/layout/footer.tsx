import Link from 'next/link';
import { stores } from '@/data/stores';
import { Icon } from '@/components/ui/icon';
export function Footer() {
  return <footer className="site-footer"><div className="container">
    <div className="footer-top"><h2>On se voit<br />en magasin ?</h2><Link className="action action-primary" href="/magasins">Nos trois adresses<Icon name="arrow" /></Link></div>
    <div className="footer-stores">{stores.map(store => <div key={store.slug}><Link className="footer-store-name" href={`/magasins/${store.slug}`}>{store.name}<Icon name="arrow" /></Link><a href={`tel:${store.phone}`}>{store.phoneLabel}</a></div>)}</div>
    <div className="footer-bottom"><span>Optic 2000 Tahiti</span><Link href="/catalogue">Tout le catalogue</Link><span>Prototype de présentation · Prix et informations à confirmer en magasin.</span></div>
  </div></footer>;
}
