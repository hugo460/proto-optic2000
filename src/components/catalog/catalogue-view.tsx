import Link from 'next/link';
import { brands, products, solarProducts } from '@/data';
import type { Product } from '@/data/types';
import { emptyFilters, filterProducts, parseFilters, serializeFilters, sortOptions, type Filters } from '@/lib/catalogue';
import { ProductCard } from './product-card';
import { FilterPanel } from './filter-panel';
import { Icon } from '@/components/ui/icon';
export function CatalogueView({ source, query, path }: { source: Product[]; query: Record<string, string | string[] | undefined>; path: '/solaires' | '/catalogue' }) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (typeof value === 'string') params.set(key, value);
  const { filters, invalid } = parseFilters(params, source);
  const result = filterProducts(source, filters);
  const normalizedQuery = serializeFilters(filters);
  const returnPath = path + (normalizedQuery ? `?${normalizedQuery}` : '');
  const colors = [...new Map(source.flatMap(p => p.attributes.find(a => a.key === 'attribute_pa_couleur')?.terms.map(t => [t.slug, t.name.replace(/&amp;/g, '&')] as const) ?? [])).entries()].sort((a, b) => a[1].localeCompare(b[1], 'fr'));
  const remove = (key: keyof Filters) => path + (serializeFilters({ ...filters, [key]: emptyFilters[key] }) ? `?${serializeFilters({ ...filters, [key]: emptyFilters[key] })}` : '');
  const active: [keyof Filters, string][] = [];
  if (filters.q) active.push(['q', `Recherche : ${filters.q}`]);
  if (filters.gender) active.push(['gender', filters.gender === 'femme' ? 'Femme' : 'Homme']);
  if (filters.color) active.push(['color', colors.find(c => c[0] === filters.color)?.[1] ?? filters.color]);
  if (filters.budget) active.push(['budget', ({ 'moins-30000': 'Moins de 30 000 XPF', '30000-40000': '30 000 à 40 000 XPF', 'plus-40000': 'Plus de 40 000 XPF' } as Record<string, string>)[filters.budget]]);
  if (filters.brand) active.push(['brand', brands.find(b => b.id === filters.brand)?.name ?? filters.brand]);
  return <div className="container catalogue-page">
    <div className="page-heading"><h1>{path === '/solaires' ? 'Les lunettes de soleil' : 'Tout le catalogue'}</h1><p>{path === '/solaires' ? 'Le bon modèle, le bon coloris. Découvrez les solaires Maui Jim et faites votre choix avec nos opticiens.' : 'Toutes les références de notre catalogue public, pour préparer votre échange avec nos opticiens.'}</p></div>
    <nav className="catalogue-tabs" aria-label="Collections"><Link aria-current={path === '/solaires' ? 'page' : undefined} href="/solaires">Solaires <span>{solarProducts.length}</span></Link><Link aria-current={path === '/catalogue' ? 'page' : undefined} href="/catalogue">Tout le catalogue <span>{products.length}</span></Link><Link href="/marques">Les autres marques<Icon name="arrow" /></Link></nav>
    <form className="catalogue-form" action={path} method="get" key={returnPath}>
      <div className="catalogue-search"><label htmlFor="model-search" className="sr-only">Rechercher un modèle ou un coloris</label><div className="search-input"><Icon name="search" /><input id="model-search" name="q" type="search" defaultValue={filters.q} maxLength={120} placeholder="Un modèle, un coloris…" /></div><button className="action action-dark" type="submit">Rechercher<Icon name="arrow" /></button></div>
      {filters.brand && <input type="hidden" name="marque" value={filters.brand} />}
      <FilterPanel count={active.filter(a => a[0] !== 'q').length}>
        <label>Collection<select name="genre" defaultValue={filters.gender}><option value="">Femme et homme</option><option value="femme">Femme</option><option value="homme">Homme</option></select></label>
        <label>Coloris de monture<select name="couleur" defaultValue={filters.color}><option value="">Tous les coloris</option>{colors.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}</select></label>
        <label>Budget<select name="budget" defaultValue={filters.budget}><option value="">Tous les prix</option><option value="moins-30000">Moins de 30 000 XPF</option><option value="30000-40000">30 000 à 40 000 XPF</option><option value="plus-40000">Plus de 40 000 XPF</option></select></label>
        <label>Trier par<select name="tri" defaultValue={filters.sort}>{sortOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <button type="submit" className="filter-apply">Appliquer<Icon name="check" /></button>
      </FilterPanel>
    </form>
    {invalid && <p className="notice" role="status">Un filtre n’a pas été reconnu. Il a été ignoré ; vous pouvez choisir à nouveau parmi les options proposées.</p>}
    <div className="results-toolbar"><p role="status"><strong>{result.length}</strong> {result.length > 1 ? 'modèles' : 'modèle'}</p>{active.length > 0 && <Link className="underlined" href={path}>Tout effacer</Link>}</div>
    {active.length > 0 && <div className="active-filters" aria-label="Filtres actifs">{active.map(([key, label]) => <Link key={key} href={remove(key)} aria-label={`Retirer le filtre ${label}`}>{label}<Icon name="close" /></Link>)}</div>}
    {result.length > 0 ? <div className="product-grid">{result.map(product => <ProductCard key={product.id} product={product} returnPath={returnPath} />)}</div> : <div className="empty-state"><Icon name="search" /><h2>Aucun modèle ne correspond.</h2><p>Essayez un autre nom ou retirez quelques filtres pour élargir votre sélection.</p><Link className="action action-primary" href={path}>Revoir tous les modèles<Icon name="arrow" /></Link></div>}
    <p className="catalogue-note">Prix du catalogue public, à confirmer en magasin. La présence d’un modèle ici ne garantit pas sa disponibilité.</p>
  </div>;
}
