import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { media } from '../src/data';
import marqueeMedia from '../src/data/marquee-media.json';
const nextRequire = createRequire(resolve('node_modules/next/package.json'));
const sharp = nextRequire('sharp') as (path: string) => { stats(): Promise<unknown>; metadata(): Promise<{ width: number; height: number; format: string }> };

// Technical limits of the home film: S5/r4 curates two solar shots (12–40 s, replacing the S5/r2 24–40 s window), at most 5 MB, no audio,
// H.264 with the index first (faststart); poster at most 150 KB. Sizes are decimal (1 MB = 1 000 000 bytes), the strictest reading.
const limits = { filmBytes: 5_000_000, posterBytes: 150_000, minSeconds: 12, maxSeconds: 40, maxWidth: 1920, maxFps: 30, tolerance: .05 };
const manifestPath = 'docs/hero-media.json';

// Minimal MP4 reader (ISO base media boxes): no dependency, no decoding. It reads the structure only.
interface Box { type: string; start: number; body: number; end: number }
function boxes(buffer: Buffer, from: number, to: number): Box[] {
  const found: Box[] = [];
  for (let offset = from; offset + 8 <= to;) {
    let size = buffer.readUInt32BE(offset), header = 8;
    const type = buffer.toString('latin1', offset + 4, offset + 8);
    if (size === 1) { size = Number(buffer.readBigUInt64BE(offset + 8)); header = 16; } else if (size === 0) size = to - offset;
    if (size < header || offset + size > to) throw new Error(`Corrupt box ${type} at ${offset}`);
    found.push({ type, start: offset, body: offset + header, end: offset + size });
    offset += size;
  }
  return found;
}
const child = (buffer: Buffer, parent: Box, type: string) => boxes(buffer, parent.body, parent.end).filter(box => box.type === type);
interface Track { handler: string; codec: string; width: number; height: number; seconds: number; fps: number; profile: number | null }
interface Film { seconds: number; faststart: boolean; tracks: Track[]; brands: string }
function readFilm(path: string): Film {
  const buffer = readFileSync(path);
  const top = boxes(buffer, 0, buffer.length);
  const moov = top.find(box => box.type === 'moov');
  const mdat = top.find(box => box.type === 'mdat');
  if (!moov || !mdat) throw new Error('No moov/mdat box: not a playable MP4');
  const mvhd = child(buffer, moov, 'mvhd')[0];
  const version = buffer.readUInt8(mvhd.body);
  const movieScale = buffer.readUInt32BE(mvhd.body + (version === 1 ? 20 : 12));
  const movieDuration = version === 1 ? Number(buffer.readBigUInt64BE(mvhd.body + 24)) : buffer.readUInt32BE(mvhd.body + 16);
  const tracks: Track[] = [];
  for (const trak of child(buffer, moov, 'trak')) {
    const tkhd = child(buffer, trak, 'tkhd')[0];
    const tkhdVersion = buffer.readUInt8(tkhd.body);
    const sizeAt = tkhd.body + (tkhdVersion === 1 ? 88 : 76);
    const mdia = child(buffer, trak, 'mdia')[0];
    const mdhd = child(buffer, mdia, 'mdhd')[0];
    const mdhdVersion = buffer.readUInt8(mdhd.body);
    const scale = buffer.readUInt32BE(mdhd.body + (mdhdVersion === 1 ? 20 : 12));
    const duration = mdhdVersion === 1 ? Number(buffer.readBigUInt64BE(mdhd.body + 24)) : buffer.readUInt32BE(mdhd.body + 16);
    const handler = buffer.toString('latin1', child(buffer, mdia, 'hdlr')[0].body + 8, child(buffer, mdia, 'hdlr')[0].body + 12);
    const stbl = child(buffer, child(buffer, mdia, 'minf')[0], 'stbl')[0];
    const stsd = child(buffer, stbl, 'stsd')[0];
    const entry = boxes(buffer, stsd.body + 8, stsd.end)[0];
    let samples = 0;
    const stts = child(buffer, stbl, 'stts')[0];
    for (let index = 0, count = buffer.readUInt32BE(stts.body + 4); index < count; index++) samples += buffer.readUInt32BE(stts.body + 8 + index * 8);
    let profile: number | null = null;
    if (entry.type === 'avc1') { // 78 bytes of visual sample entry, then the child boxes (avcC: version, profile_idc, ...)
      const avcC = boxes(buffer, entry.body + 78, entry.end).find(box => box.type === 'avcC');
      if (avcC) profile = buffer.readUInt8(avcC.body + 1);
    }
    const seconds = duration / scale;
    tracks.push({ handler, codec: entry.type, width: buffer.readUInt32BE(sizeAt) / 65536, height: buffer.readUInt32BE(sizeAt + 4) / 65536, seconds, fps: handler === 'vide' ? samples / seconds : 0, profile });
  }
  const ftyp = top.find(box => box.type === 'ftyp');
  return { seconds: movieDuration / movieScale, faststart: moov.start < mdat.start, tracks, brands: ftyp ? buffer.toString('latin1', ftyp.body, ftyp.body + 4) : '' };
}

const sha256 = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
interface Source { id?: number; sourceUrl?: string; author?: string | null; duration?: number; usedSourceRange?: number[]; sha256?: string }
interface Manifest { files?: { path: string; bytes: number; sha256: string }[]; sources?: Source[]; duration?: number; [key: string]: unknown }

async function hero(errors: string[]) {
  const report: Record<string, unknown> = {};
  const fail = (message: string) => errors.push(`hero: ${message}`);
  let manifest: Manifest;
  try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest; } catch (error) { fail(`${manifestPath} unreadable (${String(error)})`); return report; }
  const files = manifest.files ?? [];
  const filmEntry = files.find(file => file.path.endsWith('.mp4')), posterEntry = files.find(file => file.path.endsWith('.webp'));
  if (!filmEntry || !posterEntry) { fail(`${manifestPath} must list the film (.mp4) and the poster (.webp) under "files"`); return report; }
  // Provenance fields are read here as presence/format only: whether a source may be used on the web, whether a plan is
  // really distinct and whether the montage is good are human decisions documented in the session report, not outputs of this script.
  for (const field of ['sourcePage', 'license', 'checkedOn', 'transformations', 'usage']) if (typeof manifest[field] !== 'string' || !(manifest[field] as string).trim()) fail(`${manifestPath}: "${field}" missing or empty`);
  const sources = manifest.sources ?? [];
  if (!sources.length) for (const field of ['sourceUrl', 'author']) if (typeof manifest[field] !== 'string' || !(manifest[field] as string).trim()) fail(`${manifestPath}: "${field}" missing or empty (or list the plans under "sources")`);
  for (const source of sources) {
    const label = `${manifestPath}: source ${source.id ?? '?'}`;
    if (typeof source.sourceUrl !== 'string' || !/^https:\/\//.test(source.sourceUrl)) fail(`${label} has no https sourceUrl`);
    if (!('author' in source)) fail(`${label}: "author" key missing (null when not confirmed)`);
    if (!/^[0-9a-f]{64}$/.test(source.sha256 ?? '')) fail(`${label}: sha256 is not a SHA-256`);
    const range = source.usedSourceRange;
    if (!range || range.length !== 2 || !(range[0] >= 0 && range[1] > range[0] && range[1] <= (source.duration ?? Infinity) + .01)) fail(`${label}: usedSourceRange does not fit the source duration`);
  }
  if (new Set(sources.map(source => source.id)).size !== sources.length || new Set(sources.map(source => source.sha256)).size !== sources.length) fail('the same plan is listed twice (no repeated extract)');
  for (const [key, value] of Object.entries(manifest)) if (/sha256$/i.test(key) && typeof value === 'string' && !/^[0-9a-f]{64}$/.test(value)) fail(`${manifestPath}: ${key} is not a SHA-256`);
  for (const file of files) {
    let actual: number;
    try { actual = statSync(file.path).size; } catch { fail(`${file.path} is listed but missing`); continue; }
    if (actual !== file.bytes) fail(`${file.path}: ${actual} bytes on disk, ${file.bytes} in ${manifestPath}`);
    if (sha256(file.path) !== file.sha256) fail(`${file.path}: SHA-256 differs from ${manifestPath}`);
  }
  const filmBytes = statSync(filmEntry.path).size, posterBytes = statSync(posterEntry.path).size;
  if (filmBytes > limits.filmBytes) fail(`film is ${filmBytes} bytes (limit ${limits.filmBytes})`);
  if (posterBytes > limits.posterBytes) fail(`poster is ${posterBytes} bytes (limit ${limits.posterBytes})`);
  const film = readFilm(filmEntry.path);
  const video = film.tracks.filter(track => track.handler === 'vide');
  if (video.length !== 1) fail(`${video.length} video tracks (one expected)`);
  if (film.tracks.some(track => track.handler !== 'vide')) fail(`non-video track(s): ${film.tracks.filter(track => track.handler !== 'vide').map(track => track.handler).join(', ')} (no audio, no data)`);
  const track = video[0];
  if (film.seconds < limits.minSeconds - limits.tolerance || film.seconds > limits.maxSeconds + limits.tolerance) fail(`film lasts ${film.seconds.toFixed(2)} s (expected ${limits.minSeconds}–${limits.maxSeconds} s)`);
  if (!film.faststart) fail('moov box after mdat: not faststart');
  // The manifest states what the file is: its duration must match, and the used source ranges must at least cover it (crossfades
  // overlap, so the sum may exceed the film; a sum below it would mean the film is longer than the footage it claims).
  if (typeof manifest.duration === 'number' && Math.abs(manifest.duration - film.seconds) > limits.tolerance) fail(`manifest duration ${manifest.duration} s, file ${film.seconds.toFixed(2)} s`);
  const covered = sources.reduce((sum, source) => sum + ((source.usedSourceRange?.[1] ?? 0) - (source.usedSourceRange?.[0] ?? 0)), 0);
  if (sources.length && covered < film.seconds - limits.tolerance) fail(`used source ranges total ${covered.toFixed(2)} s for a ${film.seconds.toFixed(2)} s film: footage would be repeated`);
  if (track) {
    if (track.codec !== 'avc1') fail(`codec ${track.codec} (H.264 avc1 expected)`);
    if (track.profile !== null && ![66, 77, 88, 100].includes(track.profile)) fail(`H.264 profile_idc ${track.profile} (Baseline, Main or High expected, 4:2:0)`);
    if (track.width > limits.maxWidth) fail(`${track.width}px wide (limit ${limits.maxWidth})`);
    if (track.fps > limits.maxFps + .5) fail(`${track.fps.toFixed(1)} fps (limit ${limits.maxFps})`);
  }
  const poster = await sharp(posterEntry.path).metadata();
  if (poster.format !== 'webp') fail(`poster is ${poster.format} (webp expected)`);
  if (track && Math.abs(poster.width / poster.height - track.width / track.height) > .015) fail(`poster ${poster.width}×${poster.height} does not keep the film proportions ${track.width}×${track.height}`);
  Object.assign(report, {
    note: 'Technical limits and consistency with docs/hero-media.json only. Usage rights, provenance, absence of faces and the aesthetic quality of the loop are NOT established by this check.',
    film: { path: filmEntry.path, bytes: filmBytes, seconds: Number(film.seconds.toFixed(2)), faststart: film.faststart, brand: film.brands, video: track && { codec: track.codec, profile: track.profile, width: track.width, height: track.height, fps: Number(track.fps.toFixed(2)) }, audioTracks: film.tracks.filter(item => item.handler === 'soun').length },
    poster: { path: posterEntry.path, bytes: posterBytes, width: poster.width, height: poster.height },
    sources: { plans: sources.length, usedSeconds: Number(covered.toFixed(2)) },
    limits: { filmMB: limits.filmBytes / 1e6, posterKB: limits.posterBytes / 1e3, seconds: [limits.minSeconds, limits.maxSeconds] },
  });
  return report;
}

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
  const marqueeManifest = JSON.parse(readFileSync('docs/marquee-media.json', 'utf8')) as { files: { id: string; src: string; width: number; height: number; bytes: number; sha256: string }[] };
  const marqueeEntries = Object.entries(marqueeMedia);
  if (marqueeManifest.files.length !== marqueeEntries.length) errors.push('marquee: manifest and rendition counts differ');
  for (const [id, image] of marqueeEntries) {
    const path = `public${image.src}`;
    try {
      const pipeline = sharp(path);
      const info = await pipeline.metadata();
      await pipeline.stats();
      const entry = marqueeManifest.files.find(file => file.id === id);
      if (info.format !== 'webp' || info.width !== image.width || info.height !== image.height) throw new Error('Invalid format or dimensions');
      if (!entry || entry.src !== image.src || entry.width !== info.width || entry.height !== info.height || entry.bytes !== statSync(path).size || entry.sha256 !== sha256(path)) throw new Error('Manifest differs from the delivered rendition');
      if (!image.origin || !/^[0-9a-f]{64}$/.test(image.sourceSha256)) throw new Error('Source provenance missing');
    } catch (error) { errors.push(`marquee ${id}: ${String(error)}`); }
  }
  const heroReport = await hero(errors).catch(error => { errors.push(`hero: ${String(error)}`); return {}; });
  console.log(JSON.stringify({ decoded: media.length, marqueeRenditions: marqueeEntries.length, hero: heroReport, errors }, null, 2));
  if (errors.length) process.exitCode = 1;
}
main().catch(error => { console.error(error); process.exitCode = 1; });
