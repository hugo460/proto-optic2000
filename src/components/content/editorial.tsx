import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Brand } from '@/data/types';
import { collectedAt, contactHrefFor, getSourcePage } from '@/data/content';
import type { SubjectSlug } from '@/lib/contact-context';
import { MediaImage } from '@/components/ui/media-image';
import { Icon } from '@/components/ui/icon';
// Reading-page primitives: compact title, readable sections, a contextual request and the source.
const frenchDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

export function EditorialHeader({ title, children, aside }: { title: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return <header className={`editorial-header${aside ? ' has-aside' : ''}`}>
    <div className="editorial-heading"><h1>{title}</h1><div className="editorial-lead">{children}</div></div>
    {aside && <div className="editorial-aside">{aside}</div>}
  </header>;
}

export function OnThisPage({ items }: { items: { id: string; label: string }[] }) {
  return <nav className="on-this-page" aria-labelledby="on-this-page-title"><h2 id="on-this-page-title">Sur cette page</h2><ul>{items.map(item => <li key={item.id}><a href={`#${item.id}`}>{item.label}</a></li>)}</ul></nav>;
}

export function ReadingSection({ id, title, children, media }: { id: string; title: ReactNode; children: ReactNode; media?: ReactNode }) {
  return <section id={id} className={`reading-section${media ? ' has-media' : ''}`} aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>{title}</h2>
    <div className="reading-body">{children}</div>
    {media && <div className="reading-media">{media}</div>}
  </section>;
}

export function ContactPrompt({ subject, store, title, children, secondary }: { subject: SubjectSlug; store?: string; title: string; children: ReactNode; secondary?: { href: string; label: string } }) {
  const other = secondary ?? { href: '/magasins', label: 'Nos trois magasins' };
  return <aside className="contact-prompt" aria-labelledby={`contact-${subject}`}>
    <div><h2 id={`contact-${subject}`}>{title}</h2><p>{children}</p></div>
    <div className="contact-prompt-actions">
      <Link className="action action-primary" href={contactHrefFor(subject, store)}>Préparer une demande<Icon name="arrow" /></Link>
      <Link className="action action-text" href={other.href}>{other.label}<Icon name="arrow" /></Link>
      <p>Démonstration : la demande est mise en forme sur ce site, rien n’est envoyé ni réservé.</p>
    </div>
  </aside>;
}

export function SourceNote({ pages, children }: { pages: string[]; children?: ReactNode }) {
  const sources = pages.map(getSourcePage);
  return <p className="source-note">
    Source : {sources.map((page, i) => <span key={page.slug}>{i > 0 && (i === sources.length - 1 ? ' et ' : ', ')}page « {page.title} » de l’ancien site, modifiée le {frenchDate(page.modified)}</span>)}, relevée le {frenchDate(collectedAt)}. {children ?? 'Informations à confirmer auprès des magasins.'}
  </p>;
}

export function BrandTiles({ brands, label, relationship = false, showDestination = true }: { brands: Brand[]; label: string; relationship?: boolean; showDestination?: boolean }) {
  return <ul className="brand-grid brand-tiles" aria-label={label}>{brands.map(brand => <li key={brand.id}><Link className="brand-card" href={`/marques/${brand.id}`}>
    <div className={`brand-card-logo${brand.darkLogo ? ' dark-logo' : ''}`}>{brand.logo ? <MediaImage media={brand.logo} alt="" sizes="(max-width: 700px) 38vw, 20vw" /> : <span className="text-brand">{brand.name}</span>}</div>
    <h3>{brand.name}<Icon name="arrow" /></h3>
    {relationship && brand.relationship && <p>{brand.relationship}</p>}
    {showDestination && <span className="brand-destination">{brand.productIds.length ? 'Voir les références en ligne' : 'À découvrir en magasin'}</span>}
  </Link></li>)}</ul>;
}
