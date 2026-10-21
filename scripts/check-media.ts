import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { media } from '../src/data';
const nextRequire = createRequire(resolve('node_modules/next/package.json'));
const sharp = nextRequire('sharp') as (path: string) => { stats(): Promise<unknown>; metadata(): Promise<{ width: number; height: number; format: string }> };
async function main() {
  let cursor = 0;
  const errors: string[] = [];
  async function worker() {
    while (cursor < media.length) {
      const image = media[cursor++];
      try {
        const pipeline = sharp(`public${image.src}`);
        const info = await pipeline.metadata();
        await pipeline.stats();
        if (info.format !== 'webp' || Math.abs(info.width / info.height - image.width / image.height) > .015) throw new Error('Invalid format or altered proportions');
      } catch (error) { errors.push(`${image.src}: ${String(error)}`); }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  console.log(JSON.stringify({ decoded: media.length, errors }, null, 2));
  if (errors.length) process.exitCode = 1;
}
main().catch(error => { console.error(error); process.exitCode = 1; });
