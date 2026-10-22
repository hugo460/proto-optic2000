import { test as base, expect, type Page } from '@playwright/test';
import { products } from '../../src/data';
import { stores } from '../../src/data/stores';
import { houseLinks, universes } from '../../src/data/navigation';
import { demoDays, slotsFor, tahitiToday } from '../../src/lib/appointment';
import { frameInkSource, type FrameInk } from '../support/frame-ink';

// S5 scenarios: the ambient film, the home hero and its showcase, the desktop and mobile menus. The film is read from the
// media element itself (src, paused, currentTime), never from a class name. S5/r2 replaced the Pause and Play controls by an
// automatic film (no control of any kind, visible or hidden). S5/r3 recomposed the home: a single white hero (heading and
// yellow action first, then one large real frame and the three named models) and moved the film OUT of the hero, into a
// secondary passage further down. The film is therefore not in view on arrival: every playback scenario first scrolls it
// into view for real (scrollIntoViewIfNeeded, never a forced state), and reduced motion or data saving must request nothing
// even after that scroll. Same guards as S4: no error, no request outside the local origin, nothing transmitted, nothing
// typed in any URL; tolerated failures are declared by each scenario. Technical observations (the time advances, the
// time wraps, no backward jump) say nothing about the artistic quality of the loop: that is a human viewing.
interface Watch { origin: string; failures: string[]; requests: { method: string; url: string; body: string | null }[]; typed: string[]; tolerate: RegExp[] }
const safeDecode = (value: string) => { try { return decodeURIComponent(value.replace(/\+/g, ' ')); } catch { return value; } };
const test = base.extend<{ watch: Watch }>({
  watch: [async ({ context, baseURL }, use) => {
    const watch: Watch = { origin: new URL(baseURL!).origin, failures: [], requests: [], typed: [], tolerate: [] };
    await context.route(/optic2000tahiti\.com|pexels\.com/, route => { watch.failures.push(`remote media requested: ${route.request().url()}`); return route.abort(); });
    context.on('weberror', error => watch.failures.push(`page error: ${error.error().message}`));
    context.on('console', message => { if (message.type() === 'error') watch.failures.push(`console error: ${message.text()} ${message.location().url}`); });
    context.on('request', request => {
      watch.requests.push({ method: request.method(), url: request.url(), body: request.postData() });
      const url = new URL(request.url());
      if (/^https?:$/.test(url.protocol) && url.origin !== watch.origin) watch.failures.push(`automatic request outside the local origin: ${request.url()}`);
    });
    context.on('requestfailed', request => { if (request.failure()?.errorText !== 'net::ERR_ABORTED') watch.failures.push(`request failed: ${request.url()} (${request.failure()?.errorText})`); });
    await use(watch);
    expect(watch.failures.filter(f => !watch.tolerate.some(pattern => pattern.test(f))), 'errors or traffic outside the local origin').toEqual([]);
    expect(watch.requests.filter(request => request.method !== 'GET' || request.body), 'nothing is transmitted').toEqual([]);
    const traffic = watch.requests.map(request => safeDecode(request.url));
    for (const value of watch.typed) expect(traffic.filter(url => url.includes(value)), `"${value}" must not appear in any URL`).toEqual([]);
  }, { auto: true }],
});

const filmFile = '/media/ambience/eyewear-loop.mp4';
const posterFile = '/media/ambience/eyewear-poster.webp';
const filmRoute = `**${filmFile}`;
// The film is one local file, 24–40 s of distinct content before it repeats (docs/hero-media.json). A loop is observed in real time.
const minimumLength = 24, maximumLength = 40;
const h1 = (page: Page) => page.getByRole('heading', { level: 1 });
// Copy of the hero, in one place: a change of wording is edited here and nowhere else. The heading may break after the comma.
const heroTitle = /Le soleil,\s*autrement\./;
const primaryLabel = 'Toutes les solaires', appointmentLabel = 'Préparer un rendez-vous';
// The passage of the film and its poster. S5/r3 named them `.ambient-film` / `.ambient-film-media` once the film left the hero; the former
// `.hero-ambience` names are still accepted so that either naming of the same element is measured (one place to edit).
const filmBox = '.ambient-film, .hero-ambience', filmPoster = '.ambient-film-media, .hero-ambience-media';
const film = (page: Page) => page.locator(`:is(${filmBox}) video`);
// The film is far below the first screen: bring it into view by really scrolling (the observer of the page decides, nothing is
// forced), or take it back out of view. Smooth scrolling is on, so the position is awaited, not assumed.
async function toFilm(page: Page) {
  await film(page).scrollIntoViewIfNeeded();
  await expect(film(page), 'the film is in view').toBeInViewport();
}
async function awayFromFilm(page: Page, where: 'top' | 'bottom' = 'top') {
  await page.evaluate(place => window.scrollTo({ top: place === 'top' ? 0 : document.body.scrollHeight, behavior: 'instant' }), where);
  await expect(film(page), `the film is out of view (${where})`).not.toBeInViewport();
}
const filmState = (page: Page) => film(page).evaluate((video: HTMLVideoElement) => ({ src: video.getAttribute('src'), currentSrc: video.currentSrc, sources: video.querySelectorAll('source').length, network: video.networkState, ready: video.readyState, paused: video.paused, time: video.currentTime, duration: video.duration, shown: video.hasAttribute('data-shown') }));
const filmRequests = (watch: Watch) => watch.requests.filter(request => request.url.includes(filmFile));
const time = (page: Page) => film(page).evaluate((video: HTMLVideoElement) => video.currentTime);
async function expectAdvancing(page: Page) {
  const start = await time(page);
  await expect.poll(() => time(page), { message: 'the film time advances' }).toBeGreaterThan(start + .2);
}
async function expectStill(page: Page) {
  expect((await filmState(page)).paused).toBe(true);
  const start = await time(page);
  await page.waitForTimeout(500);
  expect(await time(page)).toBe(start);
}
// Playing = the element reports it (not paused) and the film is revealed over the poster; the time then moves.
async function playing(page: Page) {
  await expect.poll(async () => { const state = await filmState(page); return !state.paused && state.shown; }, { timeout: 15000, message: 'the film is playing' }).toBe(true);
  await expectAdvancing(page);
}
// No control of any kind over the film or the marquee: nothing visible, nothing hidden, nothing reachable by Tab or
// assistive technologies, under any name (button, switch, checkbox, summary, class or label that says pause/play).
async function noMediaControl(page: Page) {
  const found = await page.evaluate(() => {
    const pattern = /pause|play|lire|lecture|reprendre|d[ée]filement|toggle|vid[ée]o d’ambiance/i;
    const found: string[] = [];
    // The hero, the marquee and the passage that now holds the film (the film is no longer inside the hero).
    const passage = document.querySelector('.ambient-film, .hero-ambience')?.closest('section') ?? document.querySelector('.ambient-film, .hero-ambience')?.parentElement;
    for (const scope of [document.querySelector('.home-hero'), document.querySelector('.brand-marquee'), passage]) {
      for (const element of scope?.querySelectorAll('button, [role="button"], [role="switch"], input, summary, video, [class*="toggle"], [class*="pause"], [class*="play"], [class*="control"]') ?? []) {
        const label = [element.getAttribute('aria-label'), element.getAttribute('title'), element.textContent, String(element.className), element.id].join(' ');
        if ((element as HTMLVideoElement).controls || pattern.test(label)) found.push(`${String(scope?.className)} ${element.tagName.toLowerCase()}.${String(element.className)} "${label.trim().slice(0, 40)}"`);
      }
    }
    return found;
  });
  expect(found, 'no pause/play control, even hidden').toEqual([]);
  await expect(page.getByRole('button', { name: /pause|lire|lecture|vidéo|défilement/i })).toHaveCount(0);
}
// Poster only: the source is gone and the element is reset (empty network state, nothing buffered, at rest at zero), the film shown
// over the poster is hidden, and no new byte of the film is requested afterwards. Chromium keeps the last currentSrc after a
// load() without source (probed: networkState 0, readyState 0, currentSrc still the old URL), so an empty currentSrc is only
// required when the film was never requested at all.
async function posterOnly(page: Page, watch: Watch) {
  const state = await filmState(page);
  expect(state.src, 'no video source').toBeNull();
  expect(state.sources).toBe(0);
  expect(state.shown).toBe(false);
  if (filmRequests(watch).length === 0) expect(state.currentSrc, 'the film was never requested').toBe('');
  await expect.poll(async () => { const { network, ready, paused, time } = await filmState(page); return { network, ready, paused, time }; }, { message: 'the element is reset' }).toEqual({ network: 0, ready: 0, paused: true, time: 0 });
  const requested = filmRequests(watch).length;
  await page.waitForTimeout(700);
  expect(filmRequests(watch).length, 'no new request for the film').toBe(requested);
  expect((await filmState(page)).src, 'no new source').toBeNull();
  expect(await page.locator(filmPoster).evaluate(element => getComputedStyle(element).backgroundImage)).toContain(posterFile);
  await expect(h1(page)).toHaveText(heroTitle);
}
const hideTab = (page: Page, hidden: boolean) => page.evaluate(value => { Object.defineProperty(document, 'visibilityState', { value: value ? 'hidden' : 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); }, hidden);

test('Film: plays by itself from one local file with no control; a real cycle, then the join and the next loop, never backwards', async ({ page, watch }) => {
  test.setTimeout(150_000);
  await page.goto('/');
  await toFilm(page);
  await playing(page);
  // Decorative and muted, outside the reading order and of any control.
  const traits = await film(page).evaluate((video: HTMLVideoElement) => ({ muted: video.muted, loop: video.loop, inline: video.playsInline, controls: video.controls, tab: video.tabIndex, hidden: !!video.closest('[aria-hidden="true"]') }));
  expect(traits).toEqual({ muted: true, loop: true, inline: true, controls: false, tab: -1, hidden: true });
  await noMediaControl(page);
  const length = (await filmState(page)).duration;
  expect(length, `the film lasts ${minimumLength}–${maximumLength} s (read: ${length})`).toBeGreaterThanOrEqual(minimumLength - .05);
  expect(length).toBeLessThanOrEqual(maximumLength + .05);
  // One real cycle in real time (no seek): the time climbs to the end, wraps to the start without the element ever ending,
  // emptying, pausing or erring, then really plays the next loop. Any other backward step is a defect.
  await film(page).evaluate((video: HTMLVideoElement) => {
    const record = { wraps: 0, peak: video.currentTime, last: video.currentTime, afterWrap: 0, backward: [] as string[], incidents: [] as string[] };
    (window as unknown as { filmRecord: typeof record }).filmRecord = record;
    video.addEventListener('timeupdate', () => {
      const now = video.currentTime;
      if (now + 1 < record.last && now < 2 && record.last > video.duration - 2.5) { record.wraps++; record.afterWrap = 0; }
      else if (now < record.last - .25) record.backward.push(`${record.last.toFixed(2)}→${now.toFixed(2)}`);
      record.last = now;
      if (record.wraps === 0) record.peak = Math.max(record.peak, now); else record.afterWrap = Math.max(record.afterWrap, now);
    });
    for (const name of ['ended', 'emptied', 'pause', 'error']) video.addEventListener(name, () => record.incidents.push(name));
  });
  const record = () => page.evaluate(() => (window as unknown as { filmRecord: { wraps: number; peak: number; afterWrap: number; backward: string[]; incidents: string[] } }).filmRecord);
  await expect.poll(async () => (await record()).wraps, { timeout: (length + 25) * 1000, intervals: [1000], message: 'the film loops once' }).toBeGreaterThanOrEqual(1);
  await expect.poll(async () => (await record()).afterWrap, { timeout: 15000, intervals: [500], message: 'the next loop really plays' }).toBeGreaterThan(3);
  const done = await record();
  expect(done.peak, 'the first loop ran to the end (no seek)').toBeGreaterThanOrEqual(length - 2.5);
  expect(done.backward, 'no backward step').toEqual([]);
  expect(done.incidents).toEqual([]);
  await expectAdvancing(page);
  expect(new Set(filmRequests(watch).map(request => request.url)).size, 'a single local file').toBe(1);
  expect(new Set(watch.requests.map(request => new URL(request.url).pathname).filter(path => path.startsWith('/media/ambience/'))), 'film and poster only, no second version for another screen').toEqual(new Set([filmFile, posterFile]));
});

test('Server render: poster only, no video source; the film is a client decision', async ({ page }) => {
  const html = await (await page.request.get('/')).text();
  expect(html).not.toContain(filmFile);
  expect(html).not.toMatch(/<source\b/);
  expect(html).not.toMatch(/<video\b[^>]*\ssrc=/);
  expect(html).toContain(posterFile);
});

test('Film placement: outside the hero, after it, out of view on arrival and not fetched before it is shown', async ({ page, watch }) => {
  await page.goto('/');
  await expect(film(page)).toHaveCount(1);
  await expect(page.locator('.home-hero :is(.ambient-film, .hero-ambience), .home-hero video'), 'the hero no longer holds the film').toHaveCount(0);
  const place = await page.evaluate(() => {
    const ambience = document.querySelector('.ambient-film, .hero-ambience')!, hero = document.querySelector('.home-hero')!, box = ambience.getBoundingClientRect();
    return { after: !!(hero.compareDocumentPosition(ambience) & Node.DOCUMENT_POSITION_FOLLOWING), contained: hero.contains(ambience), top: box.top, viewport: innerHeight, hidden: !!ambience.closest('[aria-hidden="true"]') };
  });
  expect(place.contained).toBe(false);
  expect(place.after, 'the film passage comes after the hero').toBe(true);
  expect(place.top, 'the film starts below the first screen').toBeGreaterThanOrEqual(place.viewport);
  expect(place.hidden, 'decorative: hidden from assistive technologies').toBe(true);
  // preload="none": nothing of the film is fetched while it is not in view; it only starts once scrolled to.
  await page.waitForTimeout(1500);
  expect(filmRequests(watch), 'no byte of the film before it is in view').toEqual([]);
  expect((await filmState(page)).paused).toBe(true);
  await toFilm(page);
  await playing(page);
  expect(filmRequests(watch).length, 'the film is requested once it is in view').toBeGreaterThan(0);
});

// The poster and the film never sit under text: no text of the page overlaps the passage, whatever the width, and the film is
// reached by scrolling (never forced into view by the layout).
for (const viewport of [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }, { width: 1280, height: 800 }, { width: 1440, height: 900 }]) {
  test(`Film passage at ${viewport.width}×${viewport.height}: no text over the poster or the film, nothing wider than the screen`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await toFilm(page);
    await playing(page);
    const state = await page.evaluate(() => {
      const ambience = document.querySelector('.ambient-film, .hero-ambience')!.getBoundingClientRect();
      const overlap = (a: DOMRect, b: DOMRect) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      const over = [...document.querySelectorAll('h1, h2, h3, h4, p, a, button, li, figcaption, label, span')]
        .filter(node => !node.closest('.ambient-film, .hero-ambience') && node.getClientRects().length && (node.textContent ?? '').trim() && overlap(node.getBoundingClientRect(), ambience) > 4)
        .map(node => `${node.tagName.toLowerCase()} "${(node.textContent ?? '').trim().slice(0, 30)}"`);
      return { over, width: ambience.width, height: ambience.height, overflow: document.documentElement.scrollWidth - innerWidth, inside: ambience.left >= -.5 && ambience.right <= innerWidth + .5 };
    });
    expect(state.over, 'no text overlaps the film passage').toEqual([]);
    expect(state.inside).toBe(true);
    expect(state.width).toBeGreaterThan(0);
    expect(state.height).toBeGreaterThan(0);
    expect(state.overflow).toBeLessThanOrEqual(0);
    await noMediaControl(page);
  });
}

test('Film stops off screen and in a hidden tab and comes back, with no control at any moment', async ({ page }) => {
  await page.goto('/');
  await toFilm(page);
  await playing(page);
  // Out of view above (where the page starts), then back by scrolling to it.
  await awayFromFilm(page, 'top');
  await expect.poll(async () => (await filmState(page)).paused).toBe(true);
  await toFilm(page);
  await playing(page);
  await hideTab(page, true);
  await expect.poll(async () => (await filmState(page)).paused).toBe(true);
  await noMediaControl(page);
  await hideTab(page, false);
  await playing(page);
  // Out of view below and hidden together: coming back to the tab alone must not restart a film that is still out of view.
  await awayFromFilm(page, 'bottom');
  await expect.poll(async () => (await filmState(page)).paused).toBe(true);
  await hideTab(page, true);
  await hideTab(page, false);
  await page.waitForTimeout(600);
  await expectStill(page);
  await toFilm(page);
  await playing(page);
});

test.describe('Film passage on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('The first screen holds the heading and the action, not the film; the film plays when scrolled to and rests when the passage leaves the screen', async ({ page }) => {
    await page.goto('/');
    // First screen: the copy of the hero is in view, the film is not and is not playing.
    await expect(h1(page)).toBeInViewport({ ratio: 1 });
    await expect(page.locator('.hero-actions .action-primary')).toBeInViewport({ ratio: 1 });
    await expect(film(page), 'the film is not in the first screen').not.toBeInViewport();
    await page.waitForTimeout(800);
    expect((await filmState(page)).paused, 'nothing plays out of view').toBe(true);
    await toFilm(page);
    await playing(page);
    await noMediaControl(page);
    // Scroll back to the top: the heading is on screen again and the film, out of view, rests.
    await awayFromFilm(page, 'top');
    await expect(h1(page)).toBeInViewport({ ratio: 1 });
    await expect.poll(async () => (await filmState(page)).paused, { message: 'the film rests with its passage out of view' }).toBe(true);
    await expectStill(page);
    await noMediaControl(page);
    await toFilm(page);
    await playing(page);
    await noMediaControl(page);
  });
});

test('Reduced motion from the start: poster only, no video request even after scrolling to it, no control; the showcase still works', async ({ page, watch }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForTimeout(1500);
  await posterOnly(page, watch);
  await noMediaControl(page);
  expect(filmRequests(watch)).toEqual([]);
  // The film is now below the first screen: scroll it into view (then to the very bottom and back) and nothing is requested.
  await toFilm(page);
  await page.waitForTimeout(1200);
  await awayFromFilm(page, 'bottom');
  await toFilm(page);
  await posterOnly(page, watch);
  await noMediaControl(page);
  expect(filmRequests(watch), 'reduced motion: no video request, even after scrolling to the film').toEqual([]);
  expect(watch.requests.some(request => request.url.includes(posterFile)), 'the poster is served locally').toBe(true);
  await page.getByRole('button', { name: 'The Bird', exact: true }).click();
  await expect(page.locator('.showcase-stage h2')).toHaveText('The Bird');
  expect(await page.locator('.showcase-image').evaluate(element => element.getAnimations().length)).toBe(0);
});

test('Reduced motion switched on during the visit drops the source; switched off, the film resumes by itself', async ({ page, watch }) => {
  await page.goto('/');
  await toFilm(page);
  await playing(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(async () => (await filmState(page)).src).toBeNull();
  await posterOnly(page, watch);
  await noMediaControl(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await playing(page);
  await noMediaControl(page);
  // And again, in the other order and rapidly: the last preference wins.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(async () => (await filmState(page)).src).toBeNull();
  await posterOnly(page, watch);
});

test('Data saving: poster only and zero video request; the hint turning off later lets the film start', async ({ page, watch }) => {
  await page.addInitScript(() => {
    const connection = Object.assign(new EventTarget(), { saveData: true });
    Object.defineProperty(navigator, 'connection', { value: connection, configurable: true });
    (window as unknown as { setSaveData: (value: boolean) => void }).setSaveData = value => { connection.saveData = value; connection.dispatchEvent(new Event('change')); };
  });
  await page.goto('/');
  await page.waitForTimeout(2000);
  await posterOnly(page, watch);
  await noMediaControl(page);
  expect(filmRequests(watch), 'no byte of the film').toEqual([]);
  // Scrolled to for real, still nothing: data saving holds after the film comes into view, not only on arrival.
  await toFilm(page);
  await page.waitForTimeout(1200);
  await posterOnly(page, watch);
  expect(filmRequests(watch), 'data saving: no byte of the film, even after scrolling to it').toEqual([]);
  await page.evaluate(() => (window as unknown as { setSaveData: (value: boolean) => void }).setSaveData(false));
  await playing(page);
});

test('Autoplay refused: the poster stays, still and stable, with no control to start the film by hand', async ({ page }) => {
  // A browser that only plays after a real click by the visitor (the runner's own page activation does not count).
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    let clicked = false;
    addEventListener('click', event => { if (event.isTrusted) clicked = true; }, true);
    HTMLMediaElement.prototype.play = function () { return clicked ? play.call(this) : Promise.reject(new DOMException('Autoplay refused', 'NotAllowedError')); };
  });
  await page.goto('/');
  // The play attempt happens when the film comes into view: scroll to it so that the refusal is really exercised.
  await toFilm(page);
  await page.waitForTimeout(1500);
  for (let look = 0; look < 2; look++) {
    const state = await filmState(page);
    expect(state.paused).toBe(true);
    expect(state.shown, 'the poster is never replaced by a frozen frame').toBe(false);
    expect(state.time).toBe(0);
    expect(await page.locator(filmPoster).evaluate(element => getComputedStyle(element).backgroundImage)).toContain(posterFile);
    await expect(film(page)).toHaveCSS('opacity', '0');
    await noMediaControl(page);
    await page.waitForTimeout(700);
  }
  await expect(h1(page)).toHaveText(heroTitle);
  await page.getByRole('button', { name: 'Baby Beach', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.showcase-stage h2')).toHaveText('Baby Beach');
});

for (const [label, answer] of [['missing (404)', { status: 404, body: 'Not found' }], ['undecodable', { status: 200, contentType: 'video/mp4', body: Buffer.from('this is not a video stream'.repeat(64)) }]] as const) {
  test(`Film ${label}: finished poster, no control, no broken player; the page stays usable`, async ({ page, watch }) => {
    watch.tolerate.push(/eyewear-loop\.mp4/);
    await page.route(filmRoute, route => route.fulfill(answer));
    await page.goto('/');
    await toFilm(page);
    await expect.poll(async () => (await filmState(page)).src, { timeout: 10000 }).toBeNull();
    await posterOnly(page, watch);
    await noMediaControl(page);
    expect(filmRequests(watch).length).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Baby Beach', exact: true }).click();
    await expect(page.locator('.showcase-stage').getByRole('link', { name: 'Découvrir ce modèle' })).toHaveAttribute('href', '/produits/baby-beach');
  });
}

test('Slow network: copy, showcase and actions work before the film arrives; no control, the film only covers the poster once playing', async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route(filmRoute, async route => { await pending; await route.continue().catch(() => {}); });
  await page.goto('/');
  await expect(h1(page)).toBeVisible();
  await page.getByRole('button', { name: 'The Bird', exact: true }).click();
  await expect(page.locator('.showcase-stage h2')).toHaveText('The Bird');
  await expect(page.locator('.hero-actions').getByRole('link', { name: primaryLabel })).toHaveAttribute('href', '/solaires');
  // The film is asked for once in view and its bytes are held back: the poster stays alone until it plays.
  await toFilm(page);
  await expect.poll(async () => (await filmState(page)).paused, { message: 'play() was attempted while the bytes are held back' }).toBe(false);
  const early = await filmState(page);
  expect(early.time).toBe(0);
  expect(early.shown).toBe(false);
  expect(await page.locator(filmPoster).evaluate(element => getComputedStyle(element).backgroundImage)).toContain(posterFile);
  await noMediaControl(page);
  release();
  await playing(page);
});

test('Leaving and coming back: listeners and source are released, the film starts again, nothing errs', async ({ page }) => {
  await page.goto('/');
  await toFilm(page);
  await playing(page);
  await page.locator('.hero-actions').getByRole('link', { name: primaryLabel }).click();
  await expect(page).toHaveURL(/\/solaires$/);
  await expect(film(page)).toHaveCount(0);
  await page.goBack();
  // The browser may or may not restore the scroll position: the film is scrolled to again either way.
  await toFilm(page);
  await playing(page);
});

// =====================================================================================================================
// Showcase: three models, whole photos, quick selection
// =====================================================================================================================
const model = (slug: string) => products.find(p => p.slug === slug)!;
const modelSlugs = ['glory-glory', 'baby-beach', 'the-bird'];
async function expectModel(page: Page, slug: string) {
  const product = model(slug);
  const stage = page.locator('.showcase-stage');
  await expect(stage.getByRole('heading', { level: 2 })).toHaveText(product.name);
  await expect(stage.getByRole('link', { name: 'Découvrir ce modèle' })).toHaveAttribute('href', `/produits/${slug}`);
  await expect(stage.locator('.showcase-price')).toContainText(new Intl.NumberFormat('fr-FR').format(product.minPrice));
  await expect(stage.locator('img')).toHaveAttribute('src', new RegExp(encodeURIComponent(product.images[0].src)));
  await expect(stage.locator('img')).toHaveCount(1);
  await expect(stage.locator('button[aria-pressed="true"]')).toHaveText(product.name);
  await expect(stage.locator('button[aria-pressed="true"]')).toHaveCount(1);
}

test('Showcase: photo, name, price and link for the three models together; one yellow action; no black frame nor separate card; keyboard order with no control', async ({ page }) => {
  await page.goto('/');
  const stage = page.locator('.showcase-stage');
  await expect(stage.locator('img')).toHaveCount(1);
  await expect(stage.getByRole('group', { name: 'Choisir un modèle à découvrir' }).getByRole('button')).toHaveText(['Glory Glory', 'Baby Beach', 'The Bird']);
  for (const slug of ['baby-beach', 'the-bird', 'glory-glory']) {
    await stage.getByRole('button', { name: model(slug).name, exact: true }).click();
    await expectModel(page, slug);
  }
  const hero = page.locator('.home-hero');
  await expect(hero.locator('.action-primary')).toHaveCount(1);
  await expect(hero.locator('.action-primary')).toHaveText(primaryLabel);
  // The hero is one white field, so a white background is normal and no longer tested. Still banned: a black (or any dark) frame,
  // a bordered card and walled-in tabs. Nothing between the heading of the model and the hero is enclosed by borders (a single
  // ruled line is the design: two or more sides make a card) or sits on a dark background; the three choices carry no border at all;
  // if a plateau still exists under the photo, it does not enclose the information.
  const cards = await page.evaluate(() => {
    const sides = ['Top', 'Right', 'Bottom', 'Left'] as const;
    const ruled = (element: Element) => { const style = getComputedStyle(element); return sides.filter(side => parseFloat(style[`border${side}Width`]) > 0 && style[`border${side}Style`] !== 'none').length; };
    const bordered = (element: Element) => ruled(element) > 0;
    const dark = (color: string) => { const [r, g, b, a = 1] = (color.match(/[\d.]+/g) ?? []).map(Number); return a > .5 && (.2126 * r + .7152 * g + .0722 * b) / 255 < .35; };
    const bad: string[] = [];
    for (let element: Element | null = document.querySelector('.showcase-info h2'); element && !element.classList.contains('home-hero'); element = element.parentElement) {
      if (ruled(element) >= 2) bad.push(`${String(element.className)} is enclosed by borders`);
      if (dark(getComputedStyle(element).backgroundColor)) bad.push(`${String(element.className)} is a dark frame`);
    }
    if (dark(getComputedStyle(document.querySelector('.home-hero')!).backgroundColor)) bad.push('the hero field is dark');
    const buttons = [...document.querySelectorAll('.model-selector button')];
    if (buttons.filter(bordered).length > 1) bad.push('the three choices are cells with borders');
    const plateau = document.querySelector('.showcase-plateau')?.getBoundingClientRect(), info = document.querySelector('.showcase-info')!.getBoundingClientRect();
    if (plateau && info.left >= plateau.left && info.right <= plateau.right && info.top >= plateau.top && info.bottom <= plateau.bottom) bad.push('the plateau encloses the information');
    return bad;
  });
  expect(cards).toEqual([]);
  // The title is what a pointer reaches, and nothing over the content fades it (the film is no longer anywhere near the hero).
  expect(await page.evaluate(() => {
    const title = document.querySelector('#hero-title')!;
    const box = title.getBoundingClientRect();
    let opaque = true;
    for (let node: Element | null = title; node; node = node.parentElement) if (getComputedStyle(node).opacity !== '1') opaque = false;
    return { top: title.contains(document.elementFromPoint(box.left + 20, box.top + box.height / 2)), opaque };
  })).toEqual({ top: true, opaque: true });
  // Tab: the heading's actions, then the three choices and the model link in some order (the choices keep their own order),
  // then the brands. The film is no longer in the hero, so nothing else sits between the hero and the marquee.
  await page.locator('.hero-actions').getByRole('link', { name: primaryLabel }).focus();
  const order: string[] = [];
  for (let i = 0; i < 5; i++) { await page.keyboard.press('Tab'); order.push(await page.evaluate(() => document.activeElement!.textContent!.trim())); }
  expect(order[0]).toBe(appointmentLabel);
  expect(order.slice(1).toSorted()).toEqual(['Baby Beach', 'Découvrir ce modèle', 'Glory Glory', 'The Bird']);
  expect(order.filter(name => modelSlugs.some(slug => model(slug).name === name))).toEqual(['Glory Glory', 'Baby Beach', 'The Bird']);
  expect(order.join(' ')).not.toMatch(/pause|lire|lecture|vidéo/i);
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => ({ marquee: !!document.activeElement!.closest('.brand-marquee'), href: document.activeElement!.getAttribute('href') }))).toEqual({ marquee: true, href: expect.stringMatching(/^\/marques\/[a-z0-9-]+$/) });
});

test('Showcase: rapid clicks and keys across the three models end in sync on the last one', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Baby Beach', 'The Bird', 'Glory Glory', 'The Bird', 'Baby Beach', 'Glory Glory', 'The Bird', 'Baby Beach']) await page.getByRole('button', { name, exact: true }).click({ delay: 0 });
  await expectModel(page, 'baby-beach');
  await page.getByRole('button', { name: 'The Bird', exact: true }).focus();
  await page.keyboard.press('Space');
  await page.getByRole('button', { name: 'Glory Glory', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Baby Beach', exact: true }).focus();
  await page.keyboard.press('Space');
  await expectModel(page, 'baby-beach');
  await expect(page.locator('.showcase-live')).toHaveAttribute('aria-live', 'polite');
  await page.getByRole('link', { name: 'Découvrir ce modèle' }).click();
  await expect(h1(page)).toHaveText('Baby Beach');
});

test.describe('Touch showcase', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test('Tapping the three models in quick succession ends on the last one, without horizontal movement', async ({ page }) => {
    await page.goto('/');
    for (const name of ['The Bird', 'Baby Beach', 'Glory Glory', 'The Bird']) await page.getByRole('button', { name, exact: true }).tap();
    await expectModel(page, 'the-bird');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    await page.getByRole('link', { name: 'Découvrir ce modèle' }).tap();
    await expect(h1(page)).toHaveText('The Bird');
  });
});

// The recomposed hero at the six review sizes, the 320 px floor and the four thresholds of the header (800/801, 1100/1101): the
// heading and the yellow action come first and (from 360 px) are whole in the first screen, then one large real frame, whole
// and legible; the three models stay reachable; no film, no text over the photo, no overflow, no clipped text.
const heroViewports = [{ width: 320, height: 640 }, { width: 360, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 800, height: 900 }, { width: 801, height: 900 }, { width: 1024, height: 768 }, { width: 1100, height: 900 }, { width: 1101, height: 900 }, { width: 1280, height: 800 }, { width: 1440, height: 900 }];
for (const viewport of heroViewports) {
  test(`Hero at ${viewport.width}×${viewport.height}: heading and action first, one whole legible frame, no film, no text over the photo, touch targets of 44 px, brands reached`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await noMediaControl(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    const boxes = await page.evaluate(() => {
      const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
      const fits = (inner: DOMRect, outer: DOMRect) => inner.left >= outer.left - .5 && inner.right <= outer.right + .5;
      const overlap = (a: DOMRect, b: DOMRect) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      const before = (first: string, second: string) => !!(document.querySelector(first)!.compareDocumentPosition(document.querySelector(second)!) & Node.DOCUMENT_POSITION_FOLLOWING);
      const title = rect('#hero-title'), action = rect('.hero-actions .action-primary'), stage = rect('.showcase-stage'), hero = rect('.home-hero'), image = rect('.showcase-image img');
      const text = [...document.querySelectorAll('#hero-title, .hero-intro p, .hero-actions :is(a, button), .model-selector button, .showcase-info :is(h2, p, a), .showcase-link')];
      return {
        // Heading, then action, then the showcase, in reading order and from top to bottom of the hero (side by side on a wide screen is
        // fine: both end above the photo).
        order: before('#hero-title', '.hero-actions') && before('.hero-actions', '.showcase-stage'),
        vertical: title.bottom <= image.top + 1 && action.bottom <= image.top + 1,
        // The photo itself may be wider than a phone screen (only its white margins fall outside, measured below): every text and control
        // of the hero is inside the screen and inside the hero.
        inside: fits(title, hero) && fits(stage, { left: 0, right: innerWidth } as DOMRect) && text.every(node => fits(node.getBoundingClientRect(), hero)),
        // No text ever sits on the photo of the frame.
        textOnPhoto: text.filter(node => overlap(node.getBoundingClientRect(), image) > 4).map(node => node.textContent!.trim().slice(0, 30)),
        // The first screen: heading and primary action whole, the photo has started.
        first: { title: [title.top, title.bottom], action: [action.top, action.bottom], photoTop: image.top, viewport: innerHeight },
        film: document.querySelectorAll('.home-hero :is(.ambient-film, .hero-ambience), .home-hero video').length,
        targets: [...document.querySelectorAll('.home-hero :is(a, button)')].map(element => Math.round(element.getBoundingClientRect().height)),
        clipped: text.filter(node => node.scrollWidth > node.clientWidth + 1).map(node => node.textContent!.trim()),
      };
    });
    expect(boxes.order).toBe(true);
    expect(boxes.vertical, 'heading and action end above the photo').toBe(true);
    expect(boxes.inside).toBe(true);
    expect(boxes.textOnPhoto).toEqual([]);
    expect(boxes.film, 'the film is no longer part of the hero').toBe(0);
    expect(boxes.clipped).toEqual([]);
    // Heading and primary action are whole in the first screen (the 320×640 floor only has to avoid overflow and clipping).
    if (viewport.width >= 360) {
      expect(boxes.first.title[0]).toBeGreaterThanOrEqual(0);
      expect(boxes.first.title[1], 'heading whole in the first screen').toBeLessThanOrEqual(viewport.height);
      expect(boxes.first.action[0]).toBeGreaterThanOrEqual(0);
      expect(boxes.first.action[1], 'primary action whole in the first screen').toBeLessThanOrEqual(viewport.height);
      expect(boxes.first.photoTop, 'the photo starts inside the first screen').toBeLessThan(viewport.height);
    }
    for (const height of boxes.targets) expect(height).toBeGreaterThanOrEqual(44);
    // The film is out of the first screen, never in the hero.
    await expect(film(page)).not.toBeInViewport();
    // Each model photo is whole: loaded, in its true proportions (to the pixel), contained (never cropped by its own box), and the frame
    // drawn in it (the dark part, not the white margins) lies inside the screen; texts are not clipped; the frame is large enough to
    // judge (from 260 px on a phone, from 600 px on the 1440 px desktop) and the photo never exceeds 1000 px.
    for (const slug of modelSlugs) {
      await page.getByRole('button', { name: model(slug).name, exact: true }).click();
      await page.waitForTimeout(750);
      const media = model(slug).images[0];
      const photo = (await page.evaluate<FrameInk | null>(frameInkSource))!;
      expect(photo, `${slug}: a photo is shown`).not.toBeNull();
      expect(photo.loaded, `${slug}: photo loaded`).toBe(true);
      // Measure the encoded raster: density-corrected natural dimensions are rounded independently by the browser.
      // Keep the same one-pixel tolerance against the source ratio.
      expect(Math.abs(photo.rasterHeight - photo.rasterWidth * media.height / media.width), `${slug}: true proportions (${photo.rasterWidth}×${photo.rasterHeight} for a ${media.width}×${media.height} source)`).toBeLessThanOrEqual(1);
      expect(['contain', 'scale-down'], `${slug}: never cropped`).toContain(photo.fit);
      expect(photo.error, `${slug}: the drawn frame can be read`).toBeNull();
      expect(photo.ink!.left, `${slug}: frame whole, left edge on the screen`).toBeGreaterThanOrEqual(-1);
      expect(photo.ink!.right, `${slug}: frame whole, right edge on the screen`).toBeLessThanOrEqual(viewport.width + 1);
      if (viewport.width >= 360) expect(photo.ink!.width, `${slug}: frame legible (${Math.round(photo.ink!.width)} px)`).toBeGreaterThanOrEqual(viewport.width >= 1440 ? 600 : 260);
      expect(photo.box.width, `${slug}: photo kept within its maximum (${Math.round(photo.box.width)} px)`).toBeLessThanOrEqual(1000.5);
      expect(await page.evaluate(() => [...document.querySelectorAll('.showcase-info :is(h2, p, a), .showcase-link, .model-selector button')].filter(node => node.scrollWidth > node.clientWidth + 1).map(node => node.textContent!.trim()))).toEqual([]);
    }
    // The brands come after the hero and are reached by scrolling (no threshold forces them into the first screen).
    const marquee = page.locator('.brand-marquee');
    expect(await page.evaluate(() => !!(document.querySelector('.home-hero')!.compareDocumentPosition(document.querySelector('.brand-marquee')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
    await marquee.scrollIntoViewIfNeeded();
    await expect(marquee).toBeInViewport();
  });
}

// =====================================================================================================================
// Header and menus
// =====================================================================================================================
const universeHrefs = universes.map(link => link.href);
const houseHrefs = houseLinks.map(link => link.href);
const allHrefs = [...universeHrefs, ...houseHrefs, '/marques', '/magasins', '/contact', '/rendez-vous'];
const desktopWidths = [{ width: 801, height: 900 }, { width: 960, height: 900 }, { width: 961, height: 900 }, { width: 1024, height: 768 }, { width: 1100, height: 900 }, { width: 1101, height: 900 }, { width: 1280, height: 800 }, { width: 1440, height: 1000 }, { width: 3024, height: 1964 }];

for (const viewport of desktopWidths) {
  test(`Desktop menu at ${viewport.width} px: compact light panel under the bar, no destination lost, nothing overlaps or overflows`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Navigation principale' });
    const trigger = nav.getByRole('button', { name: 'Nos univers' });
    await expect(nav).toBeVisible();
    await expect(page.getByRole('button', { name: 'Menu', exact: true })).toBeHidden();
    await expect(page.locator('.header-cta')).toBeVisible();
    await expect(page.locator('.header-cta')).toHaveAttribute('href', '/rendez-vous');
    await expect(page.locator('.header-cta')).toHaveAccessibleName(/rendez-vous|RDV/i);
    const barLinks = await page.evaluate(() => [...document.querySelectorAll('.desktop-nav > a')].filter(link => link.getClientRects().length).map(link => link.getAttribute('href')));
    await trigger.click();
    const panel = page.locator('#universe-panel');
    await expect(panel).toBeVisible();
    // The panel arrives with a short translate: its anchoring is measured once that arrival has finished.
    await panel.evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished.catch(() => undefined))));
    // Every destination is reachable at this width: through the bar, the panel or the yellow action.
    const panelLinks = await panel.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href')));
    expect(panelLinks).toEqual([...universeHrefs, ...houseHrefs]);
    const reachable = new Set([...barLinks, ...panelLinks, '/rendez-vous']);
    for (const href of allHrefs) expect(reachable.has(href), `${href} reachable at ${viewport.width} px`).toBe(true);
    const metrics = await page.evaluate(() => {
      const panel = document.querySelector('#universe-panel')!, header = document.querySelector('.site-header')!.getBoundingClientRect(), box = panel.getBoundingClientRect();
      const probe = document.createElement('i'); probe.style.color = 'var(--color-paper)'; document.body.append(probe); const paper = getComputedStyle(probe).color; probe.remove();
      const sides = ['Top', 'Right', 'Bottom', 'Left'] as const;
      const ruled = (element: Element) => { const style = getComputedStyle(element); return sides.some(side => parseFloat(style[`border${side}Width`]) > 0 && style[`border${side}Style`] !== 'none'); };
      const rows = [...panel.querySelectorAll('a, li')];
      const links = [...panel.querySelectorAll('a')];
      const parts = ['.brand-lockup', '.desktop-nav', '.header-cta'].map(selector => { const part = document.querySelector(selector)!.getBoundingClientRect(); return { selector, left: part.left, right: part.right, height: part.height }; });
      return {
        headerBottom: header.bottom, headerHeight: header.height, top: box.top, left: box.left, right: box.right, bottom: box.bottom, background: getComputedStyle(panel).backgroundColor, paper,
        ruledRows: rows.filter(ruled).length, sizes: links.map(link => parseFloat(getComputedStyle(link).fontSize)), heights: links.map(link => link.getBoundingClientRect().height),
        clipped: links.filter(link => link.scrollWidth > link.clientWidth + 1).map(link => link.textContent), outside: links.filter(link => { const rect = link.getBoundingClientRect(); return rect.left < 0 || rect.right > innerWidth || rect.bottom > innerHeight; }).length,
        parts, navHeight: document.querySelector('.desktop-nav')!.getBoundingClientRect().height, overflow: document.documentElement.scrollWidth - innerWidth,
      };
    });
    // Anchored under the bar, light (not lavender), compact (not a full-screen sheet), unruled, readable navigation sizes.
    expect(Math.abs(metrics.top - metrics.headerBottom)).toBeLessThanOrEqual(3);
    expect(metrics.left).toBeGreaterThanOrEqual(0);
    expect(metrics.right).toBeLessThanOrEqual(viewport.width);
    expect(metrics.right - metrics.left).toBeLessThanOrEqual(900);
    expect(metrics.bottom - metrics.top).toBeLessThanOrEqual(viewport.height * .6);
    expect(metrics.background).toBe(metrics.paper);
    expect(metrics.ruledRows, 'no rule on each line').toBe(0);
    for (const size of metrics.sizes) { expect(size).toBeGreaterThanOrEqual(15); expect(size).toBeLessThanOrEqual(19); }
    for (const height of metrics.heights) expect(height).toBeGreaterThanOrEqual(40);
    expect(metrics.clipped).toEqual([]);
    expect(metrics.outside, 'every panel link is inside the screen').toBe(0);
    expect(metrics.headerHeight).toBeLessThanOrEqual(96);
    expect(metrics.navHeight, 'the navigation stays on one line').toBeLessThanOrEqual(60);
    for (let index = 1; index < metrics.parts.length; index++) expect(metrics.parts[index - 1].right, `${metrics.parts[index - 1].selector} overlaps ${metrics.parts[index].selector}`).toBeLessThanOrEqual(metrics.parts[index].left + 1);
    expect(metrics.parts.at(-1)!.right).toBeLessThanOrEqual(viewport.width);
    expect(metrics.overflow).toBeLessThanOrEqual(0);
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();
  });
}

test('Desktop panel: states, pointer, keyboard and every way out; no page jump', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/lentilles');
  const nav = page.getByRole('navigation', { name: 'Navigation principale' });
  const trigger = nav.getByRole('button', { name: 'Nos univers' });
  const panel = page.locator('#universe-panel');
  const link = (href: string) => panel.locator(`a[href="${href}"]`);
  const paint = (href: string) => link(href).evaluate(element => { const style = getComputedStyle(element); return { background: style.backgroundColor, weight: Number(style.fontWeight), underline: style.textDecorationLine }; });
  await expect(trigger).toHaveClass(/is-current/);
  // The header is not sticky: a scroll that hides the trigger would be undone by Playwright before a click (which scrolls to its target
  // even when it is already in the field), so the page is scrolled only as far as keeps the whole trigger in the field and the trigger
  // is pressed with the pointer itself. Opening the panel must then move nothing.
  await page.evaluate(top => window.scrollTo(0, Math.min(24, Math.max(0, top - 4))), await trigger.evaluate(element => element.getBoundingClientRect().top));
  await expect(trigger).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => scrollY), 'the page is scrolled before the measure').toBeGreaterThan(0);
  const before = await page.evaluate(() => ({ y: Math.round(scrollY), height: document.documentElement.scrollHeight, title: Math.round(document.querySelector('h1')!.getBoundingClientRect().top) }));
  const field = (await trigger.boundingBox())!;
  await page.mouse.click(field.x + field.width / 2, field.y + field.height / 2);
  await expect(panel).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  expect(await page.evaluate(() => ({ y: Math.round(scrollY), height: document.documentElement.scrollHeight, title: Math.round(document.querySelector('h1')!.getBoundingClientRect().top) })), 'opening moves nothing on the page').toEqual(before);
  // Current page: distinct from a resting link by background and by weight or underline.
  await expect(link('/lentilles')).toHaveAttribute('aria-current', 'page');
  await page.mouse.move(5, 5);
  const current = await paint('/lentilles'), resting = await paint('/basse-vision');
  expect(current.background).not.toBe(resting.background);
  expect(current.weight > resting.weight || current.underline.includes('underline')).toBe(true);
  // Pointer: the hovered row changes.
  await link('/basse-vision').hover();
  await expect.poll(async () => (await paint('/basse-vision')).background).not.toBe(resting.background);
  // Keyboard: the focused row shows a ring, and the focus can walk out without a trap.
  await page.mouse.move(5, 5);
  await trigger.focus();
  await page.keyboard.press('Tab');
  const ring = await page.evaluate(() => { const style = getComputedStyle(document.activeElement!); return { inPanel: !!document.activeElement!.closest('#universe-panel'), style: style.outlineStyle, width: parseFloat(style.outlineWidth) }; });
  expect(ring.inPanel).toBe(true);
  expect(ring.style).not.toBe('none');
  expect(ring.width).toBeGreaterThanOrEqual(2);
  // Shift+Tab out of the panel (back to the trigger, then the logo) closes it.
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(panel).toBeHidden();
  // Outside click, Escape (focus back to the trigger), a bar link, a panel link and the Back button all close it.
  await trigger.click();
  await page.mouse.click(4, 640);
  await expect(panel).toBeHidden();
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await nav.getByRole('link', { name: 'Nos marques', exact: true }).click();
  await expect(page).toHaveURL(/\/marques$/);
  await expect(panel).toBeHidden();
  await trigger.click();
  await link('/basse-vision').click();
  await expect(h1(page)).toHaveText('Basse vision.');
  await expect(panel).toBeHidden();
  await page.goBack();
  await expect(page).toHaveURL(/\/marques$/);
  await expect(panel).toBeHidden();
  await page.goBack();
  await expect(panel).toBeHidden();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

for (const viewport of [{ width: 360, height: 740 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 800, height: 900 }]) {
  test(`Mobile menu at ${viewport.width} px: named light panel, readable links, focus kept inside, every way out returns the focus`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const menu = page.getByRole('button', { name: 'Menu', exact: true });
    await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeHidden();
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    // The dialog itself is named (its own title or label), not only the navigation inside it.
    const dialog = page.getByRole('dialog', { name: /menu/i });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleName(/\S/);
    expect(await dialog.evaluate(element => { const reference = element.getAttribute('aria-labelledby'); return (element.getAttribute('aria-label') || (reference ? document.getElementById(reference)?.textContent?.trim() : '') || '').length; })).toBeGreaterThan(0);
    const nav = dialog.getByRole('navigation', { name: 'Navigation mobile' });
    expect(await nav.getByRole('link').evaluateAll(links => links.map(link => link.getAttribute('href')))).toEqual(['/', '/rendez-vous', ...universeHrefs, ...houseHrefs, '/marques', '/magasins', '/contact']);
    const metrics = await dialog.evaluate(element => {
      const probe = document.createElement('i'); probe.style.color = 'var(--color-paper)'; document.body.append(probe); const paper = getComputedStyle(probe).color; probe.remove();
      const box = element.getBoundingClientRect();
      const links = [...element.querySelectorAll('nav a')].map(link => { const rect = link.getBoundingClientRect(); return { size: parseFloat(getComputedStyle(link).fontSize), height: rect.height, clipped: link.scrollWidth > link.clientWidth + 1, beyond: rect.right > box.right + .5 || rect.left < box.left - .5 }; });
      return { background: getComputedStyle(element).backgroundColor, paper, width: box.width, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth, links };
    });
    expect(metrics.background, 'a light panel, not a lavender sheet').toBe(metrics.paper);
    expect(metrics.width).toBeLessThanOrEqual(viewport.width);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
    for (const item of metrics.links) {
      expect(item.size).toBeGreaterThanOrEqual(16);
      expect(item.size).toBeLessThanOrEqual(18);
      expect(item.height).toBeGreaterThanOrEqual(44);
      expect(item.clipped).toBe(false);
      expect(item.beyond).toBe(false);
    }
    // The modal keeps the focus inside while the keyboard walks its controls, forwards then backwards.
    for (let step = 0; step < 16; step++) { await page.keyboard.press(step < 10 ? 'Tab' : 'Shift+Tab'); expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true); }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(menu).toBeFocused();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    // A click outside the panel (on the dimmed page) closes it and returns the focus.
    await menu.click();
    await expect(dialog).toBeVisible();
    await page.mouse.click(4, viewport.height / 2);
    await expect(dialog).toBeHidden();
    await expect(menu).toBeFocused();
    // The close button.
    await menu.click();
    await dialog.getByRole('button', { name: 'Fermer le menu' }).click();
    await expect(dialog).toBeHidden();
    await expect(menu).toBeFocused();
    // Following a link closes the menu and leaves no focus in the closed dialog.
    await menu.click();
    await nav.getByRole('link', { name: 'Lentilles', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/lentilles$/);
    expect(await page.evaluate(() => !document.activeElement?.closest('dialog'))).toBe(true);
    await expect(h1(page)).toHaveText('Lentilles.');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
}

test('Mobile menu on a short screen scrolls by itself, the page behind stays where it is', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: /menu/i });
  await expect(dialog).toBeVisible();
  await page.mouse.move(200, 300);
  await page.mouse.wheel(0, 1500);
  await expect.poll(() => dialog.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => scrollY), 'the page behind does not scroll').toBe(0);
  await expect(dialog.getByRole('link', { name: 'Contact', exact: true })).toBeInViewport();
});

// A visitor in the middle of the appointment who takes the yellow action again stays in the same visit: same document,
// same step, same typed values (in memory only), the step title focused and no query or typed value in the URL.
const person = 'Marie Fictive';
test('Appointment resumed from the mobile menu and from the header: same step, same typed values, focus on the step', async ({ page, watch }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/rendez-vous');
  const proceed = page.locator('.rdv-actions [type=submit]');
  const title = page.locator('#rdv-step-title');
  await expect(proceed).toBeEnabled();
  await page.locator('label:has(#rdv-store-taravao)').click();
  await page.locator('label:has(#rdv-reason-conseil-montures)').click();
  await proceed.click();
  const day = demoDays(tahitiToday(new Date())).find(d => slotsFor('taravao', 'conseil-montures', d).length)!;
  const slot = slotsFor('taravao', 'conseil-montures', day)[0];
  await page.locator(`label:has(#rdv-day-${day})`).click();
  await page.locator(`label:has(#rdv-time-${slot.replace(':', '')})`).click();
  await proceed.click();
  await expect(title).toHaveText('Vos coordonnées');
  await page.evaluate(() => { (window as unknown as { sameVisit: string }).sameVisit = 'yes'; });
  watch.typed.push(person);
  await page.getByLabel('Nom', { exact: true }).fill(person);
  const resumed = async () => {
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(title).toHaveText('Vos coordonnées');
    await expect(title).toBeFocused();
    await expect(page).toHaveURL(/\/rendez-vous#coordonnees$/);
    await expect(page.getByLabel('Nom', { exact: true })).toHaveValue(person);
    expect(await page.evaluate(() => (window as unknown as { sameVisit?: string }).sameVisit), 'the document was not reloaded').toBe('yes');
  };
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await expect(page.getByRole('dialog', { name: /menu/i })).toBeVisible();
  await page.getByRole('dialog').getByRole('link', { name: 'Préparer un RDV', exact: true }).click();
  await resumed();
  // The same, from the desktop header, after a resize.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByLabel('Nom', { exact: true }).focus();
  await page.locator('.header-cta').click();
  await resumed();
});

// =====================================================================================================================
// Footer
// =====================================================================================================================
for (const viewport of [{ width: 360, height: 740 }, { width: 768, height: 1024 }, { width: 1440, height: 1000 }]) {
  test(`Footer at ${viewport.width} px: the three stores with their phone, every destination, no overflow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const footer = page.locator('.site-footer');
    await footer.scrollIntoViewIfNeeded();
    for (const store of stores) {
      await expect(footer.locator(`a[href="/magasins/${store.slug}"]`)).toBeVisible();
      await expect(footer.locator(`a[href="tel:${store.phone}"]`)).toBeVisible();
    }
    await expect(footer.getByRole('navigation', { name: 'Plan du site' }).getByRole('link')).toHaveCount(universeHrefs.length + houseHrefs.length + 5 + 3);
    await expect(footer.getByRole('link', { name: 'Préparer un rendez-vous' }).first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    expect(await footer.evaluate(element => [...element.querySelectorAll('a')].filter(link => link.scrollWidth > link.clientWidth + 1).length)).toBe(0);
  });
}
