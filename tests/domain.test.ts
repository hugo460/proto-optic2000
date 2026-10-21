import test from 'node:test';
import assert from 'node:assert/strict';
import { products, solarProducts } from '../src/data';
import { emptyFilters, filterProducts, parseFilters, safeReturnPath, serializeFilters } from '../src/lib/catalogue';
import { resolveVariant, variantGallery } from '../src/lib/variants';
import { formatXpf } from '../src/lib/money';
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
