import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { products, brands, media } from '../src/data';
import { stores } from '../src/data/stores';
const source = JSON.parse(readFileSync('src/data/source/catalogue.public.json', 'utf8')) as { products: { id: number; categories: unknown; attributes: { terms: unknown }[]; defaults: unknown; images: unknown[]; variants: { variation_id: number; attributes: unknown; display_price: number; imageUrl: string }[] }[] };
assert.equal(products.length, 83);
assert.equal(new Set(products.map(p => p.id)).size, 83);
assert.equal(new Set(products.map(p => p.slug)).size, 83);
assert.equal(products.reduce((n, p) => n + p.variants.length, 0), 264);
assert.equal(new Set(products.flatMap(p => p.variants.map(v => v.id))).size, 264);
assert.equal(products.filter(p => p.kind === 'solar').length, 78);
assert.equal(products.filter(p => p.normalization.length).length, 3);
assert.equal(products.reduce((n, p) => n + p.images.length, 0), 716);
assert.equal(brands.length, 38);
assert.equal(new Set(brands.map(b => b.id)).size, 38);
for (const product of products) {
  const raw = source.products.find(p => p.id === product.id)!;
  assert.deepEqual(product.sourceCategories, raw.categories);
  assert.deepEqual(product.defaultAttributes, raw.defaults);
  assert.deepEqual(product.attributes.map(a => a.terms), raw.attributes.map(a => a.terms));
  assert.equal(product.images.length, raw.images.length);
  assert.equal(product.variants.length, raw.variants.length);
  assert(brands.some(b => b.id === product.brandId));
  assert(Number.isInteger(product.price) && product.price > 0);
  for (const variant of product.variants) {
    const original = raw.variants.find(v => v.variation_id === variant.id)!;
    assert.deepEqual(variant.attributes, original.attributes);
    assert.equal(variant.price, original.display_price);
    assert.equal(variant.image.origin, original.imageUrl);
    for (const [key, value] of Object.entries(variant.attributes)) {
      if (value) assert(product.attributes.find(a => a.key === key)?.terms.some(t => t.slug === value), `${product.slug} unknown attribute ${key}=${value}`);
      else assert.equal(variant.labels[key], 'Toute option compatible');
    }
  }
}
for (const image of media) {
  assert(image.src.startsWith('/media/'));
  const path = `public${image.src}`;
  assert(existsSync(path), `Missing ${path}`);
  const buffer = readFileSync(path);
  assert.equal(buffer.toString('ascii', 0, 4), 'RIFF');
  assert.equal(buffer.toString('ascii', 8, 12), 'WEBP');
  assert(image.width > 0 && image.height > 0);
  assert(image.origin.startsWith('https://optic2000tahiti.com/wp-content/uploads/'));
}
assert.equal(stores.length, 3);
assert.deepEqual(stores.map(s => s.phone), ['+68940427754', '+68940421944', '+68940575700']);
for (const store of stores) {
  const cid = BigInt(`0x${store.mapFeatureId.split(':')[1].slice(2)}`).toString();
  assert.equal(new URL(store.mapUrl).searchParams.get('cid'), cid);
  assert(store.email.includes('@'));
}
const taravao = stores.find(s => s.slug === 'taravao')!;
assert.equal(taravao.hours.length, 0);
assert(!taravao.postalAddress.includes('987'));
assert(taravao.hoursSummary.includes('confirmer'));
console.log(`PASS — 83/83 products; 264/264 variants; 716 gallery references; 78 normalized solars; 38 identities; ${media.length} local WebP files; defaults, signs, source categories, prices/images and store links preserved.`);
