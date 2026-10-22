import type { Product } from '@/data/types';
import type { Store } from '@/data/stores';
import { queryValue, readSelection, selectionParams, type Query, type Selection } from './lens-selection';
// Shared public context: only catalogue/store identifiers travel in URLs, never what the visitor types.
export const contactSubjects = [
  { slug: 'vue', label: 'Lunettes de vue' },
  { slug: 'soleil', label: 'Lunettes de soleil' },
  { slug: 'lentilles', label: 'Lentilles et entretien' },
  { slug: 'observation', label: 'Jumelles et télescopes' },
  { slug: 'basse-vision', label: 'Basse vision' },
  { slug: 'protheses', label: 'Prothèses oculaires' },
  { slug: 'services', label: 'Services et garanties' },
  { slug: 'autre', label: 'Autre demande' },
] as const;
export type SubjectSlug = (typeof contactSubjects)[number]['slug'];
export const prosthesisStore = 'mamao';
export const isSubject = (value: string | undefined): value is SubjectSlug => contactSubjects.some(s => s.slug === value);
export const subjectLabel = (slug: string) => contactSubjects.find(s => s.slug === slug)?.label;
export type ContextParam = 'produit' | 'sujet' | 'magasin' | 'variante' | 'couleur' | 'sphere';
export interface VisitContext {
  selection?: Selection;
  store?: Store;
  subject?: SubjectSlug;
  // Subject deduced from the product family rather than read from the URL.
  subjectFromProduct: boolean;
  // Prosthesis requests are handled only at Mamao; another store was replaced or none was given.
  storeFromSubject: boolean;
  rejected: ContextParam[];
}
export function readVisitContext(query: Query, source: { products: readonly Product[]; stores: readonly Store[] }): VisitContext {
  const rejected: ContextParam[] = [];
  const rawProduct = queryValue(query, 'produit');
  const product = rawProduct ? source.products.find(p => p.slug === rawProduct) : undefined;
  if (rawProduct && !product) rejected.push('produit');
  const selection = product ? readSelection(product, query) : undefined;
  if (selection) rejected.push(...selection.rejected);
  else for (const key of ['variante', 'couleur', 'sphere'] as const) if (queryValue(query, key)) rejected.push(key);
  const rawSubject = queryValue(query, 'sujet');
  let subject: SubjectSlug | undefined = isSubject(rawSubject) ? rawSubject : undefined;
  if (rawSubject && !subject) rejected.push('sujet');
  const subjectFromProduct = !subject && !!product;
  if (!subject && product) subject = product.kind === 'lens' ? 'lentilles' : 'soleil';
  const rawStore = queryValue(query, 'magasin');
  let store = rawStore ? source.stores.find(s => s.slug === rawStore) : undefined;
  if (rawStore && !store) rejected.push('magasin');
  const storeFromSubject = subject === 'protheses' && store?.slug !== prosthesisStore;
  if (storeFromSubject) store = source.stores.find(s => s.slug === prosthesisStore);
  return { selection, store, subject, subjectFromProduct, storeFromSubject, rejected };
}
export function visitParams(context: Pick<VisitContext, 'selection' | 'store' | 'subject'>, include: { store?: boolean; subject?: boolean } = {}): URLSearchParams {
  const params = new URLSearchParams();
  if (include.subject !== false && context.subject) params.set('sujet', context.subject);
  if (include.store !== false && context.store) params.set('magasin', context.store.slug);
  if (context.selection) {
    params.set('produit', context.selection.product.slug);
    for (const [key, value] of selectionParams(context.selection)) params.set(key, value);
  }
  return params;
}
export const withQuery = (path: string, params: URLSearchParams) => (params.toString() ? `${path}?${params}` : path);
export function productHref(selection: Selection): string {
  return withQuery(`/produits/${selection.product.slug}`, selectionParams(selection));
}
export interface ContactFields { store: string; subject: string; name: string; email: string; phone: string; message: string }
export type ContactErrors = Partial<Record<keyof ContactFields, string>>;
export const contactFieldOrder: (keyof ContactFields)[] = ['store', 'subject', 'name', 'email', 'phone', 'message'];
export const messageLimits = { min: 10, max: 1000 } as const;
// Name, e-mail and optional phone: the same rules for the contact request and the demonstration appointment.
export interface PersonFields { name: string; email: string; phone: string }
export function validatePerson(fields: PersonFields): Partial<Record<keyof PersonFields, string>> {
  const errors: Partial<Record<keyof PersonFields, string>> = {};
  if (fields.name.trim().length < 2) errors.name = 'Indiquez votre nom (2 caractères minimum).';
  const email = fields.email.trim();
  if (!email) errors.email = 'Indiquez votre adresse e-mail.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Vérifiez l’adresse e-mail, par exemple prenom@example.com.';
  const phone = fields.phone.trim();
  if (phone && (!/^\+?[\d\s.()-]+$/.test(phone) || phone.replace(/\D/g, '').length < 6 || phone.replace(/\D/g, '').length > 15)) errors.phone = 'Vérifiez le numéro : chiffres, espaces et « + » uniquement, ou laissez ce champ vide.';
  return errors;
}
export function validateContact(fields: ContactFields, storeSlugs: readonly string[]): ContactErrors {
  const errors: ContactErrors = {};
  if (!storeSlugs.includes(fields.store)) errors.store = 'Choisissez le magasin qui recevrait votre demande.';
  else if (fields.subject === 'protheses' && fields.store !== prosthesisStore) errors.store = 'Les prothèses oculaires sont suivies uniquement au magasin de Mamao. Choisissez Mamao.';
  if (!isSubject(fields.subject)) errors.subject = 'Choisissez l’objet de votre demande.';
  Object.assign(errors, validatePerson(fields));
  const message = fields.message.trim();
  if (!message) errors.message = 'Écrivez votre message.';
  else if (message.length < messageLimits.min) errors.message = `Précisez votre message (${messageLimits.min} caractères minimum).`;
  else if (message.length > messageLimits.max) errors.message = `Raccourcissez votre message (${messageLimits.max} caractères maximum).`;
  return errors;
}
