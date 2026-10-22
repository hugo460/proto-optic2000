'use client';
import { useEffect, useState } from 'react';
import { preload } from 'react-dom';
import { getImageProps } from 'next/image';
import type { Media } from '@/data/types';
import { MediaImage } from '@/components/ui/media-image';
import { ActionLink } from '@/components/ui/action-link';
import { formatXpf } from '@/lib/money';
import { HeroAmbience, HeroVideoToggle, useHeroVideo } from './hero-video';
interface Model { name: string; slug: string; image: Media; price: number; colorCount: number }
// Width of the photo inside the frame: capped column on desktop, half of the stacked frame on tablet, full on phone.
const sizes = '(max-width: 600px) calc(100vw - 72px), (max-width: 800px) 52vw, (max-width: 1100px) 38vw, 430px';
export function HomeShowcase({ models }: { models: Model[] }) {
  const [index, setIndex] = useState(0);
  const model = models[index];
  const { video, scope, status, toggle } = useHeroVideo();
  // The other frames are fetched quietly once the page is interactive, so a later choice lands on a loaded photo.
  useEffect(() => {
    for (const item of models) {
      const { props } = getImageProps({ src: item.image.src, width: item.image.width, height: item.image.height, alt: '', sizes });
      preload(props.src, { as: 'image', imageSrcSet: props.srcSet, imageSizes: props.sizes, fetchPriority: 'low' });
    }
  }, [models]);
  return <section ref={scope} className="home-hero" aria-labelledby="hero-title">
    <HeroAmbience video={video} status={status} />
    <div className="container hero-layout">
      <div className="hero-heading"><h1 id="hero-title">Le soleil.<br />À votre façon.</h1><div className="hero-intro"><p>Des montures qui vous ressemblent.<br />Vos opticiens à Tahiti pour les choisir.</p><div className="hero-actions"><ActionLink href="/solaires">Toutes les solaires</ActionLink><ActionLink href="/rendez-vous" variant="text">Préparer un rendez-vous</ActionLink><HeroVideoToggle status={status} onToggle={toggle} /></div></div></div>
      <div className="showcase-stage">
        <div className="showcase-live" aria-live="polite" aria-atomic="true">
          {/* Only the photograph is keyed: it replays its arrival on each choice while the text and link change at once. */}
          <div className="showcase-image" key={model.slug}><MediaImage media={model.image} alt={`Lunettes de soleil Maui Jim ${model.name}`} sizes={sizes} priority /></div>
          <div className="showcase-info"><div><h2>{model.name}</h2><p>Maui Jim · {model.colorCount} coloris</p><p className="showcase-price">À partir de {formatXpf(model.price)}</p></div><ActionLink href={`/produits/${model.slug}`} variant="text">Découvrir ce modèle</ActionLink></div>
        </div>
        <div className="model-selector" role="group" aria-label="Choisir un modèle à découvrir">{models.map((item, i) => <button type="button" key={item.slug} aria-pressed={index === i} onClick={() => setIndex(i)}>{item.name}</button>)}</div>
      </div>
    </div>
  </section>;
}
