import Link from 'next/link';
import { products } from '@/data';
import { getStore, stores, type Store } from '@/data/stores';
import { productHref, prosthesisStore, readVisitContext, visitParams, withQuery } from '@/lib/contact-context';
import { selectionLines, type Query } from '@/lib/lens-selection';
import { formatXpf } from '@/lib/money';
import { MediaImage } from '@/components/ui/media-image';
export function readProductContext(query: Query) {
  const context = readVisitContext(query, { products, stores });
  // Store pages relay the product and an explicit subject; a subject deduced from the product stays implicit.
  const relayed = { selection: context.selection, subject: context.subjectFromProduct ? undefined : context.subject };
  return { ...context, relayed, query: visitParams(relayed, { store: false }).toString() };
}
export type ProductContextData = ReturnType<typeof readProductContext>;
export function contactHref(context: ProductContextData, store?: Store) {
  return withQuery('/contact', visitParams({ ...context.relayed, store }));
}
export function ProductContext({ context }: { context: ProductContextData }) {
  const { selection } = context;
  const mamao = getStore(prosthesisStore)!;
  return <>
    {context.rejected.length > 0 && <p className="notice">Une partie du lien n’a pas été reconnue : elle a été ignorée.</p>}
    {context.relayed.subject === 'protheses' && <p className="notice">Les prothèses oculaires sont suivies uniquement au magasin de Mamao, sur rendez-vous à demander par téléphone au <a className="underlined" href={`tel:${mamao.phone}`}>{mamao.phoneLabel}</a>.</p>}
    {selection && <aside className="product-context" aria-label="Le modèle qui vous intéresse"><MediaImage media={selection.variant?.image ?? selection.product.images[0]} alt={selection.product.name} sizes="140px" /><div><h2>Votre sélection</h2><Link href={productHref(selection)}><strong>{selection.product.name}</strong></Link><p>{selectionLines(selection).map(line => `${line.label} : ${line.value}`).join(' · ')}</p><p>{selection.variant || selection.product.minPrice === selection.product.maxPrice ? formatXpf(selection.variant?.price ?? selection.product.minPrice) : `À partir de ${formatXpf(selection.product.minPrice)}`} · Prix à confirmer</p></div><span>Pour vous renseigner, contactez le magasin de votre choix.</span></aside>}
  </>;
}
