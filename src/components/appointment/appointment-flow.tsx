'use client';
import Link from 'next/link';
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from 'react';
import { appointmentReasons, prosthesisReason } from '@/data/appointment-demo';
import { allowedView, chooseReason, dayLabel, demoDays, emptyDraft, fieldOrder, firstIncompleteStep, isView, millisecondsToTahitiMidnight, reconcileSlot, restartDraft, slotNotice, slotsFor, tahitiToday, timeLabel, validateStep, type AppointmentDraft, type AppointmentErrors, type AppointmentField, type IsoDate, type StepId, type View } from '@/lib/appointment';
import { prosthesisStore } from '@/lib/contact-context';
import type { StoreInfo } from '@/components/contact/contact-form';
import { Icon } from '@/components/ui/icon';
import { AppointmentAside, AppointmentProgress, AppointmentSummary, type AppointmentProduct } from './appointment-parts';
export type { AppointmentProduct } from './appointment-parts';
// Four short steps kept in React state only. The URL carries public anchors (#creneau…) so Back/Forward move
// between steps, never what the visitor typed; a reload starts again at the first step.
const subscribe = () => () => {};
const urlFor = (view: View) => `${location.pathname}${location.search}${view === 'visite' ? '' : `#${view}`}`;
const viewFromHash = (hash: string): View | null => { const value = hash.replace(/^#/, ''); return value === '' ? 'visite' : isView(value) ? value : null; };
const nextStep: Record<StepId, StepId> = { visite: 'creneau', creneau: 'coordonnees', coordonnees: 'recapitulatif', recapitulatif: 'recapitulatif' };
const previousStep: Partial<Record<StepId, StepId>> = { creneau: 'visite', coordonnees: 'creneau', recapitulatif: 'coordonnees' };
const titleId = 'rdv-step-title';
export function AppointmentFlow({ stores, initial, today: serverToday, notices, product, stepNotice = false }: { stores: StoreInfo[]; initial: { store: string; reason: string }; today: IsoDate; notices: string[]; product?: AppointmentProduct; stepNotice?: boolean }) {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const storeSlugs = stores.map(s => s.slug);
  const [draft, setDraft] = useState<AppointmentDraft>({ ...emptyDraft, ...initial });
  const [view, setView] = useState<View>('visite');
  const [today, setToday] = useState(serverToday);
  const [errors, setErrors] = useState<AppointmentErrors>({});
  const [result, setResult] = useState<AppointmentDraft | null>(null);
  const [returnToRecap, setReturnToRecap] = useState(false);
  // Explanations of an automatic change: the store moved to Mamao, a slot removed, a step link not followed.
  const [visitMessage, setVisitMessage] = useState<string | null>(null);
  const [slotMessage, setSlotMessage] = useState<string | null>(null);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);
  const focusTarget = useRef<string | null>(null);
  const store = stores.find(s => s.slug === draft.store);
  const days = demoDays(today);
  const slots = draft.date ? slotsFor(draft.store, draft.reason, draft.date) : [];

  useEffect(() => {
    if (!focusTarget.current) return;
    const element = document.getElementById(focusTarget.current);
    element?.focus({ preventScroll: true });
    (element?.id === titleId ? element : element?.closest('fieldset') ?? element)?.scrollIntoView({ block: element?.id === titleId ? 'start' : 'nearest', behavior: 'instant' });
    focusTarget.current = null;
  });

  // Every move re-reads the clock: a day that became today (or past) while the page stayed open is withdrawn.
  const show = (requested: View, source: AppointmentDraft, mode: 'push' | 'pop', simulated = result) => {
    const day = tahitiToday(new Date());
    const { draft: next, issue, lost } = reconcileSlot(source, day);
    const target = allowedView(requested, next, storeSlugs, day, !!simulated && !issue);
    if (day !== today) setToday(day);
    if (next !== source) setDraft(next);
    if (issue && lost) { setSlotMessage(slotNotice(issue, lost)); setResult(null); }
    if (target === 'recapitulatif' || target === 'resultat') setReturnToRecap(false);
    setView(target);
    setErrors({});
    setLinkMessage(null);
    if (mode === 'push' && target !== view) history.pushState(null, '', urlFor(target));
    if (mode === 'pop' && target !== requested) history.replaceState(null, '', urlFor(target));
    focusTarget.current = titleId;
  };
  const refreshDay = useEffectEvent(() => {
    const day = tahitiToday(new Date());
    if (day === today) return;
    if (reconcileSlot(draft, day).issue) show(view, draft, 'pop');
    else setToday(day);
  });
  useEffect(() => {
    // Re-arm even if the wall clock moved backwards and the callback still reads the same day.
    let timer: number;
    const schedule = () => { timer = window.setTimeout(() => { refreshDay(); schedule(); }, millisecondsToTahitiMidnight(new Date()) + 20); };
    schedule();
    const frame = requestAnimationFrame(refreshDay);
    const onVisible = () => { if (document.visibilityState === 'visible') refreshDay(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onVisible);
    return () => { clearTimeout(timer); cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('pageshow', onVisible); };
  }, []);
  const onHistory = useEffectEvent(() => {
    const requested = viewFromHash(location.hash);
    if (requested) show(requested, draft, 'pop');
  });
  useEffect(() => {
    const listener = () => onHistory();
    window.addEventListener('popstate', listener);
    return () => window.removeEventListener('popstate', listener);
  }, []);
  // A link or a reload landing on a later step starts at the first one and says so.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const requested = viewFromHash(location.hash);
      if (!requested || requested === 'visite') return;
      history.replaceState(null, '', urlFor('visite'));
      if (!stepNotice) setLinkMessage('Cette adresse menait à une étape suivante : après un lien direct ou un rechargement, le rendez-vous reprend au choix du magasin et du motif.');
    });
    return () => cancelAnimationFrame(frame);
  }, [stepNotice]);

  // Any change forgets a simulated result and removes a slot that no longer exists.
  const update = (candidate: AppointmentDraft) => {
    const { draft: next, issue, lost } = reconcileSlot(candidate, today);
    setDraft(next);
    setResult(null);
    if (issue && lost) setSlotMessage(slotNotice(issue, lost));
    if (Object.keys(errors).length) {
      const fresh = view === 'resultat' ? {} : validateStep(view, next, storeSlugs, today);
      setErrors(current => Object.fromEntries(Object.keys(current).filter(key => fresh[key as AppointmentField]).map(key => [key, fresh[key as AppointmentField]])));
    }
  };
  const chooseStore = (slug: string) => { setVisitMessage(null); update({ ...draft, store: slug }); };
  const pickReason = (reason: string) => {
    const { draft: next, movedToMamao } = chooseReason(draft, reason);
    setVisitMessage(movedToMamao ? 'Les prothèses oculaires sont suivies uniquement au magasin de Mamao : il a été choisi pour cette visite.' : null);
    update(next);
  };
  const pickDate = (date: IsoDate, focus = false) => { update({ ...draft, date }); if (focus) focusTarget.current = `rdv-day-${date}`; };
  const pickTime = (time: string) => { setSlotMessage(null); update({ ...draft, time }); };

  const focusIdFor = (field: AppointmentField, current: AppointmentDraft, day: IsoDate) => {
    if (field === 'store') return `rdv-store-${current.store || stores[0].slug}`;
    if (field === 'reason') return `rdv-reason-${appointmentReasons.some(r => r.slug === current.reason) ? current.reason : appointmentReasons[0].slug}`;
    if (field === 'date') return `rdv-day-${demoDays(day)[0]}`;
    if (field === 'time') { const offered = slotsFor(current.store, current.reason, current.date); return offered.length ? `rdv-time-${offered[0].replace(':', '')}` : 'rdv-next-day'; }
    return `rdv-${field}`;
  };
  const submit = (event: FormEvent<HTMLFormElement>, step: StepId) => {
    event.preventDefault();
    const day = tahitiToday(new Date());
    if (day !== today) setToday(day);
    const { draft: current, issue, lost } = reconcileSlot(draft, day);
    if (issue && lost) { setSlotMessage(slotNotice(issue, lost)); setDraft(current); setToday(day); }
    if (step === 'recapitulatif') {
      // The simulation only runs on a complete, still valid visit; otherwise the missing step opens.
      if (firstIncompleteStep(current, storeSlugs, day) !== 'recapitulatif') return show('recapitulatif', current, 'push', null);
      setResult(current);
      return show('resultat', current, 'push', current);
    }
    const found = validateStep(step, current, storeSlugs, day);
    const first = fieldOrder.find(key => found[key]);
    if (first) { setErrors(found); focusTarget.current = focusIdFor(first, current, day); return; }
    if (step === 'visite') setVisitMessage(null);
    show(returnToRecap ? 'recapitulatif' : nextStep[step], current, 'push');
  };
  const edit = (step: StepId) => { setReturnToRecap(true); show(step, draft, 'push'); };
  const restart = () => {
    const next = restartDraft(draft);
    setDraft(next);
    setResult(null);
    setVisitMessage(null);
    setSlotMessage(null);
    show('visite', next, 'push', null);
  };

  const described = (key: AppointmentField, hint?: string) => [hint, errors[key] ? `rdv-${key}-error` : ''].filter(Boolean).join(' ') || undefined;
  const error = (key: AppointmentField) => errors[key] && <p className="field-error" id={`rdv-${key}-error`}><Icon name="close" />{errors[key]}</p>;
  const backToRecap = returnToRecap && firstIncompleteStep(draft, storeSlugs, today) === 'recapitulatif';
  const actions = (step: StepId, label = backToRecap ? 'Revenir au récapitulatif' : 'Continuer') => <div className="rdv-actions">
    {previousStep[step] && <button type="button" className="action action-text" onClick={() => show(previousStep[step]!, draft, 'push')}><Icon name="back" />Retour<span className="sr-only"> à l’étape précédente</span></button>}
    <button type="submit" className="action action-primary" disabled={!hydrated}>{label}<Icon name="arrow" /></button>
  </div>;
  const stepForm = (step: StepId, title: string, children: ReactNode) => <form className="rdv-step contact-form" noValidate onSubmit={event => submit(event, step)} aria-labelledby={titleId}>
    <h2 id={titleId} tabIndex={-1}>{title}</h2>
    {children}
  </form>;
  const nextOpenDay = draft.date ? days.find(day => day > draft.date && slotsFor(draft.store, draft.reason, day).length) ?? days.find(day => slotsFor(draft.store, draft.reason, day).length) : undefined;
  const anySlot = days.some(day => slotsFor(draft.store, draft.reason, day).length);
  const mamao = stores.find(s => s.slug === prosthesisStore)!;

  return <div className="contact-layout rdv-layout">
    <div className="contact-main">
      {[...notices, linkMessage].filter(Boolean).map(text => <p className="notice" key={text}>{text}</p>)}
      {view !== 'resultat' && <AppointmentProgress view={view} limit={firstIncompleteStep(draft, storeSlugs, today)} onSelect={step => show(step, draft, 'push')} />}
      {view !== 'resultat' && (visitMessage || slotMessage) && <div role="status">{visitMessage && <p className="notice">{visitMessage}</p>}{slotMessage && <p className="notice">{slotMessage}</p>}</div>}

      {view === 'visite' && stepForm('visite', 'Votre visite', <>
        <fieldset className="contact-stores" role="radiogroup" aria-invalid={errors.store ? true : undefined} aria-describedby={described('store')}>
          <legend>Magasin</legend>
          <div className="store-choices">{stores.map(item => <label key={item.slug} className="store-choice"><input type="radio" id={`rdv-store-${item.slug}`} name="rdv-store" value={item.slug} checked={draft.store === item.slug} onChange={() => chooseStore(item.slug)} /><span><strong>{item.name}</strong><span>{item.city}</span></span></label>)}</div>
          {error('store')}
        </fieldset>
        <fieldset className="contact-stores" role="radiogroup" aria-invalid={errors.reason ? true : undefined} aria-describedby={described('reason', 'rdv-reason-hint')}>
          <legend>Motif</legend>
          <p className="field-hint" id="rdv-reason-hint">Motifs illustratifs : les prestations et les disponibilités sont à confirmer auprès du magasin.</p>
          <div className="rdv-reasons">{appointmentReasons.map(reason => <label key={reason.slug} className="store-choice"><input type="radio" id={`rdv-reason-${reason.slug}`} name="rdv-reason" value={reason.slug} checked={draft.reason === reason.slug} onChange={() => pickReason(reason.slug)} /><span><strong>{reason.label}</strong><span>{reason.summary}{reason.caution && <> {reason.caution}</>}</span></span></label>)}</div>
          {error('reason')}
        </fieldset>
        {draft.reason === prosthesisReason && <p className="rdv-callout"><Icon name="phone" /><span>Prothèses oculaires : uniquement au magasin de Mamao. Pour un vrai rendez-vous, appelez le <a className="underlined" href={`tel:${mamao.phone}`}>+689 {mamao.phoneLabel}</a>.</span></p>}
        {actions('visite')}
      </>)}

      {view === 'creneau' && stepForm('creneau', 'Votre créneau', <>
        <p className="rdv-callout"><Icon name="clock" /><span>Créneaux <strong>fictifs</strong> de démonstration, en heure de Tahiti. Ils ne viennent ni de l’agenda ni des horaires du magasin.{draft.store === 'taravao' && ' À Taravao, les horaires réels restent à confirmer auprès du magasin.'}</span></p>
        <fieldset className="contact-stores" role="radiogroup" aria-invalid={errors.date ? true : undefined} aria-describedby={described('date')}>
          <legend>Jour</legend>
          <div className="rdv-days">{days.map(day => { const label = dayLabel(day); const count = slotsFor(draft.store, draft.reason, day).length; return <label key={day} className="rdv-day" data-empty={count === 0 || undefined}>
            <input type="radio" id={`rdv-day-${day}`} name="rdv-day" value={day} checked={draft.date === day} onChange={() => pickDate(day)} />
            <span aria-hidden="true"><span className="rdv-day-name">{label.short}</span><span className="rdv-day-number">{label.day}</span><span className="rdv-day-month">{label.shortMonth}</span><span className="rdv-day-count">{count ? `${count} créneau${count > 1 ? 'x' : ''}` : 'Aucun'}</span></span>
            <span className="sr-only">{label.full}, {count ? `${count} créneau${count > 1 ? 'x' : ''} fictif${count > 1 ? 's' : ''}` : 'aucun créneau'}</span>
          </label>; })}</div>
          {error('date')}
        </fieldset>
        {!anySlot && <div className="rdv-empty" role="status"><p><strong>Aucun créneau de démonstration dans les sept prochains jours pour ce magasin et ce motif.</strong></p><button type="button" className="action action-secondary" onClick={() => show('visite', draft, 'push')}>Changer de magasin ou de motif<Icon name="arrow" /></button></div>}
        {anySlot && !draft.date && <p className="rdv-pick-day">Choisissez un jour pour afficher ses heures.</p>}
        {anySlot && draft.date && (slots.length ? <fieldset className="contact-stores" role="radiogroup" aria-invalid={errors.time ? true : undefined} aria-describedby={described('time')}>
          <legend>Heure, le {dayLabel(draft.date).full}</legend>
          <div className="rdv-times">{slots.map(time => <label key={time} className="rdv-time"><input type="radio" id={`rdv-time-${time.replace(':', '')}`} name="rdv-time" value={time} checked={draft.time === time} onChange={() => pickTime(time)} /><span>{timeLabel(time)}</span></label>)}</div>
          {error('time')}
        </fieldset> : <div className="rdv-empty" role="status">
          <p><strong>Aucun créneau de démonstration le {dayLabel(draft.date).full}.</strong> Choisissez un autre jour.</p>
          {nextOpenDay && <button type="button" id="rdv-next-day" className="action action-secondary" aria-describedby={described('time')} onClick={() => pickDate(nextOpenDay, true)}>Voir le {dayLabel(nextOpenDay).weekday} {dayLabel(nextOpenDay).day}<Icon name="arrow" /></button>}
          {error('time')}
        </div>)}
        {draft.date && draft.time && <p className="rdv-chosen"><Icon name="calendar" /><span>Créneau choisi : le {dayLabel(draft.date).full} à {timeLabel(draft.time)}, heure de Tahiti.</span></p>}
        {actions('creneau')}
      </>)}

      {view === 'coordonnees' && stepForm('coordonnees', 'Vos coordonnées', <>
        <p className="contact-required">Nom et e-mail sont obligatoires, le téléphone est facultatif. Pour la démonstration, utilisez des données fictives : rien n’est envoyé ni enregistré.</p>
        <div className="field-pair">
          <div className="field"><label htmlFor="rdv-name">Nom</label><input id="rdv-name" type="text" autoComplete="name" maxLength={80} required value={draft.name} aria-invalid={errors.name ? true : undefined} aria-describedby={described('name')} onChange={event => update({ ...draft, name: event.target.value })} />{error('name')}</div>
          <div className="field"><label htmlFor="rdv-email">E-mail</label><input id="rdv-email" type="email" inputMode="email" autoComplete="email" spellCheck={false} maxLength={120} required value={draft.email} aria-invalid={errors.email ? true : undefined} aria-describedby={described('email')} onChange={event => update({ ...draft, email: event.target.value })} />{error('email')}</div>
        </div>
        <div className="field"><label htmlFor="rdv-phone">Téléphone <span>(facultatif)</span></label><input id="rdv-phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={24} value={draft.phone} aria-invalid={errors.phone ? true : undefined} aria-describedby={described('phone')} onChange={event => update({ ...draft, phone: event.target.value })} />{error('phone')}</div>
        {actions('coordonnees')}
      </>)}

      {view === 'recapitulatif' && stepForm('recapitulatif', 'Récapitulatif', <>
        <p className="contact-required">Vérifiez la visite préparée. Chaque partie se modifie avant la simulation.</p>
        <AppointmentSummary draft={draft} storeName={store?.name ?? ''} product={product} onEdit={edit} />
        <div className="contact-submit"><div className="rdv-actions">
          <button type="button" className="action action-text" onClick={() => show('coordonnees', draft, 'push')}><Icon name="back" />Retour<span className="sr-only"> à l’étape précédente</span></button>
          <button type="submit" className="action action-primary" disabled={!hydrated}>Simuler le rendez-vous<Icon name="arrow" /></button>
        </div><p>Simulation : aucune réservation n’est effectuée et aucun e-mail n’est envoyé.</p></div>
      </>)}

      {view === 'resultat' && result && store && <section className="contact-success rdv-result" aria-labelledby={titleId}>
        <Icon name="check" className="contact-success-icon" />
        <h2 id={titleId} tabIndex={-1}>Rendez-vous préparé pour la démonstration.</h2>
        <p className="contact-success-lead">Aucune réservation n’a été effectuée et aucun e-mail n’a été envoyé : ce créneau fictif n’existe dans aucun agenda du magasin.</p>
        <AppointmentSummary draft={result} storeName={store.name} product={product} />
        <p>Pour prendre réellement rendez-vous, appelez Optic 2000 {store.name} au <a className="underlined" href={`tel:${store.phone}`}>+689 {store.phoneLabel}</a> ou écrivez à <a className="underlined" href={`mailto:${store.email}`}>{store.email}</a>.{result.reason === prosthesisReason && ' Pour les prothèses oculaires, le rendez-vous se demande par téléphone.'}{store.slug === 'taravao' && ` ${store.hoursNotice}`}</p>
        <div className="contact-success-actions">
          <Link className="action action-primary" href={`/magasins/${store.slug}`}>Voir le magasin {store.name}<Icon name="arrow" /></Link>
          {product && <Link className="action action-secondary" href={product.href}>Revenir à votre sélection<Icon name="arrow" /></Link>}
          <button type="button" className="action action-text" onClick={restart}>Refaire la démonstration</button>
        </div>
        <p className="rdv-restart-note">Refaire la démonstration garde le magasin {store.name} et efface le motif, le créneau et les coordonnées.</p>
      </section>}
    </div>
    <AppointmentAside store={store} product={product} />
  </div>;
}
