import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { products, brands, media } from '../src/data';
import { stores } from '../src/data/stores';
import { editorialMedia, services, sourcePages, teamArticles } from '../src/data/content';
import { lensFacts } from '../src/data/lens-facts';
import { houseLinks, legalLinks, universes } from '../src/data/navigation';
import { legacyRedirects } from '../src/lib/legacy-redirects';
import { contactSubjects, prosthesisStore } from '../src/lib/contact-context';
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
// S2 editorial snapshot: 25 useful pages, each with date/modification/hash; inert text only for reused pages.
assert.equal(sourcePages.length, 25);
assert.equal(new Set(sourcePages.map(p => p.slug)).size, 25);
for (const page of sourcePages) {
  assert(/^\d{4}-\d{2}-\d{2}T/.test(page.modified) && /^[0-9a-f]{64}$/.test(page.contentSha256), `${page.slug} provenance`);
  assert(!page.text?.includes('[et_pb') && !page.text?.includes('<'), `${page.slug} raw markup`);
}
const sourceText = (slug: string) => sourcePages.find(p => p.slug === slug)!.text ?? '';
for (const service of services) for (const quote of service.source) assert(sourceText('accueil').includes(quote), `Service ${service.id}: source sentence not found: ${quote}`);
const lensSlugs = products.filter(p => p.kind === 'lens').map(p => p.slug).sort();
assert.deepEqual(Object.keys(lensFacts).sort(), lensSlugs);
for (const image of Object.values(editorialMedia)) assert(media.includes(image));
// Legacy aliases: exact sources, known canonical destinations, no loop, every product slug safe for the pattern.
const pages = new Set(['/', '/solaires', '/catalogue', '/marques', '/magasins', '/contact', ...stores.map(s => `/magasins/${s.slug}`), ...[...universes, ...houseLinks, ...legalLinks].map(l => l.href)]);
for (const page of pages) if (page !== '/') assert(existsSync(`src/app${page.replace(/^\/magasins\/[^/]+$/, '/magasins/[slug]')}/page.tsx`), `Missing route ${page}`);
const sources = legacyRedirects.map(r => r.source);
assert.equal(new Set(sources).size, sources.length);
for (const redirect of legacyRedirects) {
  const destination = new URL(redirect.destination, 'https://prototype.local');
  assert(!redirect.source.includes('*') && !redirect.source.endsWith('/:path'), `Catch-all ${redirect.source}`);
  assert(!sources.includes(destination.pathname), `Redirect chain/loop ${redirect.source}`);
  if (redirect.source.startsWith('/produit/')) assert.equal(redirect.destination, '/produits/:slug');
  else assert(pages.has(destination.pathname), `Unknown destination ${redirect.destination}`);
}
assert(products.every(p => /^[a-z0-9-]+$/.test(p.slug)));
assert(legacyRedirects.find(r => r.source.startsWith('/produit/'))!.source === `/produit/:slug(${products.map(p => p.slug).join('|')})`);
for (const excluded of ['/mon-compte', '/panier', '/commander']) assert(!sources.includes(excluded) && !existsSync(`src/app${excluded}`));
// S2 matrix: each of the 25 useful old pages has exactly one disposition (canonical page, exact alias, or deliberate exclusion).
type Disposition = { canonical: string } | { alias: string } | { excluded: true };
const matrix: Record<string, Disposition> = {
  accueil: { canonical: '/' }, 'lunettes-de-vue': { canonical: '/lunettes-de-vue' }, lentilles: { canonical: '/lentilles' }, 'jumelles-et-telescopes': { canonical: '/jumelles-et-telescopes' },
  'basse-vision': { canonical: '/basse-vision' }, 'qui-sommes-nous': { canonical: '/qui-sommes-nous' }, contact: { canonical: '/contact' },
  'mentions-legales': { canonical: '/mentions-legales' }, cgv: { canonical: '/cgv' }, 'politique-de-confidentialite': { canonical: '/politique-de-confidentialite' },
  'protheses-occulaires': { alias: '/protheses-oculaires' }, 'lentille-couleur-et-fantaisie': { alias: '/lentilles#couleur-et-fantaisie' },
  'maui-jim-pour-femmes': { alias: '/solaires?genre=femme' }, 'maui-jim-pour-hommes': { alias: '/solaires?genre=homme' },
  boutique: { alias: '/catalogue' }, 'boutique-en-ligne': { alias: '/catalogue' }, 'lunettes-de-soleil': { alias: '/solaires' }, 'nos-offres': { alias: '/services-et-garanties#offres-historiques' },
  'nos-magasins': { alias: '/magasins' }, 'centre-ville': { alias: '/magasins/centre-ville' }, mamao: { alias: '/magasins/mamao' }, taravao: { alias: '/magasins/taravao' },
  'mon-compte': { excluded: true }, panier: { excluded: true }, commander: { excluded: true },
};
assert.deepEqual(Object.keys(matrix).sort(), sourcePages.map(p => p.slug).sort(), 'the matrix covers exactly the 25 snapshot pages');
const aliasFor = (slug: string) => legacyRedirects.find(r => r.source === `/${slug}`);
for (const [slug, disposition] of Object.entries(matrix)) {
  if ('canonical' in disposition) {
    assert(pages.has(disposition.canonical), `${slug}: canonical ${disposition.canonical} is not a known route`);
    assert(!aliasFor(slug) || slug === 'accueil', `${slug}: a canonical page must not also redirect`);
  } else if ('alias' in disposition) {
    assert.equal(aliasFor(slug)?.destination, disposition.alias, `${slug}: alias destination`);
  } else {
    assert(!aliasFor(slug) && !existsSync(`src/app/${slug}`), `${slug}: excluded page must neither redirect nor exist`);
  }
}
assert.equal(legacyRedirects.length, Object.values(matrix).filter(d => 'alias' in d).length + 1, 'one alias per aliased page, plus the product pattern');
// Alias targets that carry a fragment must point to an element that exists on the target page.
for (const [source, anchor] of [['lentilles', 'couleur-et-fantaisie'], ['services-et-garanties', 'offres-historiques']] as const) assert(readFileSync(`src/app/${source}/page.tsx`, 'utf8').includes(anchor), `${source} lost the #${anchor} anchor used by a legacy alias`);
// 38 identities: every one keeps a useful destination; DENCOTT is a prosthesis partner, never a 39th catalogue identity.
assert.equal(brands.length, 38);
assert(!brands.some(b => /dencott/i.test(`${b.id} ${b.name}`)), 'DENCOTT must not be a catalogue identity');
assert(readFileSync('src/app/protheses-oculaires/page.tsx', 'utf8').includes('DENCOTT'));
for (const brand of brands) assert(brand.productIds.length > 0 || brand.universes.length > 0, `${brand.id}: no destination content`);
const universeBrands: Record<string, string[]> = { Vue: [], Soleil: [], Lentilles: [], Observation: [] };
for (const brand of brands) for (const universe of brand.universes) (universeBrands[universe] ??= []).push(brand.id);
assert.deepEqual(Object.keys(universeBrands).sort(), ['Lentilles', 'Observation', 'Soleil', 'Vue']);
assert.deepEqual(universeBrands.Observation.sort(), ['bosma', 'celestron', 'perl']);
assert.equal(universeBrands.Vue.length, 16, '16 optical-frame brands are listed on /lunettes-de-vue');
for (const id of ['bosma', 'perl']) assert.equal(brands.find(b => b.id === id)!.darkLogo, true, `${id}: white logo needs a dark tile`);
assert.notEqual(brands.find(b => b.id === 'celestron')!.darkLogo, true);
// External links: only the three Google Maps places and the two press articles quoted by the old team page.
const external = new Set([...stores.map(s => s.mapUrl), ...teamArticles.map(a => a.href)]);
assert.equal(external.size, 5);
for (const url of external) assert(new URL(url).protocol === 'https:' && !url.includes('*'));
for (const article of teamArticles) assert(sourceText('qui-sommes-nous').includes(new URL(article.href).hostname.replace(/^www\./, '')), `${article.href}: host not found in the source page`);
// Public contact facts stay centralised: one email per store, three phones, no personal data in the contact subjects.
assert.deepEqual(stores.map(s => s.email), ['optic2000tahiti@gmail.com', 'optic2000tahiti@gmail.com', 'optic2000taravao@gmail.com']);
assert.equal(contactSubjects.length, 8);
assert.equal(prosthesisStore, 'mamao');
// Lens contract used by the browser scenarios: Colorblends signs and the foreign IDs.
const colorblends = products.find(p => p.slug === 'freshlook-colorblends')!;
const colorblendsSphere = colorblends.attributes.find(a => a.key === 'attribute_pa_sphere')!;
assert.deepEqual(Object.fromEntries(colorblendsSphere.terms.filter(t => t.name.endsWith('2.00')).map(t => [t.name, t.slug])), { '-2.00': '2-00-2', '+2.00': '2-00' });
assert.equal(colorblends.variants.find(v => v.id === 1949)?.labels['attribute_pa_couleur-lentilles'], 'Grey');
assert.equal(colorblends.variants.find(v => v.id === 1944)?.labels['attribute_pa_couleur-lentilles'], 'Blue');
assert(!colorblends.variants.some(v => v.id === 774 || v.id === 1957), '774 (Glory Glory) and 1957 (FreshLook 1-Day) are foreign IDs for Colorblends');
assert(products.find(p => p.slug === 'glory-glory')!.variants.some(v => v.id === 774));
assert(products.find(p => p.slug === 'freshlook-1-day')!.variants.some(v => v.id === 1957));
assert.deepEqual(products.filter(p => p.kind === 'lens').map(p => [p.slug, p.variants.length, p.minPrice]), [['freshlook-1-day', 4, 2300], ['freshlook-colorblends', 12, 2900], ['trublends-one-day', 5, 2200], ['trublends-one-day-5-couleurs', 0, 2200], ['colourvue-crazylens-one-day', 12, 1900]]);
console.log(`PASS — 83/83 products; 264/264 variants; 716 gallery references; 78 normalized solars; 38 identities; ${media.length} local WebP files; defaults, signs, source categories, prices/images and store links preserved; 25 source pages (matrix: canonical, alias or exclusion), 5 allowed external URLs, services quoted verbatim, ${Object.keys(lensFacts).length} lens fact sheets, ${legacyRedirects.length} exact legacy aliases.`);
