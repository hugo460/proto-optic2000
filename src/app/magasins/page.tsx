import type { Metadata } from 'next';
import { stores } from '@/data/stores';
import { StoreCard } from '@/components/stores/store-card';
import { ProductContext, readProductContext } from '@/components/stores/product-context';
export const metadata: Metadata = { title: 'Nos magasins à Tahiti' };
export default async function StoresPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const context = readProductContext(await searchParams);
  return <div className="container stores-page"><div className="page-heading"><h1>On est tout près.</h1><p>À Centre-ville, Mamao et Taravao, nos opticiens prennent le temps de vous accompagner. Choisissez votre magasin.</p></div><ProductContext context={context} /><div className="store-grid">{stores.map(store => <StoreCard key={store.slug} store={store} productQuery={context.query} />)}</div><p className="catalogue-note">Avant votre visite, contactez le magasin pour confirmer les horaires et la disponibilité d’une référence.</p></div>;
}
