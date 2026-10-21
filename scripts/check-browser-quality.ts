import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
async function main() {
  const root = process.env.OPTIC_PROOF_DIR;
  if (!root) throw new Error('OPTIC_PROOF_DIR must be outside Git.');
  const base = process.env.OPTIC_BASE_URL ?? 'http://127.0.0.1:3012';
  const out = join(root, 'captures'); await mkdir(out, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const remote: string[] = [], errors: string[] = [], records = [];
  await context.route(/optic2000tahiti\.com/, r => { remote.push(r.request().url()); return r.abort(); });
  page.on('pageerror', e => errors.push(e.message));
  async function loaded() {
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(async i => { i.loading = 'eager'; try { await i.decode(); } catch { /* intentional missing-image case recorded */ } })); });
  }
  async function capture(name: string, fullPage = false) {
    await loaded();
    const state = await page.evaluate(() => ({ url: location.href, viewport: innerWidth, width: document.documentElement.scrollWidth, focus: document.activeElement?.tagName, focusOutline: document.activeElement ? getComputedStyle(document.activeElement).outlineColor : null }));
    assert(state.width <= state.viewport, `${name}: horizontal overflow`);
    await page.screenshot({ path: join(out, `${name}.png`), fullPage, animations: 'disabled' });
    records.push({ name, ...state });
  }
  await page.goto(base + '/'); await loaded();
  await page.getByRole('button', { name: 'Menu', exact: true }).focus(); await page.keyboard.press('Enter');
  await page.getByRole('dialog').waitFor(); await page.keyboard.press('Tab');
  assert(await page.evaluate(() => document.querySelector('dialog')?.contains(document.activeElement)));
  await capture('menu-open-mobile'); await page.keyboard.press('Escape');
  assert(await page.getByRole('button', { name: 'Menu', exact: true }).evaluate(e => e === document.activeElement));
  await page.goto(base + '/solaires?q=Glory');
  await page.getByRole('button', { name: 'Filtres et tri', exact: true }).click();
  await capture('filters-open-mobile', true);
  await page.setViewportSize({ width: 360, height: 844 }); await page.goto(base + '/'); await capture('home-360', true);
  await page.goto(base + '/solaires'); await capture('catalogue-360');
  await page.goto(base + '/produits/glory-glory?variante=1608'); await capture('glory-360', true);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.goto(base + '/solaires');
  const filters = page.getByRole('button', { name: 'Filtres et tri', exact: true });
  assert.equal(await filters.getAttribute('aria-expanded'), 'false');
  await filters.focus(); await page.keyboard.press('Enter');
  assert(await page.getByRole('combobox', { name: 'Budget', exact: true }).isVisible());
  await capture('filters-open-tablet');
  await page.keyboard.press('Enter'); assert.equal(await filters.getAttribute('aria-expanded'), 'false');
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto(base + '/marques'); await capture('brands-mobile');
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto(base + '/marques?univers=Observation'); await capture('brands-observation-desktop', true);
  for (const slug of ['centre-ville', 'mamao']) { await page.goto(base + `/magasins/${slug}`); await capture(`store-${slug}-desktop`, true); }
  await page.goto(base + '/produits/glory-glory');
  const color = page.getByRole('button', { name: 'Noir brillant Manchester United', exact: true });
  await color.focus(); await page.keyboard.press('Enter'); await capture('variant-keyboard-desktop');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/_next/image?**', r => (new URL(r.request().url()).searchParams.get('url') ?? '').includes('HS833-12F_quarter') ? r.abort() : r.continue());
  await page.goto(base + '/produits/glory-glory?variante=774');
  await page.locator('.product-main-image .image-fallback').waitFor(); await capture('missing-photo-mobile');
  const zoom = await browser.newContext({ viewport: { width: 720, height: 500 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const zoomPage = await zoom.newPage();
  for (const route of ['/', '/solaires', '/produits/glory-glory', '/marques/ray-ban', '/magasins/taravao']) {
    await zoomPage.goto(base + route); await zoomPage.waitForLoadState('networkidle');
    const state = await zoomPage.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth, dpr: devicePixelRatio }));
    assert(state.width <= state.viewport, `Zoom reflow ${route}`); records.push({ name: 'zoom-reflow', route, ...state });
  }
  await zoomPage.goto(base + '/'); await zoomPage.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(async i => { i.loading='eager'; await i.decode().catch(() => {}); })); });
  await zoomPage.screenshot({ path: join(out, 'zoom-200-equivalent.png'), fullPage: false });
  await writeFile(join(root, 'browser-quality.json'), JSON.stringify({ timestamp: new Date().toISOString(), zoomMethod: 'Equivalent reflow: CSS viewport 720x500, DPR 2, output 1440x1000; not a manual browser zoom gesture.', records, remote, errors }, null, 2));
  await browser.close(); assert.equal(remote.length, 0); assert.equal(errors.length, 0);
  console.log(`${records.length} checks; 360 px, keyboard, menu, filter panel, missing photo, three stores and equivalent 200% reflow; zero overflow/errors/WordPress requests.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
