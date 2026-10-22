'use client';
import { useEffect, useState } from 'react';
import { preload } from 'react-dom';
import { getImageProps } from 'next/image';
import type { Media } from '@/data/types';
import { MediaImage } from '@/components/ui/media-image';
import { ActionLink } from '@/components/ui/action-link';
import { formatXpf } from '@/lib/money';
import { HeroAmbience, useHeroVideo } from './hero-video';
interface Model { name: string; slug: string; image: Media; price: number; colorCount: number }
// Width of the photo on its small plateau, at every size.
const sizes = '(max-width: 600px) 132px, 196px';
export function HomeShowcase({ models }: { models: Model[] }) {
  const [index, setIndex] = useState(0);
  const model = models[index];
  const { video, status } = useHeroVideo();
  // The other frames are fetched quietly once the page is interactive, so a later choice lands on a loaded photo.
  useEffect(() => {
    for (const item of models) {
      const { props } = getImageProps({ src: item.image.src, width: item.image.width, height: item.image.height, alt: '', sizes });
      preload(props.src, { as: 'image', imageSrcSet: props.srcSet, imageSizes: props.sizes, fetchPriority: 'low' });
    }
  }, [models]);
  // Calm lavender field for the copy, the film in its own part of the hero; the three models form a short strip below the copy.
  return <section className="home-hero" aria-labelledby="hero-title">
    <HeroAmbience video={video} status={status} />
    <div className="hero-content">
      <div className="hero-heading"><h1 id="hero-title">Le soleil.<br />À votre façon.</h1><div className="hero-intro"><p>Des montures qui vous ressemblent.<br />Vos opticiens à Tahiti pour les choisir.</p><div className="hero-actions"><ActionLink href="/solaires">Toutes les solaires</ActionLink><ActionLink href="/rendez-vous" variant="text">Préparer un rendez-vous</ActionLink></div></div></div>
      <div className="showcase-stage">
        <div className="model-selector" role="group" aria-label="Choisir un modèle à découvrir">{models.map((item, i) => <button type="button" key={item.slug} aria-pressed={index === i} onClick={() => setIndex(i)}>{item.name}</button>)}</div>
        <div className="showcase-live" aria-live="polite" aria-atomic="true">
          {/* Only the photograph is keyed: it replays its short arrival on each choice while the text and link change at once. */}
          <div className="showcase-plateau"><div className="showcase-image" key={model.slug}><MediaImage media={model.image} alt={`Lunettes de soleil Maui Jim ${model.name}`} sizes={sizes} priority /></div></div>
          <div className="showcase-info"><h2>{model.name}</h2><p>Maui Jim · {model.colorCount} coloris</p><p className="showcase-price">À partir de {formatXpf(model.price)}</p><ActionLink href={`/produits/${model.slug}`} variant="text">Découvrir ce modèle</ActionLink></div>
        </div>
      </div>
    </div>
  </section>;
}
