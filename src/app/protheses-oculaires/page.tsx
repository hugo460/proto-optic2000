import type { Metadata } from 'next';
import Link from 'next/link';
import { getStore } from '@/data/stores';
import { contactHrefFor } from '@/data/content';
import { prosthesisStore } from '@/lib/contact-context';
import { EditorialHeader, ReadingSection, SourceNote } from '@/components/content/editorial';
import { Icon } from '@/components/ui/icon';
export const metadata: Metadata = { title: 'Prothèses oculaires', description: 'Prothèses oculaires sur mesure à Optic 2000 Mamao, en collaboration avec le laboratoire DENCOTT. Uniquement sur rendez-vous.' };
export default function ProsthesesPage() {
  const mamao = getStore(prosthesisStore)!;
  return <div className="container editorial-page">
    <EditorialHeader title="Prothèses oculaires." aside={<section className="appointment-panel" aria-labelledby="rendez-vous-title">
      <h2 id="rendez-vous-title">Uniquement sur rendez-vous, à Mamao</h2>
      <p>Le rendez-vous se prend par téléphone auprès du magasin de Mamao.</p>
      <a className="contact-line" href={`tel:${mamao.phone}`}><Icon name="phone" />Optic 2000 Mamao · +689 {mamao.phoneLabel}</a>
      <div className="appointment-actions">
        <Link className="action action-primary" href={contactHrefFor('protheses', mamao.slug)}>Préparer une demande<Icon name="arrow" /></Link>
        <Link className="action action-text" href={`/magasins/${mamao.slug}`}>Le magasin de Mamao<Icon name="arrow" /></Link>
      </div>
      <p className="appointment-note">Démonstration : la demande préparée sur ce site ne réserve aucun rendez-vous et n’est pas envoyée.</p>
    </section>}>
      <p>À Optic 2000 Mamao, un opticien-oculariste réalise et adapte des prothèses oculaires sur mesure, en collaboration avec le laboratoire DENCOTT.</p>
    </EditorialHeader>
    <ReadingSection id="oculariste" title="Le rôle de l’oculariste">
      <p>L’oculariste est un spécialiste qui crée et adapte des prothèses oculaires en résines synthétiques biocompatibles.</p>
      <p>Une prothèse oculaire est destinée à combler esthétiquement l’absence d’un œil, à la suite d’une maladie ou d’un traumatisme. <strong>Elle ne redonne pas la vision.</strong></p>
    </ReadingSection>
    <ReadingSection id="sur-mesure" title="Une prothèse sur mesure">
      <p>L’oculariste prend la mesure et l’empreinte de la cavité de l’œil. Il crée une prothèse en résine biocompatible, visuellement la plus proche possible de l’autre œil : taille, couleur du blanc de l’œil, veinage et iris sont reproduits de la manière la plus réaliste possible.</p>
      <p>Il ajuste ensuite la prothèse dans l’orbite. Il a également un rôle pédagogique : il donne des conseils sur le port de la prothèse et son entretien.</p>
    </ReadingSection>
    <ReadingSection id="dencott" title="En collaboration avec DENCOTT">
      <p>L’opticien-oculariste a été formé par le laboratoire DENCOTT, à Paris, avec lequel le magasin travaille pour la réalisation des prothèses.</p>
      <p>La page de 2022 présentait un opticien-oculariste conventionné, Serge Ganancia. L’interlocuteur et les modalités actuels sont à confirmer auprès du magasin de Mamao.</p>
    </ReadingSection>
    <SourceNote pages={['protheses-occulaires']}>Les photographies de prothèses de l’ancienne page ne sont pas reprises.</SourceNote>
  </div>;
}
