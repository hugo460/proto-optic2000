import type { Metadata } from 'next';
import Link from 'next/link';
import { historicalLegal } from '@/data/content';
import { EditorialHeader, ReadingSection, SourceNote } from '@/components/content/editorial';
export const metadata: Metadata = { title: 'Mentions légales', description: 'Statut du prototype de présentation Optic 2000 Tahiti, réalisé par devlab et hébergé par Vercel, et mentions historiques de l’ancien site, à valider.' };
export default function LegalNoticePage() {
  return <div className="container editorial-page legal-page">
    <EditorialHeader title="Mentions légales.">
      <p>Ce site est un prototype de présentation réalisé par devlab pour Optic 2000 Tahiti. Il n’est pas le site officiel de l’enseigne et n’est pas destiné à être indexé.</p>
    </EditorialHeader>
    <ReadingSection id="prototype" title="Le prototype">
      <p>Réalisation : devlab. Hébergement : Vercel, qui publie cette version de démonstration à une adresse technique, distincte du domaine de l’enseigne. Les informations d’éditeur d’un futur site officiel restent à compléter et à valider par l’enseigne.</p>
      <p>Aucune vente, aucun compte client et aucun paiement ne sont proposés. Le formulaire de demande fonctionne entièrement dans le navigateur : rien n’est envoyé ni enregistré. Les détails figurent dans la page <Link className="underlined" href="/politique-de-confidentialite">Confidentialité</Link>.</p>
      <p>Les prix, horaires, garanties et contenus proviennent des pages publiques de l’ancien site, relevées le 21 octobre 2026. Ils n’ont pas été validés par l’enseigne et restent à confirmer en magasin.</p>
    </ReadingSection>
    <ReadingSection id="mentions-historiques" title="Mentions de l’ancien site, à valider">
      <p>L’ancien site optic2000tahiti.com indiquait les informations suivantes. Elles sont reprises pour validation par l’enseigne ; elles ne désignent pas l’éditeur de ce prototype.</p>
      <dl className="terms-list">{historicalLegal.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>
      <p>L’hébergeur (OVH) et le créateur (JK) cités concernaient l’ancien site. Ils ne sont ni l’hébergeur ni le créateur de ce prototype.</p>
    </ReadingSection>
    <SourceNote pages={['mentions-legales']}>Ce texte décrit le fonctionnement du prototype ; il ne constitue pas une analyse juridique.</SourceNote>
  </div>;
}
