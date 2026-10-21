'use client';
import { useState, type ReactNode } from 'react';
import { Icon } from '@/components/ui/icon';
export function FilterPanel({ children, count }: { children: ReactNode; count: number }) {
  const [opened, setOpened] = useState(false);
  return <div className="filter-panel"><button className="filter-toggle" type="button" aria-controls="catalogue-filters" aria-expanded={opened} onClick={() => setOpened(!opened)}><Icon name="filter" />Filtres et tri{count > 0 && ` (${count})`}<Icon name="chevron" /></button><div id="catalogue-filters" className="filter-fields" data-open={opened}>{children}</div></div>;
}
