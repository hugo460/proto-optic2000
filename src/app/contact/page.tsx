import type { Metadata } from 'next';
import Link from 'next/link';
import { products } from '@/data';
import { stores } from '@/data/stores';
import { productHref, readVisitContext, visitParams } from '@/lib/contact-context';
import { selectionLines } from '@/lib/lens-selection';
import { formatXpf } from '@/lib/money';
import { ContactForm, type SelectionSummary, type StoreInfo } from '@/components/contact/contact-form';
import { Icon } from '@/components/ui/icon';
export const metadata: Metadata = { title: 'Préparer une demande au magasin', description: 'Préparez une demande pour l’un des trois magasins Optic 2000 Tahiti. Démonstration : aucun message n’est envoyé.' };
export default async function ContactPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const context = readVisitContext(await searchParams, { products, stores });
  const { selection } = context;
  const summary: SelectionSummary | undefined = selection && {
    name: selection.product.name,
    href: productHref(selection),
    image: selection.variant?.image ?? selection.product.images[0],
    lines: selectionLines(selection),
    price: selection.variant || selection.product.minPrice === selection.product.maxPrice ? formatXpf(selection.variant?.price ?? selection.product.minPrice) : `À partir de ${formatXpf(selection.product.minPrice)}`,
  };
  const storeInfo: StoreInfo[] = stores.map(({ slug, name, city, address, postalAddress, phone, phoneLabel, email, mapUrl, hoursSummary, hoursNotice }) => ({ slug, name, city, address, postalAddress, phone, phoneLabel, email, mapUrl, hoursSummary, hoursNotice }));
  // Links back to a store keep the product and an explicit subject, never the store being left.
  const contextQuery = visitParams({ selection, subject: context.subjectFromProduct ? undefined : context.subject }, { store: false }).toString();
  const back = summary ? { href: summary.href, label: 'Retour à votre sélection' } : context.store ? { href: `/magasins/${context.store.slug}${contextQuery ? `?${contextQuery}` : ''}`, label: `Retour au magasin ${context.store.name}` } : { href: '/magasins', label: 'Nos magasins' };
  return <div className="container contact-page">
    <Link className="back-link" href={back.href}><Icon name="back" />{back.label}</Link>
    <div className="page-heading contact-heading"><h1>Préparer votre demande.</h1><p>Choisissez le magasin, précisez l’objet et laissez vos coordonnées : la demande est mise en forme ici, pour la démonstration. Pour choisir un jour de visite, <Link className="underlined" href="/rendez-vous">préparez plutôt un rendez-vous</Link>.</p></div>
    <p className="contact-simulation"><strong>Démonstration.</strong> Aucun message n’est envoyé et aucun rendez-vous n’est réservé. Pour joindre réellement un magasin, utilisez son téléphone ou son e-mail.</p>
    {context.rejected.length > 0 && <p className="notice">Une partie du lien n’a pas été reconnue : elle a été ignorée. Le formulaire reste utilisable.</p>}
    {context.storeFromSubject && context.subject === 'protheses' && <p className="notice">Les prothèses oculaires sont suivies uniquement au magasin de Mamao : il est choisi pour cette demande. Le rendez-vous se demande par téléphone.</p>}
    <ContactForm stores={storeInfo} summary={summary} initial={{ store: context.store?.slug ?? '', subject: context.subject ?? '' }} contextQuery={contextQuery} />
  </div>;
}
