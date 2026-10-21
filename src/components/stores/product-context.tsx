import Link from 'next/link';
import { getProduct } from '@/data';
import { resolveVariant, variantName } from '@/lib/variants';
import { formatXpf } from '@/lib/money';
import { MediaImage } from '@/components/ui/media-image';
export function readProductContext(query: Record<string, string | string[] | undefined>) {
  const product = typeof query.produit === 'string' ? getProduct(query.produit) : undefined;
  const variant = product ? resolveVariant(product, typeof query.variante === 'string' ? query.variante : null) : undefined;
  const params = new URLSearchParams();
  if (product) params.set('produit', product.slug);
  if (variant) params.set('variante', String(variant.id));
  return { product, variant, query: params.toString() };
}
export function ProductContext({ context }: { context: ReturnType<typeof readProductContext> }) {
  const { product, variant } = context;
  if (!product) return null;
  return <aside className="product-context" aria-label="Le modèle qui vous intéresse"><MediaImage media={variant?.image ?? product.images[0]} alt={product.name} sizes="140px" /><div><p>Votre sélection</p><Link href={`/produits/${product.slug}${variant ? `?variante=${variant.id}` : ''}`}><strong>{product.name}</strong></Link><p>{variant ? variantName(variant) : 'Coloris à préciser avec le magasin'}</p><p>{formatXpf(variant?.price ?? product.minPrice)} · Prix à confirmer</p></div><span>Pour vous renseigner, contactez le magasin de votre choix.</span></aside>;
}
