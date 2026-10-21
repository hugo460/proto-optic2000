import type { Attribute, Product, Variant } from '@/data/types';
import { variantName } from './variants';
// Public URL names of the lens options; any other source attribute stays out of the URL.
const optionParams = { 'attribute_pa_couleur-lentilles': 'couleur', attribute_pa_sphere: 'sphere' } as const;
export type OptionParam = (typeof optionParams)[keyof typeof optionParams];
export type SelectionParam = OptionParam | 'variante';
export type Term = Attribute['terms'][number];
export interface LensOption { param: OptionParam; key: string; label: string; terms: Term[] }
export type SelectionStatus = 'fixed' | 'empty' | 'incomplete' | 'complete' | 'incompatible';
export interface Selection {
  product: Product;
  options: LensOption[];
  chosen: Partial<Record<OptionParam, Term>>;
  variant?: Variant;
  status: SelectionStatus;
  rejected: SelectionParam[];
}
export type Query = URLSearchParams | Record<string, string | string[] | undefined>;
export function queryValue(query: Query, key: string): string | undefined {
  const value = query instanceof URLSearchParams ? query.get(key) ?? undefined : query[key];
  return typeof value === 'string' ? value : undefined;
}
// Source term names carry the sign (+2.00 / -2.00); slugs do not, so numeric order comes from the names.
const signedNumber = /^[+-]?\d+(\.\d+)?$/;
export function lensOptions(product: Product): LensOption[] {
  if (product.kind !== 'lens') return [];
  return product.attributes.flatMap(attribute => {
    const param = optionParams[attribute.key as keyof typeof optionParams];
    if (!attribute.varies || !param) return [];
    const numeric = attribute.terms.every(term => signedNumber.test(term.name));
    const terms = numeric ? [...attribute.terms].sort((a, b) => Number(a.name) - Number(b.name)) : attribute.terms;
    return [{ param, key: attribute.key, label: param === 'couleur' ? 'Couleur' : 'Sphère', terms }];
  });
}
export function readSelection(product: Product, query: Query): Selection {
  const options = lensOptions(product);
  const rejected = new Set<SelectionParam>();
  const chosen: Selection['chosen'] = {};
  for (const option of options) {
    const raw = queryValue(query, option.param);
    if (!raw) continue;
    const term = option.terms.find(t => t.slug === raw);
    if (term) chosen[option.param] = term; else rejected.add(option.param);
  }
  const rawVariant = queryValue(query, 'variante');
  let variant = rawVariant ? product.variants.find(v => String(v.id) === rawVariant) : undefined;
  if (rawVariant && !variant) rejected.add('variante');
  if (variant) {
    // A variant ID only proves its non-empty attributes; an empty sphere is a wildcard, never a correction.
    for (const option of options) {
      const value = variant.attributes[option.key];
      if (!value) continue;
      const proven = option.terms.find(t => t.slug === value);
      if (!chosen[option.param] && proven) chosen[option.param] = proven;
      else if (chosen[option.param]?.slug !== value) { rejected.add('variante'); variant = undefined; break; }
    }
  }
  const picked = options.filter(o => chosen[o.param]);
  let matches: Variant[] = [];
  if (!variant && picked.length) {
    matches = product.variants.filter(v => picked.every(o => !v.attributes[o.key] || v.attributes[o.key] === chosen[o.param]!.slug));
    // Resolve only when every specific attribute of the single candidate was chosen by the visitor.
    const [candidate] = matches;
    if (matches.length === 1 && options.every(o => !candidate.attributes[o.key] || chosen[o.param])) variant = candidate;
  }
  const status: SelectionStatus = product.kind !== 'lens'
    ? variant ? 'complete' : 'empty'
    : !options.length ? 'fixed'
    : picked.length && !variant && !matches.length ? 'incompatible'
    : variant && picked.length === options.length ? 'complete'
    : picked.length || variant ? 'incomplete' : 'empty';
  return { product, options, chosen, variant, status, rejected: [...rejected] };
}
export function selectionParams(selection: Selection): URLSearchParams {
  const params = new URLSearchParams();
  if (selection.variant) params.set('variante', String(selection.variant.id));
  for (const option of selection.options) {
    const term = selection.chosen[option.param];
    if (term) params.set(option.param, term.slug);
  }
  return params;
}
// Applies one option change and returns the canonical selection parameters.
export function changeSelection(selection: Selection, param: SelectionParam, value: string | null): URLSearchParams {
  const params = selectionParams(selection);
  if (param !== 'variante') params.delete('variante');
  if (value) params.set(param, value); else params.delete(param);
  if (param === 'variante') for (const option of selection.options) params.delete(option.param);
  return selectionParams(readSelection(selection.product, params));
}
export function selectionLines(selection: Selection): { label: string; value: string }[] {
  if (selection.status === 'fixed') return [{ label: 'Version', value: 'Unique, sans option à choisir' }];
  if (!selection.options.length) return [{ label: 'Coloris', value: selection.variant ? variantName(selection.variant) : 'à préciser avec le magasin' }];
  return selection.options.map(option => ({ label: option.label, value: selection.chosen[option.param]?.name ?? 'à préciser' }));
}
export function sharesOneImage(product: Product): boolean {
  return product.variants.length > 1 && new Set(product.variants.map(v => v.image.origin)).size === 1;
}
export function sharesOnePrice(product: Product): boolean {
  return product.minPrice === product.maxPrice;
}
