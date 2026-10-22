import { readFileSync } from 'node:fs';
const css = readFileSync('src/app/globals.css', 'utf8');
const hex = (value: string) => value.length === 4 ? `#${[...value.slice(1)].map(c => c + c).join('')}` : value;
const colors: Record<string, string> = Object.fromEntries([...css.matchAll(/--color-([\w-]+):\s*(#[0-9a-f]{6}|#[0-9a-f]{3})\b/gi)].map(m => [m[1], hex(m[2])]));
// The header and the menu focus ring sit on a literal black, not on a token.
if (!/\.site-header\s*\{[^}]*background:\s*#000000/.test(css)) throw new Error('Header background is no longer #000000: update the pair below.');
colors.black = '#000000';
const luminance = (value: string) => {
  const rgb = [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
};
// [foreground, background, minimum, usage]. Text needs 4.5, focus rings and graphics 3.
// Every listed pair is required: missing tokens or unreadable selectors fail the check.
const pairs = [
  // S1
  ['ink', 'paper', 4.5, 'body text'], ['muted', 'paper', 4.5, 'secondary text'], ['muted', 'surface', 4.5, 'secondary text on cards'],
  ['ink', 'yellow', 4.5, 'primary action'], ['ink', 'lavender', 4.5, 'lavender bands'], ['lavender-ink', 'lavender', 4.5, 'text on lavender'],
  ['lavender-ink', 'lavender-soft', 4.5, 'text on soft lavender'], ['paper', 'ink', 4.5, 'inverse text'], ['inverse-muted', 'ink', 4.5, 'inverse secondary text'],
  ['focus', 'paper', 3, 'focus ring (body, desktop panel and mobile menu are paper)'], ['focus', 'lavender', 3, 'focus ring on lavender'],
  // S2: editorial pages, contact form, menus, white brand logos
  ['ink', 'surface', 4.5, 'contact success panel, on-this-page'], ['ink', 'lavender-soft', 4.5, 'notices, simulation banner, field errors'],
  ['muted', 'lavender-soft', 4.5, 'secondary text on notices'], ['focus', 'surface', 3, 'focus ring on panels'], ['focus', 'lavender-soft', 3, 'focus ring on contact prompts'],
  ['yellow', 'black', 3, 'header and footer focus ring'], ['yellow', 'ink', 3, 'footer focus ring'], ['yellow', 'black', 4.5, 'desktop navigation hover and current page'],
  ['paper', 'ink', 4.5, 'white observation logos (Bosma, Perl) on their dark tile'],
] as const;
// Pairs read from the stylesheet: a missing required solid rule fails rather than silently skipping it.
// S5/r4: the secondary showcase stays on paper, separate from the immersive film. White text/navigation on moving imagery
// cannot be measured against the hero's solid fallback: the local contrast protection and both real shots are reviewed in
// rendered captures. This script measures the solid UI fields only; it does not certify text contrast on a photograph.
const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');
function declared(selector: string, property: 'color' | 'background'): string {
  const name = property === 'color' ? '(?<![-\\w])color' : '(?<![-\\w])background(?:-color)?';
  for (const rule of rules.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!rule[1].split(/,(?![^()]*\))/).some(item => item.trim().replace(/\s+/g, ' ') === selector)) continue;
    const value = rule[2].match(new RegExp(`(?:^|[;\\s])${name}:\\s*([^;]+)`))?.[1]?.trim();
    if (!value) continue;
    const token = value.match(/var\(--color-([\w-]+)\)/)?.[1];
    if (token) return token;
    const literal = value.match(/#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/i)?.[0];
    if (literal) { colors[`literal${hex(literal)}`] = hex(literal); return `literal${hex(literal)}`; }
  }
  throw new Error(`No rule sets ${property} on "${selector}": update scripts/check-contrast.ts to the new selector.`);
}
const required = (usage: string, build: () => [string, string, number]): [string, string, number, string] => [...build(), usage];
const bodyColor = declared('body', 'color'), bodyBackground = declared('body', 'background');
const showcaseBackground = bodyBackground, panelBackground = declared('.universe-panel', 'background'), menuBackground = declared('.mobile-navigation', 'background');
const derived = [
  [declared('.model-selector button', 'color'), showcaseBackground, 4.5, 'showcase: inactive model choice'],
  [declared('.model-selector button[aria-pressed=true]', 'color'), showcaseBackground, 4.5, 'showcase: selected model choice'],
  [declared('.model-selector button::after', 'background'), showcaseBackground, 3, 'showcase: selection marker (graphic)'],
  [declared('.showcase-info p', 'color'), showcaseBackground, 4.5, 'showcase: model line (maker, colours)'],
  [declared('.showcase-info .showcase-price', 'color'), showcaseBackground, 4.5, 'showcase: price'],
  ['focus', showcaseBackground, 3, 'showcase: focus ring on paper'],
  [declared('.universe-panel', 'color'), panelBackground, 4.5, 'desktop panel: links'],
  [declared('.universe-panel h2', 'color'), panelBackground, 4.5, 'desktop panel: group titles'],
  [declared('.desktop-nav .universe-panel a[aria-current]', 'color'), declared('.desktop-nav .universe-panel a[aria-current]', 'background'), 4.5, 'desktop panel: current page'],
  [declared('.desktop-nav .universe-panel a:hover', 'color'), declared('.desktop-nav .universe-panel a:hover', 'background'), 4.5, 'desktop panel: hovered row'],
  [declared('.mobile-navigation', 'color'), menuBackground, 4.5, 'mobile menu: links'],
  [declared('.mobile-group h3', 'color'), menuBackground, 4.5, 'mobile menu: group titles'],
  [declared('.mobile-navigation', 'color'), declared('.mobile-navigation nav a.mobile-cta', 'background'), 4.5, 'mobile menu: yellow appointment action'],
  [declared('.site-footer', 'color'), declared('.site-footer', 'background'), 4.5, 'footer: links and store names'],
  [declared(':is(.footer-stores, .footer-links) h2', 'color'), declared('.site-footer', 'background'), 4.5, 'footer: group titles'],
  [declared('.footer-stores li', 'color'), declared('.site-footer', 'background'), 4.5, 'footer: addresses'],
  [declared('.footer-bottom', 'color'), declared('.site-footer', 'background'), 4.5, 'footer: notes'],
  // Catalogue and product page: controls and notes read from their own rules, on the field they declare (or on the body field).
  required('catalogue: active filter chip', () => [bodyColor, declared('.active-filters a', 'background'), 4.5]),
  required('catalogue and product: notice', () => [bodyColor, declared('.notice', 'background'), 4.5]),
  required('product: colour option', () => [bodyColor, declared('.variant-option', 'background'), 4.5]),
  required('product: selected colour option', () => [bodyColor, declared('.variant-option[aria-pressed=true]', 'background'), 4.5]),
  required('product: thumbnail button', () => [bodyColor, declared('.gallery-thumbnails button', 'background'), 4.5]),
  required('product: price note', () => [declared('.price-note', 'color'), bodyBackground, 4.5]),
  required('product: gallery caption', () => [declared('.gallery-caption', 'color'), bodyBackground, 4.5]),
  required('catalogue: search field', () => [bodyColor, declared('.search-input', 'background'), 4.5]),
] as unknown as [string, string, number, string][];
const results = [...pairs, ...derived].map(([foreground, background, minimum, usage]) => {
  if (!colors[foreground] || !colors[background]) throw new Error(`${usage}: missing colour token (${foreground}, ${background})`);
  const a = luminance(colors[foreground]), b = luminance(colors[background]);
  const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  return { foreground, background, usage, ratio: Number(ratio.toFixed(2)), minimum, pass: ratio >= minimum };
});
console.log(JSON.stringify(results, null, 2));
if (results.some(r => !r.pass)) process.exitCode = 1;
