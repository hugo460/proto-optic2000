import Link from 'next/link';
import { getBrand } from '@/data';
import type { Product } from '@/data/types';
import { formatXpf } from '@/lib/money';
import { MediaImage } from '@/components/ui/media-image';
import { Icon } from '@/components/ui/icon';
export function ProductCard({ product, returnPath }: { product: Product; returnPath?: string }) {
  const count = product.attributes.find(a => a.key === 'attribute_pa_couleur')?.terms.length ?? 0;
  const resultsPath = returnPath ?? (product.kind === 'lens' ? '/lentilles' : '/solaires');
  return <article className="product-card"><Link href={`/produits/${product.slug}?retour=${encodeURIComponent(resultsPath)}`}>
    <div className="product-card-image"><MediaImage media={product.images[0]} alt={`${product.name}, ${product.kind === 'lens' ? 'lentilles' : 'monture'} ${getBrand(product.brandId)?.name ?? ''}`} sizes="(max-width: 600px) 46vw, (max-width: 1000px) 30vw, 23vw" /></div>
    <div className="product-card-heading"><h3>{product.name}</h3><Icon name="arrow" /></div>
    <p className="product-brand">{getBrand(product.brandId)?.name}{count > 0 && <span> · {count} coloris</span>}</p>
    <p className="product-price">{product.minPrice !== product.maxPrice && <span>À partir de </span>}{formatXpf(product.minPrice)}</p>
  </Link></article>;
}
