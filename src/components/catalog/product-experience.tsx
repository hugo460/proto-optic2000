'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { Product } from '@/data/types';
import { MediaImage } from '@/components/ui/media-image';
import { Icon } from '@/components/ui/icon';
import { resolveVariant, variantGallery, variantName } from '@/lib/variants';
import { formatXpf } from '@/lib/money';
export function ProductExperience({ product, initialVariant }: { product: Product; initialVariant?: string }) {
  const [variantId, setVariantId] = useState(initialVariant ?? '');
  const [imageIndex, setImageIndex] = useState(0);
  const variant = resolveVariant(product, variantId || null);
  const gallery = variantGallery(product, variant);
  const image = gallery[Math.min(imageIndex, gallery.length - 1)];
  const choose = (id: number) => {
    setVariantId(String(id)); setImageIndex(0);
    const url = new URL(window.location.href); url.searchParams.set('variante', String(id));
    window.history.replaceState(null, '', url.pathname + url.search);
  };
  const storeParams = new URLSearchParams({ produit: product.slug });
  if (variant) storeParams.set('variante', String(variant.id));
  const details = product.kind === 'lens' ? product.description.split('. ')[0] + '.' : variant?.description || product.shortDescription || product.description;
  return <div className="product-experience">
    <div className="product-gallery">
      <div className="product-main-image"><MediaImage media={image} alt={`${product.name}${variant ? ` — ${variantName(variant)}` : ''} — vue ${imageIndex + 1}`} sizes="(max-width: 800px) 94vw, 56vw" priority /></div>
      {gallery.length > 1 && <div className="gallery-thumbnails" role="group" aria-label="Vues du modèle">{gallery.map((photo, index) => <button type="button" key={photo.src} aria-pressed={imageIndex === index} aria-label={`Voir la vue ${index + 1}`} onClick={() => setImageIndex(index)}><MediaImage media={photo} alt="" sizes="85px" /></button>)}</div>}
      <p className="gallery-caption">Choisissez un coloris pour découvrir ses photographies.</p>
    </div>
    <div className="product-information">
      <h1>{product.name}</h1><Link className="product-brand-link" href={`/marques/${product.brandId}`}>{product.kind === 'solar' ? 'Maui Jim' : product.brandId === 'freshlook' ? 'FreshLook' : product.brandId === 'trublends' ? 'TruBlends' : 'Colourvue'}<Icon name="arrow" /></Link>
      <div className="product-price-block" aria-live="polite"><p className="detail-price">{variant ? formatXpf(variant.price) : product.minPrice === product.maxPrice ? formatXpf(product.minPrice) : `${formatXpf(product.minPrice)} – ${formatXpf(product.maxPrice)}`}</p><p className="price-note">Prix du catalogue public, à confirmer en magasin.</p></div>
      {variantId && !variant && <p className="notice">Ce coloris n’est pas reconnu. Choisissez l’un des coloris ci-dessous.</p>}
      {product.kind === 'solar' && product.variants.length > 0 ? <fieldset className="variant-picker"><legend>Choisissez votre coloris</legend><div className="variant-options">{product.variants.map(item => <button type="button" key={item.id} className="variant-option" aria-pressed={variant?.id === item.id} onClick={() => choose(item.id)}><MediaImage media={item.image} alt="" sizes="70px" /><span>{variantName(item)}</span><span className="variant-check">{variant?.id === item.id && <Icon name="check" />}</span></button>)}</div></fieldset> : product.kind === 'lens' ? <div className="product-guidance"><h2>Un choix accompagné</h2><p>Pour les coloris et les corrections adaptés à vos besoins, échangez avec nos opticiens.</p></div> : <p>Le modèle est présenté dans le coloris photographié.</p>}
      <div className="product-availability"><p>{variant?.availability.toLowerCase().includes('commande') || variant?.sourceStock.backordersAllowed ? 'Sur commande selon le catalogue public.' : 'Disponibilité à confirmer auprès du magasin.'}</p><p>Nos opticiens vous renseignent sur les coloris, les délais et les possibilités d’essai.</p></div>
      <Link className="action action-primary product-store-action" href={`/magasins?${storeParams.toString()}`}><Icon name="pin" />Se renseigner en magasin<Icon name="arrow" /></Link>
      <p className="contact-reassurance">Choisissez votre magasin pour retrouver ses coordonnées.</p>
      <div className="product-details"><details open><summary>Monture et caractéristiques<Icon name="chevron" /></summary><div>{details ? details.split('\n').map((line, i) => <p key={i}>{line}</p>) : <p>Sélectionnez un coloris pour découvrir les caractéristiques de sa monture et de ses verres.</p>}</div></details><details><summary>Préparer votre visite<Icon name="chevron" /></summary><div><p>Contactez le magasin de votre choix pour confirmer le prix et la disponibilité de cette référence avant de vous déplacer.</p><p>Aucune réservation n’est effectuée sur ce site.</p></div></details></div>
    </div>
  </div>;
}
