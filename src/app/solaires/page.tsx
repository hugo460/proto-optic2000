import type { Metadata } from 'next';
import { solarProducts } from '@/data';
import { CatalogueView } from '@/components/catalog/catalogue-view';
export const metadata: Metadata = { title: 'Les lunettes de soleil' };
export default async function SolarPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CatalogueView source={solarProducts} query={await searchParams} path="/solaires" />;
}
