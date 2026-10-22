import { test as base, expect, type Page } from '@playwright/test';
import { products } from '../../src/data';
import { stores } from '../../src/data/stores';
import { houseLinks, universes } from '../../src/data/navigation';
import { demoDays, slotsFor, tahitiToday } from '../../src/lib/appointment';
import { frameInkSource, type FrameInk } from '../support/frame-ink';

// S5 scenarios: the ambient film, the home hero and its showcase, the desktop and mobile menus. The film is read from the
// media element itself (src, paused, currentTime), never from a class name. S5/r2 replaced the Pause and Play controls by an
// automatic film (no control of any kind, visible or hidden). S5/r3 (historical, revoked) had moved the film out of the hero into
// a secondary passage further down the page. S5/r4 puts the one real film back where Hugo requires it: in the hero, as the
// picture of the first screen. After Hugo rejected the first r4 composition, the film, heading/actions and integrated header share one scene; `.home-showcase`
// (the three named models) follows as a calm secondary section, then the brands and the products. Playback therefore starts at
// page.goto('/') at the top of the page, the tab visible, with no scroll first. Going out of view means really scrolling down to
// the footer and measuring the media wholly outside the viewport; coming back means scrolling to the top (never a forced state).
// Reduced motion or data saving must request nothing, wherever the page is scrolled. Geometry is only measured on a settled
// page (fonts and images decoded), never on attached markup. Same guards as S4: no error, no request outside the local origin,
// nothing transmitted, nothing typed in any URL; tolerated failures are declared by each scenario. Technical observations (the
// time advances, the time wraps, no backward jump) say nothing about the artistic quality of the loop: that is a human viewing.
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
// S5/r4 curation: two native solar shots, 12–40 s (the former S5/r2 window was 24–40). A loop is observed in real time, never sought.
const minimumLength = 12, maximumLength = 40;
const h1 = (page: Page) => page.getByRole('heading', { level: 1 });
// Copy of the hero, in one place: a change of wording is edited here and nowhere else. The heading may break after the comma.
const heroTitle = /Le soleil,\s*autrement\./;
const primaryLabel = 'Toutes les solaires', appointmentLabel = 'Préparer un rendez-vous';
// The film and its poster, inside the hero. The film is the one `video` of the page: a second one would be a second download.
const filmBox = '.home-hero .ambient-film', filmPoster = '.home-hero .ambient-film-media';
const film = (page: Page) => page.locator(`${filmBox} video`);
// Smooth scrolling is on in the page, so every jump here is instant and its landing is awaited, never assumed. The top of the page
// holds the film; leaving it means going down to the footer, where the whole media is outside the viewport.
async function toTop(page: Page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect.poll(() => page.evaluate(() => scrollY), { message: 'the page is at the top' }).toBe(0);
  await expect(film(page), 'the film is in the first screen').toBeInViewport();
}
async function awayFromFilm(page: Page) {
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await expect(page.locator('.site-footer'), 'the footer is reached').toBeInViewport();
  await expect(film(page), 'the film is out of view').not.toBeInViewport();
  const place = await page.evaluate(selector => { const box = document.querySelector(selector)!.getBoundingClientRect(); return { top: box.top, bottom: box.bottom, viewport: innerHeight, scrolled: scrollY }; }, filmBox);
  expect(place.scrolled, 'the page really scrolled').toBeGreaterThan(0);
  expect(place.bottom <= 0 || place.top >= place.viewport, `the media is wholly outside the viewport (${Math.round(place.top)}→${Math.round(place.bottom)} of ${place.viewport})`).toBe(true);
}
// Fonts and images decoded (the poster too, it is a CSS background) and two frames drawn: only then is a box worth measuring.
async function settled(page: Page) {
  await page.evaluate(async poster => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => { image.loading = 'eager'; return image.decode().catch(() => undefined); }));
    const background = new Image();
    background.src = poster;
    await background.decode().catch(() => undefined);
    await new Promise<void>(done => requestAnimationFrame(() => requestAnimationFrame(() => done())));
  }, posterFile);
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
    // The hero (which now holds the film), the showcase that follows it and the marquee.
    for (const scope of [document.querySelector('.home-hero'), document.querySelector('.home-showcase'), document.querySelector('.brand-marquee')]) {
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

// What the hero really offers in the first screen, measured on a settled page: the title and the primary action, the visible part of
// the film's frame (clipped by the viewport), any text over the film, overflow and clipped text. The film is the picture of the home:
// at the six review sizes its visible part must be substantial, not a symbolic strip. These minima also reject the obsolete
// secondary passage; the final immersive composition fills 94–100% of the first screen, recorded in the capture manifests.
const significant = { height: 260, screenArea: .2, frameVisible: .8, screenWidth: .8 };
async function measureHero(page: Page) {
  await settled(page);
  return page.evaluate(() => {
    const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
    const overlap = (a: DOMRect, b: DOMRect) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const frame = rect('.home-hero .ambient-film'), title = rect('#hero-title'), action = rect('.hero-actions .action-primary');
    const width = Math.max(0, Math.min(frame.right, innerWidth) - Math.max(frame.left, 0)), height = Math.max(0, Math.min(frame.bottom, innerHeight) - Math.max(frame.top, 0));
    const text = [...document.querySelectorAll('h1, h2, h3, h4, p, a, button, li, figcaption, label, span')].filter(node => !node.closest('.ambient-film') && node.getClientRects().length && (node.textContent ?? '').trim());
    return {
      screen: { width: innerWidth, height: innerHeight },
      frame: { top: frame.top, bottom: frame.bottom, width: frame.width, height: frame.height },
      visible: { width, height, area: width * height },
      title: { top: title.top, bottom: title.bottom }, action: { top: action.top, bottom: action.bottom },
      over: text.filter(node => !node.closest('.home-hero, .site-header') && overlap(node.getBoundingClientRect(), frame) > 4).map(node => `${node.tagName.toLowerCase()} "${(node.textContent ?? '').trim().slice(0, 30)}"`),
      clipped: [...document.querySelectorAll('#hero-title, .hero-intro p, .hero-actions :is(a, button)')].filter(node => node.scrollWidth > node.clientWidth + 1).map(node => (node.textContent ?? '').trim()),
      overflow: document.documentElement.scrollWidth - innerWidth,
      videos: document.querySelectorAll('video').length, heroVideos: document.querySelectorAll('.home-hero video').length,
    };
  });
}
type HeroMeasure = Awaited<ReturnType<typeof measureHero>>;
function expectSignificantFilm(measure: HeroMeasure) {
  const { visible, frame, screen } = measure;
  expect(visible.height, `visible film height ${Math.round(visible.height)} px`).toBeGreaterThanOrEqual(significant.height);
  expect(visible.area / (screen.width * screen.height), 'share of the screen covered by the visible film').toBeGreaterThanOrEqual(significant.screenArea);
  expect(visible.area / (frame.width * frame.height), 'share of the film frame that is visible').toBeGreaterThanOrEqual(significant.frameVisible);
  expect(visible.width / screen.width, 'visible film width over screen width').toBeGreaterThanOrEqual(significant.screenWidth);
}
// Title and primary action whole in the first screen; only composed hero/header text on the film, no unrelated content, overflow or clipping, one video.
function expectHeroClean(measure: HeroMeasure) {
  expect(measure.over, 'only the composed hero and header may overlap the decorative film').toEqual([]);
  expect(measure.overflow).toBeLessThanOrEqual(0);
  expect(measure.clipped).toEqual([]);
  expect(measure.videos, 'exactly one video in the whole DOM').toBe(1);
  expect(measure.heroVideos, 'exactly one video in the hero').toBe(1);
  expect(measure.frame.width).toBeGreaterThan(0);
  expect(measure.frame.height).toBeGreaterThan(0);
}
function expectCopyWhole(measure: HeroMeasure) {
  expect(measure.title.top).toBeGreaterThanOrEqual(0);
  expect(measure.title.bottom, 'heading whole in the first screen').toBeLessThanOrEqual(measure.screen.height);
  expect(measure.action.top).toBeGreaterThanOrEqual(0);
  expect(measure.action.bottom, 'primary action whole in the first screen').toBeLessThanOrEqual(measure.screen.height);
}

test('Film: plays by itself from the top of the page with one local file and no control; a real cycle, then the join and the next loop, never backwards', async ({ page, watch }) => {
  test.setTimeout(150_000);
  await page.goto('/');
  // Arrival: the top of the page, the tab visible, nothing scrolled. The one film is in the first screen and plays by itself.
  expect(await page.evaluate(() => ({ scrolled: scrollY, visibility: document.visibilityState, videos: document.querySelectorAll('video').length, heroVideos: document.querySelectorAll('.home-hero video').length, sourceElements: document.querySelectorAll('video source').length }))).toEqual({ scrolled: 0, visibility: 'visible', videos: 1, heroVideos: 1, sourceElements: 0 });
  await expect(film(page), 'the film is in the first screen on arrival').toBeInViewport();
  await playing(page);
  expect((await filmState(page)).src, 'a single source, the local film').toContain(filmFile);
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

test('Film placement: one immersive scene holds the heading, actions and video, before the three models, brands and products', async ({ page, watch }) => {
  await page.goto('/');
  await settled(page);
  const place = await page.evaluate(() => {
    const hero = document.querySelector('.home-hero')!, ambience = document.querySelector('.ambient-film')!, box = ambience.getBoundingClientRect(), field = hero.getBoundingClientRect();
    const after = (first: Element, second: Element) => !!(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
    const chain = ['.home-hero', '.home-showcase', '.brand-marquee', '.home-products'].map(selector => document.querySelector(selector)!);
    return {
      videos: document.querySelectorAll('video').length, films: document.querySelectorAll('.ambient-film').length, heroVideos: hero.querySelectorAll('video').length, heroFilms: hero.querySelectorAll('.ambient-film').length,
      // Nothing of the showcase, the brands or the products is wrapped inside the hero: it is the heading, the actions and the film.
      enclosed: hero.querySelectorAll('.home-showcase, .showcase-stage, .model-selector, .showcase-image, .brand-marquee, .home-products, .product-card').length,
      order: chain.every((node, index) => index === 0 || after(chain[index - 1], node)) && after(document.querySelector('#hero-title')!, document.querySelector('.hero-actions')!),
      insideHero: box.top >= field.top - .5 && box.bottom <= field.bottom + .5,
      hidden: !!ambience.closest('[aria-hidden="true"]'),
    };
  });
  expect(place.videos, 'exactly one video in the whole DOM').toBe(1);
  expect(place.films).toBe(1);
  expect(place.heroVideos, 'exactly one video in the hero').toBe(1);
  expect(place.heroFilms).toBe(1);
  expect(place.enclosed, 'no showcase, marquee or product inside the hero').toBe(0);
  expect(place.order, 'heading before its actions; hero before models, brands and products').toBe(true);
  expect(place.insideHero, 'the film frame lies inside the hero').toBe(true);
  expect(place.hidden, 'decorative: hidden from assistive technologies').toBe(true);
  const measure = await measureHero(page);
  expectHeroClean(measure);
  expectSignificantFilm(measure);
  // The film is in the first screen, so it is asked for on arrival (preload="none" only keeps it from loading before the first play()).
  await playing(page);
  expect(filmRequests(watch).length, 'the film is requested once it plays').toBeGreaterThan(0);
});

// The film is the picture of the first screen at the six review sizes: title and primary action whole, exactly one video, and a
// substantial visible part (height, share of the screen, share of its frame, width); composed hero text, no unrelated content or overflow. It plays
// there without any scroll and has no control.
const reviewSizes = [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }, { width: 1280, height: 720 }, { width: 1440, height: 900 }];
for (const viewport of reviewSizes) {
  test(`Film in the hero at ${viewport.width}×${viewport.height}: title and action whole, one substantial film in the first screen, composed text over it, nothing wider than the screen`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(h1(page)).toBeInViewport({ ratio: 1 });
    await expect(page.locator('.hero-actions .action-primary')).toBeInViewport({ ratio: 1 });
    const measure = await measureHero(page);
    expectCopyWhole(measure);
    expectSignificantFilm(measure);
    expectHeroClean(measure);
    await playing(page);
    await noMediaControl(page);
  });
}
// 320×640 and 3024×1964 are stress tests, not review targets: reflow, whole text, no overflow and a single film, without a relative
// area that a very narrow or a very large screen cannot honestly give.
for (const viewport of [{ width: 320, height: 640 }, { width: 3024, height: 1964 }]) {
  test(`Film in the hero at the ${viewport.width}×${viewport.height} stress size: text whole, one film, composed text over it, nothing wider than the screen`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const measure = await measureHero(page);
    expectHeroClean(measure);
    await playing(page);
    await noMediaControl(page);
  });
}

test('Film stops off screen and in a hidden tab and comes back, with no control at any moment', async ({ page }) => {
  await page.goto('/');
  await playing(page);
  // Really out of view (down to the footer, the media wholly outside the viewport), then back to the top, where it resumes.
  await awayFromFilm(page);
  await expect.poll(async () => (await filmState(page)).paused).toBe(true);
  await expectStill(page);
  await toTop(page);
  await playing(page);
  await hideTab(page, true);
  await expect.poll(async () => (await filmState(page)).paused).toBe(true);
  await noMediaControl(page);
  await hideTab(page, false);
  await playing(page);
  // Out of view and hidden together: coming back to the tab alone must not restart a film that is still out of view.
  await awayFromFilm(page);
  await expect.poll(async () => (await filmState(page)).paused).toBe(true);
  await hideTab(page, true);
  await hideTab(page, false);
  await page.waitForTimeout(600);
  await expectStill(page);
  await toTop(page);
  await playing(page);
});

test.describe('Film on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('The first screen holds the heading, the action and the film, which plays on arrival and rests when the page is scrolled to the footer', async ({ page }) => {
    await page.goto('/');
    // First screen: the copy of the hero and a substantial part of the film are in view, and the film plays with no scroll.
    await expect(h1(page)).toBeInViewport({ ratio: 1 });
    await expect(page.locator('.hero-actions .action-primary')).toBeInViewport({ ratio: 1 });
    expectSignificantFilm(await measureHero(page));
    await playing(page);
    await noMediaControl(page);
    // Down to the footer: the film, wholly out of view, rests.
    await awayFromFilm(page);
    await expect.poll(async () => (await filmState(page)).paused, { message: 'the film rests with its frame out of the screen' }).toBe(true);
    await expectStill(page);
    await noMediaControl(page);
    // Back to the top: the heading is on screen again and the film resumes.
    await toTop(page);
    await expect(h1(page)).toBeInViewport({ ratio: 1 });
    await playing(page);
    await noMediaControl(page);
  });
});

test('Reduced motion from the start: poster only in the hero, no video request wherever the page is scrolled, no control; the showcase still works', async ({ page, watch }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForTimeout(1500);
  await posterOnly(page, watch);
  await noMediaControl(page);
  expect(filmRequests(watch)).toEqual([]);
  // The poster is the hero's picture: its frame is really on screen, substantial and clean, though nothing plays.
  const measure = await measureHero(page);
  expectHeroClean(measure);
  expectSignificantFilm(measure);
  // Down to the footer and back to the top: nothing is requested at any moment.
  await awayFromFilm(page);
  await page.waitForTimeout(1200);
  await toTop(page);
  await posterOnly(page, watch);
  await noMediaControl(page);
  expect(filmRequests(watch), 'reduced motion: no video request, even after scrolling away and back').toEqual([]);
  expect(watch.requests.some(request => request.url.includes(posterFile)), 'the poster is served locally').toBe(true);
  await page.getByRole('button', { name: 'The Bird', exact: true }).click();
  await expect(page.locator('.showcase-stage h2')).toHaveText('The Bird');
  expect(await page.locator('.showcase-image').evaluate(element => element.getAnimations().length)).toBe(0);
});

test('Reduced motion switched on during the visit drops the source; switched off, the film resumes by itself', async ({ page, watch }) => {
  await page.goto('/');
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
  // Down to the footer and back to the top, still nothing: data saving holds wherever the page is scrolled, not only on arrival.
  await awayFromFilm(page);
  await page.waitForTimeout(1200);
  await toTop(page);
  await posterOnly(page, watch);
  expect(filmRequests(watch), 'data saving: no byte of the film, even after scrolling away and back').toEqual([]);
  await page.evaluate(() => (window as unknown as { setSaveData: (value: boolean) => void }).setSaveData(false));
  await playing(page);
});

test('Autoplay refused: the poster stays, still and stable, with no control to start the film by hand', async ({ page }) => {
  // A browser that only plays after a real click by the visitor (the runner's own page activation does not count).
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    let clicked = false;
    (window as unknown as { playAttempts: number }).playAttempts = 0;
    addEventListener('click', event => { if (event.isTrusted) clicked = true; }, true);
    HTMLMediaElement.prototype.play = function () { (window as unknown as { playAttempts: number }).playAttempts++; return clicked ? play.call(this) : Promise.reject(new DOMException('Autoplay refused', 'NotAllowedError')); };
  });
  await page.goto('/');
  // The film is in the first screen, so the play attempt happens on arrival and the refusal is really exercised.
  await expect.poll(() => page.evaluate(() => (window as unknown as { playAttempts: number }).playAttempts), { message: 'play() was attempted on arrival' }).toBeGreaterThan(0);
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
  await expect(page.locator('.hero-actions').getByRole('link', { name: primaryLabel })).toHaveAttribute('href', '/solaires');
  // The film is in the first screen, so it is asked for on arrival and its bytes are held back: the poster stays alone until it plays.
  await expect.poll(async () => (await filmState(page)).paused, { message: 'play() was attempted while the bytes are held back' }).toBe(false);
  const early = await filmState(page);
  expect(early.time).toBe(0);
  expect(early.shown).toBe(false);
  expect(await page.locator(filmPoster).evaluate(element => getComputedStyle(element).backgroundImage)).toContain(posterFile);
  await noMediaControl(page);
  // The showcase works while the film is pending (choosing a model scrolls the page down to it).
  await page.getByRole('button', { name: 'The Bird', exact: true }).click();
  await expect(page.locator('.showcase-stage h2')).toHaveText('The Bird');
  // Back at the top the film is wanted again; the held bytes are released and it plays.
  await toTop(page);
  release();
  await playing(page);
});

test('Leaving and coming back: listeners and source are released, the film starts again, nothing errs', async ({ page }) => {
  await page.goto('/');
  await playing(page);
  await page.locator('.hero-actions').getByRole('link', { name: primaryLabel }).click();
  await expect(page).toHaveURL(/\/solaires$/);
  await expect(film(page)).toHaveCount(0);
  await page.goBack();
  // The browser may or may not restore the scroll position: the top is reached again either way.
  await toTop(page);
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

// S5/r4: the three models are a calm secondary section, `.home-showcase`, right after the hero (which ends with the film). Choosing
// a model scrolls the page down to it, so anything measured at the top of the page goes back to the top first.
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
  // The immersive hero may be dark after the S5/r4 recadrage. The secondary showcase keeps a white field. Still banned in the showcase: a black (or any
  // dark) frame, a bordered card and walled-in tabs. Nothing between the heading of the model and its section is enclosed by borders
  // (a single ruled line is the design: two or more sides make a card) or sits on a dark background; the three choices carry no
  // border at all; if a plateau still exists under the photo, it does not enclose the information.
  const cards = await page.evaluate(() => {
    const sides = ['Top', 'Right', 'Bottom', 'Left'] as const;
    const ruled = (element: Element) => { const style = getComputedStyle(element); return sides.filter(side => parseFloat(style[`border${side}Width`]) > 0 && style[`border${side}Style`] !== 'none').length; };
    const bordered = (element: Element) => ruled(element) > 0;
    const dark = (color: string) => { const [r, g, b, a = 1] = (color.match(/[\d.]+/g) ?? []).map(Number); return a > .5 && (.2126 * r + .7152 * g + .0722 * b) / 255 < .35; };
    const bad: string[] = [];
    for (let element: Element | null = document.querySelector('.showcase-info h2'); element; element = element.parentElement) {
      if (ruled(element) >= 2) bad.push(`${String(element.className)} is enclosed by borders`);
      if (dark(getComputedStyle(element).backgroundColor)) bad.push(`${String(element.className)} is a dark frame`);
      if (element.classList.contains('home-showcase')) break;
    }
    for (const field of ['.home-showcase']) if (dark(getComputedStyle(document.querySelector(field)!).backgroundColor)) bad.push(`${field} is a dark field`);
    const buttons = [...document.querySelectorAll('.model-selector button')];
    if (buttons.filter(bordered).length > 1) bad.push('the three choices are cells with borders');
    const plateau = document.querySelector('.showcase-plateau')?.getBoundingClientRect(), info = document.querySelector('.showcase-info')!.getBoundingClientRect();
    if (plateau && info.left >= plateau.left && info.right <= plateau.right && info.top >= plateau.top && info.bottom <= plateau.bottom) bad.push('the plateau encloses the information');
    return bad;
  });
  expect(cards).toEqual([]);
  // The title is what a pointer reaches, with no transparent ancestor: it sits over the decorative film, never behind it. The
  // choices above made the page scroll down to the showcase: back to the top, with the title whole on screen, before the pointer is aimed at it.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect.poll(() => page.evaluate(() => scrollY), { message: 'the page is back at the top' }).toBe(0);
  await expect(page.locator('#hero-title')).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => {
    const title = document.querySelector('#hero-title')!;
    const box = title.getBoundingClientRect();
    let opaque = true;
    for (let node: Element | null = title; node; node = node.parentElement) if (getComputedStyle(node).opacity !== '1') opaque = false;
    return { top: title.contains(document.elementFromPoint(box.left + 20, box.top + box.height / 2)), opaque };
  })).toEqual({ top: true, opaque: true });
  // Tab: the heading's actions, then the three choices and the model link in some order (the choices keep their own order),
  // then the brands. The film closes the hero but is neither focusable nor announced, so nothing else sits between the actions and the marquee.
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

// S5/r4 recadrage: the immersive hero (heading and yellow action composed over the film) and the following showcase at the six review
// sizes, the 320 px floor and the four thresholds of the header (800/801, 1100/1101): the heading and the yellow action come first and
// (from 360 px) are whole in the first screen, the film starts in that screen (its substantial share is measured by the « Film in
// the hero » scenarios above), then the three models in their own section, whole and legible; no unrelated text over the film and no text on the product photo, no
// overflow, no clipped text. (S5/r3, historical: the frame was the hero's picture and the film lay outside the hero.)
const heroViewports = [{ width: 320, height: 640 }, { width: 360, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 800, height: 900 }, { width: 801, height: 900 }, { width: 1024, height: 768 }, { width: 1100, height: 900 }, { width: 1101, height: 900 }, { width: 1280, height: 720 }, { width: 1280, height: 800 }, { width: 1440, height: 900 }];
for (const viewport of heroViewports) {
  test(`Hero and showcase at ${viewport.width}×${viewport.height}: heading and action in the film scene, the three models follow whole and legible, no unrelated text over the film or the photo, touch targets of 44 px, brands reached`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await settled(page);
    await noMediaControl(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    const boxes = await page.evaluate(() => {
      const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
      const fits = (inner: DOMRect, outer: DOMRect) => inner.left >= outer.left - .5 && inner.right <= outer.right + .5;
      const overlap = (a: DOMRect, b: DOMRect) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      const before = (first: string, second: string) => !!(document.querySelector(first)!.compareDocumentPosition(document.querySelector(second)!) & Node.DOCUMENT_POSITION_FOLLOWING);
      const title = rect('#hero-title'), action = rect('.hero-actions .action-primary'), hero = rect('.home-hero'), ambience = rect('.home-hero .ambient-film'), section = rect('.home-showcase'), stage = rect('.showcase-stage'), image = rect('.showcase-image img');
      const heroText = [...document.querySelectorAll('#hero-title, .hero-intro p, .hero-actions :is(a, button)')];
      const showcaseText = [...document.querySelectorAll('.model-selector button, .showcase-info :is(h2, p, a), .showcase-link')];
      const allText = [...document.querySelectorAll('h1, h2, h3, h4, p, a, button, li, figcaption, label, span')].filter(node => !node.closest('.ambient-film, .home-hero, .site-header') && node.getClientRects().length && (node.textContent ?? '').trim());
      const screen = { left: 0, right: innerWidth } as DOMRect;
      return {
        // Accessible title then actions; the decorative film shares their scene. The secondary showcase follows the hero.
        order: before('#hero-title', '.hero-actions') && before('.home-hero', '.home-showcase'),
        vertical: title.top >= ambience.top && title.bottom <= ambience.bottom && action.top >= title.bottom && action.bottom <= ambience.bottom && ambience.bottom <= image.top + 1,
        // Every text and control of the hero is inside the screen and inside the hero, the film too; the showcase text is inside its own
        // section. The photo itself may be wider than a phone screen (only its white margins fall outside, measured below).
        inside: fits(title, hero) && fits(ambience, screen) && fits(ambience, hero) && heroText.every(node => fits(node.getBoundingClientRect(), hero)) && fits(stage, screen) && showcaseText.every(node => fits(node.getBoundingClientRect(), section)),
        // Only hero/header copy may sit on the film; showcase text stays outside its complete product photo.
        textOnFilm: allText.filter(node => overlap(node.getBoundingClientRect(), ambience) > 4).map(node => (node.textContent ?? '').trim().slice(0, 30)),
        textOnPhoto: showcaseText.filter(node => overlap(node.getBoundingClientRect(), image) > 4).map(node => node.textContent!.trim().slice(0, 30)),
        // The first screen: heading and primary action whole, the film has started.
        first: { title: [title.top, title.bottom], action: [action.top, action.bottom], filmTop: ambience.top, viewport: innerHeight },
        videos: document.querySelectorAll('video').length, heroVideos: document.querySelectorAll('.home-hero video').length,
        enclosed: document.querySelectorAll('.home-hero :is(.home-showcase, .showcase-stage, .model-selector, .brand-marquee, .home-products, .product-card)').length,
        targets: [...document.querySelectorAll('.home-hero :is(a, button), .home-showcase :is(a, button)')].map(element => Math.round(element.getBoundingClientRect().height)),
        clipped: [...heroText, ...showcaseText].filter(node => node.scrollWidth > node.clientWidth + 1).map(node => node.textContent!.trim()),
      };
    });
    expect(boxes.order).toBe(true);
    expect(boxes.vertical, 'heading and action sit inside the immersive film, the secondary photo follows').toBe(true);
    expect(boxes.inside).toBe(true);
    expect(boxes.textOnFilm).toEqual([]);
    expect(boxes.textOnPhoto).toEqual([]);
    expect(boxes.videos, 'exactly one video in the whole DOM').toBe(1);
    expect(boxes.heroVideos, 'exactly one video in the hero').toBe(1);
    expect(boxes.enclosed, 'no showcase, marquee or product inside the hero').toBe(0);
    expect(boxes.clipped).toEqual([]);
    // Heading and primary action are whole in the first screen and the film starts there (the 320×640 floor only has to avoid overflow and clipping).
    if (viewport.width >= 360) {
      expect(boxes.first.title[0]).toBeGreaterThanOrEqual(0);
      expect(boxes.first.title[1], 'heading whole in the first screen').toBeLessThanOrEqual(viewport.height);
      expect(boxes.first.action[0]).toBeGreaterThanOrEqual(0);
      expect(boxes.first.action[1], 'primary action whole in the first screen').toBeLessThanOrEqual(viewport.height);
      expect(boxes.first.filmTop, 'the film starts inside the first screen').toBeLessThan(viewport.height);
    }
    for (const height of boxes.targets) expect(height).toBeGreaterThanOrEqual(44);
    // Each model photo is whole: loaded, in its true proportions (to the pixel), contained (never cropped by its own box), and the frame
    // drawn in it (the dark part, not the white margins) lies inside the screen; texts are not clipped; the frame is large enough to
    // judge in this secondary section (from 260 px on a phone, from 480 px on the 1440 px desktop: the former 600 px was the hero
    // picture's) and the photo never exceeds 1000 px. A choice scrolls the page to the showcase; the probe reads viewport coordinates.
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
      if (viewport.width >= 360) expect(photo.ink!.width, `${slug}: frame legible (${Math.round(photo.ink!.width)} px)`).toBeGreaterThanOrEqual(viewport.width >= 1440 ? 480 : 260);
      expect(photo.box.width, `${slug}: photo kept within its maximum (${Math.round(photo.box.width)} px)`).toBeLessThanOrEqual(1000.5);
      expect(await page.evaluate(() => [...document.querySelectorAll('.showcase-info :is(h2, p, a), .showcase-link, .model-selector button')].filter(node => node.scrollWidth > node.clientWidth + 1).map(node => node.textContent!.trim()))).toEqual([]);
    }
    // The brands come after the hero and the showcase and are reached by scrolling (no threshold forces them into the first screen).
    const marquee = page.locator('.brand-marquee');
    expect(await page.evaluate(() => !!(document.querySelector('.home-showcase')!.compareDocumentPosition(document.querySelector('.brand-marquee')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
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
