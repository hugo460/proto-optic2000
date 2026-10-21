import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactPrompt, EditorialHeader, ReadingSection, SourceNote } from '@/components/content/editorial';
export const metadata: Metadata = { title: 'Conditions générales de vente', description: 'Le prototype Optic 2000 Tahiti ne vend rien en ligne : les conditions de l’ancienne boutique ne s’appliquent pas ici.' };
export default function SalesTermsPage() {
  return <div className="container editorial-page legal-page">
    <EditorialHeader title="Conditions générales de vente.">
      <p>Ce prototype ne vend rien en ligne : aucune commande, aucun paiement, aucune livraison.</p>
    </EditorialHeader>
    <ReadingSection id="ancienne-boutique" title="Les conditions de l’ancienne boutique">
      <p>L’ancien site publiait des conditions générales de vente indiquées « en vigueur au 29/11/2022 » pour sa boutique en ligne. Elles ne s’appliquent pas à ce prototype et ne sont pas republiées comme conditions actuelles.</p>
    </ReadingSection>
    <ReadingSection id="en-magasin" title="Acheter un produit présenté">
      <p>Les prix affichés proviennent du catalogue public relevé le 21 octobre 2026 ; ils sont à confirmer. L’achat, ses conditions et les garanties se voient directement avec le magasin.</p>
      <p>Les garanties publiées sont détaillées, avec leurs limites, dans <Link className="underlined" href="/services-et-garanties">Services et garanties</Link>.</p>
    </ReadingSection>
    <ReadingSection id="future-boutique" title="Pour une future vente en ligne">
      <p>Si l’enseigne choisit de vendre en ligne, de nouvelles conditions seront à rédiger et à valider avant toute publication.</p>
    </ReadingSection>
    <ContactPrompt subject="autre" title="Une question avant d’acheter ?">Préparez votre demande pour le magasin de votre choix.</ContactPrompt>
    <SourceNote pages={['cgv']} />
  </div>;
}
