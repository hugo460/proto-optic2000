import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chromium, type Page } from '@playwright/test';
import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

// Captures of the real prototype, driven by real user actions (clicks, typing, keyboard). Nothing is simulated in the DOM.
// Before EVERY capture: reduced motion, fonts ready, images eager and decoded, scroll back to the top, one stabilisation frame.
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

async function main() {
const root = process.env.OPTIC_PROOF_DIR;
if (!root) throw new Error('Set OPTIC_PROOF_DIR to an evidence folder outside Git.');
assert(relative(process.cwd(), resolve(root)).startsWith('..'), 'OPTIC_PROOF_DIR must be outside the repository.');
const base = process.env.OPTIC_BASE_URL ?? 'http://127.0.0.1:3011';
const origin = new URL(base).origin;
const out = join(root, 'captures');
await mkdir(out, { recursive: true });
await mkdir('.impeccable/review', { recursive: true });
const code = await codeManifest();
const browser = await chromium.launch();
const context = await browser.newContext({ reducedMotion: 'reduce' });
const forbidden: string[] = [];
const errors: string[] = [];
const hosts = new Set<string>();
let requests: { method: string; url: string; body: boolean }[] = [];
await context.route(/optic2000tahiti\.com/, route => { forbidden.push(route.request().url()); return route.abort(); });
context.on('request', request => { hosts.add(new URL(request.url()).host); requests.push({ method: request.method(), url: request.url(), body: request.postData() !== null }); });
context.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
const page = await context.newPage();
page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));

// ---- capture primitive ---------------------------------------------------------------------------------------------
async function prepare(target: Page) {
  await target.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(async image => { image.loading = 'eager'; try { await image.decode(); } catch { /* failure is recorded below */ } }));
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    await new Promise<void>(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(() => resolveFrame())));
  });
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
interface Capture extends ReturnType<typeof measure> { name: string; width: number; height: number; fullPage: boolean; date: string; png: { width: number; height: number }; network: { requests: number; nonGet: string[]; withBody: string[]; offOrigin: string[] }; errorsSinceLast: string[] }
const records: Capture[] = [];
let errorMark = 0;
async function snap(name: string, fullPage: boolean) {
  await prepare(page);
  const measurements = await page.evaluate(measure);
  const buffer = await page.screenshot({ path: join(out, `${name}.png`), fullPage, animations: 'disabled' });
  const viewport = page.viewportSize()!;
  const network = { requests: requests.length, nonGet: requests.filter(r => r.method !== 'GET').map(r => `${r.method} ${r.url}`), withBody: requests.filter(r => r.body).map(r => r.url), offOrigin: requests.filter(r => /^https?:/.test(r.url) && new URL(r.url).origin !== origin).map(r => r.url) };
  requests = [];
  records.push({ name, width: viewport.width, height: viewport.height, fullPage, date: new Date().toISOString(), png: { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }, ...measurements, network, errorsSinceLast: errors.slice(errorMark) });
  errorMark = errors.length;
  console.log(`${name}: ${measurements.pageWidth}/${viewport.width}px, ${measurements.broken.length} broken, ${measurements.fallbackCount} fallbacks, ${buffer.readUInt32BE(16)}×${buffer.readUInt32BE(20)}`);
}
async function go(path: string, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto(base + path);
  await page.locator('h1').first().waitFor();
}
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
  if (name === 'home-desktop') await copyFile(join(out, `${name}.png`), '.impeccable/review/desktop.png');
  if (name === 'home-mobile') await copyFile(join(out, `${name}.png`), '.impeccable/review/mobile.png');
  if (name === 'home-tablet') await copyFile(join(out, `${name}.png`), '.impeccable/review/tablet.png');
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

const problems = records.filter(r => r.broken.length || r.fallbackCount || r.pageWidth > r.width || r.scrollY !== 0 || r.skipLinkOnScreen || r.fonts.status !== 'loaded' || r.network.nonGet.length || r.network.withBody.length || r.network.offOrigin.length || (r.firstRowBottom !== null && r.firstRowBottom > r.height) || (r.firstLensTop !== null && r.firstLensTop > r.height - 200)).map(r => r.name);
await writeFile(join(root, 'capture-manifest.json'), JSON.stringify({ timestamp: new Date().toISOString(), base, code, captureCount: records.length, records, forbidden, errors, hosts: [...hosts], problems }, null, 2));
await browser.close();
console.log(`${records.length} captures; problems: ${problems.length ? problems.join(', ') : 'none'}; errors: ${errors.length}; former-domain requests: ${forbidden.length}`);
if (forbidden.length || errors.length || problems.length) process.exitCode = 1;
}
main().catch(error => { console.error(error); process.exitCode = 1; });
