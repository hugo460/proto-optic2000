import Link from 'next/link';
import type { Store } from '@/data/stores';
import { MediaImage } from '@/components/ui/media-image';
import { Icon } from '@/components/ui/icon';
export function StoreCard({ store, productQuery = '' }: { store: Store; productQuery?: string }) {
  const href = `/magasins/${store.slug}${productQuery ? `?${productQuery}` : ''}`;
  return <article className="store-card"><Link className="store-card-image" href={href} aria-label={`Découvrir le magasin ${store.name}`}><MediaImage media={store.image} alt={`Intérieur du magasin Optic 2000 ${store.name}`} sizes="(max-width: 700px) 92vw, 30vw" /></Link><div className="store-card-body"><h3><Link href={href}>{store.name}<Icon name="arrow" /></Link></h3><p className="store-city">{store.city}</p><p className="store-address">{store.address}</p><p className="store-hours">{store.hoursSummary}</p><div className="store-card-actions"><Link className="underlined" href={href}>Les infos pratiques</Link><a href={`tel:${store.phone}`}><Icon name="phone" />{store.phoneLabel}</a></div></div></article>;
}
