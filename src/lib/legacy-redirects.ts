import catalogue from '../data/catalogue.json';
// Former optic2000tahiti.com paths mapped to their canonical prototype route. Every source is an
// exact path (no catch-all): unknown paths, including /produit/<unknown>, stay real 404s.
// Temporary (307) because the client domain is not switched by this prototype.
export interface LegacyRedirect { source: string; destination: string }
const productSlugs = (catalogue as { slug: string }[]).map(p => p.slug);
export const legacyRedirects: LegacyRedirect[] = [
  { source: '/maui-jim-pour-femmes', destination: '/solaires?genre=femme' },
  { source: '/maui-jim-pour-hommes', destination: '/solaires?genre=homme' },
  { source: '/boutique', destination: '/catalogue' },
  { source: '/boutique-en-ligne', destination: '/catalogue' },
  { source: '/nos-magasins', destination: '/magasins' },
  { source: '/centre-ville', destination: '/magasins/centre-ville' },
  { source: '/mamao', destination: '/magasins/mamao' },
  { source: '/taravao', destination: '/magasins/taravao' },
  { source: '/lunettes-de-soleil', destination: '/solaires' },
  { source: '/lentille-couleur-et-fantaisie', destination: '/lentilles#couleur-et-fantaisie' },
  { source: '/protheses-occulaires', destination: '/protheses-oculaires' },
  { source: '/nos-offres', destination: '/services-et-garanties#offres-historiques' },
  // Only the 83 recovered product slugs ([a-z0-9-] only, checked by check:data).
  { source: `/produit/:slug(${productSlugs.join('|')})`, destination: '/produits/:slug' },
];
