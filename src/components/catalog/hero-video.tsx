'use client';
import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { Icon } from '@/components/ui/icon';

// Decorative close-ups of frames behind the home hero (provenance in docs/content-inventory.md). Local files only.
export const heroVideo = '/media/ambience/eyewear-loop.mp4';
export const heroPoster = '/media/ambience/eyewear-poster.webp';

// stopped: never started here (autoplay refused or the visitor's pause kept), a manual start is possible.
type Playback = 'waiting' | 'stopped' | 'playing' | 'paused' | 'failed';
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

// Playback follows the media events, never an intention: « playing » only after the element reports it. A rejected
// play() is not playback; a pause chosen by the visitor survives scrolling away, hidden tabs and preference changes.
export function useHeroVideo() {
  const allowed = useSyncExternalStore(subscribe, filmAllowed, notYetKnown);
  const video = useRef<HTMLVideoElement>(null);
  const scope = useRef<HTMLElement>(null);
  const held = useRef(false);
  const control = useRef<(() => void) | null>(null);
  const [playback, setPlayback] = useState<Playback>('waiting');
  const [session, setSession] = useState(allowed);
  if (session !== allowed) { setSession(allowed); setPlayback('waiting'); }
  useEffect(() => {
    const element = video.current, hero = scope.current;
    if (!allowed || !element || !hero) return;
    let live = true, started = false, inView = false, shown = document.visibilityState === 'visible', attempt = 0;
    const detach = () => { element.pause(); element.removeAttribute('src'); element.load(); };
    const fail = () => { if (!live) return; live = false; attempt++; detach(); setPlayback('failed'); };
    const refuse = (error: unknown, token: number) => {
      if (!live || token !== attempt) return;
      const name = error instanceof DOMException ? error.name : '';
      if (name === 'AbortError') return; // superseded by a pause or a new source
      if (name === 'NotAllowedError') setPlayback(started ? 'paused' : 'stopped');
      else fail();
    };
    const run = () => {
      if (!live || !inView || !shown || !element.paused) return;
      if (held.current) { setPlayback(current => current === 'waiting' ? 'stopped' : current); return; }
      const token = ++attempt;
      try { element.play()?.catch(error => refuse(error, token)); } catch (error) { refuse(error, token); }
    };
    const rest = () => { if (!live) return; attempt++; if (!element.paused) element.pause(); };
    const events: [string, () => void][] = [
      ['playing', () => { if (!live) return; started = true; setPlayback('playing'); }],
      ['pause', () => { if (live) setPlayback(current => started ? 'paused' : current === 'stopped' ? 'stopped' : 'waiting'); }],
      ['ended', () => { if (live) setPlayback(started ? 'paused' : 'waiting'); }],
      ['error', fail],
    ];
    for (const [name, listener] of events) element.addEventListener(name, listener);
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; if (inView) run(); else rest(); });
    const onVisibility = () => { shown = document.visibilityState === 'visible'; if (shown) run(); else rest(); };
    document.addEventListener('visibilitychange', onVisibility);
    control.current = () => {
      if (!live) return;
      if (element.paused) { held.current = false; run(); } else { held.current = true; rest(); }
    };
    element.muted = true;
    element.src = heroVideo; // preload="none": nothing is fetched before the first play() in view
    observer.observe(hero);
    return () => {
      live = false; attempt++; control.current = null;
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      for (const [name, listener] of events) element.removeEventListener(name, listener);
      detach();
    };
  }, [allowed]);
  const status: HeroVideoStatus = allowed ? playback : 'off';
  return { video, scope, status, toggle: () => control.current?.() };
}

// Poster and film under a lavender veil, outside the reading order. The poster stays underneath at all times.
export function HeroAmbience({ video, status }: { video: RefObject<HTMLVideoElement | null>; status: HeroVideoStatus }) {
  const film = status === 'playing' || status === 'paused';
  return <div className="hero-ambience" aria-hidden="true">
    <div className="hero-ambience-media" style={{ backgroundImage: `url(${heroPoster})` }}>
      <video ref={video} data-shown={film || undefined} muted loop playsInline preload="none" tabIndex={-1} />
    </div>
  </div>;
}

// Offered only when there is a real choice: pause a film that plays, or start one that is paused or not started.
export function HeroVideoToggle({ status, onToggle }: { status: HeroVideoStatus; onToggle: () => void }) {
  const playing = status === 'playing';
  const available = playing || status === 'paused' || status === 'stopped';
  return <button type="button" className="hero-video-toggle" hidden={!available} onClick={onToggle}>
    <Icon name={playing ? 'pause' : 'play'} /><span className="hero-video-label">{playing ? 'Pause vidéo' : 'Lire la vidéo'}</span><span className="sr-only"> d’ambiance</span>
  </button>;
}
