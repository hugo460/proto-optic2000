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
  ['focus', 'paper', 3, 'focus ring'], ['focus', 'lavender', 3, 'focus ring'],
  // S2: editorial pages, contact form, menus, white brand logos
  ['ink', 'surface', 4.5, 'contact success panel, on-this-page'], ['ink', 'lavender-soft', 4.5, 'notices, simulation banner, field errors'],
  ['muted', 'lavender-soft', 4.5, 'secondary text on notices'], ['focus', 'surface', 3, 'focus ring on panels'], ['focus', 'lavender-soft', 3, 'focus ring on contact prompts'],
  ['yellow', 'black', 3, 'header and footer focus ring'], ['yellow', 'ink', 3, 'footer focus ring'], ['yellow', 'black', 4.5, 'desktop navigation hover and current page'],
  ['focus', 'lavender', 3, 'focus ring in the universe panel and mobile menu'], ['lavender-ink', 'lavender', 4.5, 'panel summaries and menu group titles'],
  ['paper', 'ink', 4.5, 'white observation logos (Bosma, Perl) on their dark tile'],
] as const;
const results = pairs.map(([foreground, background, minimum, usage]) => {
  const a = luminance(colors[foreground]), b = luminance(colors[background]);
  const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  return { foreground, background, usage, ratio: Number(ratio.toFixed(2)), minimum, pass: ratio >= minimum };
});
console.log(JSON.stringify(results, null, 2));
if (results.some(r => !r.pass)) process.exitCode = 1;
