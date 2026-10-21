import { brands, getProduct } from '@/data';
import { HomeShowcase } from '@/components/catalog/home-showcase';
import { ProductCard } from '@/components/catalog/product-card';
import { ActionLink } from '@/components/ui/action-link';
import { MediaImage } from '@/components/ui/media-image';
import { StoreCard } from '@/components/stores/store-card';
import { stores } from '@/data/stores';
import Link from 'next/link';
export default function Home() {
  const models = ['glory-glory', 'baby-beach', 'the-bird'].map(slug => getProduct(slug)!);
  const selected = ['glory-glory', 'baby-beach', 'mamane', 'alulu'].map(slug => getProduct(slug)!);
  const featuredBrands = ['maui-jim', 'ray-ban', 'oakley', 'gucci', 'longchamp'].map(id => brands.find(b => b.id === id)!);
  return <>
    <HomeShowcase models={models.map(p => ({ name: p.name, slug: p.slug, image: p.images[0], price: p.minPrice, colorCount: p.attributes.find(a => a.key === 'attribute_pa_couleur')?.terms.length ?? 0 }))} />
    <section className="brand-strip container" aria-label="Quelques-unes de nos marques">{featuredBrands.map(b => <Link href={`/marques/${b.id}`} key={b.id} aria-label={`Découvrir ${b.name}`}>{b.logo && <MediaImage media={b.logo} alt={b.name} sizes="(max-width: 600px) 28vw, 16vw" />}</Link>)}<ActionLink href="/marques" variant="text">Toutes les marques</ActionLink></section>
    <section className="section container"><div className="section-heading"><div><h2>À chaque regard,<br />sa monture.</h2><p>Des modèles Maui Jim à découvrir dans leurs vrais coloris.</p></div><ActionLink href="/solaires" variant="text">Explorer la collection</ActionLink></div><div className="product-grid home-products">{selected.map(p => <ProductCard key={p.id} product={p} />)}</div></section>
    <section className="home-stores"><div className="container"><div className="section-heading"><div><h2>Vos opticiens.<br />Tout près de vous.</h2><p>Trois adresses à Tahiti, le même plaisir de vous conseiller.</p></div><ActionLink href="/magasins" variant="text">Choisir mon magasin</ActionLink></div><div className="store-grid">{stores.map(store => <StoreCard key={store.slug} store={store} />)}</div></div></section>
  </>;
}
