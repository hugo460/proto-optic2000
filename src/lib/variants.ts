import type { Product, Variant } from '@/data/types';
export function resolveVariant(product: Product, id: string | null): Variant | undefined {
  if (id) return product.variants.find(v => String(v.id) === id);
  const defaults = Object.entries(product.defaultAttributes);
  if (!defaults.length || product.attributes.some(attribute => attribute.varies && product.defaultAttributes[attribute.key] === undefined)) return undefined;
  return product.variants.find(v => defaults.every(([key, value]) => !v.attributes[key] || v.attributes[key] === value));
}
export function variantName(variant: Variant): string {
  return variant.labels.attribute_pa_couleur ?? variant.labels['attribute_pa_couleur-lentilles'] ?? variant.sku;
}
export function variantGallery(product: Product, variant?: Variant) {
  if (!variant) return product.images;
  const start = product.images.findIndex(i => i.origin === variant.image.origin);
  // Source galleries group each frame's quarter/side/front views; stop at the next variant's image.
  const next = start < 0 ? -1 : product.images.findIndex((image, index) => index > start && product.variants.some(v => v.id !== variant.id && v.image.origin === image.origin));
  return start < 0 ? [variant.image] : product.images.slice(start, next === -1 ? undefined : next);
}
