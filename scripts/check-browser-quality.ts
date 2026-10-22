import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { brands, products } from '../src/data';
import { frameInkSource, type FrameInk } from '../tests/support/frame-ink';
import { houseLinks, universes } from '../src/data/navigation';
import { stores } from '../src/data/stores';
let activeBrowser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
async function main() {
  const root = process.env.OPTIC_PROOF_DIR;
  if (!root) throw new Error('OPTIC_PROOF_DIR must be outside Git.');
  assert(relative(process.cwd(), resolve(root)).startsWith('..'), 'OPTIC_PROOF_DIR must be outside the repository.');
  const base = process.env.OPTIC_BASE_URL ?? 'http://127.0.0.1:3012';
  const out = join(root, 'captures'); await mkdir(out, { recursive: true });
  const browser = await chromium.launch();
  activeBrowser = browser;
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const remote: string[] = [], errors: string[] = [], records: Record<string, unknown>[] = [];
  // S5/r2: the main context reduces motion, so the film must never be requested during this whole run (checked at the end).
  const filmRequests: string[] = [];
  context.on('request', request => { if (request.url().includes('/media/ambience/eyewear-loop.mp4')) filmRequests.push(request.url()); });
  // S2 checks collect every finding instead of stopping at the first one; S1 assertions below stay fail-fast.
  const findings: string[] = [];
  const check = (condition: unknown, message: string) => { if (!condition) findings.push(message); };
  const s1Routes = ['/', '/solaires', '/produits/glory-glory', '/marques/ray-ban', '/magasins/taravao'];
  const s2Routes = [
    '/lunettes-de-vue', '/lentilles', '/jumelles-et-telescopes', '/basse-vision', '/protheses-oculaires', '/services-et-garanties', '/qui-sommes-nous', '/contact',
    '/contact?magasin=taravao&produit=freshlook-colorblends&variante=1949&couleur=grey&sphere=2-00-2', '/mentions-legales', '/politique-de-confidentialite', '/cgv',
    '/produits/freshlook-colorblends?variante=1949&couleur=grey&sphere=2-00', '/produits/freshlook-colorblends?variante=774', '/produits/trublends-one-day-5-couleurs', '/produits/baby-beach?variante=1549',
    '/marques', '/marques/bosma', '/marques/versace', '/magasins', '/magasins/mamao',
    // S4: the demonstration appointment, empty and with a public context.
    '/rendez-vous', '/rendez-vous?magasin=taravao&motif=conseil-montures', '/rendez-vous?magasin=mamao&produit=glory-glory&variante=1608',
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

  // ---- S4: appointment keyboard order and focus rings at 360 px, every step reachable without overflow -----------------
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(base + '/rendez-vous?magasin=taravao');
  await page.waitForFunction(() => !document.querySelector<HTMLButtonElement>('.rdv-actions [type=submit]')?.disabled);
  const rdvRing = () => page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    if (!element) return null;
    const target = element.matches('input[type=radio]') ? element.closest('label')! : element;
    const style = getComputedStyle(target);
    return { id: element.id || (element.matches('[type=submit]') ? 'submit' : element.tagName.toLowerCase()), outlineStyle: style.outlineStyle, outlineWidth: parseFloat(style.outlineWidth) };
  });
  for (const id of ['rdv-store-taravao', 'rdv-reason-controle-vue', 'submit']) {
    let reached = null as Awaited<ReturnType<typeof rdvRing>>;
    for (let step = 0; step < 40; step++) { await page.keyboard.press('Tab'); reached = await rdvRing(); if (reached?.id === id) break; }
    check(reached?.id === id, `Appointment: Tab never reached ${id}, in order`);
    check(reached && reached.outlineStyle !== 'none' && reached.outlineWidth >= 2, `Appointment: no visible focus ring on ${id} (${JSON.stringify(reached)})`);
    records.push({ name: 'appointment-focus-ring', ...reached });
    // The reason is chosen with the keyboard, then Enter on the submit button opens the slot step.
    if (id === 'rdv-reason-controle-vue') await page.keyboard.press('Space');
  }
  await page.keyboard.press('Enter');
  await page.locator('.rdv-day').first().waitFor();
  for (const stage of ['slot-step']) { const state = await health(); check(state.width <= state.viewport, `Appointment ${stage}: horizontal overflow ${state.width}/${state.viewport}`); records.push({ name: 'appointment-step', stage, ...state }); }

  // ---- S4: motion with the default preference (the main context reduces motion) ---------------------------------------
  const moving = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await moving.route(/optic2000tahiti\.com/, r => { remote.push(r.request().url()); return r.abort(); });
  const motionPage = await moving.newPage();
  motionPage.on('pageerror', e => errors.push(e.message));
  await motionPage.goto(base + '/');
  await motionPage.waitForTimeout(1000);
  const shift = () => motionPage.locator('.marquee-track').evaluate(e => new DOMMatrix(getComputedStyle(e).transform).m41);
  // The strip only runs while it is in view and the large hero keeps it below the first screen: scroll to it for real first.
  await motionPage.locator('.brand-marquee').scrollIntoViewIfNeeded();
  const a = await shift(); await motionPage.waitForTimeout(500); const b = await shift();
  check(b < a, 'Marquee moves with the default motion preference');
  await motionPage.locator('.showcase-stage').scrollIntoViewIfNeeded();
  await motionPage.getByRole('button', { name: 'Baby Beach', exact: true }).click();
  const frames: { at: number; transform: string; opacity: string }[] = [];
  for (const at of [40, 160, 320, 800]) {
    await motionPage.waitForTimeout(at - (frames.at(-1)?.at ?? 0));
    frames.push({ at, ...(await motionPage.locator('.showcase-image').evaluate(e => ({ transform: getComputedStyle(e).transform, opacity: getComputedStyle(e).opacity }))) });
  }
  const still = (transform: string) => ['none', 'matrix(1, 0, 0, 1, 0, 0)'].includes(transform);
  check(!still(frames[0].transform) && still(frames.at(-1)!.transform), `Showcase arrival moves then rests: ${JSON.stringify(frames)}`);
  records.push({ name: 'showcase-arrival-frames', frames });
  // Keyboard focus (Tab), so the ring shown is the real :focus-visible one.
  await motionPage.locator('.marquee-group a').nth(5).focus();
  await motionPage.keyboard.press('Tab');
  await motionPage.waitForTimeout(100);
  const focusState = await motionPage.evaluate(() => { const element = document.activeElement as HTMLElement; const box = element.getBoundingClientRect(), frame = element.closest('.marquee-viewport')!.getBoundingClientRect(); return { inside: box.left >= frame.left - 1 && box.right <= frame.right + 1, outline: getComputedStyle(element).outlineStyle, transform: getComputedStyle(element.closest('.marquee-track')!).transform }; });
  check(focusState.inside && focusState.outline !== 'none' && focusState.transform === 'none', `Marquee focus: still row, visible ring, logo inside: ${JSON.stringify(focusState)}`);
  records.push({ name: 'marquee-focus', ...focusState });
  await moving.close();

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

  // ---- S5/r2: home at the six review sizes and the large screen, menus at the boundaries, long names --------------------------
  // Whole photos, texts not clipped, no media control (hidden or not), every destination reachable, nothing wider than the screen.
  const longestBy = <T,>(items: readonly T[], size: (item: T) => number, count: number) => [...items].sort((a, b) => size(b) - size(a)).slice(0, count);
  for (const [width, height] of [[360, 800], [390, 844], [768, 1024], [1024, 768], [1280, 800], [1440, 900], [3024, 1964]] as const) {
    await page.setViewportSize({ width, height });
    await page.goto(base + '/');
    await page.locator('.showcase-image img').waitFor();
    for (const slug of ['glory-glory', 'baby-beach', 'the-bird']) {
      const product = products.find(item => item.slug === slug)!;
      await page.getByRole('button', { name: product.name, exact: true }).click();
      await page.locator(`.showcase-info h2:text-is("${product.name}")`).waitFor();
      await loaded();
      // The photo may be wider than a phone screen (only its white margins fall outside): the drawn frame is measured by the shared probe.
      const photo = await page.evaluate<FrameInk | null>(frameInkSource);
      const clipped = await page.evaluate(() => [...document.querySelectorAll('.showcase-info :is(h2, p, a), .showcase-link, .model-selector button')].filter(node => node.scrollWidth > node.clientWidth + 1).map(node => node.textContent?.trim() ?? ''));
      const media = product.images[0];
      check(photo, `${width}px ${slug}: showcase photo missing`);
      if (photo) {
        check(photo.loaded, `${width}px ${slug}: photo not loaded`);
        // Encoded pixels keep the source ratio; density-corrected natural dimensions are rounded independently.
        check(Math.abs(photo.rasterHeight - photo.rasterWidth * media.height / media.width) <= 1, `${width}px ${slug}: altered proportions (${photo.rasterWidth}×${photo.rasterHeight} for a ${media.width}×${media.height} source)`);
        check(['contain', 'scale-down'].includes(photo.fit), `${width}px ${slug}: object-fit ${photo.fit} may crop the frame`);
        check(photo.ink && !photo.error, `${width}px ${slug}: the drawn frame cannot be read (${photo.error})`);
        if (photo.ink) {
          check(photo.ink.left >= -1 && photo.ink.right <= photo.screen.width + 1, `${width}px ${slug}: the frame leaves the screen (${Math.round(photo.ink.left)}→${Math.round(photo.ink.right)} of ${photo.screen.width} px)`);
          // Legible frame: from 260 px on a phone, 600 px on the 1440 px desktop; the photo never exceeds 1000 px (the 3024 px screen is only measured for the cap).
          if (width >= 360 && width <= 1440) check(photo.ink.width >= (width >= 1440 ? 600 : 260), `${width}px ${slug}: frame only ${Math.round(photo.ink.width)} px wide`);
        }
        check(photo.box.width <= 1000.5, `${width}px ${slug}: photo ${Math.round(photo.box.width)} px wide, beyond its maximum`);
        check(clipped.length === 0, `${width}px ${slug}: clipped text ${clipped.join(', ')}`);
      }
    }
    const state = await health();
    check(state.width <= state.viewport, `${width}px home: horizontal overflow ${state.width}/${state.viewport}`);
    check(state.broken.length === 0 && state.fallbacks === 0, `${width}px home: broken images or fallbacks`);
    // The hero, the marquee and the passage that now holds the film (the film is no longer inside the hero).
    const controls = await page.evaluate(() => [document.querySelector('.home-hero'), document.querySelector('.brand-marquee'), document.querySelector('.ambient-film, .hero-ambience')?.closest('section') ?? document.querySelector('.ambient-film, .hero-ambience')?.parentElement].flatMap(scope => !scope ? [] : [...scope.querySelectorAll('button, [role="button"], [role="switch"], input, summary, video, [class*="toggle"], [class*="pause"], [class*="play"], [class*="control"]')])
      .filter(element => (element as HTMLVideoElement).controls || /pause|play|lire|lecture|reprendre|d[ée]filement|toggle|vid[ée]o d’ambiance/i.test([element.getAttribute('aria-label'), element.getAttribute('title'), element.textContent, String(element.className), element.id].join(' '))).map(element => `${element.tagName.toLowerCase()}.${String(element.className)}`));
    check(controls.length === 0, `${width}px home: media control found (${controls.join(', ')})`);
    // S5/r3: heading and action in the first screen, film after the hero and below the fold at the review sizes.
    // The 3024×1964 stress viewport can naturally show later sections; it still checks separation, text and overflow.
    await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
    // (the page code declares no named function: tsx rewrites it with a helper that does not exist in the page)
    const first = await page.evaluate(() => ({
      title: document.querySelector('#hero-title')?.getBoundingClientRect().bottom ?? null, action: document.querySelector('.hero-actions .action-primary')?.getBoundingClientRect().bottom ?? null,
      film: document.querySelector('.ambient-film, .hero-ambience')?.getBoundingClientRect().top ?? null, heroFilm: document.querySelectorAll('.home-hero :is(.ambient-film, .hero-ambience), .home-hero video').length, viewport: innerHeight,
      filmAfterHero: !!(document.querySelector('.home-hero') && document.querySelector('.ambient-film, .hero-ambience') && (document.querySelector('.home-hero')!.compareDocumentPosition(document.querySelector('.ambient-film, .hero-ambience')!) & Node.DOCUMENT_POSITION_FOLLOWING)),
    }));
    if (width >= 360) {
      check(first.title !== null && first.title <= first.viewport, `${width}px home: the heading is not whole in the first screen (ends at ${first.title}, screen ${first.viewport})`);
      check(first.action !== null && first.action <= first.viewport, `${width}px home: the primary action is not whole in the first screen (ends at ${first.action}, screen ${first.viewport})`);
    }
    check(first.heroFilm === 0, `${width}px home: the film is still inside the hero`);
    check(first.film !== null && first.filmAfterHero, `${width}px home: the film passage must follow the hero`);
    if (width <= 1440) check(first.film !== null && first.film >= first.viewport, `${width}px home: the film passage starts inside the first screen (${first.film})`);
    // Reduced motion for this whole run: the film is scrolled to for real and still nothing is requested (counted at the end of the run).
    await page.locator('.ambient-film, .hero-ambience').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    records.push({ name: 'home-s5', ...state, controls, first });
  }
  // Desktop menu: no destination lost at the boundaries (the bar gives way to the panel, never to nothing); links readable and inside the screen.
  const destinations = [...universes, ...houseLinks].map(link => link.href);
  for (const [width, height] of [[801, 900], [960, 900], [961, 900], [1100, 900], [1101, 900], [1280, 800], [3024, 1964]] as const) {
    await page.setViewportSize({ width, height });
    await page.goto(base + '/');
    const bar = await page.evaluate(() => [...document.querySelectorAll('.desktop-nav > a')].filter(link => link.getClientRects().length).map(link => link.getAttribute('href')));
    await page.getByRole('button', { name: 'Nos univers' }).click();
    const panel = await page.evaluate(() => {
      const root = document.querySelector('#universe-panel')!;
      const links = [...root.querySelectorAll('a')];
      return { hrefs: links.map(link => link.getAttribute('href')), clipped: links.filter(link => link.scrollWidth > link.clientWidth + 1).map(link => link.textContent?.trim()), outside: links.filter(link => { const box = link.getBoundingClientRect(); return box.left < 0 || box.right > innerWidth; }).map(link => link.textContent?.trim()), cta: !!document.querySelector('.header-cta')?.getClientRects().length };
    });
    const reachable = new Set([...bar, ...panel.hrefs, ...(panel.cta ? ['/rendez-vous'] : [])]);
    for (const href of [...destinations, '/marques', '/magasins', '/contact', '/rendez-vous']) check(reachable.has(href as string), `${width}px menu: ${href} unreachable`);
    check(panel.clipped.length === 0 && panel.outside.length === 0, `${width}px menu: links clipped (${panel.clipped.join(', ')}) or outside the screen (${panel.outside.join(', ')})`);
    const state = await health();
    check(state.width <= state.viewport, `${width}px menu: horizontal overflow ${state.width}/${state.viewport}`);
    records.push({ name: 'menu-s5', bar, panel: panel.hrefs, ...state });
    await page.keyboard.press('Escape');
  }
  for (const [width, height] of [[360, 740], [390, 844], [768, 1024], [800, 900]] as const) {
    await page.setViewportSize({ width, height });
    await page.goto(base + '/');
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: /menu/i });
    check(await dialog.isVisible(), `${width}px mobile menu: no dialog named « Menu »`);
    const named = await page.evaluate(() => { const element = document.querySelector('dialog')!; const reference = element.getAttribute('aria-labelledby'); return (element.getAttribute('aria-label') || (reference ? document.getElementById(reference)?.textContent?.trim() : '') || '').length > 0; });
    check(named, `${width}px mobile menu: the dialog itself carries no name`);
    const fit = await page.evaluate(() => { const root = document.querySelector('dialog')!; return { hrefs: [...root.querySelectorAll('nav a')].map(link => link.getAttribute('href')), clipped: [...root.querySelectorAll('nav a')].filter(link => link.scrollWidth > link.clientWidth + 1).map(link => link.textContent?.trim()), sideways: root.scrollWidth > root.clientWidth }; });
    for (const href of ['/', '/rendez-vous', ...destinations, '/marques', '/magasins', '/contact']) check(fit.hrefs.includes(href), `${width}px mobile menu: ${href} missing`);
    check(fit.clipped.length === 0 && !fit.sideways, `${width}px mobile menu: clipped links (${fit.clipped.join(', ')}) or sideways scroll`);
    records.push({ name: 'mobile-menu-s5', width, named, ...fit });
    await page.keyboard.press('Escape');
  }
  // Long names at 360 and 390 px: the three longest product names and colour labels, brand and store names, the footer on each page.
  const longColours = longestBy(products.flatMap(product => product.variants.map(variant => ({ product, variant, size: Math.max(0, ...Object.values(variant.labels).map(label => label.length)) }))), item => item.size, 4);
  const longRoutes = [
    ...longestBy(products, product => product.name.length, 3).map(product => `/produits/${product.slug}`),
    ...longColours.map(item => `/produits/${item.product.slug}?variante=${item.variant.id}`),
    ...longestBy(brands.filter(brand => brand.productIds.length || brand.logo), brand => brand.name.length, 3).map(brand => `/marques/${brand.id}`),
    ...longestBy(stores, store => store.name.length, 2).map(store => `/magasins/${store.slug}`),
  ];
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of new Set(longRoutes)) {
      await page.goto(base + route);
      const state = await health();
      const clipped = await page.evaluate(() => [...document.querySelectorAll('main :is(h1, h2, h3, button, a)')].filter(node => node.scrollWidth > node.clientWidth + 1 && getComputedStyle(node).overflow !== 'visible').map(node => node.textContent?.trim().slice(0, 40)));
      check(state.width <= state.viewport, `${width}px long names ${route}: horizontal overflow ${state.width}/${state.viewport}`);
      check(state.broken.length === 0 && state.fallbacks === 0 && state.h1 === 1, `${width}px long names ${route}: broken image, fallback or ${state.h1} h1`);
      check(clipped.length === 0, `${width}px long names ${route}: clipped text ${clipped.join(', ')}`);
      records.push({ name: 'long-names-s5', route, ...state });
    }
  }
  check(filmRequests.length === 0, `the film was requested ${filmRequests.length} time(s) although motion is reduced for this whole run`);
  await writeFile(join(root, 'browser-quality.json'), JSON.stringify({ timestamp: new Date().toISOString(), zoomMethod: 'Equivalent reflow: CSS viewport 720x500, DPR 2, output 1440x1000; not a manual browser zoom gesture, not a physical device and not an assistive-technology test.', findings, records, remote, errors }, null, 2));
  await browser.close(); assert.equal(remote.length, 0); assert.equal(errors.length, 0); assert.deepEqual(findings, []);
  console.log(`${records.length} checks; 360 px and 720x500@2x reflow on S1, S2 and S4 routes, keyboard and focus rings (contact, appointment, marquee), Escape, motion frames, long names, missing images, 801/1101/1280 boundaries; home photos whole at 360–1440 and 3024 px, no media control and no film request after scrolling to the film passage, heading and action in the first screen, menu destinations at 801–3024 px, named mobile dialog, long names, no film request under reduced motion; zero overflow/errors/WordPress requests.`);
}
main().catch(async error => { console.error(error); process.exitCode = 1; await activeBrowser?.close(); });
