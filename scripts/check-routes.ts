import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { products, brands } from '../src/data';
import { stores } from '../src/data/stores';
import { teamArticles } from '../src/data/content';
import { contactSubjects } from '../src/lib/contact-context';

// Live checks against a running `pnpm start`: canonical pages, every internal/external link, native alias redirects, real 404s.
const base = process.env.OPTIC_BASE_URL ?? 'http://127.0.0.1:3011';
const errors: string[] = [];
const fail = (message: string) => errors.push(message);
const check = (condition: unknown, message: string) => { if (!condition) fail(message); };

// ---- Canonical pages ----------------------------------------------------------------------------------------------
const universePaths = ['/lunettes-de-vue', '/lentilles', '/jumelles-et-telescopes', '/basse-vision', '/protheses-oculaires', '/services-et-garanties', '/qui-sommes-nous'];
const legalPaths = ['/mentions-legales', '/politique-de-confidentialite', '/cgv'];
const s1Paths = ['/', '/solaires', '/catalogue', '/marques', '/magasins'];
// Contact pages in the states the journeys can reach; only public identifiers are in these URLs.
const contactPaths = [
  '/contact', '/contact?sujet=protheses&magasin=taravao', '/contact?sujet=vue', '/contact?magasin=mamao',
  '/contact?produit=freshlook-colorblends&variante=1949&couleur=grey&sphere=2-00', '/contact?produit=freshlook-colorblends&variante=1949&couleur=grey&sphere=2-00-2&magasin=taravao',
  '/contact?produit=freshlook-colorblends&variante=1949&couleur=grey&sphere=0-00', '/contact?produit=trublends-one-day-5-couleurs',
  '/contact?sujet=promo&magasin=paris&produit=inconnu&variante=1949',
];
const storeContextPaths = ['/magasins?produit=freshlook-colorblends&variante=1949&couleur=grey&sphere=2-00', '/magasins/taravao?produit=freshlook-colorblends&variante=1949&couleur=grey&sphere=2-00-2'];
const lensContextPaths = ['/produits/freshlook-colorblends?variante=1949&couleur=grey&sphere=2-00', '/produits/freshlook-colorblends?variante=774', '/produits/freshlook-1-day?couleur=grey&sphere=2-00'];
const pagePaths = [
  ...s1Paths, ...universePaths, ...legalPaths, '/contact', '/robots.txt',
  ...products.map(p => `/produits/${p.slug}`), ...brands.map(b => `/marques/${b.id}`), ...stores.map(s => `/magasins/${s.slug}`),
];
const renderedPaths = [...pagePaths, ...contactPaths.slice(1), ...storeContextPaths, ...lensContextPaths];
const allowed = new Set(pagePaths);
const subjectSlugs = new Set<string>(contactSubjects.map(s => s.slug));
const storeSlugs = new Set<string>(stores.map(s => s.slug));
const productSlugs = new Set(products.map(p => p.slug));
// External destinations: the three Google Maps places and the two press articles quoted on the old team page. No wildcard.
const externalAllowlist = new Set<string>([...stores.map(s => s.mapUrl), ...teamArticles.map(a => a.href)]);
const personalKeys = /^(nom|name|prenom|email|e-mail|mail|tel|telephone|phone|message|adresse)$/i;

const textOf = (html: string) => html.replace(/<!-- -->/g, '').replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '’').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

const links = new Set<string>();
const externals = new Set<string>();
let cursor = 0;
async function inspectPage(path: string) {
  const response = await fetch(base + path);
  check(response.status === 200, `${path}: HTTP ${response.status}`);
  check(response.headers.get('x-robots-tag')?.includes('noindex'), `${path}: missing noindex header`);
  const html = await response.text();
  if (path === '/robots.txt') return check(html.includes('Disallow: /'), 'robots.txt must disallow the prototype');
  check(/<meta name="robots" content="noindex/.test(html), `${path}: missing noindex meta`);
  check((html.match(/<h1[\s>]/g) ?? []).length === 1, `${path}: expected exactly one h1`);
  check(/<title>[^<]+ \| Optic 2000 Tahiti<\/title>|<title>Optic 2000 Tahiti — [^<]+<\/title>/.test(html), `${path}: unexpected title`);
  check(/<meta name="description" content="[^"]{20,}"/.test(html), `${path}: missing description`);
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  for (const match of html.matchAll(/<a\b([^>]*)>/g)) {
    const attributes = match[1];
    const href = /href="([^"]*)"/.exec(attributes)?.[1]?.replaceAll('&amp;', '&');
    if (href === undefined) continue;
    links.add(href);
    if (href === '#contenu') continue;
    if (!href || href === '#') { fail(`${path}: empty link`); continue; }
    if (href.startsWith('#')) { check(ids.has(href.slice(1)), `${path}: anchor ${href} has no target`); continue; }
    if (href.startsWith('/')) {
      const url = new URL(href, base);
      check(allowed.has(url.pathname), `${path}: unknown internal link ${href}`);
      for (const [key, value] of url.searchParams) {
        check(!personalKeys.test(key), `${path}: personal-data parameter in ${href}`);
        if (key === 'sujet') check(subjectSlugs.has(value), `${path}: unknown subject in ${href}`);
        if (key === 'magasin') check(storeSlugs.has(value), `${path}: unknown store in ${href}`);
        if (key === 'produit') check(productSlugs.has(value), `${path}: unknown product in ${href}`);
        if (key === 'retour') check(['/solaires', '/catalogue', '/lentilles'].includes(new URL(value, base).pathname), `${path}: unsafe return path in ${href}`);
      }
      continue;
    }
    if (href.startsWith('tel:')) { check(stores.some(s => href === `tel:${s.phone}`), `${path}: unknown phone ${href}`); continue; }
    if (href.startsWith('mailto:')) { check(stores.some(s => href === `mailto:${s.email}`), `${path}: unknown email ${href}`); continue; }
    externals.add(href);
    check(externalAllowlist.has(href), `${path}: external link outside the allowlist ${href}`);
    check(/target="_blank"/.test(attributes) && /rel="[^"]*noopener[^"]*"/.test(attributes), `${path}: external link ${href} must open safely in a new tab`);
  }
  for (const match of html.matchAll(/src="(\/media\/[^"?]+)"/g)) check(existsSync(`public${match[1]}`), `${path}: missing local file ${match[1]}`);
  for (const match of html.matchAll(/\/_next\/image\?url=([^&"]+)/g)) {
    const file = decodeURIComponent(match[1]);
    if (file.startsWith('/media/')) check(existsSync(`public${file}`), `${path}: optimized image points to missing ${file}`);
  }
  // Nothing may load from the former domain or any other origin.
  for (const match of html.matchAll(/\b(?:src|srcset|href)="(https?:\/\/[^"]+)"/g)) {
    const url = match[1].replaceAll('&amp;', '&');
    if (match[0].startsWith('href=')) continue; // external anchors are covered by the allowlist above
    fail(`${path}: remote resource ${url}`);
  }
  return html;
}
async function worker() {
  while (cursor < renderedPaths.length) {
    const path = renderedPaths[cursor++];
    try { await inspectPage(path); } catch (e) { fail(`${path}: ${e}`); }
  }
}

// ---- Server-rendered public context -------------------------------------------------------------------------------
async function contextChecks() {
  const get = async (path: string) => textOf(await (await fetch(base + path)).text());
  const plus = await get('/contact?produit=freshlook-colorblends&variante=1949&couleur=grey&sphere=2-00&magasin=taravao');
  check(/Couleur : Grey/.test(plus) && /Sphère : \+2\.00/.test(plus) && /2 900/.test(plus.replace(/[  ]/g, ' ')), 'contact +2.00 summary');
  check(/Optic 2000 Taravao/.test(plus) && /Horaires à confirmer auprès du magasin/.test(plus), 'contact Taravao hours reservation');
  const minus = await get('/contact?produit=freshlook-colorblends&variante=1949&couleur=grey&sphere=2-00-2');
  check(/Sphère : -2\.00/.test(minus) && !/Sphère : \+2\.00/.test(minus), 'contact -2.00 summary keeps its sign');
  const zero = await get('/contact?produit=freshlook-colorblends&variante=1949&couleur=grey&sphere=0-00');
  check(/Sphère : 0\.00/.test(zero), 'contact 0.00 summary');
  const colourOnly = await get('/contact?produit=freshlook-colorblends&couleur=grey');
  check(/Couleur : Grey/.test(colourOnly) && /Sphère : à préciser/.test(colourOnly), 'colour alone leaves the correction open');
  const sphereOnly = await get('/contact?produit=freshlook-colorblends&sphere=0-00');
  check(/Couleur : à préciser/.test(sphereOnly) && /Sphère : 0\.00/.test(sphereOnly), 'sphere alone never chooses a colour');
  const foreign = await get('/contact?produit=freshlook-colorblends&variante=774');
  check(/Une partie du lien n’a pas été reconnue/.test(foreign) && /Couleur : à préciser/.test(foreign) && !/Grey/.test(foreign), 'foreign variant id is ignored without a false selection');
  const simple = await get('/contact?produit=trublends-one-day-5-couleurs');
  check(/Version : Unique, sans option à choisir/.test(simple), 'simple lens summary');
  const unknown = await get('/contact?sujet=promo&magasin=paris&produit=inconnu');
  check(/Une partie du lien n’a pas été reconnue/.test(unknown) && /Aucun modèle joint/.test(unknown), 'unknown context stays usable');
  const prosthesis = await get('/contact?sujet=protheses&magasin=taravao');
  check(/uniquement au magasin de Mamao/.test(prosthesis) && /Optic 2000 Mamao/.test(prosthesis) && !/Optic 2000 Taravao/.test(prosthesis), 'prosthesis request is moved to Mamao');
  const store = await get('/magasins/taravao?produit=freshlook-colorblends&variante=1949&couleur=grey&sphere=2-00-2');
  check(/Sphère : -2\.00/.test(store) && /Horaires à confirmer auprès du magasin/.test(store), 'store page relays the lens correction');
  const lens = await get('/produits/freshlook-1-day?couleur=grey&sphere=2-00');
  check(/Une option du lien n’existe pas pour ce modèle/.test(lens), '+2.00 is not offered on FreshLook 1-Day');
  const simpleProduct = await get('/produits/trublends-one-day-5-couleurs');
  check(/Une seule version/.test(simpleProduct) && /2 200/.test(simpleProduct.replace(/[  ]/g, ' ')) && !/Choisissez la couleur/.test(simpleProduct), 'simple lens has no invented options');
  const services = await get('/services-et-garanties');
  for (const phrase of [/deux ans/, /jusqu’à 3 ans/, /60 %/, /produit identique/, /trois mois/, /Offres de 2022/, /aucune n’est confirmée comme offre actuelle/]) check(phrase.test(services), `services page lost ${phrase}`);
  const prostheses = await get('/protheses-oculaires');
  check(/Uniquement sur rendez-vous, à Mamao/.test(prostheses) && /Elle ne redonne pas la vision/.test(prostheses) && /DENCOTT/.test(prostheses), 'prosthesis page contract');
  const legal = await get('/mentions-legales');
  check(/ne sont ni l’hébergeur ni le créateur de ce prototype/.test(legal) && /SARL S2M/.test(legal), 'legal page keeps the old operator historical');
  const cgv = await get('/cgv');
  check(/ne s’appliquent pas à ce prototype/.test(cgv), 'sales terms are not published as current');
}

// ---- Native redirects ---------------------------------------------------------------------------------------------
interface Hop { url: string; status: number; location?: string }
async function chain(path: string): Promise<{ hops: Hop[]; final: Hop }> {
  const hops: Hop[] = [];
  let url = base + path;
  const seen = new Set<string>();
  for (let step = 0; step < 6; step++) {
    assert(!seen.has(url), `redirect loop on ${path}: ${url}`);
    seen.add(url);
    const response = await fetch(url, { redirect: 'manual' });
    const location = response.headers.get('location');
    void response.body?.cancel();
    if (response.status >= 300 && response.status < 400) {
      assert([307, 308].includes(response.status), `${path}: non-native redirect status ${response.status}`);
      assert(location, `${path}: redirect without Location`);
      hops.push({ url, status: response.status, location });
      url = new URL(location, url).toString();
    } else return { hops, final: { url, status: response.status } };
  }
  throw new Error(`${path}: more than 5 redirects`);
}
const samePath = (actual: URL, expected: URL, extra = new URLSearchParams()) => {
  const wanted = new URLSearchParams(expected.searchParams);
  for (const [key, value] of extra) wanted.append(key, value);
  const got = [...actual.searchParams].map(([k, v]) => `${k}=${v}`).sort().join('&');
  const want = [...wanted].map(([k, v]) => `${k}=${v}`).sort().join('&');
  return actual.pathname === expected.pathname && got === want && actual.hash === expected.hash;
};
const aliases: [string, string][] = [
  ['/maui-jim-pour-femmes', '/solaires?genre=femme'], ['/maui-jim-pour-hommes', '/solaires?genre=homme'],
  ['/boutique', '/catalogue'], ['/boutique-en-ligne', '/catalogue'], ['/lunettes-de-soleil', '/solaires'],
  ['/nos-magasins', '/magasins'], ['/centre-ville', '/magasins/centre-ville'], ['/mamao', '/magasins/mamao'], ['/taravao', '/magasins/taravao'],
  ['/lentille-couleur-et-fantaisie', '/lentilles#couleur-et-fantaisie'], ['/protheses-occulaires', '/protheses-oculaires'], ['/nos-offres', '/services-et-garanties#offres-historiques'],
];
let redirectsChecked = 0;
async function aliasChecks() {
  for (const [source, destination] of aliases) {
    const expected = new URL(destination, base);
    // As published, with a trailing slash, with a simple cumulative query, and both.
    for (const [suffix, extra] of [['', ''], ['/', ''], ['', 'tri=prix-asc'], ['/', 'tri=prix-asc&q=Glory']] as const) {
      const path = `${source}${suffix}${extra ? `?${extra}` : ''}`;
      try {
        const { hops, final } = await chain(path);
        redirectsChecked++;
        assert(hops.length >= 1 && hops.length <= 2, `${path}: ${hops.length} redirects`);
        assert.equal(hops.at(-1)!.status, 307, `${path}: the alias is temporary (307) while the real domain is not switched`);
        assert.equal(final.status, 200, `${path}: final status ${final.status}`);
        const landed = new URL(final.url);
        assert(samePath(landed, expected, new URLSearchParams(extra)), `${path}: landed on ${landed.pathname}${landed.search}${landed.hash}, expected ${destination}${extra ? ` + ${extra}` : ''}`);
        // Fragments never reach the server: they live in the Location header of the alias hop only.
        if (expected.hash) assert.equal(new URL(hops.at(-1)!.location!, base).hash, expected.hash, `${path}: fragment lost in Location`);
      } catch (e) { fail(String(e)); }
    }
  }
  // Female/male aliases keep their gender filter when other filters are accumulated.
  try {
    const { final } = await chain('/maui-jim-pour-femmes?budget=30000-40000&tri=prix-desc');
    const landed = new URL(final.url);
    assert.deepEqual([landed.pathname, landed.searchParams.get('genre'), landed.searchParams.get('budget'), landed.searchParams.get('tri')], ['/solaires', 'femme', '30000-40000', 'prix-desc']);
    redirectsChecked++;
  } catch (e) { fail(String(e)); }
  // The 83 recovered product slugs reach their equivalent product page, as published and with a trailing slash.
  let productRedirects = 0;
  for (const product of products) {
    for (const suffix of ['', '/']) {
      try {
        const { hops, final } = await chain(`/produit/${product.slug}${suffix}`);
        assert(hops.length >= 1 && hops.length <= 2 && hops.at(-1)!.status === 307, `/produit/${product.slug}${suffix}: ${JSON.stringify(hops)}`);
        assert.equal(final.status, 200);
        assert.equal(new URL(final.url).pathname, `/produits/${product.slug}`);
        productRedirects++;
      } catch (e) { fail(`/produit/${product.slug}${suffix}: ${e}`); }
    }
  }
  assert.equal(productRedirects, 166, 'every one of the 83 old product pages');
  redirectsChecked += productRedirects;
  // A variant query on an old product URL survives.
  try {
    const { final } = await chain('/produit/glory-glory?variante=1608');
    const landed = new URL(final.url);
    assert.deepEqual([landed.pathname, landed.searchParams.get('variante')], ['/produits/glory-glory', '1608']);
    redirectsChecked++;
  } catch (e) { fail(String(e)); }
}

// ---- Real 404s ---------------------------------------------------------------------------------------------------
const notFound = [
  '/produits/inconnu', '/marques/inconnue', '/magasins/inconnu', '/page-inconnue', '/produits/modele-inconnu',
  // Old product path with an unknown slug: no catch-all hides it.
  '/produit/modele-inconnu', '/produit/glory-glory-extra', '/produit/', '/produit',
  // Excluded account/cart/checkout pages, with and without a sub-path.
  '/mon-compte', '/mon-compte/commandes', '/panier', '/commander', '/commander/paiement',
  // No catch-all on the other aliases or the new routes.
  '/boutique/produit-x', '/nos-magasins/inconnu', '/lentilles/inconnue', '/contact/x', '/services-et-garanties/x', '/protheses-occulaires/x',
];
async function notFoundChecks() {
  for (const path of notFound) {
    try {
      // A trailing slash may be normalised once (308) before the 404; nothing else may redirect.
      const { hops, final } = await chain(path);
      assert(hops.every(hop => hop.status === 308 && new URL(hop.location!, base).pathname === new URL(hop.url).pathname.replace(/\/$/, '')), `${path}: unexpected redirect ${JSON.stringify(hops)}`);
      assert.equal(final.status, 404, `${path}: expected a real 404, got ${final.status}`);
      const response = await fetch(final.url);
      const html = await response.text();
      assert.equal(response.status, 404, `${path}: the 404 is not stable`);
      assert(response.headers.get('x-robots-tag')?.includes('noindex'), `${path}: 404 without noindex`);
      assert(html.includes('Cette page nous') && html.includes('échappe'), `${path}: not the prototype 404 page`);
    } catch (e) { fail(String(e)); }
  }
}

async function main() {
  await Promise.all(Array.from({ length: 4 }, worker));
  await contextChecks().catch(e => fail(`context checks: ${e}`));
  await aliasChecks();
  await notFoundChecks();
  const unused = [...externalAllowlist].filter(url => !externals.has(url));
  check(unused.length === 0, `allowlisted external URLs never linked: ${unused.join(', ')}`);
  console.log(JSON.stringify({ base, checkedRoutes: renderedPaths.length, distinctLinks: links.size, externalLinks: [...externals], aliasesChecked: aliases.length, redirectsChecked, notFoundChecked: notFound.length, errors }, null, 2));
  if (errors.length) process.exitCode = 1;
}
main().catch(error => { console.error(error); process.exitCode = 1; });
