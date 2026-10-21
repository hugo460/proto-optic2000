import type { Metadata } from 'next';
import Link from 'next/link';
import { brands } from '@/data';
import { normalizeText } from '@/lib/catalogue';
import { MediaImage } from '@/components/ui/media-image';
import { Icon } from '@/components/ui/icon';
export const metadata: Metadata = { title: 'Nos marques' };
export default async function BrandsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const q = typeof query.q === 'string' ? query.q.slice(0, 100) : '';
  const category = typeof query.univers === 'string' && ['Vue', 'Soleil', 'Lentilles', 'Observation'].includes(query.univers) ? query.univers : '';
  const result = brands.filter(b => normalizeText(b.name).includes(normalizeText(q)) && (!category || b.universes.some(u => u === category))).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  return <div className="container brands-page"><div className="page-heading"><h1>Des marques.<br />Du caractère.</h1><p>Des maisons de lunettes aux spécialistes des lentilles et de l’observation : découvrez les marques et gammes présentées par Optic 2000 Tahiti.</p></div>
    <form method="get" action="/marques" className="brands-search"><label className="search-input"><Icon name="search" /><span className="sr-only">Rechercher une marque</span><input type="search" name="q" placeholder="Quelle marque recherchez-vous ?" defaultValue={q} maxLength={100} /></label><label><span className="sr-only">Filtrer par univers</span><select name="univers" defaultValue={category}><option value="">Tous les univers</option>{['Vue', 'Soleil', 'Lentilles', 'Observation'].map(c => <option key={c}>{c}</option>)}</select></label><button className="action action-dark" type="submit">Rechercher<Icon name="arrow" /></button></form>
    <div className="results-toolbar"><p><strong>{result.length}</strong> marques et gammes</p>{(q || category) && <Link href="/marques" className="underlined">Tout effacer</Link>}</div>
    {result.length ? <div className="brand-grid">{result.map(brand => <Link className="brand-card" href={`/marques/${brand.id}`} key={brand.id}><div className={`brand-card-logo${brand.darkLogo ? ' dark-logo' : ''}`}>{brand.logo ? <MediaImage media={brand.logo} alt="" sizes="(max-width: 700px) 38vw, 20vw" /> : <span className="text-brand">{brand.name}</span>}</div><h2>{brand.name}<Icon name="arrow" /></h2><p>{brand.universes.join(' · ')}</p><span className="brand-destination">{brand.productIds.length ? 'Voir les références du catalogue' : 'À découvrir en magasin'}</span></Link>)}</div> : <div className="empty-state"><h2>Aucune marque ne correspond.</h2><p>Essayez un autre nom ou choisissez tous les univers.</p><Link href="/marques" className="action action-primary">Revoir toutes les marques<Icon name="arrow" /></Link></div>}
    <p className="catalogue-note">Certaines identités désignent des gammes et d’autres des laboratoires. Chaque présentation précise les informations connues.</p>
  </div>;
}
