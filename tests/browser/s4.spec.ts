import { test as base, expect, type Page } from '@playwright/test';
import { products } from '../../src/data';
import { stores } from '../../src/data/stores';
import { dayLabel, demoDays, slotsFor, tahitiToday, timeLabel } from '../../src/lib/appointment';

// S4 scenarios: brand marquee, animated showcase, demonstration appointment. Same guards as S2: former domain blocked,
// no error, no request outside the local origin, no request body or non-GET method, nothing typed in any URL.
interface Watch { origin: string; failures: string[]; requests: { method: string; url: string; body: string | null }[]; typed: string[]; tolerate: RegExp[] }
const safeDecode = (value: string) => { try { return decodeURIComponent(value.replace(/\+/g, ' ')); } catch { return value; } };
const test = base.extend<{ watch: Watch }>({
  watch: [async ({ context, baseURL, page }, use) => {
    const watch: Watch = { origin: new URL(baseURL!).origin, failures: [], requests: [], typed: [], tolerate: [] };
    await context.route(/optic2000tahiti\.com/, route => { watch.failures.push(`former domain requested: ${route.request().url()}`); return route.abort(); });
    context.on('weberror', error => watch.failures.push(`page error: ${error.error().message}`));
    context.on('console', message => { if (message.type() === 'error') watch.failures.push(`console error: ${message.text()} ${message.location().url}`); });
    context.on('request', request => {
      watch.requests.push({ method: request.method(), url: request.url(), body: request.postData() });
      const url = new URL(request.url());
      if (/^https?:$/.test(url.protocol) && url.origin !== watch.origin) watch.failures.push(`automatic request outside the local origin: ${request.url()}`);
    });
    context.on('requestfailed', request => { if (request.failure()?.errorText !== 'net::ERR_ABORTED') watch.failures.push(`request failed: ${request.url()} (${request.failure()?.errorText})`); });
    context.on('page', popup => { if (popup !== page) watch.failures.push('Unexpected new tab'); });
    await use(watch);
    expect(watch.failures.filter(f => !watch.tolerate.some(pattern => pattern.test(f))), 'errors or traffic outside the local origin').toEqual([]);
    expect(watch.requests.filter(request => request.method !== 'GET' || request.body), 'nothing is transmitted').toEqual([]);
    const traffic = watch.requests.map(request => safeDecode(request.url));
    for (const value of watch.typed) expect(traffic.filter(url => url.includes(value)), `"${value}" must not appear in any URL`).toEqual([]);
  }, { auto: true }],
});
const h1 = (page: Page) => page.getByRole('heading', { level: 1 });
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const storage = (page: Page) => page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, cookie: document.cookie }));

// =====================================================================================================================
// Brand marquee
// =====================================================================================================================
const track = (page: Page) => page.locator('.marquee-track');
const offset = (page: Page) => track(page).evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m41);
test('Marquee: real logos move slowly with no pause control, stop on hover and on focus, focus shows the original links only', async ({ page }) => {
  await page.goto('/');
  const marquee = page.locator('.brand-marquee');
  // S5/r3: the large hero pushes the strip below the first screen, and the row only moves while it is in view: scroll to it first.
  await marquee.scrollIntoViewIfNeeded();
  await expect(marquee).toBeInViewport();
  const links = marquee.locator('.marquee-group:not(.marquee-clone) a');
  const count = await links.count();
  expect(count).toBeGreaterThanOrEqual(8);
  for (const href of await links.evaluateAll(all => all.map(a => a.getAttribute('href')))) expect(href).toMatch(/^\/marques\/[a-z0-9-]+$/);
  // The loop copy is hidden from assistive technology and skipped by Tab, with real pointer destinations.
  const clone = marquee.locator('.marquee-clone');
  await expect(clone).toHaveAttribute('aria-hidden', 'true');
  expect(await clone.locator('[id], a:not([tabindex="-1"])').count()).toBe(0);
  expect(await clone.locator('a[tabindex="-1"]').count()).toBe(count);
  expect(await clone.locator('img').evaluateAll(images => images.every(image => image.getAttribute('alt') === ''))).toBe(true);
  await expect(page.getByRole('link', { name: 'Toutes les marques' })).toHaveAttribute('href', '/marques');
  // Moving, with no control of any kind to stop it (S5/r2 removed the Pause button, hidden or not).
  const first = await offset(page);
  await page.waitForTimeout(400);
  expect(await offset(page)).toBeLessThan(first);
  await expect(page.getByRole('button', { name: /pause|reprendre|défilement/i })).toHaveCount(0);
  expect(await marquee.locator('button, [role="button"], [role="switch"], input, [class*="control"], [class*="toggle"], [class*="pause"]').count()).toBe(0);
  // Hover pauses.
  await page.locator('.marquee-viewport').hover();
  await expect(track(page)).toHaveCSS('animation-play-state', 'paused');
  await track(page).evaluate(async element => { await Promise.all(element.getAnimations().map(animation => animation.ready)); });
  const hovered = await offset(page);
  await page.waitForTimeout(400);
  expect(await offset(page)).toBe(hovered);
  await page.mouse.move(5, 5);
  // Keyboard: Tab visits each original link once, each one fully visible, never a copy, then the controls.
  await page.getByRole('link', { name: 'Préparer un rendez-vous' }).first().focus();
  const visited: string[] = [];
  for (let step = 0; step < 40 && visited.length < count; step++) {
    await page.keyboard.press('Tab');
    const state = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement;
      const viewport = element.closest('.marquee-viewport');
      if (!viewport) return null;
      const box = element.getBoundingClientRect(), frame = viewport.getBoundingClientRect();
      return { href: element.getAttribute('href'), inClone: !!element.closest('.marquee-clone'), visible: box.left >= frame.left - 1 && box.right <= frame.right + 1, transform: getComputedStyle(element.closest('.marquee-track')!).transform };
    });
    if (!state) continue;
    expect(state.inClone).toBe(false);
    expect(state.visible, `${state.href} is fully visible when focused`).toBe(true);
    expect(state.transform).toBe('none');
    visited.push(state.href!);
  }
  expect(new Set(visited).size).toBe(count);
  // Nothing sits between the last logo and the directory link.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Toutes les marques' })).toBeFocused();
  await page.getByRole('link', { name: 'Toutes les marques' }).click();
  await expect(page).toHaveURL(/\/marques$/);
  await expect(page.locator('.brand-card')).toHaveCount(38);
});

test('Visible loop copies keep their brand destination usable with a pointer near the end of a cycle', async ({ page }) => {
  await page.goto('/');
  await page.locator('.brand-marquee').scrollIntoViewIfNeeded();
  await page.locator('.marquee-track').evaluate(element => {
    const animation = element.getAnimations()[0];
    animation.currentTime = Number(animation.effect!.getTiming().duration) - 1000;
  });
  const copy = page.locator('.marquee-clone a').nth(1);
  const href = await copy.getAttribute('href');
  const frame = (await page.locator('.marquee-viewport').boundingBox())!;
  await page.mouse.move(frame.x + frame.width / 2, frame.y + frame.height / 2);
  await copy.hover();
  await copy.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ray-Ban');
});

test('Marquee stops off screen and in a hidden tab, then resumes; no page overflow at 360 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  expect(await overflow(page)).toBeLessThanOrEqual(0);
  const marquee = page.locator('.brand-marquee');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(marquee).toHaveAttribute('data-away', 'true');
  // Back to the strip itself (the first screen now belongs to the hero, the strip is reached by scrolling).
  await marquee.scrollIntoViewIfNeeded();
  await expect(marquee).toBeInViewport();
  await expect(marquee).not.toHaveAttribute('data-away', 'true');
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(marquee).toHaveAttribute('data-away', 'true');
  expect(await track(page).evaluate(element => getComputedStyle(element).animationPlayState)).toBe('paused');
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(marquee).not.toHaveAttribute('data-away', 'true');
  expect(await track(page).evaluate(element => getComputedStyle(element).animationPlayState)).toBe('running');
});

test.describe('Touch marquee', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test('Tapping the strip background does not leave a sticky hover pause and no control is offered', async ({ page, watch }) => {
    await page.goto('/');
    const marquee = page.locator('.brand-marquee');
    await marquee.scrollIntoViewIfNeeded();
    await expect(marquee).not.toHaveAttribute('data-away', 'true');
    // Chromium expands a touch into nearby links: the 16 px inter-logo gap can activate a brand even when elementFromPoint
    // returns its background. Use the real empty area below the logos, inside the strip and clear of every link hit target.
    const background = await marquee.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const x = rect.left + 24, y = rect.bottom - 5;
      const hit = document.elementFromPoint(x, y);
      const clearOfLinks = [...element.querySelectorAll('a')].every(link => {
        const box = link.getBoundingClientRect();
        const dx = Math.max(box.left - x, 0, x - box.right), dy = Math.max(box.top - y, 0, y - box.bottom);
        return Math.hypot(dx, dy) > 32;
      });
      return { x, y, clearOfLinks, inStrip: !!hit?.closest('.brand-marquee'), onLink: !!hit?.closest('a'), inViewport: y > 0 && y < innerHeight };
    });
    expect(background.inStrip && !background.onLink && background.inViewport && background.clearOfLinks, 'the real strip background is in view, outside expanded touch targets').toBe(true);
    const before = await offset(page);
    await page.touchscreen.tap(background.x, background.y);
    await expect(page).toHaveURL(`${watch.origin}/`);
    expect(await page.evaluate(() => matchMedia('(hover: hover)').matches)).toBe(false);
    expect(await track(page).evaluate(element => getComputedStyle(element).animationPlayState)).toBe('running');
    await expect(page.getByRole('button', { name: /pause|reprendre|défilement/i })).toHaveCount(0);
    // A synthesized pointer hover on this touch context must also respect the (hover: hover) guard.
    await page.locator('.marquee-viewport').hover();
    expect(await track(page).evaluate(element => getComputedStyle(element).animationPlayState)).toBe('running');
    await expect.poll(() => offset(page), { message: 'the row keeps moving after the background tap' }).toBeLessThan(before - 4);
    expect(await track(page).evaluate(element => getComputedStyle(element).animationPlayState)).toBe('running');
  });
});

test('Reduced motion: still, manually scrollable row of the original logos, no pause button, still frame', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(await track(page).evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  await expect(page.locator('.marquee-clone')).toBeHidden();
  await expect(page.getByRole('button', { name: /pause|reprendre|défilement/i })).toHaveCount(0);
  const viewport = page.locator('.marquee-viewport');
  expect(await viewport.evaluate(element => [getComputedStyle(element).overflowX, element.scrollWidth > element.clientWidth])).toEqual(['auto', true]);
  await viewport.evaluate(element => { element.scrollLeft = 300; });
  expect(await viewport.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  expect(await overflow(page)).toBeLessThanOrEqual(0);
  await page.getByRole('button', { name: 'The Bird', exact: true }).click();
  expect(await page.locator('.showcase-image').evaluate(element => element.getAnimations().length)).toBe(0);
  await expect(page.locator('.showcase-stage h2')).toHaveText('The Bird');
});

// =====================================================================================================================
// Animated showcase
// =====================================================================================================================
const model = (slug: string) => products.find(p => p.slug === slug)!;
async function expectModel(page: Page, slug: string) {
  const product = model(slug);
  const stage = page.locator('.showcase-stage');
  await expect(stage.getByRole('heading', { level: 2 })).toHaveText(product.name);
  await expect(stage.getByRole('link', { name: 'Découvrir ce modèle' })).toHaveAttribute('href', `/produits/${slug}`);
  await expect(stage.locator('.showcase-price')).toContainText(new Intl.NumberFormat('fr-FR').format(product.minPrice));
  await expect(stage.locator('img')).toHaveAttribute('src', new RegExp(encodeURIComponent(product.images[0].src)));
  await expect(stage.locator('img')).toHaveCount(1);
  await expect(page.getByRole('button', { name: product.name, exact: true })).toHaveAttribute('aria-pressed', 'true');
}
test('Showcase: each choice replays a bounded arrival of the photo only; text, price and link change at once, rapid choices end in sync', async ({ page }) => {
  await page.goto('/');
  await expectModel(page, 'glory-glory');
  type Arrival = { name: string | null; elapsed: number; duration: number; iterations: number | undefined; fromTransform: string; toTransform: string; fromOpacity: string; toOpacity: string };
  // Observe the real animation in its own browser task. A host round trip can return after its 650 ms have elapsed.
  await page.locator('.showcase-stage').evaluate(stage => {
    const arrivals: Arrival[] = [];
    (window as Window & { __s4FrameArrivals?: Arrival[] }).__s4FrameArrivals = arrivals;
    stage.addEventListener('animationstart', event => {
      if (!(event instanceof AnimationEvent) || event.animationName !== 'frame-arrive' || !(event.target instanceof Element)) return;
      const animation = event.target.getAnimations().find(item => item instanceof CSSAnimation && item.animationName === 'frame-arrive');
      const frames = animation?.effect instanceof KeyframeEffect ? animation.effect.getKeyframes() : [];
      const timing = animation?.effect?.getTiming();
      arrivals.push({ name: stage.querySelector('.showcase-info h2')?.textContent ?? null, elapsed: event.elapsedTime, duration: Number(timing?.duration), iterations: timing?.iterations, fromTransform: String(frames[0]?.transform), toTransform: String(frames.at(-1)?.transform), fromOpacity: String(frames[0]?.opacity), toOpacity: String(frames.at(-1)?.opacity) });
    });
  });
  for (const [choice, slug] of ['baby-beach', 'the-bird', 'glory-glory'].entries()) {
    await page.getByRole('button', { name: model(slug).name, exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as Window & { __s4FrameArrivals?: Arrival[] }).__s4FrameArrivals?.length ?? 0)).toBe(choice + 1);
    const arrival = await page.evaluate(index => (window as Window & { __s4FrameArrivals?: Arrival[] }).__s4FrameArrivals![index], choice);
    expect(arrival).toMatchObject({ name: model(slug).name, elapsed: 0, duration: 650, iterations: 1, fromOpacity: '0.5', toOpacity: '1' });
    expect(arrival.fromTransform).not.toBe('undefined');
    expect(arrival.fromTransform).not.toBe('none');
    expect(arrival.fromTransform).not.toBe(arrival.toTransform);
    await expect(page.locator('.showcase-info h2')).toHaveText(model(slug).name);
    await page.waitForTimeout(750);
    const rest = await page.locator('.showcase-image').evaluate(element => ({ running: element.getAnimations().filter(a => a.playState === 'running').length, transform: getComputedStyle(element).transform }));
    expect(rest.running, 'the frame rests: no loop').toBe(0);
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(rest.transform);
    await expectModel(page, slug);
  }
  // Rapid clicks and keyboard: the last choice wins everywhere.
  for (const slug of ['baby-beach', 'the-bird', 'baby-beach', 'the-bird']) await page.getByRole('button', { name: model(slug).name, exact: true }).click({ delay: 0 });
  await expectModel(page, 'the-bird');
  await page.getByRole('button', { name: 'Baby Beach', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expectModel(page, 'baby-beach');
  await page.getByRole('link', { name: 'Découvrir ce modèle' }).click();
  await expect(h1(page)).toHaveText('Baby Beach');
});

test('Showcase: a missing photo keeps a bounded fallback, the right text and link, and the next choice recovers', async ({ page, watch }) => {
  const missing = model('baby-beach').images[0].src;
  watch.tolerate.push(new RegExp(encodeURIComponent(missing)));
  await page.route('**/_next/image?**', route => (new URL(route.request().url()).searchParams.get('url') ?? '') === missing ? route.abort() : route.continue());
  await page.goto('/');
  const stage = page.locator('.showcase-stage');
  // The box reserved for the photo (the keyed wrapper) while a photo is shown.
  await expect(stage.locator('.showcase-image img')).toBeVisible();
  const reserved = await stage.locator('.showcase-image').evaluate(element => ({ height: (element as HTMLElement).offsetHeight, width: (element as HTMLElement).offsetWidth }));
  expect(reserved.height).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Baby Beach', exact: true }).click();
  await expect(stage.locator('.image-fallback')).toBeVisible();
  await expect(stage.locator('h2')).toHaveText('Baby Beach');
  await expect(stage.getByRole('link', { name: 'Découvrir ce modèle' })).toHaveAttribute('href', '/produits/baby-beach');
  // The responsive photo reserves its own 900:320 box. An unavailable image must keep that exact layout box,
  // independently of the arrival transform: a redesign does not permit a jump when the media fails.
  expect(await stage.locator('.image-fallback').evaluate(element => ({ height: (element as HTMLElement).offsetHeight, width: (element as HTMLElement).offsetWidth }))).toEqual(reserved);
  const fallback = await stage.locator('.image-fallback').evaluate(element => {
    const box = element.getBoundingClientRect(), frame = (element.closest('.showcase-plateau') ?? element.closest('.showcase-stage'))!.getBoundingClientRect();
    return { height: box.height, width: box.width, inside: box.top >= frame.top - .5 && box.bottom <= frame.bottom + .5, onScreen: box.left >= -.5 && box.right <= innerWidth + .5, overflow: document.documentElement.scrollWidth - innerWidth };
  });
  expect(fallback.inside, 'the fallback stays inside its frame').toBe(true);
  expect(fallback.onScreen).toBe(true);
  expect(fallback.height, 'the fallback is a real box, not a collapsed line').toBeGreaterThanOrEqual(44);
  expect(fallback.width).toBeGreaterThanOrEqual(80);
  expect(fallback.overflow).toBeLessThanOrEqual(0);
  await page.getByRole('button', { name: 'The Bird', exact: true }).click();
  await expectModel(page, 'the-bird');
});

// =====================================================================================================================
// Demonstration appointment
// =====================================================================================================================
const person = { name: 'Marie Fictive', email: 'demo@example.com', phone: '+689 00 00 00 00' };
const days = () => demoDays(tahitiToday(new Date()));
const title = (page: Page) => page.locator('#rdv-step-title');
const proceed = (page: Page) => page.locator('.rdv-actions [type=submit]');
const radio = (page: Page, id: string) => page.locator(`#${id}`);
async function ready(page: Page, query = '') {
  await page.goto(`/rendez-vous${query}`);
  await expect(h1(page)).toHaveText('Préparer un RDV.');
  await expect(proceed(page)).toBeEnabled();
}
const openDay = (store: string, reason: string) => days().find(day => slotsFor(store, reason, day).length)!;
const emptyDay = (store: string, reason: string) => days().find(day => !slotsFor(store, reason, day).length)!;
async function chooseSlot(page: Page, store: string, reason: string, which = 0) {
  const day = openDay(store, reason);
  await page.locator(`label:has(#rdv-day-${day})`).click();
  const time = slotsFor(store, reason, day)[which];
  await page.locator(`label:has(#rdv-time-${time.replace(':', '')})`).click();
  return { day, time };
}
async function fillPerson(page: Page, watch: Watch) {
  watch.typed.push(person.name, person.email, person.phone);
  await page.getByLabel('Nom', { exact: true }).fill(person.name);
  await page.getByLabel('E-mail', { exact: true }).fill(person.email);
  await page.getByLabel('Téléphone').fill(person.phone);
}

test('Appointment entries: home, header, mobile menu, footer, the three stores with their store, vue, services and prostheses', async ({ page }) => {
  await page.goto('/');
  await page.locator('.hero-actions').getByRole('link', { name: 'Préparer un rendez-vous' }).click();
  await expect(h1(page)).toHaveText('Préparer un RDV.');
  await expect(page.locator('input[name="rdv-store"]:checked')).toHaveCount(0);
  await page.locator('.header-cta').click();
  await expect(page).toHaveURL(/\/rendez-vous$/);
  await expect(page.getByRole('navigation', { name: 'Plan du site' }).getByRole('link', { name: 'Préparer un rendez-vous' })).toHaveAttribute('href', '/rendez-vous');
  await expect(page.locator('.footer-actions').getByRole('link', { name: 'Préparer une demande' })).toHaveAttribute('href', '/contact');
  await expect(page.locator('.footer-actions a[href="/rendez-vous"]')).toHaveCount(0);
  for (const store of stores) {
    await page.goto(`/magasins/${store.slug}`);
    await page.locator('.store-information').getByRole('link', { name: 'Préparer un rendez-vous' }).click();
    await expect(radio(page, `rdv-store-${store.slug}`)).toBeChecked();
    await expect(page.locator('.contact-aside')).toContainText(`Optic 2000 ${store.name}`);
    await expect(page.locator('.contact-aside a[href^="tel:"]')).toHaveAttribute('href', `tel:${store.phone}`);
    await expect(page.locator('input[name="rdv-reason"]:checked')).toHaveCount(0);
  }
  await page.goto('/lunettes-de-vue');
  await expect(page.locator('main').getByRole('link', { name: 'Préparer un rendez-vous' })).toHaveAttribute('href', '/rendez-vous?motif=conseil-montures');
  await page.goto('/services-et-garanties');
  await expect(page.locator('main').getByRole('link', { name: 'Préparer un rendez-vous' })).toHaveAttribute('href', '/rendez-vous');
  await page.goto('/protheses-oculaires');
  await page.getByRole('link', { name: 'Simuler un rendez-vous' }).click();
  await expect(radio(page, 'rdv-store-mamao')).toBeChecked();
  await expect(radio(page, 'rdv-reason-protheses')).toBeChecked();
  await expect(page.locator('.rdv-callout')).toContainText('Pour un vrai rendez-vous, appelez');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Préparer un RDV', exact: true }).click();
  await expect(h1(page)).toHaveText('Préparer un RDV.');
});

test('Appointment from the home: linked errors and focus, empty day, slot, contact errors, recap edit, simulation and reset', async ({ page, watch }) => {
  await ready(page);
  await page.evaluate(() => localStorage.setItem('autre-fonction', 'conservée'));
  const before = await storage(page);
  // Step 1: nothing chosen.
  await proceed(page).click();
  await expect(page.locator('#rdv-store-error')).toContainText('Choisissez le magasin');
  await expect(page.locator('#rdv-reason-error')).toContainText('Choisissez le motif');
  await expect(radio(page, 'rdv-store-centre-ville')).toBeFocused();
  await expect(page.locator('fieldset').first()).toHaveAttribute('aria-describedby', /rdv-store-error/);
  await page.locator('label:has(#rdv-store-centre-ville)').click();
  await expect(page.locator('#rdv-store-error')).toHaveCount(0);
  await page.locator('label:has(#rdv-reason-controle-vue)').click();
  await expect(page.locator('main')).toContainText('Ce n’est pas une consultation médicale ni ophtalmologique.');
  await proceed(page).click();
  await expect(title(page)).toHaveText('Votre créneau');
  await expect(title(page)).toBeFocused();
  await expect(page).toHaveURL(/#creneau$/);
  await expect(page.locator('.rdv-day')).toHaveCount(7);
  await expect(page.locator('main')).toContainText('fictifs');
  // Step 2: no day, then a day without any slot and its way out.
  await proceed(page).click();
  await expect(page.locator('#rdv-date-error')).toBeVisible();
  await expect(radio(page, `rdv-day-${days()[0]}`)).toBeFocused();
  const empty = emptyDay('centre-ville', 'controle-vue');
  await page.locator(`label:has(#rdv-day-${empty})`).click();
  await expect(page.locator('.rdv-empty')).toContainText(`Aucun créneau de démonstration le ${dayLabel(empty).full}`);
  await page.locator('#rdv-next-day').click();
  await expect(page.locator('.rdv-time').first()).toBeVisible();
  const slot = await chooseSlot(page, 'centre-ville', 'controle-vue');
  await expect(page.locator('.rdv-chosen')).toContainText(`${dayLabel(slot.day).full} à ${timeLabel(slot.time)}, heure de Tahiti`);
  await proceed(page).click();
  // Step 3: invalid e-mail, corrected.
  await expect(title(page)).toHaveText('Vos coordonnées');
  await page.locator('.header-cta').click();
  await expect(page).toHaveURL(/#coordonnees$/);
  await expect(title(page)).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Préparer un RDV', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page).toHaveURL(/#coordonnees$/);
  await expect(title(page)).toBeFocused();
  await page.setViewportSize({ width: 1440, height: 1000 });
  watch.typed.push('demo@');
  await page.getByLabel('Nom', { exact: true }).fill(person.name);
  await page.getByLabel('E-mail', { exact: true }).fill('demo@');
  await proceed(page).click();
  await expect(page.locator('#rdv-email-error')).toContainText('Vérifiez l’adresse e-mail');
  await expect(page.getByLabel('E-mail', { exact: true })).toBeFocused();
  await expect(page.getByLabel('E-mail', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await fillPerson(page, watch);
  await expect(page.locator('#rdv-email-error')).toHaveCount(0);
  await proceed(page).click();
  // Recap: every section, then an upstream edit that removes the incompatible slot.
  await expect(title(page)).toHaveText('Récapitulatif');
  const summary = page.locator('.rdv-summary');
  for (const text of ['Optic 2000 Centre-ville', 'Contrôle de vue', dayLabel(slot.day).full, timeLabel(slot.time), person.name, person.email, person.phone]) await expect(summary).toContainText(text);
  await page.getByRole('button', { name: 'Modifier votre visite' }).click();
  await expect(title(page)).toHaveText('Votre visite');
  await expect(radio(page, 'rdv-reason-controle-vue')).toBeChecked();
  // No Centre-ville eye-test time exists at Taravao: the slot is removed and the change is explained.
  expect(slotsFor('taravao', 'controle-vue', slot.day)).not.toContain(slot.time);
  await page.locator('label:has(#rdv-store-taravao)').click();
  await expect(page.locator('[role=status] .notice')).toContainText('Il a été retiré');
  await proceed(page).click();
  await expect(title(page)).toHaveText('Votre créneau');
  await expect(page.locator('[role=status] .notice')).toContainText('Il a été retiré');
  await expect(page.locator('input[name="rdv-time"]:checked')).toHaveCount(0);
  await expect(page.locator('main')).toContainText('À Taravao, les horaires réels restent à confirmer auprès du magasin.');
  const second = await chooseSlot(page, 'taravao', 'controle-vue');
  await expect(proceed(page)).toHaveText('Revenir au récapitulatif');
  await proceed(page).click();
  await expect(title(page)).toHaveText('Récapitulatif');
  await expect(summary).toContainText('Optic 2000 Taravao');
  await expect(summary).toContainText(timeLabel(second.time));
  await expect(summary).toContainText(person.email);
  // Simulation: honest result, real store details, nothing sent or stored.
  await page.getByRole('button', { name: 'Simuler le rendez-vous' }).click();
  const result = page.getByRole('heading', { name: 'Rendez-vous préparé pour la démonstration.' });
  await expect(result).toBeFocused();
  await expect(page).toHaveURL(/#resultat$/);
  const panel = page.locator('.rdv-result');
  await expect(panel).toContainText('Aucune réservation n’a été effectuée et aucun e-mail n’a été envoyé');
  const taravao = stores.find(s => s.slug === 'taravao')!;
  await expect(panel.locator('a[href^="tel:"]')).toHaveAttribute('href', `tel:${taravao.phone}`);
  await expect(panel.locator('a[href^="mailto:"]')).toHaveAttribute('href', `mailto:${taravao.email}`);
  await expect(panel).toContainText(taravao.hoursNotice);
  await expect(panel.getByRole('link', { name: 'Voir le magasin Taravao' })).toHaveAttribute('href', '/magasins/taravao');
  expect(await storage(page)).toEqual(before);
  // Reset: the store stays, everything else is gone.
  await page.getByRole('button', { name: 'Refaire la démonstration' }).click();
  await expect(title(page)).toHaveText('Votre visite');
  await expect(title(page)).toBeFocused();
  await expect(radio(page, 'rdv-store-taravao')).toBeChecked();
  await expect(page.locator('input[name="rdv-reason"]:checked')).toHaveCount(0);
  await page.locator('label:has(#rdv-reason-conseil-montures)').click();
  await proceed(page).click();
  await expect(page.locator('input[name="rdv-day"]:checked')).toHaveCount(0);
  await chooseSlot(page, 'taravao', 'conseil-montures');
  await proceed(page).click();
  for (const label of ['Nom', 'E-mail', 'Téléphone']) await expect(page.getByLabel(label, { exact: label !== 'Téléphone' })).toHaveValue('');
  expect(await storage(page)).toEqual(before);
  expect(await page.evaluate(() => JSON.stringify(history.state ?? {}))).not.toContain('Marie');
});

test('Appointment history: Back/Forward move between steps, an invalidated result cannot come back, reload starts again', async ({ page, watch }) => {
  await ready(page, '?magasin=mamao&motif=conseil-montures');
  await proceed(page).click();
  await chooseSlot(page, 'mamao', 'conseil-montures');
  await proceed(page).click();
  await fillPerson(page, watch);
  await proceed(page).click();
  await page.getByRole('button', { name: 'Simuler le rendez-vous' }).click();
  await expect(title(page)).toHaveText('Rendez-vous préparé pour la démonstration.');
  await page.goBack();
  await expect(title(page)).toHaveText('Récapitulatif');
  await page.goForward();
  await expect(title(page)).toHaveText('Rendez-vous préparé pour la démonstration.');
  await page.goBack();
  await page.goBack();
  await expect(title(page)).toHaveText('Vos coordonnées');
  await expect(page.getByLabel('Nom', { exact: true })).toHaveValue(person.name);
  await page.getByLabel('Nom', { exact: true }).fill('Marie Fictive Bis');
  watch.typed.push('Marie Fictive Bis');
  // The edit invalidated the result: Forward lands on the recap, never on the old confirmation.
  await page.goForward();
  await page.goForward();
  await expect(title(page)).toHaveText('Récapitulatif');
  await expect(page).toHaveURL(/#recapitulatif$/);
  await expect(page.locator('.rdv-summary')).toContainText('Marie Fictive Bis');
  for (let step = 0; step < 4; step++) await page.goBack();
  await expect(title(page)).toHaveText('Votre visite');
  await expect(radio(page, 'rdv-reason-conseil-montures')).toBeChecked();
  // Reload: the typed data and the steps are gone, the public context stays.
  await page.goForward();
  await expect(page).toHaveURL(/#creneau$/);
  await page.reload();
  await expect(proceed(page)).toBeEnabled();
  await expect(title(page)).toHaveText('Votre visite');
  await expect(page).not.toHaveURL(/#/);
  await expect(page.locator('.notice').first()).toContainText('reprend au choix du magasin et du motif');
  await expect(radio(page, 'rdv-store-mamao')).toBeChecked();
  await proceed(page).click();
  await chooseSlot(page, 'mamao', 'conseil-montures');
  await proceed(page).click();
  for (const label of ['Nom', 'E-mail', 'Téléphone']) await expect(page.getByLabel(label, { exact: label !== 'Téléphone' })).toHaveValue('');
  await page.goto('/rendez-vous#resultat');
  await expect(proceed(page)).toBeEnabled();
  await expect(title(page)).toHaveText('Votre visite');
  await expect(page.locator('.rdv-result')).toHaveCount(0);
});

test('A new public context in client navigation clears the previous visit instead of keeping a false preselection', async ({ page }) => {
  await ready(page, '?magasin=taravao&motif=conseil-montures');
  await expect(radio(page, 'rdv-store-taravao')).toBeChecked();
  await page.locator('.header-cta').click();
  await expect(page).toHaveURL(/\/rendez-vous$/);
  await expect(page.locator('input[name="rdv-store"]:checked')).toHaveCount(0);
  await expect(page.locator('input[name="rdv-reason"]:checked')).toHaveCount(0);
  await ready(page, '?magasin=taravao&magasin=mamao&motif=conseil-montures');
  await expect(page.locator('.notice')).toContainText('n’a pas été reconnue');
  await expect(page.locator('input[name="rdv-store"]:checked')).toHaveCount(0);
});

test('Appointment links: unknown, contradictory and step parameters are ignored with a notice; prostheses go to Mamao', async ({ page, watch }) => {
  await ready(page, '?magasin=paris&motif=promo&nom=Test&etape=recapitulatif#coordonnees');
  await expect(page.locator('.notice').filter({ hasText: 'n’a pas été reconnue' })).toBeVisible();
  await expect(page.locator('.notice').filter({ hasText: 'étape suivante' })).toHaveCount(1);
  await expect(page.locator('input:checked')).toHaveCount(0);
  await expect(title(page)).toHaveText('Votre visite');
  await expect(page.locator('main')).not.toContainText('paris');
  await ready(page, '?magasin=taravao&motif=protheses');
  await expect(page.locator('.notice').filter({ hasText: 'uniquement au magasin de Mamao' })).toBeVisible();
  await expect(radio(page, 'rdv-store-mamao')).toBeChecked();
  // Choosing another store with the prosthesis reason is refused with the rule.
  await page.locator('label:has(#rdv-store-taravao)').click();
  await proceed(page).click();
  await expect(page.locator('#rdv-store-error')).toContainText('uniquement au magasin de Mamao');
  await expect(radio(page, 'rdv-store-taravao')).toBeFocused();
  // Picking the reason on another store moves the visit to Mamao and says so.
  await ready(page, '?magasin=centre-ville');
  await page.locator('label:has(#rdv-reason-protheses)').click();
  await expect(radio(page, 'rdv-store-mamao')).toBeChecked();
  await expect(page.locator('[role=status] .notice')).toContainText('il a été choisi pour cette visite');
  await proceed(page).click();
  const slot = await chooseSlot(page, 'mamao', 'protheses');
  await proceed(page).click();
  await fillPerson(page, watch);
  await proceed(page).click();
  await page.getByRole('button', { name: 'Simuler le rendez-vous' }).click();
  await expect(page.locator('.rdv-result')).toContainText('Pour les prothèses oculaires, le rendez-vous se demande par téléphone.');
  await expect(page.locator('.rdv-result')).toContainText(timeLabel(slot.time));
  // A product context travels as a light, validated summary.
  await ready(page, '?magasin=mamao&produit=glory-glory&variante=1608');
  await expect(page.locator('.contact-aside')).toContainText('Glory Glory');
  await expect(page.locator('.contact-aside')).toContainText('Noir brillant Manchester United');
});

test('Appointment clock: a day that became today while the page stayed open is withdrawn at midnight', async ({ page, watch }) => {
  await page.clock.install({ time: new Date() });
  await ready(page, '?magasin=centre-ville&motif=conseil-montures');
  await proceed(page).click();
  const first = openDay('centre-ville', 'conseil-montures');
  const offered = slotsFor('centre-ville', 'conseil-montures', first);
  await page.locator(`label:has(#rdv-day-${first})`).click();
  await page.locator(`label:has(#rdv-time-${offered[0].replace(':', '')})`).click();
  const observedNow = await page.evaluate(() => Date.now());
  // The first timeout now fires while the civil date is still the previous day. It must re-arm.
  await page.clock.setSystemTime(observedNow - 3_600_000);
  const elapsed = Date.parse(`${first}T10:00:00Z`) - observedNow + 1000;
  await page.clock.fastForward(elapsed);
  await expect(page.locator(`#rdv-day-${first}`)).toBeChecked();
  await page.clock.fastForward(3_600_000);
  await expect(title(page)).toHaveText('Votre créneau');
  await expect(page.locator('[role=status] .notice')).toContainText('n’est plus proposé');
  await expect(page.locator(`#rdv-day-${first}`)).toHaveCount(0);
  await expect(page.locator('input[name="rdv-day"]:checked')).toHaveCount(0);
  await proceed(page).click();
  await expect(page.getByRole('radio', { name: /fictifs|aucun créneau/ }).first()).toBeFocused();
  void watch;
});

test('Appointment on a 360 px phone: steps readable, actions reachable, no overflow at any step', async ({ page, watch }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await ready(page, '?magasin=taravao&motif=conseil-montures');
  expect(await overflow(page)).toBeLessThanOrEqual(0);
  await proceed(page).click();
  await chooseSlot(page, 'taravao', 'conseil-montures');
  expect(await overflow(page)).toBeLessThanOrEqual(0);
  await proceed(page).click();
  watch.typed.push('prenom.nom.tres.long.de.demonstration@example.com');
  await page.getByLabel('Nom', { exact: true }).fill('Longuenomfictif'.repeat(5));
  await page.getByLabel('E-mail', { exact: true }).fill('prenom.nom.tres.long.de.demonstration@example.com');
  await proceed(page).click();
  expect(await overflow(page)).toBeLessThanOrEqual(0);
  await page.getByRole('button', { name: 'Simuler le rendez-vous' }).click();
  await expect(title(page)).toBeFocused();
  expect(await overflow(page)).toBeLessThanOrEqual(0);
  const actions = await page.locator('.contact-success-actions .action').evaluateAll(all => all.map(element => element.getBoundingClientRect().width));
  expect(actions.every(width => width >= 44)).toBe(true);
});
