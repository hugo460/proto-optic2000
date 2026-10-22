import Link from 'next/link';
import { appointmentSteps, dayLabel, reasonLabel, timeLabel, type AppointmentDraft, type StepId } from '@/lib/appointment';
import type { StoreInfo } from '@/components/contact/contact-form';
import { Icon } from '@/components/ui/icon';
export interface AppointmentProduct { name: string; href: string; details: string }

// Named steps: done steps can be reopened, the current one is marked, later ones wait for the earlier answers.
export function AppointmentProgress({ view, limit, onSelect }: { view: StepId; limit: StepId; onSelect: (step: StepId) => void }) {
  const reachable = appointmentSteps.findIndex(s => s.id === limit);
  return <nav className="rdv-progress" aria-label="Étapes du rendez-vous"><ol>
    {appointmentSteps.map((step, index) => {
      const state = step.id === view ? 'current' : index < reachable ? 'done' : 'todo';
      const content = <>
        <span className="rdv-progress-index" aria-hidden="true">{state === 'done' ? <Icon name="check" /> : index + 1}</span>
        <span className="rdv-progress-label"><span className="sr-only">Étape {index + 1} : </span>{step.label}<span className="sr-only">{state === 'done' ? ', complétée' : state === 'current' ? ', en cours' : ', à venir'}</span></span>
      </>;
      return <li key={step.id} data-state={state}>{state === 'done'
        ? <button type="button" onClick={() => onSelect(step.id)}>{content}</button>
        : <span aria-current={state === 'current' ? 'step' : undefined}>{content}</span>}</li>;
    })}
  </ol></nav>;
}

// The same summary serves the editable recap and the simulated result.
export function AppointmentSummary({ draft, storeName, product, onEdit }: { draft: AppointmentDraft; storeName: string; product?: AppointmentProduct; onEdit?: (step: StepId) => void }) {
  const sections: { step: StepId; title: string; rows: [string, string][] }[] = [
    { step: 'visite', title: 'Votre visite', rows: [['Magasin', `Optic 2000 ${storeName}`], ['Motif', reasonLabel(draft.reason) ?? '']] },
    { step: 'creneau', title: 'Votre créneau', rows: [['Jour', draft.date ? dayLabel(draft.date).full : ''], ['Heure', draft.time ? `${timeLabel(draft.time)}, heure de Tahiti (créneau fictif)` : '']] },
    { step: 'coordonnees', title: 'Vos coordonnées', rows: [['Nom', draft.name.trim()], ['E-mail', draft.email.trim()], ['Téléphone', draft.phone.trim() || 'Non renseigné']] },
  ];
  return <div className="rdv-summary">
    {sections.map(section => <section key={section.step} aria-labelledby={`rdv-summary-${section.step}`}>
      <div className="rdv-summary-heading"><h3 id={`rdv-summary-${section.step}`}>{section.title}</h3>{onEdit && <button type="button" className="action action-text" onClick={() => onEdit(section.step)}>Modifier<span className="sr-only"> {section.title.toLowerCase()}</span></button>}</div>
      <dl className="contact-recap">{section.rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    </section>)}
    {product && <p className="rdv-summary-product">Modèle à voir : <Link className="underlined" href={product.href}>{product.name}</Link>{product.details && ` — ${product.details}`}</p>}
  </div>;
}

// Calm context column: the real store details, never a copy of the form.
export function AppointmentAside({ store, product }: { store?: StoreInfo; product?: AppointmentProduct }) {
  return <aside className="contact-aside" aria-label="Le magasin de votre visite">
    {product && <section className="contact-selection"><h2>Votre sélection</h2><p><Link className="underlined" href={product.href}>{product.name}</Link></p>{product.details && <p>{product.details}</p>}<p>Le modèle accompagne la visite ; sa disponibilité est à confirmer avec le magasin.</p></section>}
    <section className={product ? 'contact-store' : 'contact-store rdv-store-first'}>
      <h2>{store ? `Optic 2000 ${store.name}` : 'Votre magasin'}</h2>
      {store ? <><address>{store.address}<br /><span>{store.postalAddress}</span></address><a className="contact-line" href={`tel:${store.phone}`}><Icon name="phone" />+689 {store.phoneLabel}</a><a className="contact-line" href={`mailto:${store.email}`}><Icon name="mail" />{store.email}</a><a className="contact-line" href={store.mapUrl} target="_blank" rel="noopener noreferrer"><Icon name="pin" />Plan et itinéraire<span className="sr-only"> — Google Maps, nouvel onglet</span></a><p className="contact-hours">{store.hoursSummary}</p><p className="hours-notice">{store.hoursNotice}</p><Link className="underlined" href={`/magasins/${store.slug}`}>Voir la fiche du magasin</Link></>
        : <p>Choisissez un magasin pour afficher son adresse et ses coordonnées.</p>}
    </section>
  </aside>;
}
