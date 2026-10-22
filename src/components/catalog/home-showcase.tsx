'use client';
import { useEffect, useState } from 'react';
import { preload } from 'react-dom';
import { getImageProps } from 'next/image';
import type { Media } from '@/data/types';
import { MediaImage } from '@/components/ui/media-image';
import { ActionLink } from '@/components/ui/action-link';
import { formatXpf } from '@/lib/money';
interface Model { name: string; slug: string; image: Media; price: number; colorCount: number }
const sizes = '(max-width: 700px) 90vw, 60vw';
export function HomeShowcase({ models }: { models: Model[] }) {
  const [index, setIndex] = useState(0);
  const model = models[index];
  // The other frames are fetched quietly once the page is interactive, so a later choice lands on a loaded photo.
  useEffect(() => {
    for (const item of models) {
      const { props } = getImageProps({ src: item.image.src, width: item.image.width, height: item.image.height, alt: '', sizes });
      preload(props.src, { as: 'image', imageSrcSet: props.srcSet, imageSizes: props.sizes, fetchPriority: 'low' });
    }
  }, [models]);
  return <section className="home-hero" aria-labelledby="hero-title"><div className="container">
    <div className="hero-heading"><h1 id="hero-title">Le soleil.<br />À votre façon.</h1><div className="hero-intro"><p>Des montures qui vous ressemblent.<br />Vos opticiens à Tahiti pour les choisir.</p><ActionLink href="/rendez-vous" variant="text">Préparer un rendez-vous</ActionLink></div></div>
    <div className="showcase-stage" aria-live="polite" aria-atomic="true">
      {/* Only the photograph is keyed: it replays its arrival on each choice while the text and link change at once. */}
      <div className="showcase-image" key={model.slug}><MediaImage media={model.image} alt={`Lunettes de soleil Maui Jim ${model.name}`} sizes={sizes} priority /></div>
      <div className="showcase-info"><h2>{model.name}</h2><p>Maui Jim · {model.colorCount} coloris</p><p className="showcase-price">À partir de {formatXpf(model.price)}</p><ActionLink href={`/produits/${model.slug}`}>Découvrir ce modèle</ActionLink></div>
    </div>
    <div className="showcase-bottom"><div className="model-selector" role="group" aria-label="Choisir un modèle à découvrir">{models.map((item, i) => <button type="button" key={item.slug} aria-pressed={index === i} onClick={() => setIndex(i)}>{item.name}</button>)}</div><ActionLink href="/solaires" variant="text">Toutes les solaires</ActionLink></div>
  </div></section>;
}
