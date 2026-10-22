import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chromium, type Page } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { products } from '../src/data';
import { frameInkSource, type FrameInk } from '../tests/support/frame-ink';

// Captures of the real prototype, driven by real user actions (clicks, typing, keyboard). Nothing is simulated in the DOM.
// Before EVERY capture: reduced motion, fonts ready, images eager and decoded, scroll back to the top, one stabilisation frame.
// S5/r2: every PNG goes to OPTIC_PROOF_DIR (outside Git); nothing is written under the repository (the former .impeccable/review
// copies are gone). The captures use reduced motion, so the film is never loaded: they show the poster, the layout and the menus,
// never the film itself, whose playback is judged by watching it. Technical measures recorded with a capture (photo whole, texts
// not clipped, panel inside the screen) are listed in `checks`; a non-empty list makes the run fail.
// S5/r3 (historical, revoked): the film had left the hero for a secondary passage further down the page.
// S5/r4: the film is back in the hero, as the picture of the first screen. The home captures are therefore two distinct families: the
// HERO at the top of the page (heading and yellow action composed over the film, here its poster since the captures reduce motion) at the six
// review sizes (360×800, 390×844, 768×1024, 1024×768, 1280×720, 1440×900) and the four thresholds of the header, whose checks
// require one video, the visible part of the film to be substantial (height >= 260 px, area >= 20% of the screen, >= 80% of the frame
// visible, width >= 80% of the screen) and only composed hero/header text over it, with the rectangles and shares recorded in the manifest; and the NUANCIER
// (the three models in `.home-showcase`), one capture per model after a real choice. A choice scrolls the page down to the showcase, so
// the hero is always captured first, at the top, and each model capture is aligned on its section, never taken at the bottom by
// accident. Every crop of the motion frames and of the marquee is computed from a locator (scrolled into view, then measured),
// never from absolute coordinates.
// The manifest ties each PNG to its route, viewport, dimensions, broken images, overflow, errors, network and date, and to the
// exact code that was served (HEAD plus a digest of every source file, tracked or not).
async function codeManifest() {
  const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8' }).trim();
  const tracked = git('ls-files', '-co', '--exclude-standard', '--', 'src', 'tests', 'scripts', 'next.config.ts', 'package.json', 'pnpm-lock.yaml').split('\n').filter(Boolean).sort();
  const files: { path: string; sha256: string }[] = [];
  for (const path of tracked) files.push({ path, sha256: createHash('sha256').update(await readFile(path)).digest('hex') });
  const digest = createHash('sha256').update(files.map(f => `${f.sha256}  ${f.path}`).join('\n')).digest('hex');
  return { head: git('rev-parse', 'HEAD'), dirtyPaths: git('status', '--porcelain').split('\n').filter(Boolean).length, fileCount: files.length, digest, files };
}

let activeBrowser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
async function main() {
const root = process.env.OPTIC_PROOF_DIR;
if (!root) throw new Error('Set OPTIC_PROOF_DIR to an evidence folder outside Git.');
assert(relative(process.cwd(), resolve(root)).startsWith('..'), 'OPTIC_PROOF_DIR must be outside the repository.');
const base = process.env.OPTIC_BASE_URL ?? 'http://127.0.0.1:3011';
const origin = new URL(base).origin;
const out = join(root, 'captures');
await mkdir(out, { recursive: true });
const code = await codeManifest();
const browser = await chromium.launch();
  activeBrowser = browser;
const context = await browser.newContext({ reducedMotion: 'reduce' });
const forbidden: string[] = [];
const errors: string[] = [];
const hosts = new Set<string>();
let requests: { method: string; url: string; body: boolean }[] = [];
// Every URL requested during the run, kept to prove that nothing typed in a form ever reaches the network.
const allUrls: string[] = [];
const typed = ['Marie Fictive', 'demo@example.com', 'Message fictif de démonstration'];
await context.route(/optic2000tahiti\.com/, route => { forbidden.push(route.request().url()); return route.abort(); });
context.on('request', request => { allUrls.push(request.url()); hosts.add(new URL(request.url()).host); requests.push({ method: request.method(), url: request.url(), body: request.postData() !== null }); });
context.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
const page = await context.newPage();
page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));

// ---- capture primitive ---------------------------------------------------------------------------------------------
// Every finite animation or transition still running on the page (the desktop panel arrives with a 6 px translate, the showcase photo
// with a short arrival; finished ones that keep their fill do not count) must be over before anything is measured or captured: two frames are not enough, a capture that cancels them would
// show a state that was never at rest. Infinite animations (the marquee) are left alone. Bounded: a stuck animation fails the run.
async function settle(target: Page) {
  const pending = await target.evaluate(async () => {
    const deadline = performance.now() + 4000;
    for (let round = 0; round < 6; round++) {
      // Sample after paint, not before it: revealing a newly playing film can start its opacity transition on that paint.
      // Return the quiet sample in this same turn; an empty sample followed by two frames used to reject that new transition.
      await new Promise<void>(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(() => resolveFrame())));
      const running = document.getAnimations().filter(animation => animation.playState === 'running' && animation.effect && Number.isFinite(animation.effect.getComputedTiming().endTime as number));
      if (!running.length) return [];
      if (performance.now() > deadline) break;
      await Promise.race([Promise.all(running.map(animation => animation.finished.catch(() => undefined))), new Promise(done => setTimeout(done, Math.max(0, deadline - performance.now())))]);
    }
    return document.getAnimations().filter(animation => animation.playState === 'running' && animation.effect && Number.isFinite(animation.effect.getComputedTiming().endTime as number)).map(animation => `${animation.constructor.name} ${(animation as CSSTransition).transitionProperty ?? (animation as CSSAnimation).animationName ?? ''}`);
  });
  assert.deepEqual(pending, [], 'finite animations still running before the measure');
}
// `scroll: 'keep'` leaves the page where a real choice scrolled it (the nuancier captures); the default goes back to the top.
async function prepare(target: Page, scroll: 'top' | 'keep' = 'top') {
  await target.evaluate(async place => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(async image => { image.loading = 'eager'; try { await image.decode(); } catch { /* failure is recorded below */ } }));
    // The poster of the film is a CSS background: decoded too, so that no capture or measure sees it half drawn.
    const posterUrl = document.querySelector('.ambient-film-media') ? getComputedStyle(document.querySelector('.ambient-film-media')!).backgroundImage.match(/url\("?([^")]+)"?\)/)?.[1] : undefined;
    if (posterUrl) { const poster = new Image(); poster.src = posterUrl; await poster.decode().catch(() => undefined); }
    if (place === 'top') window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, scroll);
  await settle(target);
}
const measure = () => ({
  url: location.pathname + location.search + location.hash, title: document.title,
  h1: [...document.querySelectorAll('h1')].map(h => h.textContent?.replace(/\s+/g, ' ').trim() ?? ''),
  pageWidth: document.documentElement.scrollWidth, pageHeight: document.documentElement.scrollHeight, viewport: innerWidth, viewportHeight: innerHeight, scrollY: Math.round(scrollY),
  broken: [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src')),
  fallbackCount: document.querySelectorAll('.image-fallback').length,
  fonts: { status: document.fonts.status, loaded: [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family))] },
  focus: document.activeElement && document.activeElement !== document.body ? `${document.activeElement.tagName.toLowerCase()}${document.activeElement.id ? `#${document.activeElement.id}` : ''}` : null,
  // The fixed skip-link is only legitimate on screen while it has the focus.
  skipLinkOnScreen: (() => { const link = document.querySelector('.skip-link'); if (!link) return false; const box = link.getBoundingClientRect(); return box.bottom > 0 && box.top < innerHeight && document.activeElement !== link; })(),
  firstRowBottom: (() => {
    const grid = document.querySelector('.catalogue-page .product-grid');
    if (!grid) return null;
    const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    return Math.max(...[...grid.children].slice(0, columns).map(card => card.getBoundingClientRect().bottom));
  })(),
  firstLensTop: document.querySelector('.lens-products .product-card')?.getBoundingClientRect().top ?? null,
});
interface Capture extends ReturnType<typeof measure> { checks: string[]; keptScroll: boolean; extra: unknown; name: string; width: number; height: number; fullPage: boolean; date: string; png: { width: number; height: number }; network: { requests: number; nonGet: string[]; withBody: string[]; offOrigin: string[] }; errorsSinceLast: string[] }
const records: Capture[] = [];
let errorMark = 0;
// `keepScroll` is for the nuancier captures only (the page stands on its section on purpose); `extra` is recorded as is in the manifest.
async function snap(name: string, fullPage: boolean, checks: string[] = [], options: { keepScroll?: boolean; extra?: unknown } = {}) {
  await prepare(page, options.keepScroll ? 'keep' : 'top');
  const measurements = await page.evaluate(measure);
  const buffer = await page.screenshot({ path: join(out, `${name}.png`), fullPage, animations: 'disabled' });
  const viewport = page.viewportSize()!;
  const network = { requests: requests.length, nonGet: requests.filter(r => r.method !== 'GET').map(r => `${r.method} ${r.url}`), withBody: requests.filter(r => r.body).map(r => r.url), offOrigin: requests.filter(r => /^https?:/.test(r.url) && new URL(r.url).origin !== origin).map(r => r.url) };
  requests = [];
  records.push({ name, checks, keptScroll: !!options.keepScroll, extra: options.extra ?? null, width: viewport.width, height: viewport.height, fullPage, date: new Date().toISOString(), png: { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }, ...measurements, network, errorsSinceLast: errors.slice(errorMark) });
  errorMark = errors.length;
  console.log(`${name}: ${measurements.pageWidth}/${viewport.width}px, ${measurements.broken.length} broken, ${measurements.fallbackCount} fallbacks, ${buffer.readUInt32BE(16)}×${buffer.readUInt32BE(20)}${checks.length ? `, CHECKS: ${checks.join('; ')}` : ''}`);
}
async function go(path: string, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto(base + path);
  // Wait for hydration before changing lazy image attributes for the capture.
  await page.waitForLoadState('networkidle');
  await page.locator('h1').first().waitFor();
}
// Whole photo of the model shown (loaded, true proportions, contained by its own box) and whole frame on the screen: the photo may be
// wider than a phone screen, only its white margins falling outside, so the drawn frame (not the <img> box) is measured, by the shared
// probe of tests/support/frame-ink.ts. Texts of the showcase not clipped, no media control, one pressed choice. Measured where the page
// stands (a choice scrolled it to the showcase): the probe reads viewport coordinates.
async function showcaseChecks(slug: string) {
  const media = products.find(item => item.slug === slug)!.images[0];
  // A model click can create its img before the cached resource is decoded. Check the same stable state we capture.
  await prepare(page, 'keep');
  const photo = await page.evaluate<FrameInk | null>(frameInkSource);
  const state = await page.evaluate(() => {
    return {
      clipped: [...document.querySelectorAll('.showcase-info :is(h2, p, a), .showcase-link, .model-selector button')].filter(node => node.scrollWidth > node.clientWidth + 1).map(node => node.textContent?.trim() ?? ''),
      pressed: [...document.querySelectorAll('.model-selector button[aria-pressed="true"]')].map(node => node.textContent?.trim()),
      // The hero (which holds the film), the showcase and the marquee: no control, hidden or not.
      controls: [...document.querySelectorAll('.home-hero button, .home-showcase button, .brand-marquee button')].map(node => node.textContent?.trim() ?? '').filter(text => /pause|lire|lecture|défilement/i.test(`${text}`)),
      videoControls: [...document.querySelectorAll('.home-hero video, .home-showcase video, .brand-marquee video')].filter(node => (node as HTMLVideoElement).controls).length,
    };
  });
  const checks: string[] = [];
  if (!photo) return [`${slug}: no photo found`];
  if (!photo.loaded) checks.push(`${slug}: photo not loaded`);
  // Check encoded pixels; density-corrected natural dimensions are independently rounded down by the browser.
  if (Math.abs(photo.rasterHeight - photo.rasterWidth * media.height / media.width) > 1) checks.push(`${slug}: proportions ${photo.rasterWidth}×${photo.rasterHeight} for a ${media.width}×${media.height} source`);
  if (!['contain', 'scale-down'].includes(photo.fit)) checks.push(`${slug}: object-fit ${photo.fit} may crop the frame`);
  if (photo.error || !photo.ink) checks.push(`${slug}: frame not readable (${photo.error})`);
  else {
    if (photo.ink.left < -1 || photo.ink.right > photo.screen.width + 1) checks.push(`${slug}: the frame leaves the screen (${Math.round(photo.ink.left)}→${Math.round(photo.ink.right)} of ${photo.screen.width} px)`);
    // Legible frame in its secondary section: from 260 px on a phone, 480 px on the 1440 px desktop (360 px is the narrowest review size; the
    // former 600 px was the hero picture's); the photo never exceeds 1000 px.
    if (photo.screen.width >= 360 && photo.ink.width < (photo.screen.width >= 1440 ? 480 : 260)) checks.push(`${slug}: frame only ${Math.round(photo.ink.width)} px wide`);
  }
  if (photo.box.width > 1000.5) checks.push(`${slug}: photo ${Math.round(photo.box.width)} px wide, beyond its maximum`);
  if (state.clipped.length) checks.push(`${slug}: clipped text ${state.clipped.join(', ')}`);
  if (state.pressed.length !== 1) checks.push(`${slug}: ${state.pressed.length} pressed choices`);
  if (state.controls.length || state.videoControls) checks.push(`media control found: ${[...state.controls, ...(state.videoControls ? ['video controls'] : [])].join(', ')}`);
  return checks;
}
// First screen of the home (the hero), read at the top of the page: heading and primary action whole (from 360 px), the film inside the
// hero and substantial in the first screen (review sizes up to 1440 px: visible height >= 260 px, visible area >= 20% of the screen,
// >= 80% of its frame visible, visible width >= 80% of the screen), exactly one video in the DOM and in the hero, nothing of the
// showcase, marquee or products inside the hero, the heading then actions and hero before showcase/marquee; only composed text on the film and no text on the showcase photo. The rectangles and shares are returned for the manifest. The page code runs in the
// browser, so it holds plain data only: the geometry is compared here.
// Beware: the page code is rewritten by tsx (which keeps function names with a helper that does not exist in the page), so it
// declares no named function; DOMRect.toJSON() gives plain numbers.
interface Spot { left: number; right: number; top: number; bottom: number }
interface TextSpot extends Spot { text: string; inShowcase: boolean; composed: boolean }
const overlapOf = (a: Spot, b: Spot) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
async function homeChecks() {
  await prepare(page);
  const state = await page.evaluate(() => ({
    title: document.querySelector('#hero-title')?.getBoundingClientRect().toJSON() as Spot | undefined,
    action: document.querySelector('.hero-actions .action-primary')?.getBoundingClientRect().toJSON() as Spot | undefined,
    photo: document.querySelector('.showcase-image img')?.getBoundingClientRect().toJSON() as Spot | undefined,
    film: document.querySelector('.home-hero .ambient-film')?.getBoundingClientRect().toJSON() as Spot | undefined,
    viewport: innerHeight, width: innerWidth,
    videos: document.querySelectorAll('video').length, heroVideos: document.querySelectorAll('.home-hero video').length, heroFilms: document.querySelectorAll('.home-hero .ambient-film').length,
    enclosed: document.querySelectorAll('.home-hero .home-showcase, .home-hero .showcase-stage, .home-hero .brand-marquee, .home-hero .home-products, .home-hero .product-card').length,
    texts: [...document.querySelectorAll('h1, h2, h3, h4, p, a, button, li, figcaption, label')].filter(node => node.getClientRects().length && (node.textContent ?? '').trim() && !node.closest('.ambient-film'))
      .map(node => ({ ...node.getBoundingClientRect().toJSON(), text: (node.textContent ?? '').trim().slice(0, 30), inShowcase: !!node.closest('.home-showcase'), composed: !!node.closest('.home-hero, .site-header') })) as TextSpot[],
    inOrder: !!(document.querySelector('#hero-title') && document.querySelector('.hero-actions') && document.querySelector('.ambient-film') && document.querySelector('.home-showcase') && document.querySelector('.brand-marquee')
      && (document.querySelector('#hero-title')!.compareDocumentPosition(document.querySelector('.hero-actions')!) & Node.DOCUMENT_POSITION_FOLLOWING)
            && (document.querySelector('.ambient-film')!.compareDocumentPosition(document.querySelector('.home-showcase')!) & Node.DOCUMENT_POSITION_FOLLOWING)
      && (document.querySelector('.home-showcase')!.compareDocumentPosition(document.querySelector('.brand-marquee')!) & Node.DOCUMENT_POSITION_FOLLOWING)),
  }));
  const checks: string[] = [];
  const { title, action, photo, film } = state;
  if (!title || !action || !photo || !film) return { checks: ['hero, film or showcase not found'], geometry: null };
  const visibleWidth = Math.max(0, Math.min(film.right, state.width) - Math.max(film.left, 0)), visibleHeight = Math.max(0, Math.min(film.bottom, state.viewport) - Math.max(film.top, 0));
  const visibleArea = visibleWidth * visibleHeight, frameArea = (film.right - film.left) * (film.bottom - film.top);
  const shares = { screenArea: visibleArea / (state.width * state.viewport), frameVisible: frameArea ? visibleArea / frameArea : 0, screenWidth: visibleWidth / state.width };
  const geometry = { viewport: { width: state.width, height: state.viewport }, title, action, film, visible: { width: visibleWidth, height: visibleHeight, area: visibleArea }, shares, videos: state.videos, heroVideos: state.heroVideos };
  if (state.width >= 360 && title.bottom > state.viewport) checks.push(`heading ends at ${Math.round(title.bottom)} px, beyond the first screen (${state.viewport})`);
  if (state.width >= 360 && action.bottom > state.viewport) checks.push(`primary action ends at ${Math.round(action.bottom)} px, beyond the first screen (${state.viewport})`);
  if (state.videos !== 1 || state.heroVideos !== 1 || state.heroFilms !== 1) checks.push(`expected exactly one video in the DOM and in the hero (${state.videos} / ${state.heroVideos}, ${state.heroFilms} film frames)`);
  if (state.enclosed) checks.push(`the hero encloses ${state.enclosed} showcase, marquee or product element(s)`);
  if (!state.inOrder) checks.push('heading/actions or hero/showcase/marquee reading order is broken');
  if (film.right - film.left <= 0 || film.bottom - film.top <= 0) checks.push('the film frame has no box');
  // The review sizes and thresholds (360–1440 px): the film is the substantial picture of the first screen.
  if (state.width >= 360 && state.width <= 1440) {
    if (visibleHeight < 260) checks.push(`only ${Math.round(visibleHeight)} px of the film are visible in the first screen (minimum 260)`);
    if (shares.screenArea < .2) checks.push(`the visible film covers ${Math.round(shares.screenArea * 100)}% of the screen (minimum 20%)`);
    if (shares.frameVisible < .8) checks.push(`only ${Math.round(shares.frameVisible * 100)}% of the film frame is visible (minimum 80%)`);
    if (shares.screenWidth < .8) checks.push(`the visible film is ${Math.round(shares.screenWidth * 100)}% of the screen width (minimum 80%)`);
  }
  const overFilm = state.texts.filter(text => !text.composed && overlapOf(text, film) > 4).map(text => text.text);
  if (overFilm.length) checks.push(`unrelated text over the film: ${overFilm.join(', ')}`);
  const overPhoto = state.texts.filter(text => text.inShowcase && overlapOf(text, photo) > 4).map(text => text.text);
  if (overPhoto.length) checks.push(`text over the photo: ${overPhoto.join(', ')}`);
  return { checks, geometry };
}
// The nuancier section, brought to the top of the screen by a real scroll (a choice already scrolled the page there): the photo, the
// three choices, the caption and the model link must then be whole in the captured screen.
async function toShowcase() {
  await page.evaluate(() => window.scrollTo({ top: Math.max(0, scrollY + document.querySelector('.home-showcase')!.getBoundingClientRect().top - 16), left: 0, behavior: 'instant' }));
  await settle(page);
}
const showcaseInScreen = () => page.evaluate(() => ['.home-showcase', '.showcase-image', '.model-selector', '.showcase-info', '.showcase-link'].flatMap(selector => {
  const box = document.querySelector(selector)?.getBoundingClientRect();
  return !box || box.top < -1 || box.bottom > innerHeight + 1 ? [`${selector} is not whole in the screen (${box ? `${Math.round(box.top)}→${Math.round(box.bottom)} of ${innerHeight}` : 'missing'})`] : [];
}));
// Product gallery: every view in one horizontal rail (one row), the last view reachable by the keyboard and inside the rail.
async function galleryChecks(count: number) {
  const state = await page.evaluate(() => {
    const rail = document.querySelector('.gallery-thumbnails')!, frame = rail.getBoundingClientRect();
    const buttons = [...rail.querySelectorAll('button')].map(button => button.getBoundingClientRect());
    return { count: buttons.length, rows: new Set(buttons.map(item => Math.round(item.top - frame.top))).size, small: buttons.filter(item => item.height < 44 || item.width < 44).length, overflow: document.documentElement.scrollWidth - innerWidth };
  });
  const checks: string[] = [];
  if (state.count !== count) checks.push(`${state.count} views instead of ${count}`);
  if (state.rows !== 1) checks.push(`views on ${state.rows} rows instead of one rail`);
  if (state.small) checks.push(`${state.small} views smaller than 44 px`);
  if (state.overflow > 0) checks.push(`the rail widens the page by ${state.overflow} px`);
  return checks;
}

// Menu panels: every link readable and inside the screen (long names such as « Jumelles et télescopes », « Prothèses oculaires »).
const menuChecks = (selector: string) => page.evaluate(scope => {
  const root = document.querySelector(scope);
  if (!root) return [`${scope} not found`];
  const bad: string[] = [];
  for (const link of root.querySelectorAll('a')) {
    const box = link.getBoundingClientRect();
    if (link.scrollWidth > link.clientWidth + 1) bad.push(`clipped: ${link.textContent?.trim()}`);
    if (box.left < 0 || box.right > innerWidth) bad.push(`outside the screen: ${link.textContent?.trim()}`);
  }
  if (root.scrollWidth > root.clientWidth + 1) bad.push('horizontal scroll inside the menu');
  return bad;
}, selector);
const hydrated = () => page.waitForFunction(() => { const button = document.querySelector<HTMLButtonElement>('.contact-submit button'); return !!button && !button.disabled; });
const focusedId = () => page.evaluate(() => document.activeElement?.id ?? '');

// ---- S1 matrix, unchanged ------------------------------------------------------------------------------------------
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
for (const [name, route, width, height, fullPage] of scenarios) {
  await go(route, width, height);
  await snap(name, fullPage);
}

// ---- S5/r4: the home at the six review sizes: the HERO at the top (heading, action, film), then the NUANCIER, one capture per model ----
// The hero capture comes first, before any choice (a choice scrolls the page down to the showcase). Each model is then chosen with a real
// click, the page stands on `.home-showcase` and the capture shows its photo and its information; the full-page capture follows.
// The four thresholds of the header (800/801, 1100/1101 at 900 px high) get the same hero capture and the default model's nuancier capture.
const nuancier = ['glory-glory', 'baby-beach', 'the-bird'] as const;
const nameOf = (slug: string) => products.find(item => item.slug === slug)!.name;
for (const [width, height] of [[360, 800], [390, 844], [768, 1024], [1024, 768], [1280, 720], [1440, 900]] as const) {
  await go('/', width, height);
  const hero = await homeChecks();
  await snap(`home-${width}-hero`, false, hero.checks, { extra: hero.geometry });
  for (const [index, slug] of nuancier.entries()) {
    if (index) await page.getByRole('button', { name: nameOf(slug), exact: true }).click();
    await toShowcase();
    await snap(`home-${width}-showcase-${slug}`, false, [...await showcaseChecks(slug), ...await showcaseInScreen()], { keepScroll: true });
  }
  await page.getByRole('button', { name: nameOf('glory-glory'), exact: true }).click();
  await snap(`home-${width}-full`, true, [...await showcaseChecks('glory-glory'), ...(await homeChecks()).checks]);
}
for (const width of [800, 801, 1100, 1101]) {
  await go('/', width, 900);
  const hero = await homeChecks();
  await snap(`home-${width}-hero`, false, hero.checks, { extra: hero.geometry });
  await page.getByRole('button', { name: nameOf('glory-glory'), exact: true }).focus();
  await toShowcase();
  await snap(`home-${width}-showcase-glory-glory`, false, [...await showcaseChecks('glory-glory'), ...await showcaseInScreen()], { keepScroll: true });
}

// ---- S5/r3: catalogue (first row, filters closed on a phone) and Glory Glory (rail of 15 views, Gris transparent) ---------------
// The first row is gated by `firstRowBottom` in the manifest (photos and names inside the screen); the checks below add the rail.
const glory = products.find(item => item.slug === 'glory-glory')!;
for (const [width, height] of [[1440, 900], [1280, 800], [390, 844]] as const) {
  await go('/solaires', width, height);
  await snap(`catalogue-${width}`, false);
  await go('/catalogue', width, height);
  await snap(`catalogue-all-${width}`, false);
  await go('/produits/glory-glory', width, height);
  await snap(`glory-${width}-initial`, true, await galleryChecks(glory.images.length));
  // The last view, reached with the keyboard (Tab through the rail) and chosen with Enter: it must be inside the rail.
  await page.getByRole('button', { name: 'Voir la vue 1', exact: true }).focus();
  for (let step = 1; step < glory.images.length; step++) await page.keyboard.press('Tab');
  assert(await page.getByRole('button', { name: `Voir la vue ${glory.images.length}`, exact: true }).evaluate(el => el === document.activeElement), 'Tab reaches the last view of the rail');
  await page.keyboard.press('Enter');
  const last = await page.evaluate(() => { const button = document.activeElement!.getBoundingClientRect(), frame = document.querySelector('.gallery-thumbnails')!.getBoundingClientRect(); return button.left >= frame.left - 1 && button.right <= frame.right + 1; });
  await snap(`glory-${width}-last-view`, true, last ? [] : ['the focused last view is outside the rail']);
  // Gris transparent (ID 1607, 34 600 XPF): three views, chosen through the real colour control.
  await go('/produits/glory-glory', width, height);
  await page.getByRole('button', { name: 'Gris transparent', exact: true }).click();
  // The initial price range already contains 34 600: wait for the actual selected state before measuring its gallery.
  await page.locator('.variant-option[aria-pressed="true"]', { hasText: 'Gris transparent' }).waitFor();
  assert.match(await page.locator('.detail-price').innerText(), /^34\s*600\s*XPF$/);
  assert.equal(new URL(page.url()).search, '?variante=1607');
  await snap(`glory-${width}-gris-transparent`, true, await galleryChecks(3));
}

// ---- S2 matrix: the same six states at the three main sizes --------------------------------------------------------
const sizes = [{ key: 'mobile', width: 390, height: 844 }, { key: 'tablet', width: 768, height: 1024 }, { key: 'desktop', width: 1440, height: 1000 }] as const;
for (const { key, width, height } of sizes) {
  // Lens catalogue: the first lens cards must be on the first screen, as the solar first row is.
  await go('/lentilles', width, height);
  await snap(`lentilles-${key}`, true);
  // Colorblends, selected through the real controls: Grey, then +2.00.
  await go('/produits/freshlook-colorblends', width, height);
  await page.getByRole('button', { name: 'Grey', exact: true }).click();
  await page.getByLabel('2. Choisissez la sphère').selectOption({ label: '+2.00' });
  await page.getByText('Votre sélection : couleur Grey, sphère +2.00.', { exact: true }).waitFor();
  assert.equal(new URL(page.url()).search, '?variante=1949&couleur=grey&sphere=2-00');
  await snap(`colorblends-selected-${key}`, true);
  // Contact: the selection arrives with the store; an invalid e-mail gives a linked error, then the correction succeeds.
  await go('/contact?magasin=taravao&produit=freshlook-colorblends&variante=1949&couleur=grey&sphere=2-00', width, height);
  await hydrated();
  await page.getByLabel('Nom', { exact: true }).fill('Marie Fictive');
  await page.getByLabel('E-mail', { exact: true }).fill('demo@');
  await page.getByRole('button', { name: 'Préparer la demande', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.locator('#contact-email-error').waitFor();
  assert.equal(await focusedId(), 'contact-email', 'the first error takes the focus');
  assert.equal(await page.locator('#contact-email').getAttribute('aria-invalid'), 'true');
  assert.match(await page.locator('#contact-email').getAttribute('aria-describedby') ?? '', /contact-email-error/);
  await page.locator('#contact-message-error').waitFor();
  await snap(`contact-error-${key}`, true);
  await page.getByLabel('E-mail', { exact: true }).fill('demo@example.com');
  await page.getByLabel('Message', { exact: true }).fill('Message fictif de démonstration : aucune donnée réelle.');
  await page.getByRole('button', { name: 'Préparer la demande', exact: true }).click();
  await page.getByRole('heading', { name: 'Demande préparée pour la démonstration.' }).waitFor();
  assert.equal(await focusedId(), 'contact-success-title', 'the success heading takes the focus');
  await snap(`contact-success-${key}`, true);
  // Rich editorial pages.
  await go('/services-et-garanties', width, height);
  await snap(`services-${key}`, true);
  await go('/protheses-oculaires', width, height);
  await snap(`protheses-${key}`, true);
}

// ---- Lens states, simple product, universes, team ------------------------------------------------------------------
await go('/produits/freshlook-colorblends', 390, 844);
await page.getByRole('button', { name: 'Grey', exact: true }).click();
await page.getByText('Choisissez maintenant la sphère', { exact: false }).waitFor();
await snap('lens-incomplete-mobile', true);
await go('/produits/freshlook-colorblends?variante=774', 390, 844);
await page.locator('.notice').waitFor();
await snap('lens-invalid-url-mobile', true);
for (const [key, width, height] of [['mobile', 390, 844], ['desktop', 1440, 1000]] as const) {
  await go('/produits/trublends-one-day-5-couleurs', width, height);
  await page.getByRole('heading', { name: 'Une seule version' }).waitFor();
  await snap(`lens-simple-${key}`, true);
}
await go('/', 1440, 1000);
await page.getByRole('button', { name: 'Nos univers' }).click();
await page.locator('#universe-panel').waitFor({ state: 'visible' });
await snap('nav-universes-desktop', false);
await go('/', 768, 1024);
const menuButton = page.getByRole('button', { name: 'Menu', exact: true });
if (await menuButton.isVisible()) { await menuButton.click(); await page.getByRole('dialog').waitFor(); } else { await page.getByRole('button', { name: 'Nos univers' }).click(); await page.locator('#universe-panel').waitFor({ state: 'visible' }); }
await snap('nav-open-tablet', false);
await go('/', 390, 844);
await menuButton.focus();
await page.keyboard.press('Enter');
await page.getByRole('dialog').waitFor();
await snap('nav-menu-mobile', false);
// Short screen: the keyboard reaches the last link, the menu scrolls (the dialog scroll is its own, not the page's).
await page.setViewportSize({ width: 390, height: 600 });
const last = page.getByRole('dialog').getByRole('link', { name: 'Contact', exact: true });
for (let step = 0; step < 20 && !(await last.evaluate(el => el === document.activeElement)); step++) await page.keyboard.press('Tab');
assert(await last.evaluate(el => el === document.activeElement), 'Tab reaches the last link of the mobile menu');
assert(await page.getByRole('dialog').evaluate(d => d.scrollTop > 0), 'the mobile menu scrolled');
await snap('nav-menu-mobile-short-end', false);
await page.keyboard.press('Escape');
assert(await menuButton.evaluate(el => el === document.activeElement), 'Escape returns the focus to Menu');
for (const [name, route] of [['vue', '/lunettes-de-vue'], ['observation', '/jumelles-et-telescopes'], ['equipe', '/qui-sommes-nous']] as const) {
  for (const [key, width, height] of [['mobile', 390, 844], ['desktop', 1440, 1000]] as const) {
    await go(route, width, height);
    await snap(`${name}-${key}`, true);
  }
}

// Complete the new Read surfaces and the direct form; the three-size matrix above covers their shared primitives.
for (const [name, route] of [['basse-vision-mobile', '/basse-vision'], ['mentions-mobile', '/mentions-legales'], ['confidentialite-mobile', '/politique-de-confidentialite'], ['cgv-mobile', '/cgv']] as const) {
  await go(route, 390, 844);
  await snap(name, true);
}
await go('/contact', 1440, 1000);
await hydrated();
await snap('contact-direct-desktop', true);
await go('/magasins/taravao?produit=freshlook-colorblends&variante=1949&couleur=grey&sphere=2-00-2', 390, 844);
await snap('taravao-lens-context-mobile', true);

// ---- Publication matrix: proof limits closed before hosting ------------------------------------------------------------
// Desktop navigation inside 801–1100 px (1024 px), closed then open, on the home and on a light reading page.
for (const [name, route] of [['home', '/'], ['services', '/services-et-garanties']] as const) {
  await go(route, 1024, 768);
  const universes = page.getByRole('button', { name: 'Nos univers' });
  assert(await universes.isVisible(), `${name}: the desktop navigation is shown at 1024 px`);
  assert(!(await page.getByRole('button', { name: 'Menu', exact: true }).isVisible()), `${name}: no mobile menu at 1024 px`);
  assert.equal(await universes.getAttribute('aria-expanded'), 'false');
  await snap(`nav-1024-closed-${name}`, false);
  await universes.click();
  await page.locator('#universe-panel').waitFor({ state: 'visible' });
  assert.equal(await universes.getAttribute('aria-expanded'), 'true');
  await snap(`nav-1024-open-${name}`, false);
  await page.keyboard.press('Escape');
  await page.locator('#universe-panel').waitFor({ state: 'hidden' });
  assert(await universes.evaluate(el => el === document.activeElement), `${name}: Escape returns the focus to Nos univers`);
}
// Low vision at tablet and desktop sizes (mobile above).
for (const [key, width, height] of [['tablet', 768, 1024], ['desktop', 1440, 1000]] as const) {
  await go('/basse-vision', width, height);
  await snap(`basse-vision-${key}`, true);
}
// Direct contact on mobile (desktop above) and the three legal pages on desktop (mobile above).
await go('/contact', 390, 844);
await hydrated();
await snap('contact-direct-mobile', true);
for (const [name, route] of [['mentions-desktop', '/mentions-legales'], ['confidentialite-desktop', '/politique-de-confidentialite'], ['cgv-desktop', '/cgv']] as const) {
  await go(route, 1440, 1000);
  await snap(name, true);
}

// ---- S4 matrix: the demonstration appointment, real controls only, at the three main sizes -------------------------------
const rdvReady = () => page.waitForFunction(() => !document.querySelector<HTMLButtonElement>('.rdv-actions [type=submit]')?.disabled);
const rdvNext = () => page.locator('.rdv-actions [type=submit]').click();
for (const { key, width, height } of sizes) {
  await go('/rendez-vous?magasin=taravao', width, height);
  await rdvReady();
  await snap(`rdv-initial-${key}`, true);
  await rdvNext();
  await page.locator('#rdv-reason-error').waitFor();
  assert.equal(await focusedId(), 'rdv-reason-controle-vue', 'the first appointment error takes the focus');
  await snap(`rdv-visit-error-${key}`, true);
  await page.locator('label:has(#rdv-reason-conseil-montures)').click();
  await rdvNext();
  await page.locator('.rdv-day').first().waitFor();
  // A day without any demo slot, then the next open day and a time.
  await page.locator('.rdv-day[data-empty]').first().click();
  await page.locator('.rdv-empty').waitFor();
  await snap(`rdv-no-slot-${key}`, true);
  await page.locator('.rdv-day:not([data-empty])').first().click();
  await page.locator('.rdv-time').first().click();
  await page.locator('.rdv-chosen').waitFor();
  await snap(`rdv-slot-${key}`, true);
  await rdvNext();
  await page.getByLabel('Nom', { exact: true }).fill('Marie Fictive');
  await page.getByLabel('E-mail', { exact: true }).fill('demo@');
  await rdvNext();
  await page.locator('#rdv-email-error').waitFor();
  assert.equal(await focusedId(), 'rdv-email');
  await snap(`rdv-contact-error-${key}`, true);
  await page.getByLabel('E-mail', { exact: true }).fill('demo@example.com');
  await rdvNext();
  await page.locator('.rdv-summary').waitFor();
  await snap(`rdv-recap-${key}`, true);
  await page.getByRole('button', { name: 'Simuler le rendez-vous' }).click();
  await page.getByRole('heading', { name: 'Rendez-vous préparé pour la démonstration.' }).waitFor();
  assert.equal(await focusedId(), 'rdv-step-title');
  await snap(`rdv-result-${key}`, true);
}
// Prosthesis link corrected to Mamao, and the store page entry with its preselection.
await go('/rendez-vous?motif=protheses&magasin=taravao', 390, 844);
await rdvReady();
await snap('rdv-prosthesis-mobile', true);
await go('/magasins/mamao', 1440, 1000);
await snap('store-mamao-rdv-desktop', true);
// Navigation with the appointment action at the 801 and 1101 px boundaries.
for (const width of [801, 1101]) { await go('/', width, 800); await snap(`nav-${width}`, false); }

// ---- S5/r2: the desktop panel open at 801 / 1100 / 1101 and at the large screens (3024 px and its 1512 px CSS equivalent), the mobile
// menu at 360 / 390 / 768 and its end on a short screen. Real clicks only.
for (const [width, height] of [[801, 900], [1100, 900], [1101, 900], [1512, 982], [3024, 1964]] as const) {
  await go('/', width, height);
  await snap(`menu-${width}-closed`, false);
  await page.getByRole('button', { name: 'Nos univers' }).click();
  await page.locator('#universe-panel').waitFor({ state: 'visible' });
  await settle(page);
  const checks = await menuChecks('#universe-panel');
  const anchor = await page.evaluate(() => Math.abs(document.querySelector('#universe-panel')!.getBoundingClientRect().top - document.querySelector('.site-header')!.getBoundingClientRect().bottom));
  if (anchor > 3) checks.push(`panel ${Math.round(anchor)} px away from the bar`);
  await snap(`menu-${width}-open`, false, checks);
  await page.keyboard.press('Escape');
}
for (const [width, height] of [[360, 740], [390, 844], [768, 1024]] as const) {
  await go('/', width, height);
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('dialog', { name: /menu/i }).waitFor();
  await settle(page);
  await snap(`menu-${width}-mobile-open`, false, await menuChecks('#mobile-navigation'));
  await page.keyboard.press('Escape');
}

// ---- S4 motion: default motion preference, timestamped frames (captures elsewhere use reduced motion) --------------------
const motion = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await motion.route(/optic2000tahiti\.com/, route => { forbidden.push(route.request().url()); return route.abort(); });
const motionRequests: { method: string; url: string; body: boolean }[] = [];
motion.on('request', request => motionRequests.push({ method: request.method(), url: request.url(), body: request.postData() !== null }));
motion.on('console', message => { if (message.type() === 'error') errors.push(`motion console: ${message.text()}`); });
const motionPage = await motion.newPage();
motionPage.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
await motionPage.goto(base + '/');
await motionPage.waitForLoadState('networkidle');
await motionPage.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(async image => { image.loading = 'eager'; try { await image.decode(); } catch { /* recorded by the other captures */ } })); });
await motionPage.waitForTimeout(1200);
const motionFrames: { name: string; ms: number; transform: string; marquee: number }[] = [];
// The crop follows the element, not a fixed rectangle: the viewport-relative box of the locator (the screenshot clip is relative to the
// viewport when the page is not captured whole), widened to the full width and padded, clamped to what the viewport shows.
const cropAround = async (target: Page, selector: string, pad: number) => {
  const box = await target.locator(selector).boundingBox();
  assert(box, `${selector} has a box to crop around`);
  const viewport = target.viewportSize()!;
  const y = Math.max(0, Math.floor(box.y - pad)), bottom = Math.min(viewport.height, Math.ceil(box.y + box.height + pad));
  assert(bottom > y, `${selector} is inside the viewport for its crop`);
  return { x: 0, y, width: viewport.width, height: bottom - y };
};
// The marquee does not move while it is out of view: it is scrolled to so that the strip is measured in its running state.
const frame = async (name: string, ms: number) => {
  const state = await motionPage.evaluate(() => ({ transform: getComputedStyle(document.querySelector('.showcase-image')!).transform, marquee: new DOMMatrix(getComputedStyle(document.querySelector('.marquee-track')!).transform).m41 }));
  await motionPage.screenshot({ path: join(out, `${name}.png`), clip: await cropAround(motionPage, '.showcase-stage', 24) });
  motionFrames.push({ name, ms, ...state });
};
// The showcase is brought into view for real (scroll), then the first frame is taken at rest.
await motionPage.locator('.showcase-stage').scrollIntoViewIfNeeded();
await frame('motion-rest-before', 0);
await motionPage.getByRole('button', { name: 'Baby Beach', exact: true }).click();
const clicked = Date.now();
await motionPage.waitForTimeout(90); await frame('motion-arrival-early', Date.now() - clicked);
await motionPage.waitForTimeout(150); await frame('motion-arrival-mid', Date.now() - clicked);
await motionPage.waitForTimeout(700); await frame('motion-arrival-rest', Date.now() - clicked);
const still = (transform: string) => ['none', 'matrix(1, 0, 0, 1, 0, 0)'].includes(transform);
assert(!still(motionFrames[1].transform) && still(motionFrames[3].transform), 'the frame moves on arrival, then rests');
// The strip only runs while it is in view and the large hero keeps it below the first screen: scroll to it, then read it move.
await motionPage.locator('.brand-marquee').scrollIntoViewIfNeeded();
const marqueeOffset = () => motionPage.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('.marquee-track')!).transform).m41);
const marqueeBefore = await marqueeOffset();
await motionPage.waitForTimeout(500);
assert((await marqueeOffset()) < marqueeBefore, 'the marquee moves with the default motion preference');
await motionPage.locator('.marquee-group a').nth(5).focus();
await motionPage.keyboard.press('Tab');
await motionPage.waitForTimeout(150);
await motionPage.screenshot({ path: join(out, 'marquee-focus-desktop.png'), clip: await cropAround(motionPage, '.brand-marquee', 12) });
// Normal-motion first views and the complete marquee controls at the two smaller representative sizes.
const responsiveMotion: { name: string; width: number; height: number; transform: string; marquee: number }[] = [];
for (const size of [{ name: 'mobile', width: 390, height: 844 }, { name: 'tablet', width: 768, height: 1024 }]) {
  await motionPage.setViewportSize({ width: size.width, height: size.height });
  await motionPage.goto(base + '/');
  await prepare(motionPage);
  await motionPage.waitForTimeout(1000);
  await motionPage.screenshot({ path: join(out, `motion-home-${size.name}.png`) });
  await motionPage.locator('.brand-marquee').scrollIntoViewIfNeeded();
  await motionPage.screenshot({ path: join(out, `motion-marquee-${size.name}.png`) });
  const state = await motionPage.evaluate(() => ({ transform: getComputedStyle(document.querySelector('.showcase-image')!).transform, marquee: new DOMMatrix(getComputedStyle(document.querySelector('.marquee-track')!).transform).m41 }));
  responsiveMotion.push({ ...size, ...state });
}
const unexpectedMotionRequests = motionRequests.filter(request => request.method !== 'GET' || request.body || new URL(request.url).origin !== origin);
assert.equal(unexpectedMotionRequests.length, 0, 'motion captures also require local GET requests without bodies');
await motion.close();
await writeFile(join(root, 'motion-frames.json'), JSON.stringify({ timestamp: new Date().toISOString(), note: 'Computed transforms read at the capture moment; no frame-rate or performance metric is measured.', motionRequests, motionFrames, responsiveMotion }, null, 2));

const leaks = typed.flatMap(value => allUrls.filter(url => { try { return decodeURIComponent(url.replace(/\+/g, ' ')).includes(value); } catch { return url.includes(value); } }).map(url => `${value} in ${url}`));
const problems = records.filter(r => r.broken.length || r.fallbackCount || r.pageWidth > r.width || (r.scrollY !== 0 && !r.keptScroll) || r.skipLinkOnScreen || r.fonts.status !== 'loaded' || r.network.nonGet.length || r.network.withBody.length || r.checks.length || r.network.offOrigin.length || (r.firstRowBottom !== null && r.firstRowBottom > r.height) || (r.firstLensTop !== null && r.firstLensTop > r.height - 200)).map(r => r.name);
await writeFile(join(root, 'capture-manifest.json'), JSON.stringify({ timestamp: new Date().toISOString(), base, code, captureCount: records.length, records, forbidden, errors, hosts: [...hosts], typedLeaks: leaks, problems }, null, 2));
await browser.close();
console.log(`${records.length} captures; problems: ${problems.length ? problems.join(', ') : 'none'}; errors: ${errors.length}; former-domain requests: ${forbidden.length}; typed values in URLs: ${leaks.length}`);
if (forbidden.length || errors.length || problems.length || leaks.length) process.exitCode = 1;
}
main().catch(async error => { console.error(error); process.exitCode = 1; await activeBrowser?.close(); });
