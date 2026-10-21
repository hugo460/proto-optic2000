import { readFileSync } from 'node:fs';
const css = readFileSync('src/app/globals.css', 'utf8');
const colors = Object.fromEntries([...css.matchAll(/--color-([\w-]+):\s*(#[0-9a-f]{6})/gi)].map(m => [m[1], m[2]]));
const luminance = (hex: string) => {
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
};
const pairs = [['ink', 'paper', 4.5], ['muted', 'paper', 4.5], ['muted', 'surface', 4.5], ['ink', 'yellow', 4.5], ['ink', 'lavender', 4.5], ['lavender-ink', 'lavender', 4.5], ['lavender-ink', 'lavender-soft', 4.5], ['paper', 'ink', 4.5], ['inverse-muted', 'ink', 4.5], ['focus', 'paper', 3], ['focus', 'lavender', 3]] as const;
const results = pairs.map(([foreground, background, minimum]) => {
  const a = luminance(colors[foreground]), b = luminance(colors[background]);
  const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  return { foreground, background, ratio: Number(ratio.toFixed(2)), minimum, pass: ratio >= minimum };
});
console.log(JSON.stringify(results, null, 2));
if (results.some(r => !r.pass)) process.exitCode = 1;
