import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { products } from '../src/data';
async function main() {
  const root = process.env.OPTIC_PROOF_DIR;
  if (!root) throw new Error('OPTIC_PROOF_DIR must be outside Git.');
  assert(relative(process.cwd(), resolve(root)).startsWith('..'), 'OPTIC_PROOF_DIR must be outside the repository.');
  const base = process.env.OPTIC_BASE_URL ?? 'http://127.0.0.1:3012';
  const out = join(root, 'captures'); await mkdir(out, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const remote: string[] = [], errors: string[] = [], records: Record<string, unknown>[] = [];
  // S2 checks collect every finding instead of stopping at the first one; S1 assertions below stay fail-fast.
  const findings: string[] = [];
  const check = (condition: unknown, message: string) => { if (!condition) findings.push(message); };
  const s1Routes = ['/', '/solaires', '/produits/glory-glory', '/marques/ray-ban', '/magasins/taravao'];
  const s2Routes = [
    '/lunettes-de-vue', '/lentilles', '/jumelles-et-telescopes', '/basse-vision', '/protheses-oculaires', '/services-et-garanties', '/qui-sommes-nous', '/contact',
    '/contact?magasin=taravao&produit=freshlook-colorblends&variante=1949&couleur=grey&sphere=2-00-2', '/mentions-legales', '/politique-de-confidentialite', '/cgv',
    '/produits/freshlook-colorblends?variante=1949&couleur=grey&sphere=2-00', '/produits/freshlook-colorblends?variante=774', '/produits/trublends-one-day-5-couleurs', '/produits/baby-beach?variante=1549',
    '/marques', '/marques/bosma', '/marques/versace', '/magasins', '/magasins/mamao',
  ];
  await context.route(/optic2000tahiti\.com/, r => { remote.push(r.request().url()); return r.abort(); });
  page.on('pageerror', e => errors.push(e.message));
  async function loaded() {
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(async i => { i.loading = 'eager'; try { await i.decode(); } catch { /* intentional missing-image case recorded */ } })); });
  }
  async function health() {
    return page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(async i => { i.loading = 'eager'; try { await i.decode(); } catch { /* counted as broken below */ } }));
      return { width: document.documentElement.scrollWidth, viewport: innerWidth, h1: document.querySelectorAll('h1').length, fallbacks: document.querySelectorAll('.image-fallback').length, broken: [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src') ?? '') };
    });
  }
  async function capture(name: string, fullPage = false) {
    await loaded();
    await page.evaluate(async () => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); await new Promise<void>(done => requestAnimationFrame(() => requestAnimationFrame(() => done()))); });
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
  // S2: every new route and the S1 routes at 360 px, long names included (Baby Beach variant, Noir brillant Manchester United).
  for (const route of [...s1Routes, ...s2Routes]) {
    await page.goto(base + route);
    const state = await health();
    check(state.width <= state.viewport, `360px ${route}: horizontal overflow ${state.width}/${state.viewport}`);
    check(state.broken.length === 0, `360px ${route}: broken images ${state.broken.join(', ')}`);
    check(state.fallbacks === 0, `360px ${route}: ${state.fallbacks} image fallbacks`);
    check(state.h1 === 1, `360px ${route}: ${state.h1} h1`);
    records.push({ name: 'width-360', route, ...state });
  }
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
  await page.unroute('**/_next/image?**');
  const zoom = await browser.newContext({ viewport: { width: 720, height: 500 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  await zoom.route(/optic2000tahiti\.com/, r => { remote.push(r.request().url()); return r.abort(); });
  const zoomPage = await zoom.newPage();
  zoomPage.on('pageerror', e => errors.push(e.message));
  for (const route of [...s1Routes, ...s2Routes]) {
    await zoomPage.goto(base + route); await zoomPage.waitForLoadState('networkidle');
    const state = await zoomPage.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(async i => { i.loading = 'eager'; try { await i.decode(); } catch { /* counted as broken below */ } }));
      return { viewport: innerWidth, width: document.documentElement.scrollWidth, dpr: devicePixelRatio, broken: [...document.images].filter(i => !i.complete || i.naturalWidth === 0).length };
    });
    check(state.width <= state.viewport, `Reflow 720x500 @2x ${route}: horizontal overflow ${state.width}/${state.viewport}`);
    check(state.broken === 0, `Reflow 720x500 @2x ${route}: ${state.broken} broken images`);
    records.push({ name: 'zoom-reflow', route, ...state });
  }
  await zoomPage.goto(base + '/'); await zoomPage.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(async i => { i.loading='eager'; await i.decode().catch(() => {}); })); });
  await zoomPage.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
  await zoomPage.screenshot({ path: join(out, 'zoom-200-equivalent.png'), fullPage: false });
  await zoom.close();

  // ---- S2: keyboard order and visible focus ring through the contact form (360 px) -------------------------------------
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(base + '/contact');
  await page.waitForFunction(() => !document.querySelector<HTMLButtonElement>('.contact-submit button')?.disabled);
  await page.bringToFront();
  await loaded();
  const ring = () => page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    if (!element) return null;
    // The radio buttons draw their ring on the whole choice.
    const target = element.matches('input[type=radio]') ? element.closest('label')! : element;
    const style = getComputedStyle(target);
    return { id: element.id || (element.matches('.contact-submit button') ? 'submit' : element.tagName.toLowerCase()), outlineStyle: style.outlineStyle, outlineWidth: parseFloat(style.outlineWidth) };
  });
  await page.keyboard.press('Tab');
  await page.evaluate(() => new Promise<void>(done => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
  const skip = await page.evaluate(() => ({ skip: document.activeElement?.classList.contains('skip-link'), onScreen: (document.activeElement?.getBoundingClientRect().bottom ?? 0) > 0, active: document.activeElement?.outerHTML, transform: document.activeElement ? getComputedStyle(document.activeElement).transform : null, top: document.activeElement?.getBoundingClientRect().top, documentFocused: document.hasFocus() }));
  records.push({ name: 'skip-link-first-tab', ...skip });
  check(skip.skip && skip.onScreen, 'The skip link is the first Tab stop and appears on screen when focused');
  for (const id of ['contact-store-centre-ville', 'contact-subject', 'contact-name', 'contact-email', 'contact-phone', 'contact-message', 'submit']) {
    let reached = null as Awaited<ReturnType<typeof ring>>;
    for (let step = 0; step < 40; step++) { await page.keyboard.press('Tab'); reached = await ring(); if (reached?.id === id) break; }
    check(reached?.id === id, `Contact form: Tab never reached ${id}, in order`);
    check(reached && reached.outlineStyle !== 'none' && reached.outlineWidth >= 2, `Contact form: no visible focus ring on ${id} (${JSON.stringify(reached)})`);
    records.push({ name: 'contact-focus-ring', ...reached });
  }
  // Universes panel: Escape closes it and returns the focus to its button.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + '/');
  const universeButton = page.getByRole('button', { name: 'Nos univers' });
  await universeButton.focus(); await page.keyboard.press('Enter');
  check(await page.locator('#universe-panel').isVisible(), 'Universes panel opens with Enter');
  await page.keyboard.press('Tab'); await page.keyboard.press('Escape');
  check(!(await page.locator('#universe-panel').isVisible()) && await universeButton.evaluate(el => el === document.activeElement), 'Escape closes the universes panel and returns the focus to its button');

  // ---- S2: long unbroken input at 360 px, form then success -----------------------------------------------------------
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(base + '/contact?magasin=mamao&sujet=autre');
  await page.waitForFunction(() => !document.querySelector<HTMLButtonElement>('.contact-submit button')?.disabled);
  await page.getByLabel('Nom', { exact: true }).fill('Longuenomfictif'.repeat(6).slice(0, 80));
  await page.getByLabel('E-mail', { exact: true }).fill('prenom.nom.tres.long.de.demonstration@example.com');
  await page.getByLabel('Message', { exact: true }).fill(`Message fictif ${'x'.repeat(60)} https://example.com/${'a'.repeat(80)}`);
  for (const stage of ['form', 'success', 'reset']) {
    if (stage === 'success') await page.getByRole('button', { name: 'Préparer la demande', exact: true }).click();
    if (stage === 'reset') await page.getByRole('button', { name: /Préparer une autre demande/ }).click();
    const state = await health();
    check(state.width <= state.viewport, `Long input, ${stage}: horizontal overflow ${state.width}/${state.viewport}`);
    records.push({ name: 'contact-long-input', stage, ...state });
  }

  // ---- S2: missing images on the new pages keep the path usable ------------------------------------------------------
  await page.setViewportSize({ width: 390, height: 844 });
  const imageOf = (slug: string, id: number) => products.find(p => p.slug === slug)!.variants.find(v => v.id === id)!.image.src.split('/').pop()!;
  const blocking = async (stem: string, run: () => Promise<void>) => {
    const handler = (r: import('@playwright/test').Route) => (new URL(r.request().url()).searchParams.get('url') ?? '').includes(stem) ? r.abort() : r.continue();
    await page.route('**/_next/image?**', handler);
    try { await run(); } finally { await page.unroute('**/_next/image?**', handler); }
  };
  await blocking(imageOf('freshlook-colorblends', 1949), async () => {
    await page.goto(base + '/produits/freshlook-colorblends?variante=1949&couleur=grey&sphere=2-00');
    await page.locator('.product-main-image .image-fallback').waitFor();
    check(await page.getByRole('link', { name: 'Se renseigner en magasin' }).isVisible() && await page.locator('a.product-request-link').isVisible(), 'Missing lens photo: store and contact actions remain');
    check((await page.locator('.lens-status').textContent())?.includes('couleur Grey, sphère +2.00'), 'Missing lens photo: the selection stays readable');
    const state = await health(); check(state.width <= state.viewport, 'Missing lens photo: overflow'); records.push({ name: 'missing-lens-photo', ...state });
  });
  await blocking('b413c0bdf9', async () => {
    await page.goto(base + '/jumelles-et-telescopes');
    await page.locator('.object-plate .image-fallback').waitFor();
    check(await page.locator('.object-plate img').count() === 1, 'Missing telescope photo: the binoculars photo still loads');
    const state = await health(); check(state.width <= state.viewport, 'Missing observation photo: overflow'); records.push({ name: 'missing-observation-photo', ...state });
  });
  await blocking('fb0fe3968d', async () => {
    await page.goto(base + '/jumelles-et-telescopes');
    await page.locator('.brand-tiles .image-fallback').first().waitFor();
    check(await page.locator('.brand-tiles .brand-card').filter({ hasText: 'Bosma' }).isVisible(), 'Missing Bosma logo: the tile keeps its name');
    await page.goto(base + '/marques/bosma');
    await page.locator('.brand-hero-logo .image-fallback').waitFor();
    check(await page.getByRole('heading', { level: 1, name: 'Bosma' }).isVisible(), 'Missing Bosma logo: the brand page keeps its title');
    const state = await health(); check(state.width <= state.viewport, 'Missing logo: overflow'); records.push({ name: 'missing-brand-logo', ...state });
  });
  await blocking('6b3c1455b1', async () => {
    await page.goto(base + '/qui-sommes-nous');
    await page.locator('.team-photo .image-fallback').waitFor();
    check(await page.locator('.team-photo figcaption').isVisible(), 'Missing team photo: the caption remains');
    const state = await health(); check(state.width <= state.viewport, 'Missing team photo: overflow'); records.push({ name: 'missing-team-photo', ...state });
  });

  // ---- S2: layout boundaries 801 / 1101 / 1280 px; no extra capture unless something fails ------------------------------
  for (const width of [801, 1101, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [...s1Routes, ...s2Routes]) {
      await page.goto(base + route);
      const state = await health();
      check(state.width <= state.viewport, `${width}px ${route}: horizontal overflow ${state.width}/${state.viewport}`);
      check(state.broken.length === 0 && state.fallbacks === 0, `${width}px ${route}: broken images or fallbacks`);
      if (state.width > state.viewport) { await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })); await page.screenshot({ path: join(out, `boundary-fail-${width}-${route.replace(/\W+/g, '-')}.png`), animations: 'disabled' }); }
      records.push({ name: 'boundary', boundary: width, route, ...state });
    }
  }
  await writeFile(join(root, 'browser-quality.json'), JSON.stringify({ timestamp: new Date().toISOString(), zoomMethod: 'Equivalent reflow: CSS viewport 720x500, DPR 2, output 1440x1000; not a manual browser zoom gesture, not a physical device and not an assistive-technology test.', findings, records, remote, errors }, null, 2));
  await browser.close(); assert.equal(remote.length, 0); assert.equal(errors.length, 0); assert.deepEqual(findings, []);
  console.log(`${records.length} checks; 360 px and 720x500@2x reflow on S1 and S2 routes, keyboard and focus ring, Escape, long names, missing images, 801/1101/1280 boundaries; zero overflow/errors/WordPress requests.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
