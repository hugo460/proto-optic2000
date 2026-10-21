import type { Metadata } from 'next';
import { brands, products } from '@/data';
import { BrandTiles, ContactPrompt, ReadingSection, SourceNote } from '@/components/content/editorial';
import { ProductCard } from '@/components/catalog/product-card';
export const metadata: Metadata = { title: 'Lentilles', description: 'Lentilles de couleur avec leurs couleurs et corrections publiées, entretien et laboratoires présentés par Optic 2000 Tahiti.' };
const lensBrandOrder = ['freshlook', 'alcon', 'trublends', 'colourvue', 'acuvue', 'bausch-lomb', 'coopervision', 'lcs', 'miru'];
export default function LensesPage() {
  const lenses = products.filter(p => p.kind === 'lens');
  const lensBrands = lensBrandOrder.map(id => brands.find(b => b.id === id)!).filter(b => b.universes.includes('Lentilles'));
  return <div className="container editorial-page lenses-page">
    <div className="page-heading lenses-heading">
      <h1>Lentilles.</h1>
      <p>Les {lenses.length} lentilles de couleur présentées en ligne sont détaillées avec les couleurs et les corrections publiées. Pour les autres lentilles et l’entretien, nos opticiens vous accompagnent en magasin.</p>
      <nav className="anchor-row" aria-label="Sur cette page"><a href="#familles">Les familles</a><a href="#entretien">L’entretien</a><a href="#laboratoires">Laboratoires et marques</a></nav>
    </div>
    <section id="couleur-et-fantaisie" className="lens-products" aria-labelledby="couleur-et-fantaisie-title">
      <h2 id="couleur-et-fantaisie-title">Lentilles de couleur et fantaisie</h2>
      <div className="product-grid">{lenses.map(p => <ProductCard key={p.id} product={p} returnPath="/lentilles" />)}</div>
      <p className="catalogue-note">Prix du catalogue public, à confirmer en magasin. Sur chaque fiche, choisissez la couleur et, si elle est proposée, la correction (sphère).</p>
    </section>
    <ReadingSection id="familles" title="Les familles de lentilles">
      <h3>Lentilles de contact</h3>
      <p>Les lentilles de contact sont une alternative aux lunettes de vue. On peut les préférer pour différentes raisons : un inconfort au niveau du nez ou des oreilles, la pratique, l’esthétique… Nos opticiens vous accompagnent dans votre choix.</p>
      <h3>Lentilles de couleur et fantaisie</h3>
      <p>Les lentilles fantaisie accompagnent une tenue ou un déguisement. Les cinq références présentées en ligne en font partie.</p>
    </ReadingSection>
    <ReadingSection id="entretien" title="L’entretien">
      <p>Les produits d’entretien comptent pour l’hygiène et le confort. Des produits génériques aux produits de grandes marques, un choix vous est proposé en magasin.</p>
    </ReadingSection>
    <ReadingSection id="laboratoires" title="Laboratoires et marques">
      <p>FreshLook est une gamme du laboratoire Alcon. Les liens entre les autres gammes et laboratoires présentés restent à confirmer.</p>
    </ReadingSection>
    <BrandTiles brands={lensBrands} label="Laboratoires et marques de lentilles" relationship />
    <ContactPrompt subject="lentilles" title="Une question sur vos lentilles ?">Couleur, correction ou entretien : préparez votre demande au magasin de votre choix.</ContactPrompt>
    <SourceNote pages={['lentilles', 'lentille-couleur-et-fantaisie']}>Les délais et mentions de stock de 2022 ne sont pas repris comme conditions actuelles.</SourceNote>
  </div>;
}
