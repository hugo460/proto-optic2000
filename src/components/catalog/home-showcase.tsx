'use client';
import { useState } from 'react';
import type { Media } from '@/data/types';
import { MediaImage } from '@/components/ui/media-image';
import { ActionLink } from '@/components/ui/action-link';
import { formatXpf } from '@/lib/money';
interface Model { name: string; slug: string; image: Media; price: number; colorCount: number }
export function HomeShowcase({ models }: { models: Model[] }) {
  const [index, setIndex] = useState(0);
  const model = models[index];
  return <section className="home-hero" aria-labelledby="hero-title"><div className="container">
    <div className="hero-heading"><h1 id="hero-title">Le soleil.<br />À votre façon.</h1><div className="hero-intro"><p>Des montures qui vous ressemblent.<br />Vos opticiens à Tahiti pour les choisir.</p><ActionLink href="/magasins" variant="text">Rencontrer nos opticiens</ActionLink></div></div>
    <div className="showcase-stage" aria-live="polite" aria-atomic="true">
      <div className="showcase-image" key={model.slug}><MediaImage media={model.image} alt={`Lunettes de soleil Maui Jim ${model.name}`} sizes="(max-width: 700px) 90vw, 60vw" priority /></div>
      <div className="showcase-info"><h2>{model.name}</h2><p>Maui Jim · {model.colorCount} coloris</p><p className="showcase-price">À partir de {formatXpf(model.price)}</p><ActionLink href={`/produits/${model.slug}`}>Découvrir ce modèle</ActionLink></div>
    </div>
    <div className="showcase-bottom"><div className="model-selector" role="group" aria-label="Choisir un modèle à découvrir">{models.map((item, i) => <button type="button" key={item.slug} aria-pressed={index === i} onClick={() => setIndex(i)}>{item.name}</button>)}</div><ActionLink href="/solaires" variant="text">Toutes les solaires</ActionLink></div>
  </div></section>;
}
