import { chromium } from '@playwright/test';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
async function main() {
const root = process.env.OPTIC_PROOF_DIR;
if (!root) throw new Error('Set OPTIC_PROOF_DIR to an evidence folder outside Git.');
const base = process.env.OPTIC_BASE_URL ?? 'http://127.0.0.1:3011';
const out = join(root, 'captures');
await mkdir(out, { recursive: true });
await mkdir('.impeccable/review', { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ reducedMotion: 'reduce' });
const forbidden: string[] = [];
const errors: string[] = [];
const hosts = new Set<string>();
await context.route(/optic2000tahiti\.com/, route => { forbidden.push(route.request().url()); return route.abort(); });
context.on('request', request => hosts.add(new URL(request.url()).host));
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
const scenarios = [
  ['home-desktop', '/', 1440, 1000, true], ['home-tablet', '/', 768, 1024, true], ['home-mobile', '/', 390, 844, true],
  ['catalogue-desktop', '/solaires', 1440, 1000, false], ['catalogue-tablet', '/solaires', 768, 1024, false], ['catalogue-mobile', '/solaires', 390, 844, false],
  ['glory-desktop', '/produits/glory-glory?variante=1608', 1440, 1000, true], ['glory-tablet', '/produits/glory-glory?variante=1608', 768, 1024, true], ['glory-mobile', '/produits/glory-glory?variante=1608', 390, 844, true],
  ['baby-long-mobile', '/produits/baby-beach?variante=1549', 390, 844, true],
  ['rayban-desktop', '/marques/ray-ban', 1440, 1000, true], ['rayban-mobile', '/marques/ray-ban', 390, 844, true],
  ['stores-desktop', '/magasins', 1440, 1000, true], ['stores-mobile', '/magasins', 390, 844, true],
  ['taravao-desktop', '/magasins/taravao', 1440, 1000, true], ['taravao-mobile', '/magasins/taravao', 390, 844, true],
  ['empty-mobile', '/solaires?q=zzzintrouvable', 390, 844, false],
] as const;
const records = [];
for (const [name, route, width, height, fullPage] of scenarios) {
  await page.setViewportSize({ width, height });
  await page.goto(base + route);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(async image => { image.loading = 'eager'; try { await image.decode(); } catch { /* failure is recorded below */ } }));
    window.scrollTo(0, 0);
  });
  const measurements = await page.evaluate(() => ({
    title: document.title, pageWidth: document.documentElement.scrollWidth, viewport: innerWidth,
    broken: [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src')),
    fallbackCount: document.querySelectorAll('.image-fallback').length,
    firstRowBottom: (() => {
      const grid = document.querySelector('.catalogue-page .product-grid');
      if (!grid) return null;
      const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      return Math.max(...[...grid.children].slice(0, columns).map(card => card.getBoundingClientRect().bottom));
    })(),
  }));
  await page.screenshot({ path: join(out, `${name}.png`), fullPage, animations: 'disabled' });
  records.push({ name, route, width, height, fullPage, ...measurements });
  if (name === 'home-desktop') await copyFile(join(out, `${name}.png`), '.impeccable/review/desktop.png');
  if (name === 'home-mobile') await copyFile(join(out, `${name}.png`), '.impeccable/review/mobile.png');
  if (name === 'home-tablet') await copyFile(join(out, `${name}.png`), '.impeccable/review/tablet.png');
  console.log(`${name}: ${measurements.pageWidth}/${width}px, ${measurements.broken.length} broken, ${measurements.fallbackCount} fallbacks`);
}
await writeFile(join(root, 'capture-manifest.json'), JSON.stringify({ timestamp: new Date().toISOString(), base, records, forbidden, errors, hosts: [...hosts] }, null, 2));
await browser.close();
if (forbidden.length || errors.length || records.some(r => r.broken.length || r.fallbackCount || r.pageWidth > r.width || (r.firstRowBottom !== null && r.firstRowBottom > r.height))) process.exitCode = 1;

}
main().catch(error => { console.error(error); process.exitCode = 1; });
