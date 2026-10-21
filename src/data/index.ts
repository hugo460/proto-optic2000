import catalogue from './catalogue.json';
import identityData from './brands.json';
import mediaData from './media.json';
import type { Brand, Media, Product } from './types';
export const products = catalogue as Product[];
export const brands = identityData as Brand[];
export const media = mediaData as Media[];
export const solarProducts = products.filter(p => p.kind === 'solar');
export const getProduct = (slug: string) => products.find(p => p.slug === slug);
export const getBrand = (id: string) => brands.find(b => b.id === id);
export const findMedia = (filename: string) => {
  const match = media.find(m => m.src.includes(filename));
  if (!match) throw new Error(`Unknown local media: ${filename}`);
  return match;
};
