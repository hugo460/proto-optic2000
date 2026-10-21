import type { Metadata } from 'next';
import { editorialMedia, teamArticles } from '@/data/content';
import { stores } from '@/data/stores';
import { ContactPrompt, EditorialHeader, ReadingSection, SourceNote } from '@/components/content/editorial';
import { StoreCard } from '@/components/stores/store-card';
import { MediaImage } from '@/components/ui/media-image';
import { Icon } from '@/components/ui/icon';
export const metadata: Metadata = { title: 'Qui sommes-nous', description: 'Les opticiens Optic 2000 Tahiti : une équipe aux profils variés, à Centre-ville, Mamao et Taravao.' };
export default function AboutPage() {
  return <div className="container editorial-page">
    <EditorialHeader title="Vos opticiens à Tahiti." aside={<figure className="team-photo">
      <MediaImage media={editorialMedia.team} alt="Trois membres de l’équipe Optic 2000 Tahiti en polo sombre, devant un mur de lunettes de soleil en magasin." sizes="(max-width: 800px) 90vw, 34vw" priority />
      <figcaption>Photo publiée sur la page « Qui sommes-nous » en 2022. La composition actuelle de l’équipe est à confirmer.</figcaption>
    </figure>}>
      <p>Une équipe aux profils variés : des Polynésiens formés au métier, ainsi que des monteurs-vendeurs et des opticiens diplômés d’État formés en métropole.</p>
      <p>Une qualité caractérise l’équipe et est appréciée par sa clientèle : sa bonne humeur.</p>
    </EditorialHeader>
    <ReadingSection id="articles" title="Ils en ont parlé">
      <p>Deux magazines polynésiens ont consacré un article à l’équipe. Les noms sont ceux cités sur la page de 2022.</p>
      <ul className="article-links">{teamArticles.map(article => <li key={article.href}><a href={article.href} target="_blank" rel="noopener noreferrer"><span>L’article consacré à {article.about}</span><Icon name="external" /><span className="article-source">{article.site}</span><span className="sr-only"> — site externe, nouvel onglet</span></a></li>)}</ul>
    </ReadingSection>
    <section className="section about-stores" aria-labelledby="nos-magasins-title">
      <div className="section-heading"><h2 id="nos-magasins-title">Nos trois magasins.</h2></div>
      <div className="store-grid">{stores.map(store => <StoreCard key={store.slug} store={store} />)}</div>
    </section>
    <ContactPrompt subject="autre" title="Envie de nous rencontrer ?">Préparez une demande pour le magasin de votre choix, ou passez nous voir.</ContactPrompt>
    <SourceNote pages={['qui-sommes-nous']}>Les anciennetés, effectifs et magasins partenaires cités en 2022 ne sont pas repris comme informations actuelles.</SourceNote>
  </div>;
}
