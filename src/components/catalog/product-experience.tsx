'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Product } from '@/data/types';
import { MediaImage } from '@/components/ui/media-image';
import { Icon } from '@/components/ui/icon';
import { LensPicker } from '@/components/catalog/lens-picker';
import { variantGallery, variantName } from '@/lib/variants';
import { changeSelection, readSelection, sharesOneImage, sharesOnePrice, type SelectionParam } from '@/lib/lens-selection';
import { visitParams, withQuery } from '@/lib/contact-context';
import { formatXpf } from '@/lib/money';
import { lensFacts } from '@/data/lens-facts';
const selectionKeys = ['variante', 'couleur', 'sphere'];
export function ProductExperience({ product }: { product: Product }) {
  // The URL is the selection: direct links, reload and history all read the same validated parameters.
  const searchParams = useSearchParams();
  const selection = readSelection(product, searchParams);
  const { variant } = selection;
  const [imageIndex, setImageIndex] = useState(0);
  const gallery = variantGallery(product, variant);
  const image = gallery[Math.min(imageIndex, gallery.length - 1)];
  const isLens = product.kind === 'lens';
  const sharedImage = sharesOneImage(product);
  const change = (param: SelectionParam, value: string | null) => {
    const url = new URL(window.location.href);
    // Consecutive choices can precede the next router render: use the current URL, not the previous render's selection.
    const nextParams = changeSelection(readSelection(product, url.searchParams), param, value);
    for (const key of selectionKeys) url.searchParams.delete(key);
    for (const [key, next] of nextParams) url.searchParams.set(key, next);
    setImageIndex(0);
    window.history.replaceState(null, '', url.pathname + url.search);
  };
  const context = { selection, subject: isLens ? 'lentilles' as const : 'soleil' as const };
  const storeHref = withQuery('/magasins', visitParams({ selection }));
  const contactHref = withQuery('/contact', visitParams(context));
  // Lens packaging/renewal are facts; former stock, delay and seasonal rules stay dated reservations.
  const lens = isLens ? lensFacts[product.slug] : undefined;
  const details = isLens ? lens?.facts.join('\n') ?? '' : variant?.description || product.shortDescription || product.description;
  const price = variant ? formatXpf(variant.price) : sharesOnePrice(product) ? formatXpf(product.minPrice) : `${formatXpf(product.minPrice)} – ${formatXpf(product.maxPrice)}`;
  const priceNote = isLens && !variant && product.variants.length > 1 && sharesOnePrice(product) ? 'Même prix pour toutes les couleurs dans le catalogue public, à confirmer en magasin.' : 'Prix du catalogue public, à confirmer en magasin.';
  const imageLabel = sharedImage ? 'photographie du catalogue' : variant ? variantName(variant) : '';
  const invalidNotice = selection.rejected.length > 0 && (isLens
    ? 'Une option du lien n’existe pas pour ce modèle : elle a été ignorée. Vérifiez la couleur et la sphère ci-dessous.'
    : 'Ce coloris n’est pas reconnu. Choisissez l’un des coloris ci-dessous.');
  return <div className="product-experience">
    <div className="product-gallery">
      <div className="product-main-image"><MediaImage media={image} alt={`${product.name}${imageLabel ? ` — ${imageLabel}` : ''} — vue ${imageIndex + 1}`} sizes="(max-width: 800px) 94vw, 56vw" priority /></div>
      {/* One scrollable row of views, whatever their number; a focused view scrolls into the row by itself. The row is
          keyed by the chosen colour so a new gallery starts again from its first view. */}
      {gallery.length > 1 && <div className="gallery-rail"><div className="gallery-thumbnails" role="group" aria-label="Vues du modèle" key={variant?.id ?? 'all'}>{gallery.map((photo, index) => <button type="button" key={photo.src} aria-pressed={imageIndex === index} aria-label={`Voir la vue ${index + 1}`} onClick={() => setImageIndex(index)}><MediaImage media={photo} alt="" sizes="85px" /></button>)}</div><p className="gallery-count" aria-hidden="true">{Math.min(imageIndex, gallery.length - 1) + 1} / {gallery.length}</p></div>}
      <p className="gallery-caption">{sharedImage ? 'Photographie du catalogue public, commune à toutes les couleurs : la couleur choisie est indiquée par son nom.' : isLens ? 'Photographie du catalogue public.' : 'Choisissez un coloris pour découvrir ses photographies.'}</p>
    </div>
    <div className="product-information">
      <h1>{product.name}</h1><Link className="product-brand-link" href={`/marques/${product.brandId}`}>{product.kind === 'solar' ? 'Maui Jim' : product.brandId === 'freshlook' ? 'FreshLook' : product.brandId === 'trublends' ? 'TruBlends' : 'Colourvue'}<Icon name="arrow" /></Link>
      <div className="product-price-block" aria-live="polite"><p className="detail-price">{price}</p><p className="price-note">{priceNote}</p></div>
      {invalidNotice && <p className="notice">{invalidNotice}</p>}
      {product.kind === 'solar' && product.variants.length > 0 ? <fieldset className="variant-picker"><legend>Choisissez votre coloris</legend><div className="variant-options">{product.variants.map(item => <button type="button" key={item.id} className="variant-option" aria-pressed={variant?.id === item.id} onClick={() => change('variante', String(item.id))}><MediaImage media={item.image} alt="" sizes="70px" /><span>{variantName(item)}</span><span className="variant-check">{variant?.id === item.id && <Icon name="check" />}</span></button>)}</div></fieldset>
        : selection.options.length ? <><LensPicker selection={selection} onChange={change} /><p className="lens-guidance">Pour les couleurs et les corrections adaptées à vos besoins, échangez avec nos opticiens.</p></>
        : isLens ? <div className="product-guidance"><h2>Une seule version</h2><p>Ce produit est proposé tel quel dans le catalogue public, sans couleur ni correction à choisir.</p></div>
        : <p>Le modèle est présenté dans le coloris photographié.</p>}
      {/* The action follows the options directly; availability and its reservations stay right under it. */}
      <div className="product-actions">
        <Link className="action action-primary product-store-action" href={storeHref}><Icon name="pin" />Se renseigner en magasin<Icon name="arrow" /></Link>
        <p className="contact-reassurance">Choisissez votre magasin pour retrouver ses coordonnées.</p>
        <Link className="action action-text product-request-link" href={contactHref}>Préparer une demande au magasin<Icon name="arrow" /></Link>
      </div>
      <div className="product-availability"><p>{variant?.availability.toLowerCase().includes('commande') || variant?.sourceStock.backordersAllowed ? 'Sur commande selon le catalogue public.' : 'Disponibilité à confirmer auprès du magasin.'}</p><p>Nos opticiens vous renseignent sur les {isLens ? 'couleurs' : 'coloris'}, les délais et les possibilités d’essai.</p></div>
      <div className="product-details"><details open><summary>{isLens ? 'Caractéristiques' : 'Monture et caractéristiques'}<Icon name="chevron" /></summary><div>{details ? details.split('\n').map((line, i) => <p key={i}>{line}</p>) : !lens?.history && <p>Sélectionnez un coloris pour découvrir les caractéristiques de sa monture et de ses verres.</p>}{lens?.history && <p className="lens-history">{lens.history} Ces conditions ne sont pas confirmées aujourd’hui : renseignez-vous en magasin.</p>}</div></details><details><summary>Préparer votre visite<Icon name="chevron" /></summary><div><p>Contactez le magasin de votre choix pour confirmer le prix et la disponibilité de cette référence avant de vous déplacer.</p><p>Aucune réservation n’est effectuée sur ce site.</p></div></details></div>
    </div>
  </div>;
}
