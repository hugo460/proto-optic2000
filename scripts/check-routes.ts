import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { products, brands } from '../src/data';
import { stores } from '../src/data/stores';
async function main() {
  const base = process.env.OPTIC_BASE_URL ?? 'http://127.0.0.1:3011';
  const paths = ['/', '/solaires', '/catalogue', '/marques', '/magasins', '/robots.txt', ...products.map(p => `/produits/${p.slug}`), ...brands.map(b => `/marques/${b.id}`), ...stores.map(s => `/magasins/${s.slug}`)];
  const allowed = new Set(paths);
  const links = new Set<string>();
  let cursor = 0;
  const errors: string[] = [];
  async function worker() {
    while (cursor < paths.length) {
      const path = paths[cursor++];
      try {
        const response = await fetch(base + path);
        assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
        assert(response.headers.get('x-robots-tag')?.includes('noindex'));
        const html = await response.text();
        for (const match of html.matchAll(/<a\b[^>]*href="([^"]*)"/g)) {
          const href = match[1].replaceAll('&amp;', '&'); links.add(href);
          if (href === '#contenu') continue;
          assert(href && href !== '#', `${path}: empty link`);
          if (href.startsWith('/')) assert(allowed.has(new URL(href, base).pathname), `${path}: unknown internal link ${href}`);
          if (href.startsWith('tel:')) assert(stores.some(s => href === `tel:${s.phone}`));
          if (href.startsWith('mailto:')) assert(stores.some(s => href === `mailto:${s.email}`));
          if (href.startsWith('http')) assert(stores.some(s => href === s.mapUrl), `Unexpected external link ${href}`);
        }
        for (const match of html.matchAll(/src="(\/media\/[^"?]+)"/g)) assert(existsSync(`public${match[1]}`));
      } catch (e) { errors.push(String(e)); }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  for (const path of ['/produits/inconnu', '/marques/inconnue', '/magasins/inconnu', '/page-inconnue']) {
    const response = await fetch(base + path);
    if (response.status !== 404) errors.push(`${path}: expected 404, got ${response.status}`);
  }
  console.log(JSON.stringify({ base, checkedRoutes: paths.length, distinctLinks: links.size, errors }, null, 2));
  if (errors.length) process.exitCode = 1;
}
main().catch(error => { console.error(error); process.exitCode = 1; });
