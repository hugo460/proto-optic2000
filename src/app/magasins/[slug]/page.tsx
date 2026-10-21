import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getStore, stores } from '@/data/stores';
import { MediaImage } from '@/components/ui/media-image';
import { Icon } from '@/components/ui/icon';
import { ProductContext, readProductContext } from '@/components/stores/product-context';
export const dynamicParams = false;
export function generateStaticParams() { return stores.map(item => ({ slug: item.slug })); }
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const store = getStore((await params).slug); return { title: store ? `Le magasin ${store.name}` : 'Magasin introuvable' }; }
export default async function StorePage({ params, searchParams }: Props) {
  const store = getStore((await params).slug);
  if (!store) notFound();
  const context = readProductContext(await searchParams);
  return <div className="container store-page"><Link className="back-link" href={`/magasins${context.query ? `?${context.query}` : ''}`}><Icon name="back" />Tous les magasins</Link><div className="store-page-heading"><h1>Optic 2000<br />{store.name}</h1><p>{store.description}</p></div><ProductContext context={context} />
    <div className="store-detail-grid"><div><MediaImage className="store-detail-photo" media={store.image} alt={`L’espace d’accueil et les collections du magasin ${store.name}`} sizes="(max-width: 800px) 94vw, 55vw" priority /><p className="store-practical"><Icon name="pin" />{store.practical}</p></div><div className="store-information"><section><h2>Nous trouver</h2><address>{store.address}<br /><span>{store.postalAddress}</span></address><a className="action action-primary" href={store.mapUrl} target="_blank" rel="noopener noreferrer">Plan et itinéraire<Icon name="external" /><span className="sr-only"> — Google Maps, nouvel onglet</span></a></section><section><h2>Nous contacter</h2><a className="contact-line" href={`tel:${store.phone}`}><Icon name="phone" />+689 {store.phoneLabel}</a><a className="contact-line" href={`mailto:${store.email}`}><Icon name="mail" />{store.email}</a></section><section><h2>Les horaires</h2>{store.hours.length ? <dl className="store-schedule">{store.hours.map(row => <div key={row.days}><dt>{row.days}</dt><dd>{row.time}</dd></div>)}</dl> : <p className="hours-unconfirmed">{store.hoursSummary}</p>}<p className="hours-notice">{store.hoursNotice}</p></section></div></div>
    <section className="other-stores"><h2>Nos autres magasins</h2><div>{stores.filter(s => s.slug !== store.slug).map(s => <Link key={s.slug} href={`/magasins/${s.slug}${context.query ? `?${context.query}` : ''}`}>{s.name}<Icon name="arrow" /></Link>)}</div></section>
  </div>;
}
