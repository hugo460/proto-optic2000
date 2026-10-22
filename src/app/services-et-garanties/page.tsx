import type { Metadata } from 'next';
import { historicalOffers, services } from '@/data/content';
import { ContactPrompt, EditorialHeader, OnThisPage, ReadingSection, SourceNote } from '@/components/content/editorial';
export const metadata: Metadata = { title: 'Services et garanties', description: 'Devis, entretien, garanties et adaptation publiés par Optic 2000 Tahiti, avec leurs conditions, à confirmer en magasin.' };
export default function ServicesPage() {
  return <div className="container editorial-page">
    <EditorialHeader title="Services et garanties." aside={<OnThisPage items={[...services.map(s => ({ id: s.id, label: s.title })), { id: 'offres-historiques', label: 'Offres de 2022' }]} />}>
      <p>Les engagements publiés sur l’ancien site, regroupés avec leurs conditions et leurs limites. Ils ont été relevés le 21 octobre 2026 et restent à confirmer en magasin.</p>
    </EditorialHeader>
    {services.map(service => <ReadingSection key={service.id} id={service.id} title={service.title}>
      {service.paragraphs.map(text => <p key={text}>{text}</p>)}
      {service.terms && <dl className="terms-list">{service.terms.map(term => <div key={term.label}><dt>{term.label}</dt><dd>{term.value}</dd></div>)}</dl>}
      {service.note && <p className="reading-note">{service.note}</p>}
    </ReadingSection>)}
    <ReadingSection id="offres-historiques" title="Offres de 2022">
      <p>L’ancienne page « Nos offres » présentait trois visuels datés de 2022 : {historicalOffers.join(', ')}. Ces offres ne sont pas reprises : aucune n’est confirmée comme offre actuelle.</p>
      <p>Pour connaître les offres en cours, renseignez-vous auprès de votre magasin.</p>
    </ReadingSection>
    <ContactPrompt subject="services" title="Une question sur un service ?" appointment={{ href: '/rendez-vous', lead: false }}>Devis, entretien, garantie : préparez votre demande pour le magasin de votre choix, ou une visite pour en parler sur place.</ContactPrompt>
    <SourceNote pages={['accueil', 'nos-offres']}>Textes réorganisés et orthographe corrigée, sans changement des conditions publiées.</SourceNote>
  </div>;
}
