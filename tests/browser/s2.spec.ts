import { test as base, expect, type Page } from '@playwright/test';
import { products } from '../../src/data';
import { stores } from '../../src/data/stores';
import { teamArticles } from '../../src/data/content';

// S2 scenarios. Every scenario runs with the former domain blocked and fails on any automatic request that leaves the
// local origin, page/console error, broken image, horizontal overflow, request body or new tab. External links are
// read (href, target, rel) but never activated. All form data is fictitious and uses example.com.
interface Watch { origin: string; failures: string[]; requests: { method: string; url: string; body: string | null }[]; popups: string[]; typed: string[]; tolerate: RegExp[] }
const safeDecode = (value: string) => { try { return decodeURIComponent(value.replace(/\+/g, ' ')); } catch { return value; } };
const test = base.extend<{ watch: Watch }>({
  watch: [async ({ context, baseURL, page }, use) => {
    const watch: Watch = { origin: new URL(baseURL!).origin, failures: [], requests: [], popups: [], typed: [], tolerate: [] };
    await context.route(/optic2000tahiti\.com/, route => { watch.failures.push(`former domain requested: ${route.request().url()}`); return route.abort(); });
    context.on('weberror', error => watch.failures.push(`page error: ${error.error().message}`));
    context.on('console', message => { if (message.type() === 'error') watch.failures.push(`console error: ${message.text()}`); });
    // A navigation cancelled by the next click is not a failure; anything else is.
    context.on('requestfailed', request => { if (request.failure()?.errorText !== 'net::ERR_ABORTED') watch.failures.push(`request failed: ${request.url()} (${request.failure()?.errorText})`); });
    context.on('request', request => {
      watch.requests.push({ method: request.method(), url: request.url(), body: request.postData() });
      const url = new URL(request.url());
      if (/^https?:$/.test(url.protocol) && url.origin !== watch.origin) watch.failures.push(`automatic request outside the local origin: ${request.url()}`);
    });
    context.on('page', popup => { if (popup !== page) watch.popups.push(popup.url()); });
    await use(watch);
    expect(watch.failures.filter(failure => !watch.tolerate.some(pattern => pattern.test(failure))), 'errors, failed requests or traffic outside the local origin').toEqual([]);
    expect(watch.popups, 'no new tab: external links are never activated').toEqual([]);
    expect(watch.requests.filter(request => request.method !== 'GET' || request.body), 'nothing typed is transmitted: no request has a body or a method other than GET').toEqual([]);
    const traffic = watch.requests.map(request => safeDecode(request.url));
    for (const value of watch.typed) expect(traffic.filter(url => url.includes(value)), `"${value}" must not appear in any URL`).toEqual([]);
  }, { auto: true }],
});

// ---- Shared helpers -----------------------------------------------------------------------------------------------
const externalAllowlist = new Set<string>([...stores.map(s => s.mapUrl), ...teamArticles.map(a => a.href)]);
async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(async image => { image.loading = 'eager'; try { await image.decode(); } catch { /* a failed decode is reported as a broken image */ } }));
  });
}
// Images decoded and visible, no fallback, no horizontal overflow, external links only from the allowlist, safely opened.
async function expectHealthy(page: Page) {
  await settle(page);
  const state = await page.evaluate(() => ({
    broken: [...document.images].filter(image => !image.complete || image.naturalWidth === 0).map(image => image.currentSrc || image.getAttribute('src')),
    fallbacks: document.querySelectorAll('.image-fallback').length,
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    external: [...document.querySelectorAll<HTMLAnchorElement>('a[href]')].filter(a => /^https?:/.test(a.getAttribute('href') ?? '') && new URL(a.href).origin !== location.origin).map(a => ({ href: a.getAttribute('href')!, target: a.target, rel: a.rel })),
  }));
  expect(state.broken, `${page.url()}: broken images`).toEqual([]);
  expect(state.fallbacks, `${page.url()}: image fallbacks shown`).toBe(0);
  expect(state.overflow, `${page.url()}: horizontal overflow`).toBeLessThanOrEqual(0);
  for (const link of state.external) {
    expect(externalAllowlist.has(link.href), `${page.url()}: external link outside the allowlist: ${link.href}`).toBe(true);
    expect([link.target, /noopener/.test(link.rel), /noreferrer/.test(link.rel)], `${link.href} opens safely in a new tab`).toEqual(['_blank', true, true]);
  }
}
const params = (page: Page) => Object.fromEntries(new URL(page.url()).searchParams);
const queryOf = (href: string | null) => Object.fromEntries(new URL(href!, 'http://prototype.local').searchParams);
const imageSrc = (src: string) => new RegExp(encodeURIComponent(src).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const storage = (page: Page) => page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage }, cookie: document.cookie }));
const h1 = (page: Page) => page.getByRole('heading', { level: 1 });

// ---- Lens helpers (FreshLook Colorblends: Grey = 1949, Blue = 1944; one variant per colour, sphere left open) --------
const colorblends = products.find(p => p.slug === 'freshlook-colorblends')!;
const variantOf = (id: number) => colorblends.variants.find(v => v.id === id)!;
const colorblendsUrl = '/produits/freshlook-colorblends';
const colour = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const sphere = (page: Page) => page.getByLabel('2. Choisissez la sphère');
const lensStatus = (page: Page) => page.locator('.lens-status');
const price = (page: Page) => page.locator('.detail-price');
const mainImage = (page: Page) => page.locator('.product-main-image img');
const storeAction = (page: Page) => page.locator('a.product-store-action');
const corrections = [{ sign: '+2.00', slug: '2-00' }, { sign: '-2.00', slug: '2-00-2' }, { sign: '0.00', slug: '0-00' }] as const;

// ---- Contact helpers ----------------------------------------------------------------------------------------------
const person = { name: 'Marie Fictive', email: 'demo@example.com', phone: '+689 00 00 00 00', message: 'Message fictif S2 zq93x : question de démonstration.' };
const submitButton = (page: Page) => page.getByRole('button', { name: 'Préparer la demande', exact: true });
const field = (page: Page, label: 'Nom' | 'E-mail' | 'Téléphone' | 'Message') => label === 'Téléphone' ? page.getByLabel('Téléphone') : page.getByLabel(label, { exact: true });
const storeRadio = (page: Page, slug: string) => page.locator(`#contact-store-${slug}`);
const subjectSelect = (page: Page) => page.getByLabel('Objet de la demande');
async function openContact(page: Page, query = '') {
  await page.goto(`/contact${query}`);
  await expect(h1(page)).toHaveText('Préparer votre demande.');
  await expect(submitButton(page)).toBeEnabled();
}
async function fillPerson(page: Page, watch: Watch, only: (keyof typeof person)[] = ['name', 'email', 'phone', 'message']) {
  watch.typed.push(...only.map(key => person[key]));
  if (only.includes('name')) await field(page, 'Nom').fill(person.name);
  if (only.includes('email')) await field(page, 'E-mail').fill(person.email);
  if (only.includes('phone')) await field(page, 'Téléphone').fill(person.phone);
  if (only.includes('message')) await field(page, 'Message').fill(person.message);
}
// The error text is visible, the control is invalid and points at its message through aria-describedby.
async function expectFieldError(page: Page, name: 'store' | 'subject' | 'name' | 'email' | 'phone' | 'message', text: RegExp) {
  const error = page.locator(`#contact-${name}-error`);
  await expect(error).toBeVisible();
  await expect(error).toContainText(text);
  const control = name === 'store' ? page.locator('fieldset.contact-stores') : page.locator(`#contact-${name}`);
  await expect(control).toHaveAttribute('aria-invalid', 'true');
  await expect(control).toHaveAttribute('aria-describedby', new RegExp(`(^|\\s)contact-${name}-error(\\s|$)`));
}
const backLink = (page: Page) => page.locator('.contact-page > .back-link');
const noError = (page: Page, name: string) => expect(page.locator(`#contact-${name}-error`)).toHaveCount(0);
const aside = (page: Page) => page.getByRole('complementary', { name: 'Récapitulatif de votre demande' });
async function expectStoreAside(page: Page, slug: string) {
  const store = stores.find(s => s.slug === slug)!;
  await expect(aside(page).getByRole('heading', { name: `Optic 2000 ${store.name}` })).toBeVisible();
  await expect(aside(page).locator('a[href^="tel:"]')).toHaveAttribute('href', `tel:${store.phone}`);
  await expect(aside(page).locator('a[href^="mailto:"]')).toHaveAttribute('href', `mailto:${store.email}`);
  await expect(aside(page).getByRole('link', { name: 'Plan et itinéraire' })).toHaveAttribute('href', store.mapUrl);
  await expect(aside(page).locator('.contact-hours')).toHaveText(store.hoursSummary);
  await expect(aside(page).locator('.hours-notice')).toHaveText(store.hoursNotice);
}

// =====================================================================================================================
// Navigation
// =====================================================================================================================
const destinations = [
  ['/lunettes-de-vue', 'Lunettes de vue.'], ['/solaires', 'Les lunettes de soleil'], ['/lentilles', 'Lentilles.'], ['/jumelles-et-telescopes', 'Jumelles et télescopes.'],
  ['/basse-vision', 'Basse vision.'], ['/protheses-oculaires', 'Prothèses oculaires.'], ['/services-et-garanties', 'Services et garanties.'], ['/qui-sommes-nous', 'Vos opticiens à Tahiti.'],
] as const;

test('Desktop universes panel: keyboard, Escape, focus return, outside click and every destination', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Navigation principale' });
  const trigger = nav.getByRole('button', { name: 'Nos univers' });
  const panel = page.locator('#universe-panel');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).toBeHidden();
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(panel).toBeVisible();
  expect(await panel.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href')))).toEqual(destinations.map(([href]) => href));
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('#universe-panel'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
  // Leaving the panel with Tab closes it and lands on the next control of the navigation.
  await page.keyboard.press('Enter');
  await expect(panel).toBeVisible();
  const brands = nav.getByRole('link', { name: 'Nos marques', exact: true });
  for (let step = 0; step < 14 && !(await brands.evaluate(el => el === document.activeElement)); step++) await page.keyboard.press('Tab');
  await expect(brands).toBeFocused();
  await expect(panel).toBeHidden();
  // A click outside closes it too.
  await trigger.click();
  await expect(panel).toBeVisible();
  await page.mouse.click(8, 700);
  await expect(panel).toBeHidden();
  for (const [href, title] of destinations) {
    await trigger.click();
    await panel.locator(`a[href="${href}"]`).click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(h1(page)).toHaveText(title);
    await expect(panel).toBeHidden();
    await trigger.click();
    await expect(panel.locator(`a[href="${href}"]`)).toHaveAttribute('aria-current', 'page');
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expectHealthy(page);
  }
  for (const [name, href] of [['Nos marques', '/marques'], ['Nos magasins', '/magasins'], ['Contact', '/contact']] as const) {
    await nav.getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
  }
});

test('Footer reaches every universe, the house pages and the three legal pages', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('navigation', { name: 'Plan du site' });
  expect(await footer.getByRole('link').evaluateAll(links => links.map(link => link.getAttribute('href')))).toEqual([
    ...destinations.map(([href]) => href).filter(href => !['/services-et-garanties', '/qui-sommes-nous'].includes(href)),
    '/services-et-garanties', '/qui-sommes-nous', '/marques', '/magasins', '/catalogue', '/contact',
    '/mentions-legales', '/politique-de-confidentialite', '/cgv',
  ]);
  for (const [name, title, phrase] of [
    ['Mentions légales', 'Mentions légales.', /prototype de présentation réalisé par Devlab/], ['Confidentialité', 'Confidentialité.', /aucun cookie/], ['CGV', 'Conditions générales de vente.', /Ce prototype ne vend rien en ligne/],
  ] as const) {
    await page.goto('/');
    await footer.getByRole('link', { name, exact: true }).click();
    await expect(h1(page)).toHaveText(title);
    await expect(page.locator('main')).toContainText(phrase);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.getByText(/accepter (les|tous les) cookies|bandeau cookies/i)).toHaveCount(0);
    await expectHealthy(page);
  }
});

for (const viewport of [{ width: 390, height: 600 }, { width: 360, height: 640 }]) {
  test(`Mobile menu ${viewport.width}×${viewport.height}: all destinations, scrollable, keyboard, Escape and focus return`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const menu = page.getByRole('button', { name: 'Menu', exact: true });
    await menu.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const nav = dialog.getByRole('navigation', { name: 'Navigation mobile' });
    expect(await nav.getByRole('link').evaluateAll(links => links.map(link => link.getAttribute('href')))).toEqual([
      '/', '/lunettes-de-vue', '/solaires', '/lentilles', '/jumelles-et-telescopes', '/basse-vision', '/protheses-oculaires', '/services-et-garanties', '/qui-sommes-nous', '/marques', '/magasins', '/contact',
    ]);
    const metrics = await dialog.evaluate(element => ({ scroll: element.scrollHeight, client: element.clientHeight, overflowY: getComputedStyle(element).overflowY, viewport: innerHeight }));
    expect(metrics.scroll, 'the menu is taller than the short screen').toBeGreaterThan(metrics.client);
    expect(metrics.client).toBeLessThanOrEqual(metrics.viewport);
    expect(['auto', 'scroll']).toContain(metrics.overflowY);
    // The keyboard reaches the last link and scrolls it into view.
    const last = nav.getByRole('link', { name: 'Contact', exact: true });
    for (let step = 0; step < 20 && !(await last.evaluate(el => el === document.activeElement)); step++) await page.keyboard.press('Tab');
    await expect(last).toBeFocused();
    await expect(last).toBeInViewport();
    expect(await dialog.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.activeElement?.closest('dialog') !== null)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(menu).toBeFocused();
    await menu.click();
    await dialog.getByRole('button', { name: 'Fermer le menu' }).click();
    await expect(dialog).toBeHidden();
    await expect(menu).toBeFocused();
    for (const [name, href] of [['Lunettes de vue', '/lunettes-de-vue'], ['Jumelles et télescopes', '/jumelles-et-telescopes'], ['Prothèses oculaires', '/protheses-oculaires'], ['Qui sommes-nous', '/qui-sommes-nous']] as const) {
      await menu.click();
      await nav.getByRole('link', { name, exact: true }).scrollIntoViewIfNeeded();
      await nav.getByRole('link', { name, exact: true }).click();
      await expect(dialog).toBeHidden();
      await expect(page).toHaveURL(new RegExp(`${href}$`));
      await expectHealthy(page);
    }
  });
}

test('Home shows the whole house beyond Maui Jim without hiding the first models or the store shortcut', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(h1(page)).toHaveText(/Le soleil\.\s*À votre façon\./);
    await expect(page.locator('.showcase-stage')).toBeInViewport();
    if (viewport.width >= 1101) await expect(page.locator('.header-store')).toBeVisible();
    else await expect(page.getByRole('button', { name: 'Menu', exact: true }).or(page.getByRole('navigation', { name: 'Navigation principale' }))).toBeVisible();
    expect(await page.locator('.home-universes .universe-index a').evaluateAll(links => links.map(link => link.getAttribute('href')))).toEqual(destinations.slice(0, 6).map(([href]) => href));
    expect(await page.locator('.home-universes .universe-more a').evaluateAll(links => links.map(link => link.getAttribute('href')))).toEqual(['/services-et-garanties', '/qui-sommes-nous']);
    await expect(page.locator('.home-products .product-card')).toHaveCount(4);
    await expectHealthy(page);
  }
  await page.goto('/');
  await page.locator('.home-universes').getByRole('link', { name: /^Basse vision/ }).click();
  await expect(h1(page)).toHaveText('Basse vision.');
});

test('Catalogue first row and the first lens cards stay visible at the three main sizes', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/solaires');
    await settle(page);
    const firstRowBottom = await page.evaluate(() => {
      const grid = document.querySelector('.catalogue-page .product-grid')!;
      const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      return Math.max(...[...grid.children].slice(0, columns).map(card => card.getBoundingClientRect().bottom));
    });
    expect(firstRowBottom, `/solaires first row at ${viewport.width}px`).toBeLessThanOrEqual(viewport.height);
    await page.goto('/lentilles');
    await settle(page);
    const firstLensTop = await page.locator('.lens-products .product-card').first().evaluate(card => card.getBoundingClientRect().top);
    expect(firstLensTop, `/lentilles first card at ${viewport.width}px: editorial blocks must not push the lenses out of the first screen`).toBeLessThan(viewport.height - 200);
  }
});

// =====================================================================================================================
// Universes
// =====================================================================================================================
test('Vue: brands with real logos, no invented assortment, brand without product leads to the stores', async ({ page }) => {
  await page.goto('/lunettes-de-vue');
  await expect(h1(page)).toHaveText('Lunettes de vue.');
  await expect(page.locator('.brand-tiles > li')).toHaveCount(16);
  await expect(page.locator('.brand-tiles .brand-card-logo img')).not.toHaveCount(0);
  await expect(page.locator('#marques')).toContainText('Les collections et les modèles disponibles se découvrent avec nos équipes.');
  await expect(page.locator('.brand-tiles .brand-destination')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText(/XPF|\d\s?€|à partir de/i);
  await expect(page.locator('.product-card')).toHaveCount(0);
  await expect(page.locator('.campaign-pair img')).toHaveCount(2);
  await expect(page.locator('main').getByRole('link', { name: 'Préparer une demande', exact: true })).toHaveAttribute('href', '/contact?sujet=vue');
  await expectHealthy(page);
  await page.locator('.brand-tiles').getByRole('link', { name: /^Versace/ }).click();
  await expect(page).toHaveURL(/\/marques\/versace$/);
  await expect(h1(page)).toHaveText('Versace');
  await expect(page.locator('.product-card')).toHaveCount(0);
  await page.getByRole('link', { name: 'Trouver mon magasin', exact: true }).last().click();
  await expect(page).toHaveURL(/\/magasins$/);
  await page.locator('.store-card').filter({ hasText: 'Centre-ville' }).getByRole('link', { name: 'Les infos pratiques' }).click();
  await expect(page).toHaveURL(/\/magasins\/centre-ville$/);
  await expectHealthy(page);
});

test('Observation: Bosma, Celestron and Perl with real photos and white logos on a dark tile', async ({ page }) => {
  await page.goto('/jumelles-et-telescopes');
  await expect(h1(page)).toHaveText('Jumelles et télescopes.');
  await expect(page.locator('.brand-tiles > li')).toHaveCount(3);
  for (const [name, dark] of [['Bosma', true], ['Celestron', false], ['Perl', true]] as const) {
    const tile = page.locator('.brand-tiles .brand-card').filter({ hasText: name });
    await expect(tile).toHaveCount(1);
    await expect(tile).toHaveAttribute('href', `/marques/${name.toLowerCase()}`);
    const logo = tile.locator('.brand-card-logo');
    await expect(logo.locator('img')).toHaveCount(1);
    expect(await logo.evaluate(el => /\bdark-logo\b/.test(el.className)), `${name} dark tile`).toBe(dark);
    const rgb = (await logo.evaluate(el => getComputedStyle(el).backgroundColor)).match(/\d+(\.\d+)?/g)!.map(Number);
    const background = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
    if (dark) { expect(rgb[3] ?? 1, `${name}: the dark tile is opaque`).toBe(1); expect(background, `${name}: white logo needs a dark background`).toBeLessThan(0.15); }
    else if ((rgb[3] ?? 1) > 0) expect(background, `${name}: the Celestron logo sits on a light background`).toBeGreaterThan(0.6);
  }
  const photos = page.locator('.object-plate img');
  await expect(photos).toHaveCount(2);
  for (const photo of await photos.all()) { await photo.scrollIntoViewIfNeeded(); await expect(photo).toBeVisible(); }
  await expect(page.locator('main')).not.toContainText(/XPF|\d\s?€|référence\s*:|SKU/i);
  await expect(page.locator('.product-card')).toHaveCount(0);
  await expect(page.locator('main').getByRole('link', { name: 'Préparer une demande', exact: true })).toHaveAttribute('href', '/contact?sujet=observation');
  await expectHealthy(page);
  await page.goto('/marques?univers=Observation');
  await expect(page.locator('.brand-card')).toHaveCount(3);
  await page.goto('/marques/bosma');
  await expect(h1(page)).toHaveText('Bosma');
  await expect(page.locator('.brand-hero-logo.dark-logo img')).toBeVisible();
  await expect(page.locator('.product-card')).toHaveCount(0);
  await page.getByRole('link', { name: 'Trouver mon magasin', exact: true }).last().click();
  await expect(page).toHaveURL(/\/magasins$/);
  await expectHealthy(page);
});

test('Basse vision keeps the source wording and invents neither clinical efficacy nor eligibility', async ({ page }) => {
  await page.goto('/basse-vision');
  await expect(h1(page)).toHaveText('Basse vision.');
  await expect(page.locator('main')).toContainText('le meilleur compromis entre le grossissement et la taille de la loupe');
  await expect(page.locator('main')).toContainText('téléphone (vini), tablette, télévision');
  await expect(page.locator('main')).not.toContainText(/éligib|rembours|guéri|efficacité|ordonnance|prise en charge/i);
  await page.getByRole('navigation', { name: 'Sur cette page' }).getByRole('link', { name: 'Systèmes optiques' }).click();
  await expect(page).toHaveURL(/#systemes-optiques$/);
  await expect(page.locator('#systemes-optiques-title')).toBeInViewport();
  await page.locator('main').getByRole('link', { name: 'Préparer une demande', exact: true }).click();
  await expect(subjectSelect(page)).toHaveValue('basse-vision');
  await expectHealthy(page);
});

test('Prostheses: sober, Mamao and appointment only, request leads to Mamao with the subject', async ({ page, watch }) => {
  await page.goto('/protheses-oculaires');
  await expect(h1(page)).toHaveText('Prothèses oculaires.');
  const panel = page.locator('.appointment-panel');
  await expect(panel).toContainText('Uniquement sur rendez-vous, à Mamao');
  const mamao = stores.find(s => s.slug === 'mamao')!;
  await expect(panel.locator('a[href^="tel:"]')).toHaveAttribute('href', `tel:${mamao.phone}`);
  await expect(page.getByRole('link', { name: /réserv|prendre rendez-vous en ligne/i })).toHaveCount(0);
  await expect(page.locator('main')).toContainText('Elle ne redonne pas la vision.');
  await expect(page.locator('main')).toContainText('DENCOTT');
  await expect(page.getByRole('link', { name: /DENCOTT/ })).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText(/avant\s*\/?\s*après|retrouv\w+ (la )?(vue|vision)|redonne la vue/i);
  await expect(page.locator('main img')).toHaveCount(0);
  await expectHealthy(page);
  await panel.getByRole('link', { name: 'Préparer une demande' }).click();
  await expect(page).toHaveURL(/\/contact\?/);
  expect(params(page)).toEqual({ sujet: 'protheses', magasin: 'mamao' });
  await expect(subjectSelect(page)).toHaveValue('protheses');
  await expect(storeRadio(page, 'mamao')).toBeChecked();
  await expect(page.locator('#contact-store-hint')).toContainText('uniquement au magasin de Mamao');
  await expectStoreAside(page, 'mamao');
  // Another store contradicts the rule: the form says so and focuses the choice.
  await expect(submitButton(page)).toBeEnabled();
  await fillPerson(page, watch);
  await storeRadio(page, 'taravao').check();
  await submitButton(page).click();
  await expectFieldError(page, 'store', /uniquement au magasin de Mamao/);
  await expect(storeRadio(page, 'taravao')).toBeFocused();
  await storeRadio(page, 'mamao').check();
  await noError(page, 'store');
  await submitButton(page).click();
  const success = page.getByRole('heading', { name: 'Demande préparée pour la démonstration.' });
  await expect(success).toBeFocused();
  await expect(page.locator('.contact-success')).toContainText('Optic 2000 Mamao');
  await expect(page.locator('.contact-success')).toContainText('Prothèses oculaires');
  await expect(page.locator('.contact-success')).toContainText('le rendez-vous se demande par téléphone');
  await expect(page.locator('.contact-success')).toContainText('aucun rendez-vous n’a été réservé');
  // A direct link naming another store is corrected to Mamao and announced.
  await openContact(page, '?sujet=protheses&magasin=taravao');
  await expect(storeRadio(page, 'mamao')).toBeChecked();
  await expect(page.locator('.notice')).toContainText('uniquement au magasin de Mamao');
  // Choosing the subject on an empty form proposes Mamao.
  await openContact(page);
  await expect(page.locator('input[name="store"]:checked')).toHaveCount(0);
  await storeRadio(page, 'taravao').check();
  await subjectSelect(page).selectOption('protheses');
  await expect(storeRadio(page, 'mamao')).toBeChecked();
  await expect.poll(() => params(page)).toEqual({ magasin: 'mamao', sujet: 'protheses' });
  // The store page relays the same rule.
  await page.goto('/magasins/mamao');
  await expect(page.getByRole('link', { name: 'Préparer une demande à ce magasin' })).toHaveAttribute('href', '/contact?magasin=mamao');
});

test('Services and guarantees keep every condition, date the sources and qualify the 2022 offers', async ({ page }) => {
  await page.goto('/services-et-garanties');
  await expect(h1(page)).toHaveText('Services et garanties.');
  const main = page.locator('main');
  await expect(page.locator('#garanties')).toContainText(/Garantie de deux ans, pour chaque partie de vos lunettes/);
  await expect(page.locator('#garanties')).toContainText(/Garantie à 100\s?%, jusqu’à 3 ans, contre tout défaut de fabrication/);
  await expect(page.locator('#garanties')).toContainText(/Une casse accidentelle de la monture est prise en charge à 100\s?%/);
  await expect(page.locator('#garanties')).toContainText(/Ne couvre pas/);
  await expect(page.locator('#garanties')).toContainText(/mauvaise utilisation, une chute, une rayure/);
  await expect(page.locator('#garanties')).toContainText(/remise de 60\s?% pendant 2 ans/);
  await expect(page.locator('#garanties')).toContainText('produit identique');
  await expect(page.locator('#garanties .reading-note')).toContainText('à faire préciser en magasin');
  await expect(page.locator('#adaptation')).toContainText(/dans les trois mois suivant l’achat/);
  await expect(page.locator('#entretien')).toContainText('vérification en 10 points');
  await expect(page.locator('#devis')).toContainText('gratuitement');
  await expect(page.locator('#financement')).toContainText('à demander en magasin');
  const offers = page.locator('#offres-historiques');
  await expect(offers).toContainText('Offres de 2022');
  await expect(offers).toContainText('ne sont pas reprises');
  await expect(offers).toContainText('aucune n’est confirmée comme offre actuelle');
  await expect(main).toContainText(/relevée le 21\/10\/2026/);
  await expect(main).toContainText('à confirmer');
  await expect(page.locator('.product-card, .product-price')).toHaveCount(0);
  await page.getByRole('navigation', { name: 'Sur cette page' }).getByRole('link', { name: 'Garanties des montures et des verres' }).click();
  await expect(page).toHaveURL(/#garanties$/);
  await expect(page.locator('#garanties-title')).toBeInViewport();
  await expectHealthy(page);
  await main.getByRole('link', { name: 'Préparer une demande', exact: true }).click();
  await expect(subjectSelect(page)).toHaveValue('services');
});

test('Team page: public texts, photo and the two press articles, nothing invented or activated', async ({ page }) => {
  await page.goto('/qui-sommes-nous');
  await expect(h1(page)).toHaveText('Vos opticiens à Tahiti.');
  await expect(page.locator('.team-photo img')).toBeVisible();
  const links = page.locator('.article-links a');
  expect(await links.evaluateAll(anchors => anchors.map(a => a.getAttribute('href')))).toEqual(teamArticles.map(a => a.href));
  for (const link of await links.all()) await expect(link).toHaveAttribute('target', '_blank');
  await expect(page.locator('.store-card')).toHaveCount(3);
  await expect(page.locator('main')).toContainText('La composition actuelle de l’équipe est à confirmer');
  await expect(page.locator('main')).not.toContainText(/depuis \d{4}|\d+ ans d’expérience|plus de \d+ (montures|modèles)|n°\s?1|leader/i);
  await expectHealthy(page);
});

test('Legal pages present the prototype factually and keep the old operator historical', async ({ page }) => {
  await page.goto('/mentions-legales');
  const main = page.locator('main');
  await expect(main).toContainText('n’est pas le site officiel de l’enseigne');
  await expect(main).toContainText('SARL S2M');
  await expect(main).toContainText('976464');
  await expect(main).toContainText('ne sont ni l’hébergeur ni le créateur de ce prototype');
  await expect(main).not.toContainText(/RCS/);
  await page.goto('/politique-de-confidentialite');
  await expect(page.locator('main')).toContainText('rien n’est enregistré');
  await expect(page.locator('main')).toContainText('aucun cookie');
  await expect(page.locator('main')).toContainText('Seuls des identifiants publics');
  await page.goto('/cgv');
  await expect(page.locator('main')).toContainText('ne s’appliquent pas à ce prototype');
  await expect(page.locator('main')).toContainText('29/11/2022');
  await expect(page.locator('main')).toContainText(/en vigueur au 29\/11\/2022/);
  for (const path of ['/mentions-legales', '/politique-de-confidentialite', '/cgv']) {
    const response = await page.request.get(path);
    expect(response.headers()['x-robots-tag']).toContain('noindex');
  }
});

test('Brand directory keeps 38 identities and DENCOTT is not one of them', async ({ page }) => {
  await page.goto('/marques');
  await expect(page.locator('.brand-card')).toHaveCount(38);
  await expect(page.getByText('DENCOTT')).toHaveCount(0);
  await page.getByRole('searchbox', { name: 'Rechercher une marque', exact: true }).fill('DENCOTT');
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Aucune marque ne correspond.' })).toBeVisible();
  await page.goto('/lentilles');
  await expect(page.locator('.brand-tiles .brand-card').filter({ hasText: 'FreshLook' })).toContainText('Alcon');
});

// =====================================================================================================================
// Lenses
// =====================================================================================================================
test('Colorblends: +2.00, -2.00 and 0.00 keep the real Grey ID 1949, price and photo, through the store to the contact and back', async ({ page }) => {
  test.setTimeout(150_000);
  expect(variantOf(1949).price).toBe(2900);
  for (const correction of corrections) {
    await test.step(`correction ${correction.sign}`, async () => {
      await page.goto(colorblendsUrl);
      await expect(h1(page)).toHaveText(colorblends.name);
      await expect(lensStatus(page)).toHaveText('Choisissez une couleur, puis une sphère.');
      await expect(page.locator('.lens-colour')).toHaveCount(12);
      await expect(price(page)).toContainText(/2\s*900/);
      await colour(page, 'Grey').click();
      await expect.poll(() => params(page)).toEqual({ variante: '1949', couleur: 'grey' });
      await expect(colour(page, 'Grey')).toHaveAttribute('aria-pressed', 'true');
      await expect(lensStatus(page)).toContainText('Choisissez maintenant la sphère');
      await sphere(page).selectOption({ label: correction.sign });
      await expect.poll(() => params(page)).toEqual({ variante: '1949', couleur: 'grey', sphere: correction.slug });
      await expect(sphere(page)).toHaveValue(correction.slug);
      await expect(lensStatus(page)).toHaveText(`Votre sélection : couleur Grey, sphère ${correction.sign}.`);
      await expect(price(page)).toContainText(/2\s*900/);
      await expect(mainImage(page)).toHaveAttribute('src', imageSrc(variantOf(1949).image.src));
      expect(queryOf(await storeAction(page).getAttribute('href'))).toEqual({ produit: 'freshlook-colorblends', variante: '1949', couleur: 'grey', sphere: correction.slug });
      expect(queryOf(await page.locator('a.product-request-link').getAttribute('href'))).toEqual({ sujet: 'lentilles', produit: 'freshlook-colorblends', variante: '1949', couleur: 'grey', sphere: correction.slug });
      // Store list, then the Taravao page (the store whose hours are still to confirm), then the contact.
      await storeAction(page).click();
      await expect(page).toHaveURL(/\/magasins\?/);
      expect(params(page)).toEqual({ produit: 'freshlook-colorblends', variante: '1949', couleur: 'grey', sphere: correction.slug });
      await expect(page.locator('.product-context')).toContainText('Couleur : Grey');
      await expect(page.locator('.product-context')).toContainText(`Sphère : ${correction.sign}`);
      await expect(page.locator('.product-context')).toContainText(/2\s*900/);
      await page.locator('.store-card').filter({ hasText: 'Taravao' }).getByRole('link', { name: 'Les infos pratiques' }).click();
      await expect(page).toHaveURL(/\/magasins\/taravao\?/);
      await expect(page.getByText('Horaires à confirmer auprès du magasin', { exact: true })).toBeVisible();
      await expect(page.locator('.product-context')).toContainText(`Sphère : ${correction.sign}`);
      await page.getByRole('link', { name: 'Préparer une demande à ce magasin' }).click();
      await expect(page).toHaveURL(/\/contact\?/);
      expect(params(page)).toEqual({ magasin: 'taravao', produit: 'freshlook-colorblends', variante: '1949', couleur: 'grey', sphere: correction.slug });
      const selection = page.locator('.contact-selection');
      await expect(selection).toContainText('FreshLook® Colorblends');
      await expect(selection).toContainText('Couleur : Grey');
      await expect(selection).toContainText(`Sphère : ${correction.sign}`);
      await expect(selection).toContainText(/2\s*900 XPF · Prix à confirmer/);
      await expect(storeRadio(page, 'taravao')).toBeChecked();
      await expect(subjectSelect(page)).toHaveValue('lentilles');
      await expectStoreAside(page, 'taravao');
      const back = page.getByRole('link', { name: 'Retour à votre sélection' });
      await expect(back).toHaveAttribute('href', `${colorblendsUrl}?variante=1949&couleur=grey&sphere=${correction.slug}`);
      await expectHealthy(page);
      await back.click();
      await expect.poll(() => params(page)).toEqual({ variante: '1949', couleur: 'grey', sphere: correction.slug });
      await expect(colour(page, 'Grey')).toHaveAttribute('aria-pressed', 'true');
      await expect(sphere(page)).toHaveValue(correction.slug);
      await expect(lensStatus(page)).toHaveText(`Votre sélection : couleur Grey, sphère ${correction.sign}.`);
    });
  }
});

test('Colorblends: direct link, reload, back and forward keep the selection; changing the colour recomputes the ID', async ({ page }) => {
  const link = `${colorblendsUrl}?variante=1949&couleur=grey&sphere=2-00-2`;
  await page.goto(link);
  await expect(lensStatus(page)).toHaveText('Votre sélection : couleur Grey, sphère -2.00.');
  await page.reload();
  await expect(page).toHaveURL(url => url.pathname + url.search === link);
  await expect(colour(page, 'Grey')).toHaveAttribute('aria-pressed', 'true');
  await expect(sphere(page)).toHaveValue('2-00-2');
  await expect(lensStatus(page)).toHaveText('Votre sélection : couleur Grey, sphère -2.00.');
  await storeAction(page).click();
  await expect(page.locator('.product-context')).toContainText('Sphère : -2.00');
  await page.goBack();
  await expect(page).toHaveURL(url => url.pathname + url.search === link);
  await expect(sphere(page)).toHaveValue('2-00-2');
  await expect(colour(page, 'Grey')).toHaveAttribute('aria-pressed', 'true');
  await page.goForward();
  await expect(page.locator('.product-context')).toContainText('Sphère : -2.00');
  await page.goBack();
  // Another colour keeps the chosen correction and takes the other colour's real ID, price and photo.
  await colour(page, 'Blue').click();
  await expect.poll(() => params(page)).toEqual({ variante: '1944', couleur: 'blue', sphere: '2-00-2' });
  await expect(lensStatus(page)).toHaveText('Votre sélection : couleur Blue, sphère -2.00.');
  await expect(colour(page, 'Grey')).toHaveAttribute('aria-pressed', 'false');
  await expect(price(page)).toContainText(/2\s*900/);
  await expect(mainImage(page)).toHaveAttribute('src', imageSrc(variantOf(1944).image.src));
  await page.reload();
  await expect(colour(page, 'Blue')).toHaveAttribute('aria-pressed', 'true');
  await expect(sphere(page)).toHaveValue('2-00-2');
  // The keyboard operates the same controls.
  await colour(page, 'Brown').focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => params(page)).toEqual({ variante: '1946', couleur: 'brown', sphere: '2-00-2' });
  await sphere(page).selectOption({ label: '0.00' });
  await expect(lensStatus(page)).toHaveText('Votre sélection : couleur Brown, sphère 0.00.');
  await expectHealthy(page);
});

test('Colorblends: a sphere alone never chooses a colour, and the correction stays open for the store', async ({ page }) => {
  await page.goto(`${colorblendsUrl}?sphere=0-00`);
  await expect(page.locator('.lens-colour[aria-pressed="true"]')).toHaveCount(0);
  await expect(sphere(page)).toHaveValue('0-00');
  await expect(lensStatus(page)).toHaveText(/^Sphère 0\.00 choisie\. Choisissez maintenant une couleur/);
  await expect(page.locator('.product-main-image img')).toBeVisible();
  expect(queryOf(await storeAction(page).getAttribute('href'))).toEqual({ produit: 'freshlook-colorblends', sphere: '0-00' });
  await storeAction(page).click();
  await expect(page.locator('.product-context')).toContainText('Couleur : à préciser');
  await expect(page.locator('.product-context')).toContainText('Sphère : 0.00');
  // The colour alone leaves the correction undecided (not 0.00).
  await page.goto(`${colorblendsUrl}?couleur=grey`);
  await expect(sphere(page)).toHaveValue('');
  await expect(lensStatus(page)).toContainText('Choisissez maintenant la sphère');
  expect(queryOf(await storeAction(page).getAttribute('href'))).toEqual({ produit: 'freshlook-colorblends', variante: '1949', couleur: 'grey' });
  await storeAction(page).click();
  await expect(page.locator('.product-context')).toContainText('Sphère : à préciser');
  await expect(page.locator('.product-context')).not.toContainText('Sphère : 0.00');
});

test('Colorblends: foreign IDs 774 and 1957, unknown options and contradictions recover without a wrong correction', async ({ page }) => {
  const invalid = ['variante=774', 'variante=1957', 'variante=abc', 'couleur=pure-hazel&sphere=%2B2.00', 'couleur=Grey', 'sphere=2-00-9'];
  for (const query of invalid) {
    await page.goto(`${colorblendsUrl}?${query}`);
    await expect(page.locator('.notice')).toContainText('Une option du lien n’existe pas pour ce modèle');
    await expect(page.locator('.lens-colour[aria-pressed="true"]')).toHaveCount(0);
    await expect(sphere(page)).toHaveValue('');
    await expect(lensStatus(page)).toHaveText('Choisissez une couleur, puis une sphère.');
    expect(queryOf(await storeAction(page).getAttribute('href')), query).toEqual({ produit: 'freshlook-colorblends' });
    await expect(price(page)).toContainText(/2\s*900/);
  }
  // The URL heals itself as soon as an option is chosen.
  await page.goto(`${colorblendsUrl}?variante=774`);
  await colour(page, 'Blue').click();
  await expect.poll(() => params(page)).toEqual({ variante: '1944', couleur: 'blue' });
  expect(page.url()).not.toContain('774');
  await expect(page.locator('.notice')).toHaveCount(0);
  // A contradiction keeps what the visitor proves and drops the stranger.
  await page.goto(`${colorblendsUrl}?variante=1949&couleur=blue&sphere=2-00-2`);
  await expect(page.locator('.notice')).toBeVisible();
  await expect(colour(page, 'Blue')).toHaveAttribute('aria-pressed', 'true');
  await expect(colour(page, 'Grey')).toHaveAttribute('aria-pressed', 'false');
  await expect(sphere(page)).toHaveValue('2-00-2');
  expect(queryOf(await storeAction(page).getAttribute('href'))).toEqual({ produit: 'freshlook-colorblends', variante: '1944', couleur: 'blue', sphere: '2-00-2' });
  // The contact page applies the same rule.
  await openContact(page, '?produit=freshlook-colorblends&variante=774');
  await expect(page.locator('.notice')).toContainText('Une partie du lien n’a pas été reconnue');
  await expect(page.locator('.contact-selection')).toContainText('Couleur : à préciser');
  await expect(page.locator('.contact-selection')).not.toContainText('Grey');
  await expectHealthy(page);
});

test('The simple TruBlends 5-colour box has no selector, costs 2 200 and reaches the store and contact as it is', async ({ page }) => {
  const slug = 'trublends-one-day-5-couleurs';
  await page.goto(`/produits/${slug}`);
  await expect(page.locator('.lens-picker')).toHaveCount(0);
  await expect(page.locator('.lens-colour')).toHaveCount(0);
  await expect(page.getByLabel('2. Choisissez la sphère')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Une seule version' })).toBeVisible();
  await expect(price(page)).toContainText(/2\s*200/);
  await expect(page.locator('main')).toContainText('5 couleurs dans la boîte');
  expect(queryOf(await storeAction(page).getAttribute('href'))).toEqual({ produit: slug });
  await expectHealthy(page);
  await storeAction(page).click();
  await expect(page.locator('.product-context')).toContainText('Version : Unique, sans option à choisir');
  await page.goBack();
  await page.locator('a.product-request-link').click();
  await expect(page).toHaveURL(/\/contact\?/);
  expect(params(page)).toEqual({ sujet: 'lentilles', produit: slug });
  await expect(page.locator('.contact-selection')).toContainText('Version : Unique, sans option à choisir');
  await expect(page.locator('.contact-selection')).toContainText(/2\s*200 XPF/);
  // Foreign options are ignored: nothing is invented for a product without variants.
  await page.goto(`/produits/${slug}?variante=1937&couleur=blue&sphere=2-00`);
  await expect(page.locator('.notice')).toBeVisible();
  await expect(page.locator('.lens-picker')).toHaveCount(0);
  expect(queryOf(await storeAction(page).getAttribute('href'))).toEqual({ produit: slug });
});

const otherLenses = [
  { slug: 'freshlook-1-day', colourName: 'Green', variant: '1958', colour: 'green', sphereLabel: '-2.50', sphereSlug: '2-50-2', amount: /2\s*300/, colours: 4 },
  { slug: 'trublends-one-day', colourName: 'Violet', variant: '1941', colour: 'violet', sphereLabel: '-1.00', sphereSlug: '1-00-2', amount: /2\s*200/, colours: 5 },
  { slug: 'colourvue-crazylens-one-day', colourName: 'White Zombie', variant: '1877', colour: 'white-zombie', sphereLabel: '-3.00', sphereSlug: '3-00-2', amount: /1\s*900/, colours: 12 },
] as const;
for (const lens of otherLenses) {
  test(`${lens.slug}: colour and correction are operable and reach the contact`, async ({ page }) => {
    const product = products.find(p => p.slug === lens.slug)!;
    const expected = product.variants.find(v => String(v.id) === lens.variant)!;
    await page.goto(`/produits/${lens.slug}`);
    await expect(h1(page)).toHaveText(product.name);
    await expect(page.locator('.lens-colour')).toHaveCount(lens.colours);
    await expect(price(page)).toContainText(lens.amount);
    await colour(page, lens.colourName).click();
    await sphere(page).selectOption({ label: lens.sphereLabel });
    await expect.poll(() => params(page)).toEqual({ variante: lens.variant, couleur: lens.colour, sphere: lens.sphereSlug });
    await expect(lensStatus(page)).toHaveText(`Votre sélection : couleur ${lens.colourName}, sphère ${lens.sphereLabel}.`);
    await expect(price(page)).toContainText(lens.amount);
    await expect(mainImage(page)).toHaveAttribute('src', imageSrc(expected.image.src));
    await expectHealthy(page);
    await page.locator('a.product-request-link').click();
    await expect(page).toHaveURL(/\/contact\?/);
    expect(params(page)).toEqual({ sujet: 'lentilles', produit: lens.slug, variante: lens.variant, couleur: lens.colour, sphere: lens.sphereSlug });
    await expect(page.locator('.contact-selection')).toContainText(`Couleur : ${lens.colourName}`);
    await expect(page.locator('.contact-selection')).toContainText(`Sphère : ${lens.sphereLabel}`);
    await page.getByRole('link', { name: 'Retour à votre sélection' }).click();
    await expect(sphere(page)).toHaveValue(lens.sphereSlug);
    await expect(colour(page, lens.colourName)).toHaveAttribute('aria-pressed', 'true');
  });
}

test('FreshLook 1-Day does not offer +2.00 and rejects it in a link', async ({ page }) => {
  await page.goto('/produits/freshlook-1-day');
  const options = sphere(page).locator('option');
  const product = products.find(p => p.slug === 'freshlook-1-day')!;
  await expect(options).toHaveCount(product.attributes.find(a => a.key === 'attribute_pa_sphere')!.terms.length + 1);
  expect(await options.allTextContents()).not.toContain('+2.00');
  expect((await options.allTextContents()).filter(text => text.startsWith('+'))).toEqual([]);
  expect(await options.allTextContents()).toEqual(expect.arrayContaining(['-2.00', '0.00', '-6.00']));
  await page.goto('/produits/freshlook-1-day?couleur=grey&sphere=2-00');
  await expect(page.locator('.notice')).toContainText('Une option du lien n’existe pas pour ce modèle');
  await expect(colour(page, 'Grey')).toHaveAttribute('aria-pressed', 'true');
  await expect(sphere(page)).toHaveValue('');
  await expect(lensStatus(page)).toContainText('Choisissez maintenant la sphère');
  expect(queryOf(await storeAction(page).getAttribute('href'))).toEqual({ produit: 'freshlook-1-day', variante: '1959', couleur: 'grey' });
});

test('Lens cards: family alt text and the way back to /lentilles from a card and from a related product', async ({ page }) => {
  await page.goto('/lentilles');
  await expect(h1(page)).toHaveText('Lentilles.');
  const cards = page.locator('.lens-products .product-card');
  await expect(cards).toHaveCount(5);
  for (const alt of await cards.locator('img').evaluateAll(images => images.map(image => image.getAttribute('alt')))) {
    expect(alt).toMatch(/, lentilles /);
    expect(alt).not.toMatch(/monture/i);
  }
  await page.goto('/solaires');
  expect(await page.locator('.product-card img').first().getAttribute('alt')).toMatch(/, monture /);
  await page.goto('/catalogue');
  await expect(page.locator('.product-card img[alt*=", lentilles "]')).toHaveCount(5);
  await expect(page.locator('.product-card img[alt*=", monture "]')).toHaveCount(78);
  // Card → product → back to the lens results.
  await page.goto('/lentilles');
  await page.locator('.lens-products .product-card').filter({ hasText: 'Colorblends' }).getByRole('link').click();
  await expect(h1(page)).toHaveText(colorblends.name);
  const back = page.getByRole('link', { name: 'Retour aux résultats' });
  await expect(back).toHaveAttribute('href', '/lentilles');
  await back.click();
  await expect(page).toHaveURL(/\/lentilles$/);
  await expect(cards).toHaveCount(5);
  // Related product (still a lens) → product → back to the lens results.
  await page.goto(`${colorblendsUrl}?variante=1949&couleur=grey`);
  const related = page.locator('.related-products .product-card');
  await expect(page.getByRole('heading', { name: 'D’autres lentilles.' })).toBeVisible();
  await expect(related).toHaveCount(4);
  for (const alt of await related.locator('img').evaluateAll(images => images.map(image => image.getAttribute('alt')))) expect(alt).toMatch(/, lentilles /);
  const relatedName = (await related.first().locator('h3').textContent())!;
  await related.first().getByRole('link').click();
  await expect(h1(page)).toHaveText(relatedName);
  await expect(page.getByRole('link', { name: 'Retour aux résultats' })).toHaveAttribute('href', '/lentilles');
  await page.getByRole('link', { name: 'Retour aux résultats' }).click();
  await expect(page).toHaveURL(/\/lentilles$/);
  await page.goto(colorblendsUrl);
  await expect(page.getByRole('link', { name: 'Toutes les lentilles' })).toHaveAttribute('href', '/lentilles');
  // Solar related products stay in the solar family.
  await page.goto('/produits/glory-glory');
  for (const alt of await page.locator('.related-products .product-card img').evaluateAll(images => images.map(image => image.getAttribute('alt')))) expect(alt).toMatch(/, monture /);
  await expect(page.getByRole('link', { name: 'Toutes les solaires' })).toHaveAttribute('href', '/solaires');
  await page.goto('/lentilles');
  await expectHealthy(page);
  await expect(page.locator('main')).not.toContainText(/en stock|stock disponible|livraison/i);
  await expect(page.locator('#familles')).toContainText('Lentilles de contact');
  await expect(page.locator('#entretien')).toContainText('Les produits d’entretien');
});

// =====================================================================================================================
// Contact
// =====================================================================================================================
test('Direct contact: empty submission, linked errors, kept input, store change, success, return and reset', async ({ page, watch, context }) => {
  test.setTimeout(120_000);
  await openContact(page);
  await page.evaluate(() => localStorage.setItem('autre-outil:preference', 'ne-pas-effacer'));
  await expect(page.locator('.contact-simulation')).toContainText('Aucun message n’est envoyé et aucun rendez-vous n’est réservé');
  await expect(page.locator('.contact-submit')).toContainText('Simulation : rien n’est envoyé au magasin, aucun rendez-vous n’est réservé.');
  await expect(aside(page)).toContainText('Aucun modèle joint');
  await expect(backLink(page)).toHaveAttribute('href', '/magasins');
  await expect(backLink(page)).toContainText('Nos magasins');
  // Types and requirements.
  await expect(field(page, 'E-mail')).toHaveAttribute('type', 'email');
  await expect(field(page, 'Téléphone')).toHaveAttribute('type', 'tel');
  await expect(field(page, 'Nom')).toHaveAttribute('autocomplete', 'name');
  for (const label of ['Nom', 'E-mail', 'Message'] as const) await expect(field(page, label)).toHaveAttribute('required', '');
  await expect(field(page, 'Téléphone')).not.toHaveAttribute('required', '');
  await expect(page.locator('.contact-required')).toContainText('Tous les champs sont obligatoires, sauf le téléphone');
  // Keyboard submission of the empty form: the first error takes the focus and every error is linked to its field.
  await submitButton(page).focus();
  await page.keyboard.press('Enter');
  await expectFieldError(page, 'store', /Choisissez le magasin/);
  await expectFieldError(page, 'subject', /Choisissez l’objet/);
  await expectFieldError(page, 'name', /Indiquez votre nom/);
  await expectFieldError(page, 'email', /Indiquez votre adresse e-mail/);
  await expectFieldError(page, 'message', /Écrivez votre message/);
  await noError(page, 'phone');
  await expect(storeRadio(page, stores[0].slug)).toBeFocused();
  // Partial correction: errors of corrected fields disappear, the others stay, nothing typed is lost.
  await storeRadio(page, 'mamao').check();
  await noError(page, 'store');
  await expectStoreAside(page, 'mamao');
  await fillPerson(page, watch, ['name', 'phone', 'message']);
  await field(page, 'E-mail').fill('demo@');
  watch.typed.push('demo@');
  await noError(page, 'name');
  await noError(page, 'message');
  await expectFieldError(page, 'email', /Vérifiez l’adresse e-mail/);
  await expectFieldError(page, 'subject', /Choisissez l’objet/);
  await submitButton(page).click();
  await expect(subjectSelect(page)).toBeFocused();
  await expect(field(page, 'Nom')).toHaveValue(person.name);
  await expect(field(page, 'Téléphone')).toHaveValue(person.phone);
  await expect(field(page, 'Message')).toHaveValue(person.message);
  await expect(field(page, 'E-mail')).toHaveValue('demo@');
  await expect(storeRadio(page, 'mamao')).toBeChecked();
  await subjectSelect(page).selectOption('lentilles');
  await noError(page, 'subject');
  await submitButton(page).click();
  await expectFieldError(page, 'email', /Vérifiez l’adresse e-mail/);
  await noError(page, 'subject');
  await expect(field(page, 'E-mail')).toBeFocused();
  await expect(field(page, 'E-mail')).toHaveValue('demo@');
  await expect(field(page, 'Nom')).toHaveValue(person.name);
  // Correct the e-mail, then change the store: summary, links and hours reservation follow.
  await fillPerson(page, watch, ['email']);
  await noError(page, 'email');
  await expect(page.locator('.field-error')).toHaveCount(0);
  await expectStoreAside(page, 'mamao');
  await storeRadio(page, 'taravao').check();
  await expectStoreAside(page, 'taravao');
  await expect(aside(page).locator('.contact-hours')).toHaveText('Horaires à confirmer auprès du magasin');
  await expect(aside(page).locator('.contact-hours')).not.toContainText('7h30');
  await expect.poll(() => params(page)).toEqual({ magasin: 'taravao', sujet: 'lentilles' });
  // Resubmission succeeds, announces the simulation and takes the focus.
  await submitButton(page).click();
  await expect(page.getByRole('heading', { name: 'Demande préparée pour la démonstration.' })).toBeFocused();
  const success = page.locator('.contact-success');
  await expect(success).toContainText('Aucun message n’a été envoyé et aucun rendez-vous n’a été réservé');
  await expect(success).toContainText('Optic 2000 Taravao');
  await expect(success).toContainText('Lentilles et entretien');
  await expect(success).toContainText(person.name);
  await expect(success).toContainText(person.email);
  await expect(success).toContainText(person.phone);
  await expect(success).toContainText(person.message);
  await expect(success.locator('a[href^="tel:"]')).toHaveAttribute('href', `tel:${stores[2].phone}`);
  await expect(success.locator('a[href^="mailto:"]')).toHaveAttribute('href', `mailto:${stores[2].email}`);
  await expect(page.locator('form.contact-form')).toHaveCount(0);
  await expect(success.getByRole('link', { name: /Voir le magasin Taravao/ })).toHaveAttribute('href', '/magasins/taravao?sujet=lentilles');
  await expect(success.getByRole('link', { name: /Revenir à votre sélection/ })).toHaveCount(0);
  await expectHealthy(page);
  // Reset: personal fields are emptied, the public context (store, subject) stays, the focus goes to the first field.
  await success.getByRole('button', { name: /Préparer une autre demande/ }).click();
  await expect(field(page, 'Nom')).toBeFocused();
  for (const label of ['Nom', 'E-mail', 'Téléphone', 'Message'] as const) await expect(field(page, label)).toHaveValue('');
  await expect(storeRadio(page, 'taravao')).toBeChecked();
  await expect(subjectSelect(page)).toHaveValue('lentilles');
  await expect(page.locator('.field-error')).toHaveCount(0);
  await expect(aside(page).getByRole('heading', { name: 'Optic 2000 Taravao' })).toBeVisible();
  // Nothing persists: a reload empties the form, the foreign storage entry is untouched, no cookie, no request body.
  await field(page, 'Nom').fill(person.name);
  await page.reload();
  await expect(field(page, 'Nom')).toHaveValue('');
  expect(await storage(page)).toEqual({ local: { 'autre-outil:preference': 'ne-pas-effacer' }, session: {}, cookie: '' });
  expect(await context.cookies()).toEqual([]);
  expect(Object.keys(params(page)).filter(key => !['magasin', 'sujet', 'produit', 'variante', 'couleur', 'sphere'].includes(key))).toEqual([]);
  for (const value of Object.values(person)) expect(page.url()).not.toContain(encodeURIComponent(value));
});

test('Contact with a lens selection: recap, return to the selection and reset keep the public context', async ({ page, watch }) => {
  const link = '?magasin=taravao&produit=freshlook-colorblends&variante=1949&couleur=grey&sphere=2-00-2';
  await openContact(page, link);
  await expect(page.getByRole('link', { name: 'Retour à votre sélection' })).toHaveAttribute('href', `${colorblendsUrl}?variante=1949&couleur=grey&sphere=2-00-2`);
  await expect(subjectSelect(page)).toHaveValue('lentilles');
  await subjectSelect(page).selectOption('services');
  await fillPerson(page, watch);
  await submitButton(page).click();
  const success = page.locator('.contact-success');
  await expect(success).toBeVisible();
  await expect(success).toContainText('Services et garanties');
  await expect(success).toContainText('FreshLook® Colorblends — Couleur : Grey · Sphère : -2.00');
  await expect(success.getByRole('link', { name: /Voir le magasin Taravao/ })).toHaveAttribute('href', /^\/magasins\/taravao\?/);
  expect(queryOf(await success.getByRole('link', { name: /Voir le magasin Taravao/ }).getAttribute('href'))).toEqual({ produit: 'freshlook-colorblends', variante: '1949', couleur: 'grey', sphere: '2-00-2', sujet: 'services' });
  await success.getByRole('button', { name: /Préparer une autre demande/ }).click();
  await expect(field(page, 'Nom')).toBeFocused();
  await expect(aside(page)).toContainText('Sphère : -2.00');
  await expect(storeRadio(page, 'taravao')).toBeChecked();
  await fillPerson(page, watch, ['name', 'email', 'message']);
  await submitButton(page).click();
  await page.getByRole('link', { name: /Revenir à votre sélection/ }).click();
  await expect.poll(() => params(page)).toEqual({ variante: '1949', couleur: 'grey', sphere: '2-00-2' });
  await expect(sphere(page)).toHaveValue('2-00-2');
  await expect(lensStatus(page)).toHaveText('Votre sélection : couleur Grey, sphère -2.00.');
  await expectHealthy(page);
});

test('Contact from a store page and from every universe pre-selects the store or the subject', async ({ page }) => {
  await page.goto('/magasins/mamao');
  await page.getByRole('link', { name: 'Préparer une demande à ce magasin' }).click();
  await expect(page).toHaveURL(/\/contact\?magasin=mamao$/);
  expect(params(page)).toEqual({ magasin: 'mamao' });
  await expect(storeRadio(page, 'mamao')).toBeChecked();
  await expect(backLink(page)).toContainText('Retour au magasin Mamao');
  await expect(backLink(page)).toHaveAttribute('href', '/magasins/mamao');
  await backLink(page).click();
  await expect(h1(page)).toContainText('Mamao');
  for (const [path, subject] of [['/lunettes-de-vue', 'vue'], ['/lentilles', 'lentilles'], ['/jumelles-et-telescopes', 'observation'], ['/basse-vision', 'basse-vision'], ['/services-et-garanties', 'services'], ['/qui-sommes-nous', 'autre'], ['/cgv', 'autre']] as const) {
    await page.goto(path);
    await page.locator('main').getByRole('link', { name: 'Préparer une demande', exact: true }).click();
    await expect(h1(page)).toHaveText('Préparer votre demande.');
    expect(params(page)).toEqual({ sujet: subject });
    await expect(subjectSelect(page)).toHaveValue(subject);
    await expect(page.locator('input[name="store"]:checked')).toHaveCount(0);
  }
  // Header and footer lead to the same direct form.
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: 'Contact', exact: true }).click();
  await expect(h1(page)).toHaveText('Préparer votre demande.');
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Plan du site' }).getByRole('link', { name: 'Préparer une demande' }).click();
  await expect(h1(page)).toHaveText('Préparer votre demande.');
});

test('Contact with an unknown or invalid context stays usable and invents no selection', async ({ page, watch }) => {
  await openContact(page, '?sujet=promo&magasin=paris&produit=inconnu&variante=1949&nom=Intrus%20Fictif');
  await expect(page.locator('.notice')).toContainText('Une partie du lien n’a pas été reconnue : elle a été ignorée. Le formulaire reste utilisable.');
  await expect(page.locator('input[name="store"]:checked')).toHaveCount(0);
  await expect(subjectSelect(page)).toHaveValue('');
  await expect(aside(page)).toContainText('Aucun modèle joint');
  await expect(aside(page).getByRole('heading', { name: 'Votre magasin' })).toBeVisible();
  await expect(backLink(page)).toHaveAttribute('href', '/magasins');
  await expect(page.locator('main')).not.toContainText('Intrus Fictif');
  await fillPerson(page, watch);
  await storeRadio(page, 'centre-ville').check();
  await subjectSelect(page).selectOption('autre');
  await submitButton(page).click();
  await expect(page.locator('.contact-success')).toContainText('Optic 2000 Centre-ville');
  await expect(page.locator('.contact-success')).toContainText('Autre demande');
  await expect(page.locator('.contact-success')).not.toContainText('Sélection');
  await expect(page.locator('.contact-success a[href^="/magasins"]').first()).toHaveAttribute('href', '/magasins/centre-ville?sujet=autre');
  await openContact(page, '?produit=inconnu&magasin=mamao');
  await expect(storeRadio(page, 'mamao')).toBeChecked();
  await expect(backLink(page)).toContainText('Retour au magasin Mamao');
  await expect(backLink(page)).toHaveAttribute('href', '/magasins/mamao');
  await openContact(page, '?produit=trublends-one-day-5-couleurs');
  await expect(subjectSelect(page)).toHaveValue('lentilles');
  await expect(page.locator('input[name="store"]:checked')).toHaveCount(0);
  await expect(backLink(page)).toContainText('Retour à votre sélection');
  await expect(backLink(page)).toHaveAttribute('href', '/produits/trublends-one-day-5-couleurs');
  // No data typed ever travelled in a URL.
  expect(page.url()).not.toContain('Marie');
});

test('Long unbroken input and a 360 px screen: the recap and the form do not overflow', async ({ page, watch }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await openContact(page, '?magasin=mamao&sujet=autre');
  const longName = 'Longuenomfictif'.repeat(6).slice(0, 80);
  const longMessage = `Message fictif S2 ${'x'.repeat(60)} https://example.com/${'a'.repeat(80)}`;
  watch.typed.push(longName, longMessage);
  await field(page, 'Nom').fill(longName);
  await field(page, 'E-mail').fill('prenom.nom.tres.long.de.demonstration@example.com');
  await field(page, 'Message').fill(longMessage);
  await expectHealthy(page);
  await submitButton(page).click();
  await expect(page.locator('.contact-success')).toContainText(longName);
  await expectHealthy(page);
  await page.getByRole('button', { name: /Préparer une autre demande/ }).click();
  await expectHealthy(page);
});

// =====================================================================================================================
// Legacy addresses, 404 and breakpoints
// =====================================================================================================================
test('Old addresses land on the right page in a browser, keep their filter and fragment, and unknown ones stay 404', async ({ page, watch }) => {
  const solar = products.filter(p => p.kind === 'solar');
  await page.goto('/maui-jim-pour-femmes');
  await expect(page).toHaveURL(/\/solaires\?genre=femme$/);
  await expect(page.getByRole('combobox', { name: 'Collection', exact: true })).toHaveValue('femme');
  await expect(page.locator('.product-card')).toHaveCount(solar.filter(p => p.categories.includes('femme')).length);
  await page.goto('/maui-jim-pour-hommes?tri=prix-asc');
  expect(params(page)).toEqual({ genre: 'homme', tri: 'prix-asc' });
  await expect(page.locator('.product-card')).toHaveCount(solar.filter(p => p.categories.includes('homme')).length);
  const amounts = (await page.locator('.product-price').allTextContents()).map(text => Number(text.replace(/\D/g, '')));
  expect(amounts).toEqual([...amounts].sort((a, b) => a - b));
  for (const [from, to, cards] of [['/boutique', '/catalogue', 83], ['/boutique-en-ligne/', '/catalogue', 83], ['/lunettes-de-soleil', '/solaires', 78]] as const) {
    await page.goto(from);
    await expect(page).toHaveURL(new RegExp(`${to}$`));
    await expect(page.locator('.product-card')).toHaveCount(cards);
  }
  await page.goto('/lentille-couleur-et-fantaisie');
  await expect(page).toHaveURL(/\/lentilles#couleur-et-fantaisie$/);
  await expect(page.locator('#couleur-et-fantaisie-title')).toBeInViewport();
  await expect(page.locator('.lens-products .product-card')).toHaveCount(5);
  await page.goto('/protheses-occulaires/');
  await expect(page).toHaveURL(/\/protheses-oculaires$/);
  await expect(h1(page)).toHaveText('Prothèses oculaires.');
  await page.goto('/nos-offres');
  await expect(page).toHaveURL(/\/services-et-garanties#offres-historiques$/);
  await expect(page.locator('#offres-historiques-title')).toBeInViewport();
  for (const [from, to] of [['/nos-magasins', '/magasins'], ['/centre-ville', '/magasins/centre-ville'], ['/mamao', '/magasins/mamao'], ['/taravao/', '/magasins/taravao']] as const) {
    await page.goto(from);
    await expect(page).toHaveURL(new RegExp(`${to}$`));
  }
  await page.goto('/produit/glory-glory?variante=1608');
  await expect(page).toHaveURL(/\/produits\/glory-glory\?variante=1608$/);
  await expect(page.locator('.detail-price')).toContainText(/38\s*100/);
  await expect(colour(page, 'Noir brillant Manchester United')).toHaveAttribute('aria-pressed', 'true');
  // Real 404s (the status is a real 404 and the page is the prototype's, never a 200 with an error body).
  watch.tolerate.push(/status of 404/);
  for (const path of ['/produit/modele-inconnu', '/produit/glory-glory-extra', '/mon-compte', '/panier', '/commander', '/boutique/produit-x', '/produits/inconnu', '/contact/x']) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
    await expect(page.getByRole('heading', { name: 'Cette page nous échappe.' })).toBeVisible();
    expect(new URL(page.url()).pathname, 'no redirect hides an unknown page').toBe(path);
  }
});

const boundaryRoutes = [
  '/', '/solaires', '/catalogue', '/lunettes-de-vue', '/lentilles', '/jumelles-et-telescopes', '/basse-vision', '/protheses-oculaires', '/services-et-garanties', '/qui-sommes-nous',
  '/contact', '/contact?magasin=taravao&produit=freshlook-colorblends&variante=1949&couleur=grey&sphere=2-00-2', '/mentions-legales', '/politique-de-confidentialite', '/cgv',
  '/produits/freshlook-colorblends?variante=1949&couleur=grey&sphere=2-00', '/produits/trublends-one-day-5-couleurs', '/magasins', '/magasins/taravao', '/marques', '/marques/bosma',
];
for (const width of [801, 1101, 1280]) {
  test(`No horizontal overflow and a usable header at the ${width}px boundary`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    for (const route of boundaryRoutes) {
      await page.goto(route);
      await expectHealthy(page);
    }
    await page.goto('/');
    const desktop = page.getByRole('navigation', { name: 'Navigation principale' });
    const menu = page.getByRole('button', { name: 'Menu', exact: true });
    // Exactly one way into the site is shown, and it works.
    const desktopVisible = await desktop.isVisible();
    const menuVisible = await menu.isVisible();
    expect(desktopVisible || menuVisible, 'at least one navigation is visible').toBe(true);
    if (desktopVisible) {
      await desktop.getByRole('button', { name: 'Nos univers' }).click();
      const panel = page.locator('#universe-panel');
      await expect(panel).toBeVisible();
      const box = (await panel.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      for (const link of await panel.locator('a').all()) await expect(link).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const navBox = (await desktop.boundingBox())!;
      expect(navBox.x + navBox.width, 'the desktop navigation stays inside the screen').toBeLessThanOrEqual(width);
      const rects = await page.evaluate(() => ['.brand-lockup', '.desktop-nav', '.header-store'].map(selector => { const box = document.querySelector(selector)?.getBoundingClientRect(); return box && box.width > 0 ? { selector, left: box.left, right: box.right } : null; }).filter((box): box is { selector: string; left: number; right: number } => !!box));
      for (let index = 1; index < rects.length; index++) expect(rects[index - 1].right, `${rects[index - 1].selector} overlaps ${rects[index].selector}`).toBeLessThanOrEqual(rects[index].left + 1);
      await page.keyboard.press('Escape');
    } else {
      await menu.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
    }
  });
}
