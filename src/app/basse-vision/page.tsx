import type { Metadata } from 'next';
import { ContactPrompt, EditorialHeader, OnThisPage, ReadingSection, SourceNote } from '@/components/content/editorial';
export const metadata: Metadata = { title: 'Basse vision', description: 'Loupes et systèmes optiques : les opticiens Optic 2000 Tahiti vous aident à choisir selon vos besoins et votre budget.' };
export default function LowVisionPage() {
  return <div className="container editorial-page">
    <EditorialHeader title="Basse vision." aside={<OnThisPage items={[{ id: 'loupes', label: 'Loupes' }, { id: 'systemes-optiques', label: 'Systèmes optiques' }, { id: 'conseil', label: 'Le conseil en magasin' }]} />}>
      <p>Loupes et systèmes optiques : nos opticiens vous aident à choisir une aide adaptée à vos besoins et à votre budget.</p>
    </EditorialHeader>
    <ReadingSection id="loupes" title="Loupes">
      <p>Pour bien choisir une loupe, il faut trouver le meilleur compromis entre le grossissement et la taille de la loupe.</p>
      <p>Notre équipe de spécialistes est là pour vous guider.</p>
    </ReadingSection>
    <ReadingSection id="systemes-optiques" title="Systèmes optiques">
      <p>De nombreux systèmes optiques sont disponibles, mais méconnus. Ils peuvent faciliter la lecture, l’écriture et l’utilisation des écrans : téléphone (vini), tablette, télévision.</p>
    </ReadingSection>
    <ReadingSection id="conseil" title="Le conseil en magasin">
      <p>Notre équipe vous guide dans votre achat en fonction de vos besoins et de votre budget. Loupes et systèmes optiques se découvrent en magasin.</p>
      <p>Chaque situation est différente : les solutions possibles se discutent avec nos opticiens.</p>
    </ReadingSection>
    <ContactPrompt subject="basse-vision" title="Parler de vos besoins">Préparez une demande pour le magasin de votre choix, ou appelez-le pour convenir d’un moment.</ContactPrompt>
    <SourceNote pages={['basse-vision']} />
  </div>;
}
