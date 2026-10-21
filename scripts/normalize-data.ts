import { readFileSync, writeFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import type { Attribute, Brand, Media, Product, Universe } from '../src/data/types';

interface RawAsset { url: string; file: string; dimensions: number[]; sha256: string }
interface RawVariant {
  variation_id: number; attributes: Record<string, string>; display_price: number;
  display_regular_price: number; imageUrl: string; image_id: number; sku: string;
  description: string; availability: string; is_in_stock: boolean;
  backorders_allowed: boolean; variation_is_active: boolean; variation_is_visible: boolean;
}
interface RawProduct {
  id: number; name: string; slug: string; type: string; permalink: string;
  prices: { price: string }; categories: Product['sourceCategories'];
  attributes: { taxonomy: string; name: string; terms: Attribute['terms']; has_variations: boolean }[];
  defaults: Record<string, string>; images: { src: string }[]; variants: RawVariant[];
  description: string; shortDescription: string; is_in_stock: boolean; backorders_allowed: boolean | null;
}
interface RawBrand { name: string; evidence: Brand['source'] }
const read = <T>(name: string): T => JSON.parse(readFileSync(`src/data/source/${name}`, 'utf8'));
const assets = read<RawAsset[]>('assets.public.json');
const mediaByUrl = new Map(assets.map(a => [a.url, {
  src: `/media/${basename(a.file, extname(a.file))}.webp`,
  width: a.dimensions[0], height: a.dimensions[1], origin: a.url, sourceSha256: a.sha256,
} satisfies Media]));
const media = (url: string) => {
  const m = mediaByUrl.get(url);
  if (!m) throw new Error(`Unmapped public image: ${url}`);
  return m;
};
const slug = (name: string) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const corrections: Record<string, string[]> = {
  'the-bird': ['Catégories vides dans la source : ajout proposé de soleil et Maui Jim, cohérent avec la fiche et les références B835.'],
  'kalani': ['Catégories vides dans la source : ajout proposé de soleil et Maui Jim, cohérent avec la fiche et les références 818.'],
  'kanaha-asian-fit': ['Solaire absent dans la source : ajout proposé de soleil, fiche classée Maui Jim/Homme.'],
};
const products: Product[] = read<{ products: RawProduct[] }>('catalogue.public.json').products.map(p => {
  const kind = p.categories.some(c => c.slug === 'lentilles') ? 'lens' : 'solar';
  const brandId = kind === 'solar' ? 'maui-jim' : p.slug.startsWith('freshlook') ? 'freshlook' : p.slug.startsWith('trublends') ? 'trublends' : 'colourvue';
  const attributes = p.attributes.map(a => ({ key: `attribute_${a.taxonomy}`, name: a.name, terms: a.terms, varies: a.has_variations }));
  const variants = p.variants.map(v => ({
    id: v.variation_id, attributes: v.attributes,
    labels: Object.fromEntries(Object.entries(v.attributes).map(([key, value]) => [key, value === '' ? 'Toute option compatible' : attributes.find(a => a.key === key)?.terms.find(t => t.slug === value)?.name.replace(/&amp;/g, '&') ?? value])),
    price: v.display_price, regularPrice: v.display_regular_price,
    image: media(v.imageUrl), imageId: v.image_id, sku: v.sku,
    description: v.description, availability: v.availability,
    sourceStock: { inStock: v.is_in_stock, backordersAllowed: v.backorders_allowed, active: v.variation_is_active, visible: v.variation_is_visible },
  }));
  const prices = variants.length ? variants.map(v => v.price) : [Number(p.prices.price)];
  const categories = p.categories.map(c => c.slug);
  if (kind === 'solar') for (const c of ['lunettes-de-soleil', 'maui-jim']) if (!categories.includes(c)) categories.push(c);
  return {
    id: p.id, name: p.name, slug: p.slug, type: p.type, kind, brandId,
    price: Number(p.prices.price), minPrice: Math.min(...prices), maxPrice: Math.max(...prices),
    description: p.description, shortDescription: p.shortDescription,
    categories, sourceCategories: p.categories, attributes, defaultAttributes: p.defaults,
    images: p.images.map(i => media(i.src)), variants, source: p.permalink,
    normalization: corrections[p.slug] ?? [],
    sourceStock: { inStock: p.is_in_stock, backordersAllowed: p.backorders_allowed },
  };
});
const universeForPage = (page: string): Universe | null => page.includes('lunettes-de-vue') ? 'Vue' : page.includes('lunettes-de-soleil') ? 'Soleil' : page.includes('lentilles') ? 'Lentilles' : page.includes('jumelles-et-telescopes') ? 'Observation' : null;
const brands: Brand[] = read<RawBrand[]>('brands.public.json').map(b => {
  const id = slug(b.name);
  const logoUrl = b.evidence.find(e => e.url && mediaByUrl.has(e.url))?.url;
  const universes = [...new Set(b.evidence.map(e => universeForPage(e.page ?? '')).filter((x): x is Universe => x !== null))];
  const relationship = b.name === 'FreshLook' ? 'Gamme de lentilles Alcon.' : ['Alcon', 'LCS', 'Bausch + Lomb', 'CooperVision'].includes(b.name) ? 'Laboratoire présenté dans l’univers lentilles.' : ['Miru', 'ACUVUE', 'TruBlends', 'Colourvue'].includes(b.name) ? 'Marque ou gamme de lentilles présentée sur le site. Le laboratoire associé reste à confirmer.' : null;
  return { id, name: b.name, universes, logo: logoUrl ? media(logoUrl) : null, darkLogo: ['Bosma', 'Perl'].includes(b.name), productIds: products.filter(p => p.brandId === id).map(p => p.id), relationship, source: b.evidence };
});
const shippingUrls = new Set([...products.flatMap(p => [...p.images.map(i => i.origin), ...p.variants.map(v => v.image.origin)]), ...brands.flatMap(b => b.logo ? [b.logo.origin] : []), ...assets.filter(a => ['655699e241', '1973260a9f', '9aa0950419', '4a3600313f'].some(prefix => a.file.startsWith(prefix))).map(a => a.url)]);
const shippingMedia = [...mediaByUrl.values()].filter(m => shippingUrls.has(m.origin));
for (const [name, data] of [['catalogue.json', products], ['brands.json', brands], ['media.json', shippingMedia]] as const) {
  writeFileSync(`src/data/${name}`, JSON.stringify(data, null, 2) + '\n');
}
console.log(`${products.length} produits, ${products.reduce((n, p) => n + p.variants.length, 0)} variantes, ${products.filter(p => p.kind === 'solar').length} solaires, ${brands.length} identités.`);
