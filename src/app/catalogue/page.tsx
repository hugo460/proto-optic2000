import type { Metadata } from 'next';
import { products } from '@/data';
import { CatalogueView } from '@/components/catalog/catalogue-view';
export const metadata: Metadata = { title: 'Tout le catalogue' };
export default async function CataloguePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogueView source={products} query={await searchParams} path="/catalogue" />;
}
