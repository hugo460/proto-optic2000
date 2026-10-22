import { readFileSync } from 'node:fs';
const css = readFileSync('src/app/globals.css', 'utf8');
const colors: Record<string, string> = Object.fromEntries([...css.matchAll(/--color-([\w-]+):\s*(#[0-9a-f]{6})/gi)].map(m => [m[1], m[2]]));
// The header and the menu focus ring sit on a literal black, not on a token.
if (!/\.site-header\s*\{[^}]*background:\s*#000000/.test(css)) throw new Error('Header background is no longer #000000: update the pair below.');
colors.black = '#000000';
const luminance = (hex: string) => {
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
};
// [foreground, background, minimum, usage]. Text needs 4.5, focus rings and graphics 3.
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
// S5/r2: pairs read from the stylesheet itself, so a change of token on the home hero, the desktop panel, the mobile menu or the
// footer is measured instead of assumed. Each entry names the rule that sets the foreground and the one that sets the background;
// a missing rule stops the check (update the selector here) rather than silently skipping the pair.
const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');
function declared(selector: string, property: 'color' | 'background'): string {
  for (const rule of rules.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!rule[1].split(/,(?![^()]*\))/).some(item => item.trim().replace(/\s+/g, ' ') === selector)) continue;
    const value = rule[2].match(new RegExp(`(?:^|[;\\s])${property}:\\s*([^;]+)`))?.[1]?.trim();
    if (!value) continue;
    const token = value.match(/var\(--color-([\w-]+)\)/)?.[1];
    if (token) return token;
    const literal = value.match(/#[0-9a-f]{6}\b/i)?.[0];
    if (literal) { colors[`literal${literal}`] = literal; return `literal${literal}`; }
  }
  throw new Error(`No rule sets ${property} on "${selector}": update scripts/check-contrast.ts to the new selector.`);
}
const heroBackground = declared('.home-hero', 'background'), panelBackground = declared('.universe-panel', 'background'), menuBackground = declared('.mobile-navigation', 'background');
const derived = [
  [declared('.model-selector button', 'color'), heroBackground, 4.5, 'hero: inactive model choice'],
  [declared('.model-selector button[aria-pressed=true]', 'color'), heroBackground, 4.5, 'hero: selected model choice'],
  [declared('.model-selector button::after', 'background'), heroBackground, 3, 'hero: selection marker (graphic)'],
  [declared('.showcase-info p', 'color'), heroBackground, 4.5, 'hero: model line (maker, colours)'],
  [declared('.showcase-info .showcase-price', 'color'), heroBackground, 4.5, 'hero: price'],
  ['focus', heroBackground, 3, 'hero: focus ring on the lavender field'],
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
] as unknown as [string, string, number, string][];
const results = [...pairs, ...derived].map(([foreground, background, minimum, usage]) => {
  const a = luminance(colors[foreground]), b = luminance(colors[background]);
  const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  return { foreground, background, usage, ratio: Number(ratio.toFixed(2)), minimum, pass: ratio >= minimum };
});
console.log(JSON.stringify(results, null, 2));
if (results.some(r => !r.pass)) process.exitCode = 1;
