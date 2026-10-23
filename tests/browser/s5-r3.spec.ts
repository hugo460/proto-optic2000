import { test as base, expect, type Page } from '@playwright/test';
import { products } from '../../src/data';
import { variantGallery } from '../../src/lib/variants';

// S5/r3 scenarios for the recomposed catalogue and product page (criteria H5, H6, H9). The home hero, the film and the menus are in
// s5.spec.ts; the catalogue and product invariants that did not change (filters, URL, return, lenses) stay in journey.spec.ts and
// s2.spec.ts. Same guards as S5: no error, no request outside the local origin, nothing transmitted. Everything here is geometry read
// from the page itself and the real controls: nothing is forced, nothing relies on a class name that says what a thing looks like.
interface Watch { origin: string; failures: string[]; requests: { method: string; url: string; body: string | null }[] }
const test = base.extend<{ watch: Watch }>({
  watch: [async ({ context, baseURL }, use) => {
    const watch: Watch = { origin: new URL(baseURL!).origin, failures: [], requests: [] };
    await context.route(/optic2000tahiti\.com/, route => { watch.failures.push(`former domain requested: ${route.request().url()}`); return route.abort(); });
    context.on('weberror', error => watch.failures.push(`page error: ${error.error().message}`));
    context.on('console', message => { if (message.type() === 'error') watch.failures.push(`console error: ${message.text()} ${message.location().url}`); });
    context.on('request', request => {
      watch.requests.push({ method: request.method(), url: request.url(), body: request.postData() });
      const url = new URL(request.url());
      if (/^https?:$/.test(url.protocol) && url.origin !== watch.origin) watch.failures.push(`automatic request outside the local origin: ${request.url()}`);
    });
    context.on('requestfailed', request => { if (request.failure()?.errorText !== 'net::ERR_ABORTED') watch.failures.push(`request failed: ${request.url()} (${request.failure()?.errorText})`); });
    await use(watch);
    expect(watch.failures, 'errors or traffic outside the local origin').toEqual([]);
    expect(watch.requests.filter(request => request.method !== 'GET' || request.body), 'nothing is transmitted').toEqual([]);
  }, { auto: true }],
});

const h1 = (page: Page) => page.getByRole('heading', { level: 1 });
const params = (page: Page) => Object.fromEntries(new URL(page.url()).searchParams);
const queryOf = (href: string | null) => Object.fromEntries(new URL(href!, 'http://prototype.local').searchParams);
const imageSrc = (src: string) => new RegExp(encodeURIComponent(src).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
async function settle(page: Page) {
  // Hydration completes before the capture probe changes loading attributes.
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(async image => { image.loading = 'eager'; try { await image.decode(); } catch { /* a failed decode is reported as a broken image */ } }));
  });
}
// Images decoded, no fallback shown, nothing wider than the screen, no text cut inside a box that hides its overflow.
async function expectSound(page: Page, label: string) {
  await settle(page);
  const state = await page.evaluate(() => ({
    broken: [...document.images].filter(image => !image.complete || image.naturalWidth === 0).map(image => image.currentSrc || image.getAttribute('src')),
    fallbacks: document.querySelectorAll('.image-fallback').length,
    overflow: document.documentElement.scrollWidth - innerWidth,
    clipped: [...document.querySelectorAll('main :is(h1, h2, h3, button, a, label)')].filter(node => !node.closest('.sr-only') && node.getClientRects().length && node.scrollWidth > node.clientWidth + 1 && getComputedStyle(node).overflowX !== 'visible').map(node => (node.textContent ?? '').trim().slice(0, 40)),
  }));
  expect(state.broken, `${label}: broken images`).toEqual([]);
  expect(state.fallbacks, `${label}: image fallbacks shown`).toBe(0);
  expect(state.overflow, `${label}: horizontal overflow`).toBeLessThanOrEqual(0);
  expect(state.clipped, `${label}: clipped text`).toEqual([]);
}
// Touch targets: every visible control matching the selector is at least 44 px high (and, when asked, 44 px wide).
async function below44(page: Page, selector: string, wide = false) {
  return page.evaluate(([css, both]) => [...document.querySelectorAll<HTMLElement>(css as string)]
    .filter(element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden')
    .map(element => { const box = element.getBoundingClientRect(); return { name: (element.getAttribute('aria-label') || element.textContent || element.getAttribute('name') || element.tagName).trim().slice(0, 40), height: Math.round(box.height), width: Math.round(box.width) }; })
    .filter(control => control.height < 44 || (both && control.width < 44)), [selector, wide] as const);
}

// =====================================================================================================================
// Catalogue (H5)
// =====================================================================================================================
// The cards of the first grid row, measured from the page: whole photo, name, and where they sit in the screen.
const firstRow = (page: Page) => page.evaluate(() => {
  const grid = document.querySelector('.catalogue-page .product-grid')!;
  const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
  return {
    columns,
    cards: [...grid.children].slice(0, columns).map(card => {
      const image = card.querySelector('img')!, photo = image.getBoundingClientRect(), name = card.querySelector('h3')!.getBoundingClientRect();
      const fit = getComputedStyle(image).objectFit;
      return {
        title: card.querySelector('h3')!.textContent!.trim(), loaded: image.complete && image.naturalWidth > 0, fit,
        // Whole photo: contained, or a box that keeps the natural ratio (never a cropped cover).
        whole: ['contain', 'scale-down'].includes(fit) || Math.abs(photo.width / photo.height - image.naturalWidth / image.naturalHeight) < .03 * (image.naturalWidth / image.naturalHeight),
        photo: { top: photo.top, bottom: photo.bottom, left: photo.left, right: photo.right, width: photo.width, height: photo.height }, name: { top: name.top, bottom: name.bottom }, viewport: innerHeight, wide: innerWidth,
      };
    }),
  };
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }]) {
  test(`Catalogue at ${viewport.width}×${viewport.height}: the first row shows whole photos and their names without scrolling`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const route of ['/solaires', '/catalogue']) {
      await page.goto(route);
      await settle(page);
      const row = await firstRow(page);
      expect(row.columns, `${route}: several models side by side`).toBeGreaterThanOrEqual(2);
      for (const card of row.cards) {
        expect(card.loaded, `${route} ${card.title}: photo loaded`).toBe(true);
        expect(card.whole, `${route} ${card.title}: photo kept whole (${card.fit})`).toBe(true);
        expect(card.photo.top, `${route} ${card.title}: photo starts in the screen`).toBeGreaterThanOrEqual(0);
        expect(card.photo.bottom, `${route} ${card.title}: photo ends in the screen`).toBeLessThanOrEqual(viewport.height);
        expect(card.name.bottom, `${route} ${card.title}: name in the screen`).toBeLessThanOrEqual(viewport.height);
        expect(card.photo.right).toBeLessThanOrEqual(viewport.width);
        expect(card.photo.width, `${route} ${card.title}: a photograph, not a stamp (${Math.round(card.photo.width)} px)`).toBeGreaterThanOrEqual(120);
      }
      await expectSound(page, `${route} ${viewport.width}px`);
    }
  });
}

for (const width of [360, 390, 400, 401, 801, 960, 961, 1101, 1280, 1350, 1351]) {
  test(`Catalogue native filter values remain legible at ${width}px, including the active sort`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/solaires', '/catalogue?tri=prix-desc']) {
      await page.goto(route);
      await settle(page);
      if (width <= 800) await page.getByRole('button', { name: /^Filtres et tri/ }).click();
      await expect(page.getByRole('combobox', { name: 'Collection', exact: true })).toBeVisible();
      const values = await page.locator('.filter-fields select[name="genre"], .filter-fields select[name="tri"]').evaluateAll(controls => controls.map(control => {
        const select = control as HTMLSelectElement, style = getComputedStyle(select);
        const context = document.createElement('canvas').getContext('2d')!;
        context.font = style.font;
        const text = select.selectedOptions[0].textContent ?? '';
        // Chromium's native popup indicator also reserves inner space beyond the authored padding.
        const room = select.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 20;
        return { text, ink: context.measureText(text).width, room };
      }));
      for (const value of values) expect(value.ink, `${route}: ${value.text} fits before the native indicator`).toBeLessThanOrEqual(value.room);
      await expectSound(page, `${route} ${width}px`);
    }
  });
}

test.describe('Catalogue on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('Filters closed: two columns and the first two photos whole in the first screen; the filters open on demand', async ({ page }) => {
    await page.goto('/solaires');
    await settle(page);
    const toggle = page.getByRole('button', { name: /Filtres et tri/ });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('combobox', { name: 'Budget', exact: true })).toBeHidden();
    const row = await firstRow(page);
    expect(row.columns, 'two columns on a phone').toBe(2);
    expect(row.cards).toHaveLength(2);
    expect(Math.abs(row.cards[0].photo.top - row.cards[1].photo.top), 'the two photos share the first row').toBeLessThanOrEqual(2);
    for (const card of row.cards) {
      expect(card.loaded, `${card.title}: photo loaded`).toBe(true);
      expect(card.whole, `${card.title}: photo kept whole (${card.fit})`).toBe(true);
      expect(card.photo.top).toBeGreaterThanOrEqual(0);
      expect(card.photo.bottom, `${card.title}: photo whole in the first screen`).toBeLessThanOrEqual(844);
      expect(card.photo.left).toBeGreaterThanOrEqual(0);
      expect(card.photo.right).toBeLessThanOrEqual(390);
      expect(card.photo.width, `${card.title}: a photograph, not a stamp (${Math.round(card.photo.width)} px)`).toBeGreaterThanOrEqual(120);
    }
    // Opened: every real filter is there, with the same names, and closes again.
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    for (const name of ['Collection', 'Coloris de monture', 'Budget', 'Trier par']) await expect(page.getByRole('combobox', { name, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Appliquer', exact: true })).toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('combobox', { name: 'Budget', exact: true })).toBeHidden();
  });

  test('Every control of the catalogue is at least 44 px high: closed, opened and with active filters', async ({ page }) => {
    const controls = '.catalogue-page :is(select, button, summary, .search-input, .active-filters a, .results-toolbar a, .catalogue-tabs a, .filter-toggle)';
    await page.goto('/solaires?q=Glory&genre=femme');
    await settle(page);
    await expect(page.locator('.active-filters a')).not.toHaveCount(0);
    expect(await below44(page, controls), 'closed, with active filters').toEqual([]);
    await page.getByRole('button', { name: /Filtres et tri/ }).click();
    await expect(page.getByRole('combobox', { name: 'Budget', exact: true })).toBeVisible();
    expect(await below44(page, controls), 'opened').toEqual([]);
    await page.goto('/solaires?q=zzzintrouvable');
    await expect(page.getByRole('heading', { name: 'Aucun modèle ne correspond.' })).toBeVisible();
    expect(await below44(page, `${controls}, .empty-state a`), 'empty state').toEqual([]);
  });
});

// Filters and sort keep their plain GET contract: one form, the same field names, the URL carries the choice.
test('Catalogue form: plain GET, same fields and names, values read back from the URL, reset and removable chips', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/solaires?q=Glory&genre=femme&tri=prix-desc');
  const form = page.locator('form.catalogue-form');
  await expect(form).toHaveAttribute('method', 'get');
  await expect(form).toHaveAttribute('action', '/solaires');
  expect(await form.locator('input[name], select[name]').evaluateAll(fields => fields.map(field => field.getAttribute('name')))).toEqual(['q', 'genre', 'couleur', 'budget', 'tri']);
  await expect(page.getByRole('searchbox', { name: 'Rechercher un modèle ou un coloris' })).toHaveValue('Glory');
  await expect(page.getByRole('combobox', { name: 'Collection', exact: true })).toHaveValue('femme');
  await expect(page.getByRole('combobox', { name: 'Trier par', exact: true })).toHaveValue('prix-desc');
  await expect(page.getByRole('link', { name: 'Tout effacer', exact: true })).toHaveAttribute('href', '/solaires');
  await expect(page.getByRole('link', { name: /Retirer le filtre/ })).not.toHaveCount(0);
  await page.getByRole('combobox', { name: 'Trier par', exact: true }).selectOption('prix-asc');
  await page.getByRole('button', { name: 'Appliquer', exact: true }).click();
  await expect.poll(() => params(page)).toMatchObject({ q: 'Glory', genre: 'femme', tri: 'prix-asc' });
  // The URL can commit before the result is ready. Await the one visible price of this Glory fixture before reading it.
  const prices = page.locator('.product-grid .product-price');
  await expect(prices).toHaveCount(1);
  await expect(prices).toBeVisible();
  const amounts = (await prices.allTextContents()).map(text => Number(text.replace(/\D/g, '')));
  expect(amounts.length).toBeGreaterThan(0);
  expect(amounts).toEqual([...amounts].sort((a, b) => a - b));
  // A chip removes only its own filter.
  await page.getByRole('link', { name: 'Retirer le filtre Femme', exact: true }).click();
  await expect.poll(() => params(page)).toEqual({ q: 'Glory', tri: 'prix-asc' });
});

// The catalogue and the product page at the six review sizes and the four thresholds of the header: nothing wider than the
// screen, nothing cut, no broken image, the heading present once; two columns on a phone.
const sizes = [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 800, height: 900 }, { width: 801, height: 900 }, { width: 1024, height: 768 }, { width: 1100, height: 900 }, { width: 1101, height: 900 }, { width: 1280, height: 800 }, { width: 1440, height: 900 }];
for (const viewport of sizes) {
  test(`Catalogue and product page at ${viewport.width}×${viewport.height}: no overflow, no cut text, whole photos`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const route of ['/solaires', '/catalogue', '/solaires?q=Glory&genre=femme', '/produits/glory-glory', '/produits/baby-beach?variante=1549']) {
      await page.goto(route);
      await expect(h1(page)).toHaveCount(1);
      await expectSound(page, `${route} ${viewport.width}px`);
    }
    await page.goto('/solaires');
    // Streamed markup can be attached before it has a layout: measure the visible, settled collection.
    await expect(page.locator('.catalogue-page .product-grid')).toBeVisible();
    await settle(page);
    if (viewport.width <= 600) expect((await firstRow(page)).columns, 'two columns on a phone').toBe(2);
  });
}

// =====================================================================================================================
// Product page: Glory Glory (H6)
// =====================================================================================================================
const glory = products.find(p => p.slug === 'glory-glory')!;
const gray = glory.variants.find(v => v.id === 1607)!;
const colourLabel = (variant: (typeof glory.variants)[number]) => variant.labels.attribute_pa_couleur;
const thumbs = (page: Page) => page.locator('.gallery-thumbnails button');
const colours = (page: Page) => page.locator('.variant-option');
const rail = (page: Page) => page.locator('.gallery-thumbnails').evaluate(element => {
  const box = element.getBoundingClientRect();
  const buttons = [...element.querySelectorAll('button')].map(button => button.getBoundingClientRect());
  return {
    count: buttons.length, tops: buttons.map(item => Math.round(item.top - box.top)), heights: buttons.map(item => Math.round(item.height)), widths: buttons.map(item => Math.round(item.width)),
    scrollWidth: element.scrollWidth, clientWidth: element.clientWidth, scrollLeft: element.scrollLeft, overflowX: getComputedStyle(element).overflowX,
    wrap: getComputedStyle(element).flexWrap, pageOverflow: document.documentElement.scrollWidth - innerWidth,
  };
});

test('Glory Glory initial state: the 15 views are all there, the 5 colours are named and none is chosen, the price is the range', async ({ page }) => {
  expect(glory.images).toHaveLength(15);
  expect(glory.variants).toHaveLength(5);
  await page.goto('/produits/glory-glory');
  await expect(h1(page)).toHaveText('Glory Glory');
  await expect(thumbs(page)).toHaveCount(15);
  for (let view = 1; view <= 15; view++) await expect(page.getByRole('button', { name: `Voir la vue ${view}`, exact: true })).toHaveCount(1);
  await expect(page.locator('.gallery-thumbnails[role="group"]')).toHaveAccessibleName('Vues du modèle');
  // The first view is the one shown; every colour is named in full and none is pre-selected.
  await expect(thumbs(page).nth(0)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.gallery-thumbnails button[aria-pressed="true"]')).toHaveCount(1);
  await expect(page.locator('.product-main-image img')).toHaveAttribute('src', imageSrc(glory.images[0].src));
  await expect(colours(page)).toHaveCount(5);
  expect(await colours(page).evaluateAll(options => options.map(option => option.getAttribute('aria-pressed')))).toEqual(['false', 'false', 'false', 'false', 'false']);
  for (const variant of glory.variants) {
    const option = page.getByRole('button', { name: colourLabel(variant), exact: true });
    await expect(option).toHaveCount(1);
    await expect(option).toBeVisible();
    await expect(option).toHaveAttribute('aria-pressed', 'false');
  }
  await expect(page.locator('.detail-price')).toContainText(/34\s*600/);
  await expect(page.locator('.detail-price')).toContainText(/38\s*100/);
  expect(params(page)).toEqual({});
});

for (const viewport of [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 800, height: 900 }, { width: 801, height: 900 }, { width: 1024, height: 768 }, { width: 1100, height: 900 }, { width: 1101, height: 900 }, { width: 1280, height: 800 }, { width: 1440, height: 900 }]) {
  test(`Glory Glory at ${viewport.width}×${viewport.height}: one horizontal rail for the 15 views, the last one reached by keyboard and click, controls of 44 px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/produits/glory-glory');
    await settle(page);
    const before = await rail(page);
    expect(before.count).toBe(15);
    // One single row: every view starts at the same height inside the rail, whatever the width.
    expect(Math.max(...before.tops) - Math.min(...before.tops), `one row (tops ${before.tops.join(',')})`).toBeLessThanOrEqual(2);
    expect(before.wrap, 'the rail does not wrap').toBe('nowrap');
    expect(before.pageOverflow, 'the rail scrolls inside itself, the page does not widen').toBeLessThanOrEqual(0);
    expect(before.scrollLeft).toBe(0);
    // When the 15 views do not fit, the rail itself scrolls horizontally (a phone cannot show 15 views of 44 px at once).
    if (before.scrollWidth > before.clientWidth + 1) expect(['auto', 'scroll']).toContain(before.overflowX);
    if (viewport.width <= 600) expect(before.scrollWidth, 'on a phone the rail really overflows and scrolls').toBeGreaterThan(before.clientWidth + 1);
    for (const [index, height] of before.heights.entries()) {
      expect(height, `view ${index + 1}: tall enough to touch`).toBeGreaterThanOrEqual(44);
      expect(before.widths[index], `view ${index + 1}: wide enough to touch`).toBeGreaterThanOrEqual(44);
    }
    expect(await below44(page, '.variant-option, a.product-brand-link, a.product-store-action, a.product-request-link, .product-details summary'), 'colour, brand, store, request and detail controls').toEqual([]);
    // The keyboard walks the rail view after view and the last view comes into sight by itself.
    await thumbs(page).nth(0).focus();
    for (let step = 0; step < 14; step++) await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Voir la vue 15', exact: true })).toBeFocused();
    await expect.poll(() => page.evaluate(() => {
      const button = document.activeElement!.getBoundingClientRect(), frame = document.querySelector('.gallery-thumbnails')!.getBoundingClientRect();
      return button.left >= frame.left - 1 && button.right <= frame.right + 1;
    }), { message: 'the focused last view is inside the rail' }).toBe(true);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Voir la vue 15', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.product-main-image img')).toHaveAttribute('src', imageSrc(glory.images[14].src));
    await expect(page.locator('.product-main-image img')).toHaveAttribute('alt', /vue 15/);
    // And by pointer: back to the first view, then the last one again.
    await page.getByRole('button', { name: 'Voir la vue 1', exact: true }).click();
    await expect(page.locator('.product-main-image img')).toHaveAttribute('src', imageSrc(glory.images[0].src));
    await page.getByRole('button', { name: 'Voir la vue 15', exact: true }).click();
    await expect(page.locator('.product-main-image img')).toHaveAttribute('src', imageSrc(glory.images[14].src));
    await expect(page.locator('.gallery-thumbnails button[aria-pressed="true"]')).toHaveCount(1);
    await expectSound(page, `glory-glory ${viewport.width}px`);
  });
}

test.describe('Glory Glory on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('The name and the price are in the first screen, not pushed down by the views; heading, price, colours and store action stay in that order', async ({ page }) => {
    await page.goto('/produits/glory-glory');
    await settle(page);
    const layout = await page.evaluate(() => {
      const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
      const before = (first: string, second: string) => !!(document.querySelector(first)!.compareDocumentPosition(document.querySelector(second)!) & Node.DOCUMENT_POSITION_FOLLOWING);
      const title = box('h1'), price = box('.detail-price'), picker = box('.variant-picker'), action = box('a.product-store-action'), image = box('.product-main-image'), rail = box('.gallery-thumbnails');
      return {
        titleBottom: title.bottom, priceTop: price.top, viewport: innerHeight,
        order: before('h1', '.detail-price') && before('.detail-price', '.variant-picker') && before('.variant-picker', 'a.product-store-action'),
        vertical: title.top <= price.top && price.top <= picker.top && picker.top <= action.top,
        photoFirst: image.top < title.top, railRows: Math.round(rail.height),
      };
    });
    expect(layout.titleBottom, 'the name is whole in the first screen').toBeLessThanOrEqual(layout.viewport);
    expect(layout.priceTop, 'the price starts in the first screen').toBeLessThan(layout.viewport);
    expect(layout.order).toBe(true);
    expect(layout.vertical).toBe(true);
    expect(layout.photoFirst, 'the photo comes first on a phone').toBe(true);
    // The five long colour names and the action are not required to fit without scrolling: each is reachable and uncut.
    for (const variant of glory.variants) {
      const option = page.getByRole('button', { name: colourLabel(variant), exact: true });
      await option.scrollIntoViewIfNeeded();
      await expect(option).toBeInViewport({ ratio: 1 });
    }
    expect(await colours(page).evaluateAll(options => options.filter(option => option.scrollWidth > option.clientWidth + 1 || [...option.querySelectorAll('span')].some(span => span.scrollWidth > span.clientWidth + 1)).map(option => option.textContent!.trim()))).toEqual([]);
    for (const variant of glory.variants) expect(await colours(page).filter({ hasText: colourLabel(variant) }).count(), `${colourLabel(variant)}: name written in full`).toBe(1);
    const action = page.getByRole('link', { name: 'Se renseigner en magasin' });
    await action.scrollIntoViewIfNeeded();
    await expect(action).toBeInViewport({ ratio: 1 });
  });
});

test('Glory Glory: Gris transparent (ID 1607) costs 34 600 XPF, keeps its 3 views, its photo and its store context; reload and deep link agree', async ({ page }) => {
  expect(gray.price).toBe(34600);
  expect(colourLabel(gray)).toBe('Gris transparent');
  const views = variantGallery(glory, gray);
  expect(views, 'Gris transparent has 3 views').toHaveLength(3);
  await page.goto('/produits/glory-glory');
  await page.getByRole('button', { name: 'Gris transparent', exact: true }).click();
  await expect.poll(() => params(page)).toEqual({ variante: '1607' });
  await expect(page.getByRole('button', { name: 'Gris transparent', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.variant-option[aria-pressed="true"]')).toHaveCount(1);
  await expect(page.locator('.detail-price')).toContainText(/34\s*600/);
  await expect(page.locator('.detail-price')).not.toContainText(/38\s*100/);
  await expect(thumbs(page)).toHaveCount(3);
  for (let view = 1; view <= 3; view++) await expect(page.getByRole('button', { name: `Voir la vue ${view}`, exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Voir la vue 4', exact: true })).toHaveCount(0);
  await expect(page.locator('.product-main-image img')).toHaveAttribute('src', imageSrc(gray.image.src));
  await expect(page.getByRole('button', { name: 'Voir la vue 1', exact: true })).toHaveAttribute('aria-pressed', 'true');
  // The last of the three views.
  await page.getByRole('button', { name: 'Voir la vue 3', exact: true }).click();
  await expect(page.locator('.product-main-image img')).toHaveAttribute('src', imageSrc(views[2].src));
  // Store and contact keep the real variant.
  expect(queryOf(await page.locator('a.product-store-action').getAttribute('href'))).toMatchObject({ produit: 'glory-glory', variante: '1607' });
  expect(queryOf(await page.locator('a.product-request-link').getAttribute('href'))).toMatchObject({ produit: 'glory-glory', variante: '1607' });
  await page.locator('a.product-store-action').click();
  await expect(page).toHaveURL(/\/magasins\?/);
  await expect(page.locator('.product-context')).toContainText('Gris transparent');
  await expect(page.locator('.product-context')).toContainText(/34\s*600/);
  await page.goBack();
  await expect.poll(() => params(page)).toEqual({ variante: '1607' });
  await expect(page.getByRole('button', { name: 'Gris transparent', exact: true })).toHaveAttribute('aria-pressed', 'true');
  // Reload and a direct link give the same state.
  await page.goto('/produits/glory-glory?variante=1607');
  await expect(page.getByRole('button', { name: 'Gris transparent', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(thumbs(page)).toHaveCount(3);
  await expect(page.locator('.detail-price')).toContainText(/34\s*600/);
  // Choosing another colour changes the price (Manchester United 38 100) and the views, never the product.
  await page.getByRole('button', { name: 'Noir brillant Manchester United', exact: true }).click();
  await expect.poll(() => params(page)).toEqual({ variante: '1608' });
  await expect(page.locator('.detail-price')).toContainText(/38\s*100/);
  await expect(thumbs(page)).toHaveCount(variantGallery(glory, glory.variants.find(v => v.id === 1608)).length);
  await expect(h1(page)).toHaveText('Glory Glory');
});

test('Glory Glory: the filtered catalogue is still the way back after choosing a colour and a view', async ({ page }) => {
  await page.goto('/solaires?q=Glory&genre=femme&tri=prix-desc');
  const card = page.locator('.product-card').filter({ hasText: 'Glory Glory' }).first();
  await expect(card).toBeVisible();
  const results = new URL((await card.getByRole('link').getAttribute('href'))!, 'http://prototype.local').searchParams.get('retour')!;
  expect(results).toMatch(/^\/solaires\?/);
  const count = await page.locator('.product-card').count();
  await card.getByRole('link').click();
  await expect(h1(page)).toHaveText('Glory Glory');
  await page.getByRole('button', { name: 'Gris transparent', exact: true }).click();
  await page.getByRole('button', { name: 'Voir la vue 2', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Voir la vue 2', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const back = page.getByRole('link', { name: 'Retour aux résultats' });
  await expect(back).toHaveAttribute('href', results);
  await back.click();
  await expect(page).toHaveURL(url => url.pathname + url.search === results);
  await expect(page.locator('.product-card')).toHaveCount(count);
  await expect(page.getByRole('searchbox', { name: 'Rechercher un modèle ou un coloris' })).toHaveValue('Glory');
  await expect(page.getByRole('combobox', { name: 'Collection', exact: true })).toHaveValue('femme');
  await expect(page.getByRole('combobox', { name: 'Trier par', exact: true })).toHaveValue('prix-desc');
});
