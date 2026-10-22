import { test as base, expect, type Page } from '@playwright/test';
import { products } from '../../src/data';

// S5 scenarios: the ambient film behind the home hero and the compact frame. The film state is read from the media
// element itself (src, paused, currentTime), never from a class name. Same guards as S4: no error, no request outside
// the local origin, nothing transmitted; tolerated failures are declared by each scenario.
interface Watch { origin: string; failures: string[]; requests: { method: string; url: string; body: string | null }[]; tolerate: RegExp[] }
const test = base.extend<{ watch: Watch }>({
  watch: [async ({ context, baseURL }, use) => {
    const watch: Watch = { origin: new URL(baseURL!).origin, failures: [], requests: [], tolerate: [] };
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
  }, { auto: true }],
});

const filmFile = '/media/ambience/eyewear-loop.mp4';
const posterFile = '/media/ambience/eyewear-poster.webp';
const filmRoute = `**${filmFile}`;
const pauseName = 'Pause vidéo d’ambiance';
const playName = 'Lire la vidéo d’ambiance';
const toggle = (page: Page) => page.locator('.hero-video-toggle');
const film = (page: Page) => page.locator('.hero-ambience video');
const filmState = (page: Page) => film(page).evaluate((video: HTMLVideoElement) => ({ src: video.getAttribute('src'), paused: video.paused, time: video.currentTime, shown: video.hasAttribute('data-shown') }));
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
async function playing(page: Page) {
  await expect(page.getByRole('button', { name: pauseName })).toBeVisible({ timeout: 15000 });
  expect((await filmState(page)).paused).toBe(false);
  await expectAdvancing(page);
}
// No control at all: neither visible nor reachable by assistive technologies or Tab.
async function noControl(page: Page) {
  await expect(page.getByRole('button', { name: /vidéo d’ambiance/ })).toHaveCount(0);
  await expect(toggle(page)).toBeHidden();
}
async function posterOnly(page: Page) {
  const state = await filmState(page);
  expect(state.src, 'no video source').toBeNull();
  expect(state.shown).toBe(false);
  expect(await page.locator('.hero-ambience-media').evaluate(element => getComputedStyle(element).backgroundImage)).toContain(posterFile);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Le soleil\.\s*À votre façon\./);
}
const hideTab = (page: Page, hidden: boolean) => page.evaluate(value => { Object.defineProperty(document, 'visibilityState', { value: value ? 'hidden' : 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); }, hidden);

test('Film: really plays and loops three times from one local file; pause and resume follow the media; rapid toggles end in sync', async ({ page, watch }) => {
  test.setTimeout(90000);
  await page.goto('/');
  await playing(page);
  // Decorative and muted, outside the reading order; its control is named apart from the brand marquee's.
  const traits = await film(page).evaluate((video: HTMLVideoElement) => ({ muted: video.muted, loop: video.loop, inline: video.playsInline, controls: video.controls, tab: video.tabIndex, hidden: !!video.closest('[aria-hidden="true"]') }));
  expect(traits).toEqual({ muted: true, loop: true, inline: true, controls: false, tab: -1, hidden: true });
  await expect(page.getByRole('button', { name: 'Pause du défilement des marques' })).toBeVisible();
  // Three real loops: time wraps back to the start without the element ever ending, emptying or pausing.
  await film(page).evaluate((video: HTMLVideoElement) => {
    const record = { wraps: 0, last: video.currentTime, incidents: [] as string[] };
    (window as unknown as { filmRecord: typeof record }).filmRecord = record;
    video.addEventListener('timeupdate', () => { if (video.currentTime + 1 < record.last) record.wraps++; record.last = video.currentTime; });
    for (const name of ['ended', 'emptied', 'pause', 'error']) video.addEventListener(name, () => record.incidents.push(name));
  });
  const record = () => page.evaluate(() => (window as unknown as { filmRecord: { wraps: number; incidents: string[] } }).filmRecord);
  await expect.poll(async () => (await record()).wraps, { timeout: 40000, intervals: [500] }).toBeGreaterThanOrEqual(3);
  expect((await record()).incidents).toEqual([]);
  await expectAdvancing(page);
  expect(new Set(filmRequests(watch).map(request => request.url)).size, 'a single local file').toBe(1);
  // Visitor pause, then resume.
  await page.getByRole('button', { name: pauseName }).click();
  await expect(page.getByRole('button', { name: playName })).toBeVisible();
  await expectStill(page);
  expect((await filmState(page)).shown, 'a paused film keeps its still frame').toBe(true);
  await page.getByRole('button', { name: playName }).click();
  await playing(page);
  // Rapid toggles: whatever the interleaving of play() and pause(), the label ends matching the element.
  for (let i = 0; i < 5; i++) await toggle(page).click({ delay: 0 });
  await page.waitForTimeout(400);
  const paused = (await filmState(page)).paused;
  await expect(toggle(page)).toHaveAccessibleName(paused ? playName : pauseName);
});

test('Film stops off screen and in a hidden tab and comes back; a visitor pause survives both', async ({ page }) => {
  await page.goto('/');
  await playing(page);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(async () => (await filmState(page)).paused).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await playing(page);
  await hideTab(page, true);
  await expect.poll(async () => (await filmState(page)).paused).toBe(true);
  await hideTab(page, false);
  await playing(page);
  // The visitor's choice wins over every automatic resume.
  await page.getByRole('button', { name: pauseName }).click();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo(0, 0));
  await hideTab(page, true);
  await hideTab(page, false);
  await page.waitForTimeout(600);
  await expect(page.getByRole('button', { name: playName })).toBeVisible();
  await expectStill(page);
});

test('Reduced motion from the start: poster only, no video request, no control; the frame still works', async ({ page, watch }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForTimeout(1500);
  await posterOnly(page);
  await noControl(page);
  expect(filmRequests(watch)).toEqual([]);
  expect(watch.requests.some(request => request.url.includes(posterFile)), 'the poster is served locally').toBe(true);
  await page.getByRole('button', { name: 'The Bird', exact: true }).click();
  await expect(page.locator('.showcase-stage h2')).toHaveText('The Bird');
  expect(await page.locator('.showcase-image').evaluate(element => element.getAnimations().length)).toBe(0);
});

test('Reduced motion switched on during the visit drops the source; switched off, the film resumes unless the visitor paused', async ({ page }) => {
  await page.goto('/');
  await playing(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(async () => (await filmState(page)).src).toBeNull();
  await posterOnly(page);
  await noControl(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await playing(page);
  // Paused by the visitor, then a round trip through reduced motion: still paused, still restartable by hand.
  await page.getByRole('button', { name: pauseName }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(async () => (await filmState(page)).src).toBeNull();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.getByRole('button', { name: playName })).toBeVisible();
  await page.waitForTimeout(600);
  expect((await filmState(page)).paused).toBe(true);
  await page.getByRole('button', { name: playName }).click();
  await playing(page);
});

test('Data saving: poster only and zero video request; the hint turning off later lets the film start', async ({ page, watch }) => {
  await page.addInitScript(() => {
    const connection = Object.assign(new EventTarget(), { saveData: true });
    Object.defineProperty(navigator, 'connection', { value: connection, configurable: true });
    (window as unknown as { setSaveData: (value: boolean) => void }).setSaveData = value => { connection.saveData = value; connection.dispatchEvent(new Event('change')); };
  });
  await page.goto('/');
  await page.waitForTimeout(2000);
  await posterOnly(page);
  await noControl(page);
  expect(filmRequests(watch), 'no byte of the film').toEqual([]);
  await page.evaluate(() => (window as unknown as { setSaveData: (value: boolean) => void }).setSaveData(false));
  await playing(page);
});

test('Autoplay refused: poster kept, never a false pause; the control starts the film by hand', async ({ page }) => {
  // A browser that only plays after a real click by the visitor (the runner's own page activation does not count).
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    let clicked = false;
    addEventListener('click', event => { if (event.isTrusted) clicked = true; }, true);
    HTMLMediaElement.prototype.play = function () { return clicked ? play.call(this) : Promise.reject(new DOMException('Autoplay refused', 'NotAllowedError')); };
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: playName })).toBeVisible();
  await expect(page.getByRole('button', { name: pauseName })).toHaveCount(0);
  const state = await filmState(page);
  expect(state.paused).toBe(true);
  expect(state.shown).toBe(false);
  expect(state.time).toBe(0);
  await page.getByRole('button', { name: playName }).click();
  await playing(page);
});

for (const [label, answer] of [['missing (404)', { status: 404, body: 'Not found' }], ['undecodable', { status: 200, contentType: 'video/mp4', body: Buffer.from('this is not a video stream'.repeat(64)) }]] as const) {
  test(`Film ${label}: finished poster, no control, no broken player; the page stays usable`, async ({ page, watch }) => {
    watch.tolerate.push(/eyewear-loop\.mp4/);
    await page.route(filmRoute, route => route.fulfill(answer));
    await page.goto('/');
    await expect.poll(async () => (await filmState(page)).src, { timeout: 10000 }).toBeNull();
    await posterOnly(page);
    await noControl(page);
    expect(filmRequests(watch).length).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Baby Beach', exact: true }).click();
    await expect(page.locator('.showcase-stage').getByRole('link', { name: 'Découvrir ce modèle' })).toHaveAttribute('href', '/produits/baby-beach');
  });
}

test('Slow network: copy, frame and actions work before the film arrives; no pause offered until real playback', async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route(filmRoute, async route => { await pending; await route.continue().catch(() => {}); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'The Bird', exact: true }).click();
  await expect(page.locator('.showcase-stage h2')).toHaveText('The Bird');
  await expect(page.locator('.hero-actions').getByRole('link', { name: 'Toutes les solaires' })).toHaveAttribute('href', '/solaires');
  const early = await filmState(page);
  expect(early.time).toBe(0);
  expect(early.shown).toBe(false);
  await noControl(page);
  release();
  await playing(page);
});

test('Leaving and coming back: listeners and source are released, the film starts again, nothing errs', async ({ page }) => {
  await page.goto('/');
  await playing(page);
  await page.locator('.hero-actions').getByRole('link', { name: 'Toutes les solaires' }).click();
  await expect(page).toHaveURL(/\/solaires$/);
  await expect(film(page)).toHaveCount(0);
  await page.goBack();
  await playing(page);
});

const model = (slug: string) => products.find(p => p.slug === slug)!;
test('Frame: photo, sheet, model link and three choices together; one yellow action; content above the film; keyboard order', async ({ page }) => {
  await page.goto('/');
  const stage = page.locator('.showcase-stage');
  await expect(stage.locator('img')).toHaveCount(1);
  await expect(stage.getByRole('group', { name: 'Choisir un modèle à découvrir' }).getByRole('button')).toHaveText(['Glory Glory', 'Baby Beach', 'The Bird']);
  for (const slug of ['baby-beach', 'the-bird', 'glory-glory']) {
    await stage.getByRole('button', { name: model(slug).name, exact: true }).click();
    await expect(stage.getByRole('heading', { level: 2 })).toHaveText(model(slug).name);
    await expect(stage.locator('.showcase-price')).toContainText(new Intl.NumberFormat('fr-FR').format(model(slug).minPrice));
    await expect(stage.getByRole('link', { name: 'Découvrir ce modèle' })).toHaveAttribute('href', `/produits/${slug}`);
  }
  const hero = page.locator('.home-hero');
  await expect(hero.locator('.action-primary')).toHaveCount(1);
  await expect(hero.locator('.action-primary')).toHaveText('Toutes les solaires');
  // The film is painted under the copy: the title is what a pointer reaches, and nothing over the content fades it.
  expect(await page.evaluate(() => {
    const title = document.querySelector('#hero-title')!;
    const box = title.getBoundingClientRect();
    let opaque = true;
    for (let node: Element | null = title; node; node = node.parentElement) if (getComputedStyle(node).opacity !== '1') opaque = false;
    return { top: title.contains(document.elementFromPoint(box.left + 20, box.top + box.height / 2)), opaque };
  })).toEqual({ top: true, opaque: true });
  // Tab: intro actions with the film control, model link, then the three choices.
  await playing(page);
  await page.locator('.hero-actions').getByRole('link', { name: 'Toutes les solaires' }).focus();
  const order: string[] = [];
  for (let i = 0; i < 6; i++) { await page.keyboard.press('Tab'); order.push(await page.evaluate(() => document.activeElement!.textContent!.trim())); }
  expect(order).toEqual(['Préparer un rendez-vous', 'Pause vidéo d’ambiance', 'Découvrir ce modèle', 'Glory Glory', 'Baby Beach', 'The Bird']);
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: pauseName })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: playName })).toBeFocused();
});

for (const viewport of [{ width: 320, height: 640 }, { width: 360, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }, { width: 1440, height: 900 }]) {
  test(`Hero at ${viewport.width}×${viewport.height}: no overflow, copy before the frame, touch targets of 44 px, catalogue reached`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await playing(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    const boxes = await page.evaluate(width => {
      const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
      const fits = (inner: DOMRect, outer: DOMRect) => inner.left >= outer.left - .5 && inner.right <= outer.right + .5;
      const title = rect('#hero-title'), stage = rect('.showcase-stage'), hero = rect('.home-hero');
      return {
        copyFirst: width > 800 ? title.right <= stage.left : title.bottom <= stage.top,
        inside: fits(title, hero) && fits(stage, hero) && [...document.querySelectorAll('.showcase-stage *')].every(node => fits(node.getBoundingClientRect(), stage)),
        targets: [...document.querySelectorAll('.home-hero :is(a, button)')].map(element => Math.round(element.getBoundingClientRect().height)),
      };
    }, viewport.width);
    expect(boxes.copyFirst).toBe(true);
    expect(boxes.inside).toBe(true);
    for (const height of boxes.targets) expect(height).toBeGreaterThanOrEqual(44);
    // The hero never fills the screen on its own: the brand marquee starts within the first two screens.
    expect(await page.locator('.brand-marquee').evaluate(element => element.getBoundingClientRect().top)).toBeLessThan(viewport.height * 2);
  });
}
