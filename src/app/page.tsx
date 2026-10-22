import { brands, getProduct } from '@/data';
import { HomeShowcase } from '@/components/catalog/home-showcase';
import { ProductCard } from '@/components/catalog/product-card';
import { BrandMarquee } from '@/components/catalog/brand-marquee';
import { ActionLink } from '@/components/ui/action-link';
import { StoreCard } from '@/components/stores/store-card';
import { stores } from '@/data/stores';
import Link from 'next/link';
import { houseLinks, universes } from '@/data/navigation';
import { Icon } from '@/components/ui/icon';
import { MediaImage } from '@/components/ui/media-image';
import { editorialMedia } from '@/data/content';
import marqueeMedia from '@/data/marquee-media.json';
import type { Media } from '@/data/types';
export default function Home() {
  const models = ['glory-glory', 'baby-beach', 'the-bird'].map(slug => getProduct(slug)!);
  const selected = ['mamane', 'alulu', 'pehu', 'liquid-sunshine'].map(slug => getProduct(slug)!);
  // Editorial selection of real logos across the universes; the directory keeps all 38 identities.
  const featuredBrands = ['maui-jim', 'ray-ban', 'oakley', 'gucci', 'persol', 'versace', 'demetz', 'vuarnet', 'michael-kors', 'julbo', 'vogue-eyewear', 'freshlook', 'celestron'].map(id => brands.find(b => b.id === id)!);
  return <>
    <HomeShowcase models={models.map(p => ({ name: p.name, slug: p.slug, image: p.images[0], price: p.minPrice, colorCount: p.attributes.find(a => a.key === 'attribute_pa_couleur')?.terms.length ?? 0 }))} />
    <BrandMarquee brands={featuredBrands.map(b => ({ id: b.id, name: b.name, logo: (marqueeMedia as Record<string, Media>)[b.id] }))} />
    <section className="section container"><div className="section-heading"><div><h2>À chaque regard,<br />sa monture.</h2><p>Des modèles Maui Jim à découvrir dans leurs vrais coloris.</p></div><ActionLink href="/solaires" variant="text">Explorer la collection</ActionLink></div><div className="product-grid home-products">{selected.map(p => <ProductCard key={p.id} product={p} />)}</div></section>
    {/* The house beyond the sun, told around the real team photo: a short list of the six universes, then the house pages. */}
    <section className="section container home-universes" aria-labelledby="home-universes-title">
      <figure className="home-universes-photo"><MediaImage media={editorialMedia.team} alt="Trois membres de l’équipe Optic 2000 Tahiti en polo sombre, devant un mur de lunettes de soleil en magasin." sizes="(max-width: 800px) 90vw, 36vw" /></figure>
      <div className="home-universes-body">
        <h2 id="home-universes-title">Bien plus<br />que le soleil.</h2>
        <p>Vue, lentilles, observation, basse vision, prothèses : nos opticiens vous accompagnent dans chaque univers.</p>
        <ul className="universe-index">{universes.map(link => <li key={link.href}><Link href={link.href}>{link.label}<Icon name="arrow" /></Link></li>)}</ul>
        <p className="universe-more">{houseLinks.map(link => <Link key={link.href} className="underlined" href={link.href}>{link.label}</Link>)}</p>
      </div>
    </section>
    <section className="home-stores"><div className="container"><div className="section-heading"><div><h2>Vos opticiens.<br />Tout près de vous.</h2><p>Trois adresses à Tahiti, le même plaisir de vous conseiller.</p></div><ActionLink href="/magasins" variant="text">Choisir mon magasin</ActionLink></div><div className="store-grid">{stores.map(store => <StoreCard key={store.slug} store={store} />)}</div></div></section>
  </>;
}
