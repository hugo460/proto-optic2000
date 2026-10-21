import test from 'node:test';
import assert from 'node:assert/strict';
import { products, solarProducts } from '../src/data';
import { emptyFilters, filterProducts, parseFilters, safeReturnPath, serializeFilters } from '../src/lib/catalogue';
import { resolveVariant, variantGallery } from '../src/lib/variants';
import { formatXpf } from '../src/lib/money';
import { changeSelection, lensOptions, readSelection, selectionLines, selectionParams, sharesOnePrice } from '../src/lib/lens-selection';
import { readVisitContext, validateContact, visitParams } from '../src/lib/contact-context';
import { stores } from '../src/data/stores';
import { legacyRedirects } from '../src/lib/legacy-redirects';
const glory = products.find(p => p.slug === 'glory-glory')!;
test('Glory Glory keeps the five source prices and frame photographs', () => {
  const expected = [[774, 34600, 'HS833-12F'], [775, 34600, 'RS833-13D'], [1606, 34600, 'GS833-24S'], [1607, 34600, 'B833-11'], [1608, 38100, 'GS833-02UTD']] as const;
  for (const [id, price, image] of expected) {
    const variant = resolveVariant(glory, String(id))!;
    assert.equal(variant.price, price);
    assert(variant.image.origin.includes(image));
    assert.equal(variantGallery(glory, variant)[0].origin, variant.image.origin);
  }
  assert.equal(resolveVariant(glory, null), undefined);
  assert.equal(resolveVariant(glory, 'invalid'), undefined);
});
test('Open sphere means compatible option; positive and negative correction labels stay distinct', () => {
  const lens = products.find(p => p.slug === 'freshlook-colorblends')!;
  const sphere = lens.attributes.find(a => a.name === 'Sphère')!;
  assert.equal(sphere.terms.find(t => t.slug === '2-00')?.name, '+2.00');
  assert.equal(sphere.terms.find(t => t.slug === '2-00-2')?.name, '-2.00');
  assert.equal(lens.defaultAttributes.attribute_pa_sphere, '0-00');
  assert.equal(resolveVariant(lens, null), undefined, 'a default sphere alone must not silently choose a color');
  assert(lens.variants.every(v => v.attributes.attribute_pa_sphere === ''));
  assert(lens.variants.every(v => v.labels.attribute_pa_sphere === 'Toute option compatible'));
});
test('Cumulative filters, URL roundtrip, ordering and no results', () => {
  const f = { ...emptyFilters, q: 'Glory', gender: 'femme', color: 'cannelle-transparente', budget: '30000-40000', sort: 'prix-desc' };
  assert.deepEqual(filterProducts(solarProducts, f).map(p => p.slug), ['glory-glory']);
  assert.deepEqual(parseFilters(new URLSearchParams(serializeFilters(f)), solarProducts).filters, f);
  assert.equal(filterProducts(solarProducts, { ...emptyFilters, q: 'zzzintrouvable' }).length, 0);
  assert.equal(filterProducts(solarProducts, emptyFilters).length, 78);
  const sorted = filterProducts(solarProducts, { ...emptyFilters, sort: 'prix-asc' });
  assert(sorted.every((p, index) => index === 0 || p.minPrice >= sorted[index - 1].minPrice));
});
test('Invalid filters recover, and catalogue return URLs cannot leave this prototype', () => {
  const parsed = parseFilters(new URLSearchParams('genre=intrus&couleur=imaginaire&tri=mauvais'), solarProducts);
  assert(parsed.invalid);
  assert.deepEqual(parsed.filters, emptyFilters);
  assert.equal(safeReturnPath('/solaires?q=Glory&tri=prix-asc'), '/solaires?q=Glory&tri=prix-asc');
  for (const value of ['https://other.example', '//other.example', '/magasins', 'javascript:alert(1)']) assert.equal(safeReturnPath(value), '/solaires');
});
test('XPF has no decimals', () => assert.equal(formatXpf(38100).replace(/\s/g, ' '), '38 100 XPF'));

// Expected values below are copied from the archived source (WooCommerce Store API terms and product page variations).
const bySlug = (slug: string) => products.find(p => p.slug === slug)!;
const colorblends = bySlug('freshlook-colorblends');
const read = (product: typeof colorblends, query: string) => readSelection(product, new URLSearchParams(query));
test('Colorblends +2.00, -2.00 and 0.00 keep the real Grey variant ID and travel as distinct corrections', () => {
  const plus = read(colorblends, 'couleur=grey&sphere=2-00');
  const minus = read(colorblends, 'couleur=grey&sphere=2-00-2');
  const plano = read(colorblends, 'couleur=grey&sphere=0-00');
  const absent = read(colorblends, 'couleur=grey');
  assert.deepEqual([plus, minus, plano].map(s => [s.variant?.id, s.chosen.sphere?.name, s.status]), [[1949, '+2.00', 'complete'], [1949, '-2.00', 'complete'], [1949, '0.00', 'complete']]);
  assert.equal(plus.variant!.attributes.attribute_pa_sphere, '', 'the source variant keeps its open sphere');
  assert.equal(selectionParams(plus).toString(), 'variante=1949&couleur=grey&sphere=2-00');
  assert.equal(selectionParams(minus).toString(), 'variante=1949&couleur=grey&sphere=2-00-2');
  assert.equal(absent.variant?.id, 1949);
  assert.equal(absent.chosen.sphere, undefined, 'no correction is not 0.00');
  assert.equal(absent.status, 'incomplete');
  assert.deepEqual(selectionLines(absent), [{ label: 'Couleur', value: 'Grey' }, { label: 'Sphère', value: 'à préciser' }]);
  assert.equal(plus.variant!.price, 2900);
  const spheres = plus.options.find(o => o.param === 'sphere')!.terms.map(t => t.name);
  assert.deepEqual([spheres[0], spheres[29], spheres[30], spheres.at(-1)], ['-8.50', '0.00', '+0.25', '+6.00']);
  assert.equal(spheres.length, 46);
});
test('A default sphere or a sphere alone never chooses a colour; a variant-only link proves only its colour', () => {
  const empty = read(colorblends, '');
  assert.equal(empty.status, 'empty');
  assert.equal(empty.variant, undefined);
  assert.deepEqual(empty.chosen, {});
  const sphereOnly = read(colorblends, 'sphere=0-00');
  assert.equal(sphereOnly.variant, undefined);
  assert.equal(sphereOnly.chosen.couleur, undefined);
  assert.equal(sphereOnly.status, 'incomplete');
  const variantOnly = read(colorblends, 'variante=1949');
  assert.equal(variantOnly.chosen.couleur?.name, 'Grey');
  assert.equal(variantOnly.chosen.sphere, undefined);
  assert.equal(selectionParams(variantOnly).toString(), 'variante=1949&couleur=grey');
});
test('Foreign, unknown and contradictory parameters are rejected without a false selection', () => {
  for (const query of ['variante=774', 'variante=1957', 'variante=abc', 'variante=']) {
    const selection = read(colorblends, query);
    assert.equal(selection.variant, undefined, query);
    assert.deepEqual(selection.chosen, {}, query);
  }
  assert.deepEqual(read(colorblends, 'variante=774').rejected, ['variante']);
  const badOptions = read(colorblends, 'couleur=pure-hazel&sphere=%2B2.00');
  assert.deepEqual(badOptions.rejected.sort(), ['couleur', 'sphere']);
  assert.equal(badOptions.status, 'empty');
  const conflict = read(colorblends, 'variante=1949&couleur=blue&sphere=2-00-2');
  assert.deepEqual(conflict.rejected, ['variante']);
  assert.deepEqual([conflict.variant?.id, conflict.chosen.couleur?.name, conflict.chosen.sphere?.name], [1944, 'Blue', '-2.00']);
  const freshlook = bySlug('freshlook-1-day');
  assert.deepEqual(read(freshlook, 'couleur=grey&sphere=2-00').rejected, ['sphere'], '+2.00 is not offered on FreshLook 1-Day');
});
test('Every lens variant is reachable by its colour, with its own ID, price and image', () => {
  const lenses = products.filter(p => p.kind === 'lens');
  assert.equal(lenses.flatMap(p => p.variants).length, 33);
  for (const product of lenses) for (const variant of product.variants) {
    const selection = read(product, `couleur=${variant.attributes['attribute_pa_couleur-lentilles']}&sphere=0-00`);
    assert.equal(selection.variant?.id, variant.id);
    assert.equal(selection.variant?.price, variant.price);
    assert.equal(selection.variant?.image.src, variant.image.src);
  }
});
test('The simple TruBlends 5-colour box is operable without invented options', () => {
  const simple = bySlug('trublends-one-day-5-couleurs');
  const selection = read(simple, 'variante=1937&couleur=blue');
  assert.equal(selection.status, 'fixed');
  assert.deepEqual(selection.options, []);
  assert.equal(selection.variant, undefined);
  assert.deepEqual(selection.rejected, ['variante']);
  assert.equal(selectionParams(selection).toString(), '');
  assert.equal(simple.price, 2200);
  const glory = read(products.find(p => p.slug === 'glory-glory')!, 'variante=1608&couleur=x');
  assert.deepEqual([glory.status, glory.variant?.id, glory.rejected], ['complete', 1608, []]);
});
test('Visit context round-trips public identifiers only; unknown values are ignored; prostheses go to Mamao', () => {
  const source = { products, stores };
  const query = 'sujet=lentilles&magasin=taravao&produit=freshlook-colorblends&variante=1949&couleur=grey&sphere=2-00-2';
  const context = readVisitContext(new URLSearchParams(query), source);
  assert.equal(visitParams(context).toString(), query);
  assert.equal(visitParams(readVisitContext(visitParams(context), source)).toString(), query);
  const deduced = readVisitContext(new URLSearchParams('produit=freshlook-1-day&couleur=green'), source);
  assert.deepEqual([deduced.subject, deduced.subjectFromProduct, deduced.selection?.variant?.id], ['lentilles', true, 1958]);
  const unknown = readVisitContext(new URLSearchParams('sujet=promo&magasin=paris&produit=inconnu&variante=1949&nom=Test'), source);
  assert.deepEqual([unknown.selection, unknown.store, unknown.subject], [undefined, undefined, undefined]);
  assert.deepEqual(unknown.rejected.sort(), ['magasin', 'produit', 'sujet', 'variante']);
  assert.equal(visitParams(unknown).toString(), '');
  const prosthesis = readVisitContext(new URLSearchParams('sujet=protheses&magasin=taravao'), source);
  assert.deepEqual([prosthesis.store?.slug, prosthesis.storeFromSubject], ['mamao', true]);
  assert.equal(readVisitContext(new URLSearchParams('sujet=protheses&magasin=mamao'), source).storeFromSubject, false);
});
test('Simulated contact validation names each missing field and keeps the prosthesis rule', () => {
  const slugs = stores.map(s => s.slug);
  const empty = { store: '', subject: '', name: '', email: '', phone: '', message: '' };
  assert.deepEqual(Object.keys(validateContact(empty, slugs)), ['store', 'subject', 'name', 'email', 'message']);
  const valid = { store: 'taravao', subject: 'lentilles', name: 'Test Démo', email: 'demo@example.com', phone: '', message: 'Question de démonstration.' };
  assert.deepEqual(validateContact(valid, slugs), {});
  assert.deepEqual(Object.keys(validateContact({ ...valid, subject: 'protheses' }, slugs)), ['store']);
  assert.deepEqual(validateContact({ ...valid, subject: 'protheses', store: 'mamao' }, slugs), {});
  assert.deepEqual(Object.keys(validateContact({ ...valid, email: 'demo@', phone: 'abc' }, slugs)), ['email', 'phone']);
  assert.deepEqual(validateContact({ ...valid, phone: '+689 40 42 19 44' }, slugs), {});
});

test('Changing one option keeps the other choice and recomputes the real variant ID', () => {
  const grey = read(colorblends, 'variante=1949&couleur=grey&sphere=2-00');
  const toBlue = changeSelection(grey, 'couleur', 'blue');
  assert.equal(toBlue.toString(), 'variante=1944&couleur=blue&sphere=2-00', 'Blue is variation 1944 in the source and keeps +2.00');
  const toMinus = changeSelection(grey, 'sphere', '2-00-2');
  assert.equal(toMinus.toString(), 'variante=1949&couleur=grey&sphere=2-00-2', 'the same variation, the opposite sign');
  assert.equal(changeSelection(grey, 'sphere', null).toString(), 'variante=1949&couleur=grey', 'clearing the correction keeps the colour and its ID');
  assert.equal(changeSelection(grey, 'couleur', null).toString(), 'sphere=2-00', 'clearing the colour drops the ID but keeps the correction');
  assert.equal(changeSelection(grey, 'sphere', 'inconnue').toString(), 'variante=1949&couleur=grey', 'an unknown value is dropped, never stored');
  const foreign = read(colorblends, 'variante=774');
  assert.equal(changeSelection(foreign, 'couleur', 'blue').toString(), 'variante=1944&couleur=blue', 'choosing an option heals a foreign ID');
});
test('FreshLook 1-Day offers no positive correction; every other lens keeps its source options', () => {
  const sphere = (slug: string) => lensOptions(bySlug(slug)).find(o => o.param === 'sphere')?.terms.map(t => t.name);
  assert(sphere('freshlook-1-day')!.every(name => name === '0.00' || name.startsWith('-')), '+2.00 is not offered on FreshLook 1-Day');
  assert.equal(sphere('freshlook-1-day')!.length, 24);
  assert.equal(sphere('trublends-one-day')!.length, 24);
  assert.equal(sphere('colourvue-crazylens-one-day')!.length, 12);
  assert.equal(sphere('freshlook-colorblends')!.length, 46);
  assert.deepEqual(lensOptions(bySlug('trublends-one-day-5-couleurs')), []);
  assert.deepEqual(lensOptions(glory), [], 'solar frames never get lens options');
  assert.equal(lensOptions(bySlug('freshlook-1-day')).find(o => o.param === 'couleur')!.terms.length, 4);
  for (const lens of products.filter(p => p.kind === 'lens')) assert.equal(sharesOnePrice(lens), true, `${lens.slug}: one catalogue price per lens`);
});
test('Contact validation boundaries: message 10 to 1000 characters, name 2, phone 6 to 15 digits, e-mail with spaces', () => {
  const slugs = stores.map(s => s.slug);
  const valid = { store: 'centre-ville', subject: 'autre', name: 'Test Démo', email: 'demo@example.com', phone: '', message: 'Dix signes' };
  assert.deepEqual(validateContact(valid, slugs), {});
  assert.deepEqual(Object.keys(validateContact({ ...valid, message: '123456789' }, slugs)), ['message']);
  assert.deepEqual(validateContact({ ...valid, message: 'x'.repeat(1000) }, slugs), {});
  assert.deepEqual(Object.keys(validateContact({ ...valid, message: 'x'.repeat(1001) }, slugs)), ['message']);
  assert.deepEqual(Object.keys(validateContact({ ...valid, message: '          ' }, slugs)), ['message'], 'blanks are not a message');
  assert.deepEqual(Object.keys(validateContact({ ...valid, name: 'A' }, slugs)), ['name']);
  assert.deepEqual(Object.keys(validateContact({ ...valid, name: ' A ' }, slugs)), ['name']);
  assert.deepEqual(validateContact({ ...valid, phone: '12 34 56' }, slugs), {});
  assert.deepEqual(Object.keys(validateContact({ ...valid, phone: '12345' }, slugs)), ['phone']);
  assert.deepEqual(Object.keys(validateContact({ ...valid, phone: '1'.repeat(16) }, slugs)), ['phone']);
  assert.deepEqual(validateContact({ ...valid, email: '  demo@example.com  ' }, slugs), {});
  assert.deepEqual(Object.keys(validateContact({ ...valid, email: 'de mo@example.com' }, slugs)), ['email']);
  assert.deepEqual(Object.keys(validateContact({ ...valid, store: 'paris' }, slugs)), ['store']);
  assert.deepEqual(Object.keys(validateContact({ ...valid, subject: 'promo' }, slugs)), ['subject']);
});
test('Legacy aliases: exact paths, filters kept, product pattern limited to the 83 recovered slugs, excluded pages absent', () => {
  const alias = (source: string) => legacyRedirects.find(r => r.source === source)?.destination;
  assert.equal(alias('/maui-jim-pour-femmes'), '/solaires?genre=femme');
  assert.equal(alias('/maui-jim-pour-hommes'), '/solaires?genre=homme');
  assert.equal(alias('/boutique'), '/catalogue');
  assert.equal(alias('/protheses-occulaires'), '/protheses-oculaires', 'the old double-c spelling');
  assert.equal(alias('/lentille-couleur-et-fantaisie'), '/lentilles#couleur-et-fantaisie');
  assert.equal(alias('/nos-offres'), '/services-et-garanties#offres-historiques');
  for (const store of stores) assert.equal(alias(`/${store.slug}`), `/magasins/${store.slug}`);
  assert.equal(legacyRedirects.length, 13);
  const pattern = legacyRedirects.find(r => r.source.startsWith('/produit/'))!;
  assert.equal(pattern.source.match(/\|/g)!.length, 82, '83 alternatives, no wildcard');
  assert.equal(pattern.destination, '/produits/:slug');
  for (const excluded of ['/mon-compte', '/panier', '/commander', '/produit', '/produit/']) assert.equal(alias(excluded), undefined);
});
