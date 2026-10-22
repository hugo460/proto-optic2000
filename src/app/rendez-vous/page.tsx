import type { Metadata } from 'next';
import Link from 'next/link';
import { products } from '@/data';
import { stores } from '@/data/stores';
import { readAppointmentContext, tahitiToday } from '@/lib/appointment';
import { productHref } from '@/lib/contact-context';
import { selectionLines } from '@/lib/lens-selection';
import { AppointmentFlow, type AppointmentProduct } from '@/components/appointment/appointment-flow';
import type { StoreInfo } from '@/components/contact/contact-form';
import { Icon } from '@/components/ui/icon';
export const metadata: Metadata = { title: 'Préparer un rendez-vous', description: 'Préparez une visite dans l’un des trois magasins Optic 2000 Tahiti. Démonstration : créneaux fictifs, rien n’est réservé ni envoyé.' };
export default async function AppointmentPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const context = readAppointmentContext(await searchParams, { products, stores });
  // The client island receives only what it displays: store details, an optional product summary, today's date in Tahiti.
  const storeInfo: StoreInfo[] = stores.map(({ slug, name, city, address, postalAddress, phone, phoneLabel, email, mapUrl, hoursSummary, hoursNotice }) => ({ slug, name, city, address, postalAddress, phone, phoneLabel, email, mapUrl, hoursSummary, hoursNotice }));
  const { selection } = context;
  const product: AppointmentProduct | undefined = selection && { name: selection.product.name, href: productHref(selection), details: selectionLines(selection).map(line => `${line.label} : ${line.value}`).join(' · ') };
  const origin = context.store ? stores.find(s => s.slug === context.store)! : undefined;
  const back = product ? { href: product.href, label: 'Retour à votre sélection' } : origin ? { href: `/magasins/${origin.slug}`, label: `Retour au magasin ${origin.name}` } : { href: '/magasins', label: 'Nos magasins' };
  const notices = [
    context.ignored && 'Une partie du lien n’a pas été reconnue : elle a été ignorée, sans rien choisir à votre place.',
    context.skippedStep && 'Le lien visait une étape suivante : le rendez-vous commence par le choix du magasin et du motif.',
    context.storeCorrected && 'Les prothèses oculaires sont suivies uniquement au magasin de Mamao : il est choisi pour cette visite. Le vrai rendez-vous se demande par téléphone.',
  ].filter((notice): notice is string => !!notice);
  return <div className="container contact-page rdv-page">
    <Link className="back-link" href={back.href}><Icon name="back" />{back.label}</Link>
    <div className="page-heading contact-heading"><h1>Préparer un RDV.</h1><p>Préparez votre visite en magasin. Pour une question, <Link className="underlined" href="/contact">préparez plutôt une demande</Link>.</p></div>
    <p className="contact-simulation"><strong>Démonstration.</strong> Les créneaux sont fictifs : rien n’est réservé, aucun e-mail n’est envoyé.</p>
    <AppointmentFlow key={[context.store, context.reason, product?.href, context.ignored, context.skippedStep].join('|')} stores={storeInfo} initial={{ store: context.store ?? '', reason: context.reason ?? '' }} today={tahitiToday(new Date())} notices={notices} product={product} stepNotice={context.skippedStep} />
  </div>;
}
