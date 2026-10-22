'use client';
import { useEffect, useState } from 'react';
import { preload } from 'react-dom';
import { getImageProps } from 'next/image';
import type { Media } from '@/data/types';
import { MediaImage } from '@/components/ui/media-image';
import { ActionLink } from '@/components/ui/action-link';
import { formatXpf } from '@/lib/money';
interface Model { name: string; slug: string; image: Media; price: number; colorCount: number }
// Width of the frame in its section: wider than a phone screen (only the photo's white margins fall outside), the content width on a tablet, 760 px at most.
const sizes = '(max-width: 600px) 128vw, (max-width: 824px) calc(100vw - 64px), 760px';
export function HomeShowcase({ models }: { models: Model[] }) {
  const [index, setIndex] = useState(0);
  // The frame arrives only after a visitor's own choice; the first screen shows it still.
  const [picked, setPicked] = useState(false);
  const model = models[index];
  // The other frames are fetched quietly once the page is interactive, so a later choice lands on a loaded photo.
  useEffect(() => {
    for (const item of models) {
      const { props } = getImageProps({ src: item.image.src, width: item.image.width, height: item.image.height, alt: '', sizes });
      preload(props.src, { as: 'image', imageSrcSet: props.srcSet, imageSizes: props.sizes, fetchPriority: 'low' });
    }
  }, [models]);
  const choose = (i: number) => { if (i === index) return; setIndex(i); setPicked(true); };
  // A calm white section right after the hero: the real frame, then one ruled line with the caption, the three named
  // choices and the model link.
  return <section className="home-showcase container" aria-label="Trois modèles Maui Jim">
    <div className="showcase-stage">
      {/* Only the photograph is keyed: it replays its short arrival on each new choice while the caption changes at once. */}
      <div className="showcase-image" key={model.slug} data-arrive={picked || undefined}><MediaImage media={model.image} alt={`Lunettes de soleil Maui Jim ${model.name}`} sizes={sizes} priority /></div>
      <div className="showcase-bar">
        <div className="model-selector" role="group" aria-label="Choisir un modèle à découvrir">{models.map((item, i) => <button type="button" key={item.slug} aria-pressed={index === i} onClick={() => choose(i)}>{item.name}</button>)}</div>
        <div className="showcase-info showcase-live" aria-live="polite" aria-atomic="true"><h2>{model.name}</h2><p>Maui Jim · {model.colorCount} coloris</p><p className="showcase-price">À partir de {formatXpf(model.price)}</p></div>
        <ActionLink href={`/produits/${model.slug}`} variant="text" className="showcase-link">Découvrir ce modèle</ActionLink>
      </div>
    </div>
  </section>;
}
