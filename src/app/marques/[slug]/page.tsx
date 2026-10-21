import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBrand, brands, products } from '@/data';
import { stores } from '@/data/stores';
import { MediaImage } from '@/components/ui/media-image';
import { ActionLink } from '@/components/ui/action-link';
import { Icon } from '@/components/ui/icon';
import { ProductCard } from '@/components/catalog/product-card';
import { StoreCard } from '@/components/stores/store-card';
export const dynamicParams = false;
export function generateStaticParams() { return brands.map(item => ({ slug: item.id })); }
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const b = getBrand((await params).slug); return { title: b?.name ?? 'Marque introuvable' }; }
export default async function BrandPage({ params }: Props) {
  const brand = getBrand((await params).slug);
  if (!brand) notFound();
  const collection = products.filter(p => brand.productIds.includes(p.id));
  const catalogueUrl = collection.some(p => p.kind === 'solar') ? `/solaires?marque=${brand.id}` : `/catalogue?marque=${brand.id}`;
  return <div className="container brand-page"><Link className="back-link" href="/marques"><Icon name="back" />Toutes les marques</Link><div className="brand-introduction"><div><h1>{brand.name}</h1><p>{brand.universes.join(' · ')}</p><p>{collection.length ? `Découvrez les ${collection.length} références du catalogue, puis échangez avec nos opticiens pour choisir votre modèle.` : 'Découvrez cette marque avec nos opticiens. En magasin, renseignez-vous sur les collections et les références disponibles.'}</p>{brand.relationship && <p className="brand-relationship">{brand.relationship}</p>}<ActionLink href={collection.length ? catalogueUrl : '/magasins'}>{collection.length ? 'Explorer la collection' : 'Trouver mon magasin'}</ActionLink></div><div className={`brand-hero-logo${brand.darkLogo ? ' dark-logo' : ''}`}>{brand.logo ? <MediaImage media={brand.logo} alt={`Logo ${brand.name}`} sizes="(max-width: 700px) 60vw, 28vw" priority /> : <span className="text-brand">{brand.name}</span>}</div></div>
    {collection.length > 0 && <section className="section"><div className="section-heading"><h2>À découvrir.</h2><ActionLink href={catalogueUrl} variant="text">Tous les modèles</ActionLink></div><div className="product-grid">{collection.slice(0, 4).map(p => <ProductCard key={p.id} product={p} returnPath={catalogueUrl} />)}</div></section>}
    <section className="section brand-stores"><div className="section-heading"><div><h2>{brand.universes.some(u => u === 'Vue' || u === 'Soleil') ? 'Parlons de votre prochaine monture.' : 'Rencontrons-nous en magasin.'}</h2><p>{collection.length ? 'Un conseil, une question sur une référence ? Choisissez votre magasin.' : 'L’assortiment se découvre directement avec nos équipes. Contactez votre magasin avant de vous déplacer.'}</p></div></div><div className="store-grid">{stores.map(store => <StoreCard key={store.slug} store={store} />)}</div></section>
  </div>;
}
