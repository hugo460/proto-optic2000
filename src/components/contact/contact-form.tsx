'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import type { Media } from '@/data/types';
import { MediaImage } from '@/components/ui/media-image';
import { Icon } from '@/components/ui/icon';
import { contactFieldOrder, contactSubjects, messageLimits, prosthesisStore, subjectLabel, validateContact, type ContactErrors, type ContactFields } from '@/lib/contact-context';
export interface StoreInfo { slug: string; name: string; city: string; address: string; postalAddress: string; phone: string; phoneLabel: string; email: string; mapUrl: string; hoursSummary: string; hoursNotice: string }
export interface SelectionSummary { name: string; href: string; image: Media; lines: { label: string; value: string }[]; price: string }
const subscribe = () => () => {};
const emptyPerson = { name: '', email: '', phone: '', message: '' };
const fieldId = (key: keyof ContactFields, stores: StoreInfo[], store: string) => key === 'store' ? `contact-store-${store || stores[0].slug}` : `contact-${key}`;
export function ContactForm({ stores, summary, initial, contextQuery }: { stores: StoreInfo[]; summary?: SelectionSummary; initial: { store: string; subject: string }; contextQuery: string }) {
  // Nothing typed here leaves the browser: no request, no storage, no URL parameter.
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const [fields, setFields] = useState<ContactFields>({ ...initial, ...emptyPerson });
  const [errors, setErrors] = useState<ContactErrors>({});
  const [prepared, setPrepared] = useState<ContactFields | null>(null);
  const focusTarget = useRef<string | null>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const storeSlugs = stores.map(s => s.slug);
  const store = stores.find(s => s.slug === fields.store);
  useEffect(() => {
    if (prepared) successHeading.current?.focus();
    else if (focusTarget.current) document.getElementById(focusTarget.current)?.focus();
    focusTarget.current = null;
  }, [errors, prepared]);
  const syncUrl = (next: ContactFields) => {
    const url = new URL(window.location.href);
    for (const [key, value] of [['magasin', next.store], ['sujet', next.subject]]) if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
    window.history.replaceState(null, '', url.pathname + url.search);
  };
  const update = (key: keyof ContactFields, value: string) => {
    const next = { ...fields, [key]: value };
    if (key === 'subject' && value === 'protheses') next.store = prosthesisStore;
    setFields(next);
    if (key === 'store' || key === 'subject') syncUrl(next);
    if (Object.keys(errors).length) {
      const fresh = validateContact(next, storeSlugs);
      setErrors(current => {
        const kept = { ...current };
        for (const name of key === 'subject' ? ['subject', 'store'] as const : [key]) { if (fresh[name] && current[name]) kept[name] = fresh[name]; else delete kept[name]; }
        return kept;
      });
    }
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validateContact(fields, storeSlugs);
    const first = contactFieldOrder.find(key => found[key]);
    if (first) { focusTarget.current = fieldId(first, stores, fields.store); setErrors(found); return; }
    setErrors({});
    setPrepared(fields);
  };
  const restart = () => {
    setFields(current => ({ ...current, ...emptyPerson }));
    setErrors({});
    setPrepared(null);
    focusTarget.current = 'contact-name';
  };
  const described = (key: keyof ContactFields, hint?: string) => [hint, errors[key] ? `contact-${key}-error` : ''].filter(Boolean).join(' ') || undefined;
  const error = (key: keyof ContactFields) => errors[key] && <p className="field-error" id={`contact-${key}-error`}><Icon name="close" />{errors[key]}</p>;
  const storeLink = (slug: string) => {
    const params = new URLSearchParams(contextQuery);
    if (fields.subject) params.set('sujet', fields.subject); else params.delete('sujet');
    return `/magasins/${slug}${params.size ? `?${params}` : ''}`;
  };
  const preparedStore = prepared && stores.find(s => s.slug === prepared.store);
  return <div className="contact-layout">
    <div className="contact-main">
      {prepared && preparedStore ? <section className="contact-success" aria-labelledby="contact-success-title">
        <Icon name="check" className="contact-success-icon" />
        <h2 id="contact-success-title" ref={successHeading} tabIndex={-1}>Demande préparée pour la démonstration.</h2>
        <p className="contact-success-lead">Aucun message n’a été envoyé et aucun rendez-vous n’a été réservé : ce prototype ne transmet rien au magasin.</p>
        <dl className="contact-recap">
          <div><dt>Magasin</dt><dd>Optic 2000 {preparedStore.name}</dd></div>
          <div><dt>Objet</dt><dd>{subjectLabel(prepared.subject)}</dd></div>
          {summary && <div><dt>Sélection</dt><dd>{summary.name} — {summary.lines.map(line => `${line.label} : ${line.value}`).join(' · ')}</dd></div>}
          <div><dt>Nom</dt><dd>{prepared.name.trim()}</dd></div>
          <div><dt>E-mail</dt><dd>{prepared.email.trim()}</dd></div>
          {prepared.phone.trim() && <div><dt>Téléphone</dt><dd>{prepared.phone.trim()}</dd></div>}
          <div><dt>Message</dt><dd className="contact-recap-message">{prepared.message.trim()}</dd></div>
        </dl>
        <p>Pour joindre réellement le magasin {preparedStore.name}, appelez le <a className="underlined" href={`tel:${preparedStore.phone}`}>+689 {preparedStore.phoneLabel}</a> ou écrivez à <a className="underlined" href={`mailto:${preparedStore.email}`}>{preparedStore.email}</a>.{prepared.subject === 'protheses' && ' Pour les prothèses oculaires, le rendez-vous se demande par téléphone.'}</p>
        <div className="contact-success-actions">
          {summary && <Link className="action action-primary" href={summary.href}>Revenir à votre sélection<Icon name="arrow" /></Link>}
          <Link className={`action ${summary ? 'action-secondary' : 'action-primary'}`} href={storeLink(preparedStore.slug)}>Voir le magasin {preparedStore.name}<Icon name="arrow" /></Link>
          <button type="button" className="action action-text" onClick={restart}><Icon name="back" />Préparer une autre demande</button>
        </div>
      </section>
      : <form className="contact-form" noValidate onSubmit={submit} aria-labelledby="contact-form-title">
        <h2 id="contact-form-title">Votre demande</h2>
        <p className="contact-required">Tous les champs sont obligatoires, sauf le téléphone.</p>
        <fieldset className="contact-stores" role="radiogroup" aria-invalid={errors.store ? true : undefined} aria-describedby={described('store', fields.subject === 'protheses' ? 'contact-store-hint' : undefined)}>
          <legend>Magasin</legend>
          {fields.subject === 'protheses' && <p className="field-hint" id="contact-store-hint">Les prothèses oculaires sont suivies uniquement au magasin de Mamao, sur rendez-vous à demander par téléphone.</p>}
          <div className="store-choices">{stores.map(item => <label key={item.slug} className="store-choice"><input type="radio" id={`contact-store-${item.slug}`} name="store" value={item.slug} checked={fields.store === item.slug} onChange={() => update('store', item.slug)} /><span><strong>{item.name}</strong><span>{item.city}</span></span></label>)}</div>
          {error('store')}
        </fieldset>
        <div className="field">
          <label htmlFor="contact-subject">Objet de la demande</label>
          <select id="contact-subject" value={fields.subject} required aria-invalid={errors.subject ? true : undefined} aria-describedby={described('subject')} onChange={event => update('subject', event.target.value)}><option value="">Choisir l’objet</option>{contactSubjects.map(subject => <option key={subject.slug} value={subject.slug}>{subject.label}</option>)}</select>
          {error('subject')}
        </div>
        <div className="field-pair">
          <div className="field"><label htmlFor="contact-name">Nom</label><input id="contact-name" type="text" autoComplete="name" maxLength={80} required value={fields.name} aria-invalid={errors.name ? true : undefined} aria-describedby={described('name')} onChange={event => update('name', event.target.value)} />{error('name')}</div>
          <div className="field"><label htmlFor="contact-email">E-mail</label><input id="contact-email" type="email" inputMode="email" autoComplete="email" spellCheck={false} maxLength={120} required value={fields.email} aria-invalid={errors.email ? true : undefined} aria-describedby={described('email')} onChange={event => update('email', event.target.value)} />{error('email')}</div>
        </div>
        <div className="field"><label htmlFor="contact-phone">Téléphone <span>(facultatif)</span></label><input id="contact-phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={24} value={fields.phone} aria-invalid={errors.phone ? true : undefined} aria-describedby={described('phone')} onChange={event => update('phone', event.target.value)} />{error('phone')}</div>
        <div className="field"><label htmlFor="contact-message">Message</label><p className="field-hint" id="contact-message-hint">{messageLimits.min} à {messageLimits.max} caractères. N’ajoutez ni ordonnance ni information médicale.</p><textarea id="contact-message" rows={6} maxLength={messageLimits.max} required value={fields.message} aria-invalid={errors.message ? true : undefined} aria-describedby={described('message', 'contact-message-hint')} onChange={event => update('message', event.target.value)} />{error('message')}</div>
        <div className="contact-submit"><button type="submit" className="action action-primary" disabled={!hydrated}>Préparer la demande<Icon name="arrow" /></button><p>Simulation : rien n’est envoyé au magasin, aucun rendez-vous n’est réservé.</p></div>
      </form>}
    </div>
    <aside className="contact-aside" aria-label="Récapitulatif de votre demande">
      {summary ? <section className="contact-selection"><h2>Votre sélection</h2><div><MediaImage media={summary.image} alt={summary.name} sizes="120px" /><div><Link className="underlined" href={summary.href}>{summary.name}</Link>{summary.lines.map(line => <p key={line.label}>{line.label} : {line.value}</p>)}<p>{summary.price} · Prix à confirmer</p></div></div></section>
        : <section className="contact-selection"><h2>Votre sélection</h2><p>Aucun modèle joint. Vous pouvez décrire votre besoin dans le message.</p></section>}
      <section className="contact-store">
        <h2>{store ? `Optic 2000 ${store.name}` : 'Votre magasin'}</h2>
        {store ? <><address>{store.address}<br /><span>{store.postalAddress}</span></address><a className="contact-line" href={`tel:${store.phone}`}><Icon name="phone" />+689 {store.phoneLabel}</a><a className="contact-line" href={`mailto:${store.email}`}><Icon name="mail" />{store.email}</a><a className="contact-line" href={store.mapUrl} target="_blank" rel="noopener noreferrer"><Icon name="pin" />Plan et itinéraire<span className="sr-only"> — Google Maps, nouvel onglet</span></a><p className="contact-hours">{store.hoursSummary}</p><p className="hours-notice">{store.hoursNotice}</p><Link className="underlined" href={storeLink(store.slug)}>Voir la fiche du magasin</Link></>
          : <p>Choisissez un magasin pour afficher son adresse et ses coordonnées.</p>}
      </section>
    </aside>
  </div>;
}
