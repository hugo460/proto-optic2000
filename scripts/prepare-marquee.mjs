import { createRequire } from 'node:module';
import { realpathSync } from 'node:fs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const requireNext = createRequire(realpathSync(resolve('node_modules/next/package.json')));
const sharp = requireNext('sharp');
const brands = JSON.parse(await readFile('src/data/brands.json', 'utf8'));
const ids = ['maui-jim', 'ray-ban', 'oakley', 'gucci', 'persol', 'versace', 'demetz', 'vuarnet', 'michael-kors', 'julbo', 'vogue-eyewear', 'freshlook', 'celestron'];
await mkdir('public/media/brand-strip', { recursive: true });
const assets = {};
for (const id of ids) {
  const logo = brands.find(brand => brand.id === id).logo;
  const path = `public/media/brand-strip/${id}.webp`;
  // Remove only empty outer white/transparent canvas. Keep every part of the mark, including taglines and symbols.
  const flat = await sharp(`public${logo.src}`).flatten({ background: '#ffffff' }).toBuffer();
  const trimmed = await sharp(flat).trim({ background: '#ffffff', threshold: 1 }).toBuffer();
  const result = await sharp(trimmed).resize({ width: 640, height: 320, fit: 'inside', withoutEnlargement: true }).webp({ quality: 90 }).toFile(path);
  assets[id] = { ...logo, src: `/media/brand-strip/${id}.webp`, width: result.width, height: result.height };
  await writeFile(`${path}.json`, JSON.stringify({ prompt: `Source: ${logo.origin}; existing local rendition ${logo.src}. Only empty outer white/transparent canvas removed, threshold 1; whole mark and tagline preserved. Proportional resize inside 640x320, no enlargement, WebP quality90. Original source SHA256 ${logo.sourceSha256}.`, source: logo.origin }, null, 2) + '\n');
}
await writeFile('src/data/marquee-media.json', JSON.stringify(assets, null, 2) + '\n');
const manifest = await Promise.all(ids.map(async id => { const path = `public${assets[id].src}`; const bytes = await readFile(path); return { id, ...assets[id], bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }; }));
await writeFile('docs/marquee-media.json', JSON.stringify({ transformations: 'Empty outer white/transparent canvas removed only; whole mark including tagline retained; proportional resize inside640x320 without enlargement, WebP90. Source originals stay unchanged.', files: manifest }, null, 2) + '\n');
console.log(`${ids.length} whole-mark renditions prepared; original logos unchanged.`);
