import type { Metadata } from 'next';
import { EditorialHeader, ReadingSection, SourceNote } from '@/components/content/editorial';
export const metadata: Metadata = { title: 'Confidentialité', description: 'Ce que fait réellement le prototype Optic 2000 Tahiti des informations saisies, qui ne quittent pas le navigateur, et ce que reçoit son hébergeur.' };
export default function PrivacyPage() {
  return <div className="container editorial-page legal-page">
    <EditorialHeader title="Confidentialité.">
      <p>Ce que fait réellement ce prototype de présentation des informations que vous saisissez ou consultez.</p>
    </EditorialHeader>
    <ReadingSection id="formulaire" title="La demande et le rendez-vous">
      <p>La demande utilise le nom, l’e-mail, le téléphone facultatif et le message. Le rendez-vous de démonstration utilise seulement le nom, l’e-mail et le téléphone facultatif. Ces informations restent dans la page ouverte de votre navigateur et servent uniquement à afficher le récapitulatif préparé.</p>
      <p>Rien n’est envoyé au magasin, à l’hébergeur ni à un service extérieur, et rien n’est enregistré : un rechargement de la page, « Préparer une autre demande » ou « Refaire la démonstration » efface la saisie. Les créneaux proposés sont fictifs : aucun rendez-vous n’est réservé.</p>
    </ReadingSection>
    <ReadingSection id="adresse" title="L’adresse des pages">
      <p>Seuls des identifiants publics peuvent figurer dans l’adresse d’une page : produit, couleur, correction, magasin, objet de la demande, motif ou étape du rendez-vous. Votre nom, votre e-mail, votre téléphone, votre message et le créneau choisi n’y figurent jamais.</p>
    </ReadingSection>
    <ReadingSection id="hebergement" title="Les requêtes reçues par l’hébergeur">
      <p>Le prototype est hébergé par Vercel. Comme pour tout site publié, chaque page, image ou police demandée passe par ses serveurs, qui reçoivent les informations techniques de la requête : l’adresse IP, l’adresse publique de la page demandée et des données techniques du navigateur. Elles peuvent servir au fonctionnement et à la sécurité du service.</p>
      <p>Ces requêtes ne contiennent jamais ce que vous saisissez dans le formulaire. Leur éventuelle conservation relève de l’hébergeur et sa durée n’est pas précisée ici : ce prototype ne promet pas l’absence de toute trace technique.</p>
    </ReadingSection>
    <ReadingSection id="mesure" title="Mesure d’audience et cookies">
      <p>Le prototype n’ajoute aucun outil de mesure d’audience, aucun traceur publicitaire et aucun cookie. Les polices et les images sont servies par le site lui-même.</p>
    </ReadingSection>
    <ReadingSection id="liens" title="Liens vers d’autres services">
      <p>Certains liens ouvrent volontairement un autre service : un plan Google Maps, un article de presse, votre application de téléphone ou de messagerie. Une fois ouverts, ces services appliquent leurs propres règles.</p>
    </ReadingSection>
    <ReadingSection id="ancienne-politique" title="La politique de l’ancien site">
      <p>La politique de confidentialité de l’ancien site décrivait des services absents de ce prototype, notamment une boutique avec paiement et des services WordPress. Elle n’est pas reprise et ne s’applique pas à ce prototype. La politique d’un futur site officiel reste à rédiger et à valider par l’enseigne.</p>
    </ReadingSection>
    <SourceNote pages={['politique-de-confidentialite']}>Ce texte décrit le fonctionnement technique du prototype ; il ne constitue pas une analyse juridique.</SourceNote>
  </div>;
}
