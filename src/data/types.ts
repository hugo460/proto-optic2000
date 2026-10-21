export type ProductKind = 'solar' | 'lens';
export type Universe = 'Vue' | 'Soleil' | 'Lentilles' | 'Observation';
export interface Media {
  src: string;
  width: number;
  height: number;
  origin: string;
  sourceSha256: string;
}
export interface Attribute {
  key: string;
  name: string;
  terms: { id: number; name: string; slug: string; default?: boolean }[];
  varies: boolean;
}
export interface Variant {
  id: number;
  attributes: Record<string, string>;
  labels: Record<string, string>;
  price: number;
  regularPrice: number;
  image: Media;
  imageId: number;
  sku: string;
  description: string;
  availability: string;
  sourceStock: { inStock: boolean; backordersAllowed: boolean; active: boolean; visible: boolean };
}
export interface Product {
  id: number;
  slug: string;
  name: string;
  brandId: string;
  kind: ProductKind;
  type: string;
  price: number;
  minPrice: number;
  maxPrice: number;
  description: string;
  shortDescription: string;
  categories: string[];
  sourceCategories: { id: number; name: string; slug: string; link: string }[];
  attributes: Attribute[];
  defaultAttributes: Record<string, string>;
  images: Media[];
  variants: Variant[];
  source: string;
  normalization: string[];
  sourceStock: { inStock: boolean; backordersAllowed: boolean | null };
}
export interface Brand {
  id: string;
  name: string;
  universes: Universe[];
  logo: Media | null;
  darkLogo: boolean;
  productIds: number[];
  relationship: string | null;
  source: { url?: string; page?: string; method?: string }[];
}
