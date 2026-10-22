import { test, expect } from '@playwright/test';
import { products } from '../../src/data';
import { stores } from '../../src/data/stores';

const failures: string[] = [];
test.beforeEach(async ({ context, page }) => {
  await context.route(/optic2000tahiti\.com/, route => { failures.push(route.request().url()); return route.abort(); });
  page.on('pageerror', error => failures.push(error.message));
});
test.afterEach(() => expect(failures.splice(0)).toEqual([]));

test('Home model selection, Maui Jim collection, Ray-Ban in-store destination', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Le soleil,\s*autrement\./ })).toBeVisible();
  const stage = page.locator('.showcase-stage');
  await expect(stage.getByRole('heading', { name: 'Glory Glory' })).toBeVisible();
  await page.getByRole('button', { name: 'Baby Beach', exact: true }).click();
  await expect(stage.getByRole('heading', { name: 'Baby Beach' })).toBeVisible();
  await expect(stage.getByRole('link', { name: 'Découvrir ce modèle' })).toHaveAttribute('href', '/produits/baby-beach');
  await page.goto('/marques/maui-jim');
  await page.getByRole('link', { name: 'Explorer la collection' }).click();
  await expect(page).toHaveURL(/solaires\?marque=maui-jim/);
  await expect(page.locator('.product-card')).toHaveCount(78);
  await page.goto('/marques/ray-ban');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ray-Ban');
  await expect(page.locator('.product-card')).toHaveCount(0);
  await expect(page.locator('.store-card')).toHaveCount(3);
  await page.getByRole('link', { name: 'Trouver mon magasin', exact: true }).last().click();
  await expect(page).toHaveURL(/\/magasins$/);
});

test('Cumulative filters, shareable URL, product return and browser back preserve context', async ({ page, context }) => {
  await page.goto('/solaires');
  await page.getByRole('searchbox', { name: 'Rechercher un modèle ou un coloris' }).fill('Glory');
  await page.getByRole('combobox', { name: 'Collection', exact: true }).selectOption('femme');
  await page.getByRole('combobox', { name: 'Coloris de monture', exact: true }).selectOption('cannelle-transparente');
  await page.getByRole('combobox', { name: 'Budget', exact: true }).selectOption('30000-40000');
  await page.getByRole('combobox', { name: 'Trier par', exact: true }).selectOption('prix-desc');
  await page.getByRole('button', { name: 'Appliquer', exact: true }).click();
  await expect(page.locator('.product-card')).toHaveCount(1);
  await expect(page.locator('.active-filters a')).toHaveCount(4);
  const url = page.url();
  const shared = await context.newPage();
  await shared.goto(url);
  await expect(shared.locator('.product-card')).toHaveCount(1);
  await expect(shared.getByRole('searchbox')).toHaveValue('Glory');
  await expect(shared.getByRole('combobox', { name: 'Trier par', exact: true })).toHaveValue('prix-desc');
  await shared.close();
  await page.locator('.product-card').getByRole('link').click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Glory Glory');
  await page.getByRole('link', { name: 'Retour aux résultats' }).click();
  await expect(page.locator('.product-card')).toHaveCount(1);
  await expect(page.getByRole('combobox', { name: 'Coloris de monture', exact: true })).toHaveValue('cannelle-transparente');
  await page.locator('.product-card').getByRole('link').click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Glory Glory');
  await page.goBack();
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.getByRole('link', { name: 'Tout effacer', exact: true }).click();
  await expect(page.locator('.product-card')).toHaveCount(78);
});

test('No results, invalid filter, sort order, complete catalogue and unknown route', async ({ page, request }) => {
  await page.goto('/solaires?q=zzzintrouvable');
  await expect(page.getByRole('heading', { name: 'Aucun modèle ne correspond.' })).toBeVisible();
  await page.getByRole('link', { name: 'Revoir tous les modèles' }).click();
  await expect(page.locator('.product-card')).toHaveCount(78);
  await page.goto('/solaires?genre=inconnu&tri=invalide');
  await expect(page.getByText('Un filtre n’a pas été reconnu.', { exact: false })).toBeVisible();
  await expect(page.locator('.product-card')).toHaveCount(78);
  await page.goto('/solaires?tri=prix-asc');
  const prices = await page.locator('.product-price').allTextContents();
  const numeric = prices.map(p => Number(p.replace(/\D/g, '')));
  expect(numeric).toEqual([...numeric].sort((a, b) => a - b));
  await page.goto('/catalogue');
  await expect(page.locator('.product-card')).toHaveCount(83);
  const unknown = await request.get('/produits/modele-inconnu');
  expect(unknown.status()).toBe(404);
  await page.goto('/chemin-inconnu');
  await expect(page.getByRole('heading', { name: 'Cette page nous échappe.' })).toBeVisible();
});

test('Every Glory Glory variant has its source price/image, long name, gallery and store context', async ({ page }) => {
  await page.goto('/produits/glory-glory');
  const product = products.find(p => p.slug === 'glory-glory')!;
  for (const variant of product.variants) {
    await page.getByRole('button', { name: variant.labels.attribute_pa_couleur, exact: true }).click();
    await expect(page.locator('.detail-price')).toContainText(new Intl.NumberFormat('fr-FR').format(variant.price));
    await expect(page.locator('.product-main-image img')).toHaveAttribute('src', new RegExp(encodeURIComponent(variant.image.src)));
    await expect(page).toHaveURL(new RegExp(`variante=${variant.id}`));
  }
  await page.getByRole('button', { name: 'Cannelle transparente', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.detail-price')).toContainText('34');
  await page.getByRole('button', { name: 'Noir brillant Manchester United', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.detail-price')).toContainText('38');
  await page.getByRole('button', { name: 'Voir la vue 2', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Voir la vue 2', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: 'Se renseigner en magasin' }).click();
  await expect(page.locator('.product-context')).toContainText('Noir brillant Manchester United');
  await page.locator('.store-card').filter({ hasText: 'Taravao' }).getByRole('link', { name: 'Les infos pratiques' }).click();
  await expect(page.locator('.product-context')).toContainText('38 100');
  await expect(page.getByText('Horaires à confirmer auprès du magasin', { exact: true })).toBeVisible();
  await page.goto('/produits/baby-beach');
  await expect(page.locator('.variant-option')).toHaveCount(4);
  await page.getByRole('button', { name: 'Argenté verre bleu hawaii', exact: true }).click();
  await expect(page.locator('.detail-price')).toContainText('34');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Argenté verre bleu hawaii', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('Store telephone, email and exact source map place IDs, robots protection', async ({ page, request }) => {
  for (const store of stores) {
    await page.goto(`/magasins/${store.slug}`);
    await expect(page.locator('.store-information a[href^="tel:"]')).toHaveAttribute('href', `tel:${store.phone}`);
    await expect(page.locator('.store-information a[href^="mailto:"]')).toHaveAttribute('href', `mailto:${store.email}`);
    await expect(page.getByRole('link', { name: 'Plan et itinéraire', exact: false })).toHaveAttribute('href', store.mapUrl);
    await expect(page.locator('.store-detail-photo')).toBeVisible();
    if (store.slug === 'taravao') {
      await expect(page.locator('.store-schedule')).toHaveCount(0);
      await expect(page.locator('address')).not.toContainText('987');
    }
  }
  const response = await request.get('/');
  expect(response.headers()['x-robots-tag']).toContain('noindex');
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /');
});

test('Mobile menu keyboard, Escape, focus return; mobile filters and 360 px overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  await menu.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Tab');
  const activeInside = await page.evaluate(() => document.querySelector('dialog')?.contains(document.activeElement));
  expect(activeInside).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(menu).toBeFocused();
  await menu.click();
  await page.getByRole('navigation', { name: 'Navigation mobile' }).getByRole('link', { name: 'Les solaires' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'Filtres et tri', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Coloris de monture', exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Budget', exact: true }).selectOption('plus-40000');
  await page.getByRole('button', { name: 'Appliquer', exact: true }).click();
  await expect(page).toHaveURL(/budget=plus-40000/);
  await page.setViewportSize({ width: 360, height: 844 });
  for (const route of ['/', '/solaires', '/produits/glory-glory', '/marques/ray-ban', '/magasins/taravao']) {
    await page.goto(route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});


test('A missing product photograph has a bounded fallback and leaves the variant/store path usable', async ({ page }) => {
  await page.route('**/_next/image?**', route => {
    const image = new URL(route.request().url()).searchParams.get('url') ?? '';
    return image.includes('HS833-12F_quarter') ? route.abort() : route.continue();
  });
  await page.goto('/produits/glory-glory?variante=774');
  await expect(page.locator('.product-main-image .image-fallback')).toBeVisible();
  await page.getByRole('button', { name: 'Noir brillant Manchester United', exact: true }).click();
  await expect(page.locator('.product-main-image img')).toBeVisible();
  await expect(page.locator('.detail-price')).toContainText('38');
  await expect(page.getByRole('link', { name: 'Se renseigner en magasin' })).toBeVisible();
});


test('Brand directory searches, filters, resets and preserves laboratory/gamme distinctions', async ({ page }) => {
  await page.goto('/marques');
  await expect(page.locator('.brand-card')).toHaveCount(38);
  await page.getByRole('searchbox', { name: 'Rechercher une marque', exact: true }).fill('Ray-Ban');
  await page.getByRole('combobox', { name: 'Filtrer par univers', exact: true }).selectOption('Soleil');
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click();
  await expect(page.locator('.brand-card')).toHaveCount(1);
  await expect(page.locator('.brand-card')).toContainText('À découvrir en magasin');
  await page.getByRole('link', { name: 'Tout effacer', exact: true }).click();
  await expect(page.locator('.brand-card')).toHaveCount(38);
  await page.goto('/marques?q=zzzintrouvable');
  await expect(page.getByRole('heading', { name: 'Aucune marque ne correspond.' })).toBeVisible();
  await page.goto('/marques/freshlook');
  await expect(page.getByText('Gamme de lentilles Alcon.', { exact: true })).toBeVisible();
});
