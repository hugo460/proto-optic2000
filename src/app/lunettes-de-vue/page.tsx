import type { Metadata } from 'next';
import Link from 'next/link';
import { brands } from '@/data';
import { editorialMedia } from '@/data/content';
import { BrandTiles, ContactPrompt, EditorialHeader, ReadingSection, SourceNote } from '@/components/content/editorial';
import { MediaImage } from '@/components/ui/media-image';
export const metadata: Metadata = { title: 'Lunettes de vue', description: 'Les marques de montures de vue présentées dans les magasins Optic 2000 Tahiti, avec le conseil de nos opticiens.' };
export default function OpticalPage() {
  const opticalBrands = brands.filter(b => b.universes.includes('Vue')).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  return <div className="container editorial-page">
    <EditorialHeader title="Lunettes de vue." aside={<figure className="campaign-pair">
      <div><MediaImage media={editorialMedia.campaignGold} alt="Portrait de campagne Optic 2000 : femme souriante portant une monture de vue fine et dorée." sizes="(max-width: 800px) 45vw, 22vw" priority /></div>
      <div><MediaImage media={editorialMedia.campaignBlue} alt="Portrait de campagne Optic 2000 : homme souriant portant une monture de vue noire et bleue." sizes="(max-width: 800px) 45vw, 22vw" priority /></div>
      <figcaption>Visuels de campagne Optic 2000 publiés sur l’ancien site en 2022. Aucune offre ni aucun prix n’y est associé.</figcaption>
    </figure>}>
      <p>Nos magasins présentent les montures de {opticalBrands.length} marques. Les montures de vue ne sont pas vendues en ligne : venez les essayer et laissez nos opticiens vous conseiller.</p>
    </EditorialHeader>
    <ReadingSection id="marques" title="Les marques en magasin">
      <p>Chaque marque a sa présentation. Les collections et les modèles disponibles se découvrent avec nos équipes.</p>
    </ReadingSection>
    <BrandTiles brands={opticalBrands} label="Marques de lunettes de vue" showDestination={false} />
    <ReadingSection id="conseil" title="Choisir avec un opticien">
      <p>Nos opticiens vous accompagnent pour trouver une monture adaptée à votre style et à votre vue.</p>
      <p>Lors de votre passage, ils réalisent gratuitement un ou plusieurs devis sur les équipements qui vous conviennent. Garanties, entretien et adaptation sont détaillés, avec leurs conditions, dans <Link className="underlined" href="/services-et-garanties">Services et garanties</Link>.</p>
    </ReadingSection>
    <ContactPrompt subject="vue" title="Une monture à essayer ?" appointment={{ href: '/rendez-vous?motif=conseil-montures', lead: true }}>Préparez une visite d’essai dans le magasin de votre choix, posez d’abord une question, ou appelez-le directement.</ContactPrompt>
    <SourceNote pages={['lunettes-de-vue', 'accueil']}>Les forfaits de 2022 de l’ancienne page ne sont pas repris comme offres actuelles.</SourceNote>
  </div>;
}
