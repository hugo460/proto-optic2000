import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProduct, products } from '@/data';
import { safeReturnPath } from '@/lib/catalogue';
import { ProductExperience } from '@/components/catalog/product-experience';
import { ProductCard } from '@/components/catalog/product-card';
import { Icon } from '@/components/ui/icon';
export const dynamicParams = false;
export function generateStaticParams() { return products.map(item => ({ slug: item.slug })); }
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = getProduct((await params).slug);
  return { title: product ? product.name : 'Modèle introuvable' };
}
export default async function ProductPage({ params, searchParams }: Props) {
  const product = getProduct((await params).slug);
  if (!product) notFound();
  const query = await searchParams;
  const returnPath = safeReturnPath(typeof query.retour === 'string' ? query.retour : product.kind === 'lens' ? '/catalogue' : null);
  // Related products stay in the same family: frames with frames, lenses with lenses.
  const related = products.filter(p => p.kind === product.kind && p.id !== product.id).slice(0, 4);
  const familyLink = product.kind === 'lens' ? { href: '/lentilles', label: 'Toutes les lentilles' } : { href: '/solaires', label: 'Toutes les solaires' };
  return <div className="container product-page"><Link className="back-link" href={returnPath}><Icon name="back" />Retour aux résultats</Link><ProductExperience key={product.slug} product={product} />
    <section className="section related-products"><div className="section-heading"><h2>{product.kind === 'lens' ? 'D’autres lentilles.' : 'Un autre regard.'}</h2><Link className="underlined" href={familyLink.href}>{familyLink.label}</Link></div><div className="product-grid">{related.map(p => <ProductCard key={p.id} product={p} />)}</div></section>
  </div>;
}
