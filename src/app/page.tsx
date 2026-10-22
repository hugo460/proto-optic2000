import { brands, getProduct } from '@/data';
import { HomeShowcase } from '@/components/catalog/home-showcase';
import { AmbientFilm } from '@/components/catalog/hero-video';
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
    {/* Hero: the real film fills the first screen from its very top, under the light home bar. Title, short text and
        actions read first and sit low on the left, in the same picture. */}
    <section className="home-hero" aria-labelledby="hero-title">
      <div className="hero-content">
        <div className="hero-heading"><h1 id="hero-title">Le soleil,<br />autrement.</h1><div className="hero-intro"><p>Des montures qui vous ressemblent. Vos opticiens à Tahiti pour les choisir.</p><div className="hero-actions"><ActionLink href="/solaires">Toutes les solaires</ActionLink><ActionLink href="/rendez-vous" variant="text">Préparer un rendez-vous</ActionLink></div></div></div>
        <AmbientFilm />
      </div>
    </section>
    <HomeShowcase models={models.map(p => ({ name: p.name, slug: p.slug, image: p.images[0], price: p.minPrice, colorCount: p.attributes.find(a => a.key === 'attribute_pa_couleur')?.terms.length ?? 0 }))} />
    <BrandMarquee brands={featuredBrands.map(b => ({ id: b.id, name: b.name, logo: (marqueeMedia as Record<string, Media>)[b.id] }))} />
    {/* Editorial selection: Mamane at full scale on the left, the three others as compact ruled rows on the right
        (two plain columns on a phone). Same shared card, only its photo width changes. */}
    <section className="section container home-selection" aria-labelledby="home-selection-title">
      <div className="section-heading"><h2 id="home-selection-title">À chaque regard,<br />sa monture.</h2><p>Des modèles Maui Jim à découvrir dans leurs vrais coloris.</p><ActionLink href="/solaires" variant="text">Explorer la collection</ActionLink></div>
      <div className="home-products">{selected.map((p, i) => <ProductCard key={p.id} product={p} sizes={i === 0 ? '(max-width: 800px) 46vw, (max-width: 1100px) 54vw, 720px' : '(max-width: 800px) 46vw, (max-width: 1100px) 20vw, 260px'} />)}</div>
    </section>
    {/* The house beyond the sun: a large ruled index of the six universes with their one-line summary, beside the real team photo. */}
    <section className="home-universes" aria-labelledby="home-universes-title"><div className="container home-universes-inner">
      <div className="home-universes-body">
        <h2 id="home-universes-title">Bien plus<br />que le soleil.</h2>
        <p>Vue, lentilles, observation, basse vision, prothèses : nos opticiens vous accompagnent dans chaque univers.</p>
      </div>
      <ul className="universe-index">{universes.map(link => <li key={link.href}><Link href={link.href}><span className="universe-label">{link.label}</span>{' '}<span className="universe-summary">{link.summary}</span><Icon name="arrow" /></Link></li>)}</ul>
      <figure className="home-universes-photo"><MediaImage media={editorialMedia.team} alt="Trois membres de l’équipe Optic 2000 Tahiti en polo sombre, devant un mur de lunettes de soleil en magasin." sizes="(max-width: 800px) 90vw, 34vw" /></figure>
      <p className="universe-more">{houseLinks.map(link => <Link key={link.href} className="underlined" href={link.href}>{link.label}</Link>)}</p>
    </div></section>
    {/* The three stores as editorial rows on a desk (photo, name, address and hours, actions), photographic blocks on a phone. */}
    <section className="section container home-stores" aria-labelledby="home-stores-title">
      <div className="section-heading"><h2 id="home-stores-title">Vos opticiens.<br />Tout près de vous.</h2><p>Trois adresses à Tahiti, le même plaisir de vous conseiller.</p><ActionLink href="/magasins" variant="text">Choisir mon magasin</ActionLink></div>
      <div className="store-grid">{stores.map(store => <StoreCard key={store.slug} store={store} />)}</div>
    </section>
  </>;
}
