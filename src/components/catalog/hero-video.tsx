'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

// Decorative close-ups of frames in a quiet passage of the home page, below the hero (provenance in docs/content-inventory.md). Local files only.
export const heroVideo = '/media/ambience/eyewear-loop.mp4';
export const heroPoster = '/media/ambience/eyewear-poster.webp';

// No playback control is offered: the film runs by itself when the browser allows it, otherwise the poster stays.
type Playback = 'waiting' | 'playing' | 'paused' | 'failed';
export type HeroVideoStatus = Playback | 'off';
interface Connection extends EventTarget { saveData?: boolean }
const reducedMotion = '(prefers-reduced-motion: reduce)';
const connection = () => (navigator as Navigator & { connection?: Connection }).connection;
function subscribe(onChange: () => void) {
  const motion = matchMedia(reducedMotion);
  const network = connection();
  motion.addEventListener('change', onChange);
  network?.addEventListener?.('change', onChange);
  return () => { motion.removeEventListener('change', onChange); network?.removeEventListener?.('change', onChange); };
}
// The film needs an explicit yes from the browser: no reduced motion, no data saving. The server render and hydration
// know neither, so they ship the poster only, with no video source.
const filmAllowed = () => !matchMedia(reducedMotion).matches && connection()?.saveData !== true;
const notYetKnown = () => false;

// Playback follows the media events, never an intention: « playing » only after the element reports it. A refused
// play() leaves the poster in place; the film plays in view on a visible tab and rests otherwise.
export function useHeroVideo() {
  const allowed = useSyncExternalStore(subscribe, filmAllowed, notYetKnown);
  const video = useRef<HTMLVideoElement>(null);
  const [playback, setPlayback] = useState<Playback>('waiting');
  const [session, setSession] = useState(allowed);
  if (session !== allowed) { setSession(allowed); setPlayback('waiting'); }
  useEffect(() => {
    const element = video.current;
    if (!allowed || !element) return;
    let live = true, started = false, inView = false, shown = document.visibilityState === 'visible', attempt = 0;
    const detach = () => { element.pause(); element.removeAttribute('src'); element.load(); };
    const fail = () => { if (!live) return; live = false; attempt++; detach(); setPlayback('failed'); };
    const refuse = (error: unknown, token: number) => {
      if (!live || token !== attempt) return;
      const name = error instanceof DOMException ? error.name : '';
      if (name === 'AbortError') return; // superseded by a pause or a new source
      if (name !== 'NotAllowedError') fail(); // autoplay refused: the poster simply stays
    };
    const run = () => {
      if (!live || !inView || !shown || !element.paused) return;
      const token = ++attempt;
      try { element.play()?.catch(error => refuse(error, token)); } catch (error) { refuse(error, token); }
    };
    const rest = () => { if (!live) return; attempt++; if (!element.paused) element.pause(); };
    const events: [string, () => void][] = [
      ['playing', () => { if (!live) return; started = true; setPlayback('playing'); }],
      ['pause', () => { if (live) setPlayback(started ? 'paused' : 'waiting'); }],
      ['ended', () => { if (live) setPlayback(started ? 'paused' : 'waiting'); }],
      ['error', fail],
    ];
    for (const [name, listener] of events) element.addEventListener(name, listener);
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; if (inView) run(); else rest(); });
    const onVisibility = () => { shown = document.visibilityState === 'visible'; if (shown) run(); else rest(); };
    document.addEventListener('visibilitychange', onVisibility);
    element.muted = true;
    element.src = heroVideo; // preload="none": nothing is fetched before the first play() in view
    // The film rests whenever its band leaves the screen.
    observer.observe(element);
    return () => {
      live = false; attempt++;
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      for (const [name, listener] of events) element.removeEventListener(name, listener);
      detach();
    };
  }, [allowed]);
  const status: HeroVideoStatus = allowed ? playback : 'off';
  return { video, status };
}

// Poster and film in their own band, outside the reading order and with no text over them. The poster stays underneath
// at all times; the film only covers it once frames are really playing (or rest on a played frame).
export function AmbientFilm() {
  const { video, status } = useHeroVideo();
  const film = status === 'playing' || status === 'paused';
  return <div className="ambient-film" aria-hidden="true">
    <div className="ambient-film-media" style={{ backgroundImage: `url(${heroPoster})` }}>
      <video ref={video} data-shown={film || undefined} muted loop playsInline preload="none" tabIndex={-1} />
    </div>
  </div>;
}
