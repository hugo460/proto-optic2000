import type { Product } from '@/data/types';
export const sortOptions = [
  ['selection', 'Notre sélection'], ['prix-asc', 'Prix croissant'], ['prix-desc', 'Prix décroissant'], ['nom', 'Nom : A à Z'],
] as const;
export interface Filters { q: string; gender: string; color: string; budget: string; sort: string; brand: string }
export const emptyFilters: Filters = { q: '', gender: '', color: '', budget: '', sort: 'selection', brand: '' };
export const normalizeText = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function parseFilters(params: URLSearchParams, source: Product[]): { filters: Filters; invalid: boolean } {
  const colors = new Set(source.flatMap(p => p.attributes.find(a => a.key === 'attribute_pa_couleur')?.terms.map(t => t.slug) ?? []));
  const allowed: Record<string, (v: string) => boolean> = {
    genre: v => ['', 'femme', 'homme'].includes(v), couleur: v => !v || colors.has(v),
    budget: v => ['', 'moins-30000', '30000-40000', 'plus-40000'].includes(v),
    tri: v => sortOptions.some(o => o[0] === v), marque: v => !v || source.some(p => p.brandId === v),
  };
  let invalid = false;
  const value = (key: string, fallback = '') => {
    const v = params.get(key) ?? fallback;
    if (allowed[key] && !allowed[key](v)) { invalid = true; return fallback; }
    return v;
  };
  return { filters: { q: (params.get('q') ?? '').slice(0, 120), gender: value('genre'), color: value('couleur'), budget: value('budget'), sort: value('tri', 'selection'), brand: value('marque') }, invalid };
}
export function serializeFilters(filters: Filters): string {
  const p = new URLSearchParams();
  for (const [key, value] of [['q', filters.q], ['genre', filters.gender], ['couleur', filters.color], ['budget', filters.budget], ['tri', filters.sort === 'selection' ? '' : filters.sort], ['marque', filters.brand]]) if (value) p.set(key, value);
  return p.toString();
}
export function filterProducts(source: Product[], f: Filters): Product[] {
  const query = normalizeText(f.q.trim());
  const result = source.filter(p => {
    if (query && !normalizeText(`${p.name} ${p.brandId} ${p.attributes.flatMap(a => a.terms.map(t => t.name)).join(' ')}`).includes(query)) return false;
    if (f.gender && !p.categories.includes(f.gender)) return false;
    if (f.color && !p.attributes.some(a => a.key === 'attribute_pa_couleur' && a.terms.some(t => t.slug === f.color))) return false;
    if (f.brand && p.brandId !== f.brand) return false;
    if (f.budget === 'moins-30000' && p.minPrice >= 30000) return false;
    if (f.budget === '30000-40000' && (p.minPrice < 30000 || p.minPrice > 40000)) return false;
    if (f.budget === 'plus-40000' && p.minPrice <= 40000) return false;
    return true;
  });
  const featured = ['glory-glory', 'baby-beach', 'the-bird', 'mamane', 'alulu'];
  return [...result].sort((a, b) => f.sort === 'prix-asc' ? a.minPrice - b.minPrice : f.sort === 'prix-desc' ? b.minPrice - a.minPrice : f.sort === 'nom' ? a.name.localeCompare(b.name, 'fr') : (featured.indexOf(a.slug) === -1 ? 100 : featured.indexOf(a.slug)) - (featured.indexOf(b.slug) === -1 ? 100 : featured.indexOf(b.slug)));
}
export function safeReturnPath(path: string | null | undefined): string {
  if (!path) return '/solaires';
  try {
    const url = new URL(path, 'https://prototype.local');
    if (url.origin !== 'https://prototype.local' || !['/solaires', '/catalogue'].includes(url.pathname)) return '/solaires';
    return url.pathname + url.search;
  } catch { return '/solaires'; }
}
