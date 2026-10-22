import type { Product } from '@/data/types';
import { appointmentReasons, demoWeek, prosthesisReason, type ReasonSlug, type StoreSlug } from '@/data/appointment-demo';
import { prosthesisStore, validatePerson, type PersonFields } from './contact-context';
import { queryValue, readSelection, type Query, type Selection } from './lens-selection';
// Demonstration appointment: pure functions only. Dates are computed in Pacific/Tahiti from an injected clock,
// never from the machine's or the visitor's time zone. Nothing here sends, stores or books anything.
export const appointmentTimeZone = 'Pacific/Tahiti';
export const demoDayCount = 7;
export type IsoDate = string;

// ---- Dates ---------------------------------------------------------------------------------------------------------
const tahitiParts = new Intl.DateTimeFormat('en-US', { timeZone: appointmentTimeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
export function tahitiToday(now: Date): IsoDate {
  const part = (type: string) => tahitiParts.formatToParts(now).find(p => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
const utcOf = (iso: IsoDate) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
export function addDays(iso: IsoDate, days: number): IsoDate {
  const date = utcOf(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export const weekdayOf = (iso: IsoDate) => utcOf(iso).getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
// The days offered start tomorrow in Tahiti: no day of the list, and so no slot, can already be past.
export function demoDays(today: IsoDate, count = demoDayCount): IsoDate[] {
  return Array.from({ length: count }, (_, index) => addDays(today, index + 1));
}
// Tahiti stays at UTC−10. Schedule a day refresh even when the visitor leaves the form open at midnight.
export function millisecondsToTahitiMidnight(now: Date): number {
  return Date.parse(`${addDays(tahitiToday(now), 1)}T00:00:00-10:00`) - now.getTime();
}
// French labels written out so the server and every browser render the same text.
const weekdays = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const shortMonths = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
export function dayLabel(iso: IsoDate) {
  const date = utcOf(iso);
  const day = date.getUTCDate();
  const weekday = weekdays[date.getUTCDay()];
  return { weekday, short: `${weekday.slice(0, 3)}.`, day, month: months[date.getUTCMonth()], shortMonth: shortMonths[date.getUTCMonth()], full: `${weekday} ${day === 1 ? '1er' : day} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}` };
}
export const timeLabel = (time: string) => { const [h, m] = time.split(':'); return `${Number(h)}h${m === '00' ? '' : m}`; };

// ---- Fictitious slots ----------------------------------------------------------------------------------------------
export const isReason = (value: string | undefined): value is ReasonSlug => appointmentReasons.some(r => r.slug === value);
export const reasonLabel = (slug: string) => appointmentReasons.find(r => r.slug === slug)?.label;
export function slotsFor(store: string, reason: string, date: IsoDate): readonly string[] {
  if (!(store in demoWeek) || !isReason(reason)) return [];
  return demoWeek[store as StoreSlug][weekdayOf(date)]?.[reason] ?? [];
}

// ---- Steps, validation and invalidation ----------------------------------------------------------------------------
export const appointmentSteps = [
  { id: 'visite', label: 'Votre visite' }, { id: 'creneau', label: 'Votre créneau' },
  { id: 'coordonnees', label: 'Vos coordonnées' }, { id: 'recapitulatif', label: 'Récapitulatif' },
] as const;
export type StepId = (typeof appointmentSteps)[number]['id'];
export type View = StepId | 'resultat';
export const isView = (value: string): value is View => value === 'resultat' || appointmentSteps.some(s => s.id === value);
export interface AppointmentDraft extends PersonFields { store: string; reason: string; date: IsoDate; time: string }
export type AppointmentField = keyof AppointmentDraft;
export type AppointmentErrors = Partial<Record<AppointmentField, string>>;
export const emptyDraft: AppointmentDraft = { store: '', reason: '', date: '', time: '', name: '', email: '', phone: '' };
export const fieldOrder: AppointmentField[] = ['store', 'reason', 'date', 'time', 'name', 'email', 'phone'];
export function validateStep(step: StepId, draft: AppointmentDraft, storeSlugs: readonly string[], today: IsoDate): AppointmentErrors {
  if (step === 'visite') {
    const errors: AppointmentErrors = {};
    if (!storeSlugs.includes(draft.store)) errors.store = 'Choisissez le magasin de votre visite.';
    else if (draft.reason === prosthesisReason && draft.store !== prosthesisStore) errors.store = 'Les prothèses oculaires sont suivies uniquement au magasin de Mamao. Choisissez Mamao ou un autre motif.';
    if (!isReason(draft.reason)) errors.reason = 'Choisissez le motif de votre visite.';
    return errors;
  }
  if (step === 'creneau') {
    if (!demoDays(today).includes(draft.date)) return { date: 'Choisissez un jour parmi les sept prochains jours.' };
    if (!slotsFor(draft.store, draft.reason, draft.date).includes(draft.time)) return { time: 'Choisissez une heure parmi les créneaux de ce jour.' };
    return {};
  }
  if (step === 'coordonnees') return validatePerson(draft);
  return { ...validateStep('visite', draft, storeSlugs, today), ...validateStep('creneau', draft, storeSlugs, today), ...validatePerson(draft) };
}
// The first step that still needs an answer; the recap is reachable only when every earlier step is complete.
export function firstIncompleteStep(draft: AppointmentDraft, storeSlugs: readonly string[], today: IsoDate): StepId {
  for (const { id } of appointmentSteps.slice(0, 3)) if (Object.keys(validateStep(id, draft, storeSlugs, today)).length) return id;
  return 'recapitulatif';
}
const stepIndex = (view: View) => view === 'resultat' ? appointmentSteps.length : appointmentSteps.findIndex(s => s.id === view);
// A requested view (link, Back/Forward, edit) never skips a required step, and the result only exists once simulated.
export function allowedView(requested: View, draft: AppointmentDraft, storeSlugs: readonly string[], today: IsoDate, hasResult: boolean): View {
  const limit = firstIncompleteStep(draft, storeSlugs, today);
  if (requested === 'resultat') return hasResult && limit === 'recapitulatif' ? 'resultat' : limit;
  return stepIndex(requested) <= stepIndex(limit) ? requested : limit;
}
export type SlotIssue = 'past' | 'unavailable';
// Keeps a chosen slot only while it is still offered for this store, reason and day, and the day is still ahead.
export function reconcileSlot(draft: AppointmentDraft, today: IsoDate): { draft: AppointmentDraft; issue?: SlotIssue; lost?: { date: IsoDate; time: string } } {
  if (!draft.date) return { draft };
  if (!demoDays(today).includes(draft.date)) return { draft: { ...draft, date: '', time: '' }, issue: 'past', lost: { date: draft.date, time: draft.time } };
  if (draft.time && !slotsFor(draft.store, draft.reason, draft.date).includes(draft.time)) return { draft: { ...draft, time: '' }, issue: 'unavailable', lost: { date: draft.date, time: draft.time } };
  return { draft };
}
export function slotNotice(issue: SlotIssue, lost: { date: IsoDate; time: string }): string {
  const when = `${dayLabel(lost.date).full}${lost.time ? ` à ${timeLabel(lost.time)}` : ''}`;
  return issue === 'past'
    ? `Le ${when} n’est plus proposé : la liste commence toujours au lendemain. Choisissez un nouveau jour.`
    : `Le créneau du ${when} n’existe pas pour ce magasin et ce motif. Il a été retiré : choisissez une autre heure.`;
}
// Choosing the prosthesis reason moves the visit to Mamao, as the contact form does.
export function chooseReason(draft: AppointmentDraft, reason: string): { draft: AppointmentDraft; movedToMamao: boolean } {
  const movedToMamao = reason === prosthesisReason && draft.store !== prosthesisStore;
  return { draft: { ...draft, reason, store: movedToMamao ? prosthesisStore : draft.store }, movedToMamao };
}
// Starting the demonstration again keeps the store and forgets everything else.
export const restartDraft = (draft: AppointmentDraft): AppointmentDraft => ({ ...emptyDraft, store: draft.store });

// ---- Public link context (server side) -----------------------------------------------------------------------------
const contextKeys = ['magasin', 'motif', 'produit', 'variante', 'couleur', 'sphere', 'etape'];
export interface AppointmentContext { store?: string; reason?: ReasonSlug; selection?: Selection; storeCorrected: boolean; ignored: boolean; skippedStep: boolean }
// Only public identifiers are read; an unknown key or value is ignored (never displayed) and reported by a notice.
export function readAppointmentContext(query: Query, source: { products: readonly Product[]; stores: readonly { slug: string }[] }): AppointmentContext {
  const keys = query instanceof URLSearchParams ? [...new Set(query.keys())] : Object.keys(query);
  let ignored = keys.some(key => !contextKeys.includes(key));
  const unambiguous = new URLSearchParams();
  for (const key of keys) {
    const raw = query instanceof URLSearchParams ? query.getAll(key) : query[key];
    const values = Array.isArray(raw) ? raw : raw === undefined ? [] : [raw];
    if (new Set(values).size > 1) { ignored = true; continue; }
    if (values[0] !== undefined) unambiguous.set(key, values[0]);
  }
  query = unambiguous;
  const rawStore = queryValue(query, 'magasin');
  let store = source.stores.find(s => s.slug === rawStore)?.slug;
  const rawReason = queryValue(query, 'motif');
  const rawStep = queryValue(query, 'etape') ?? '';
  if (rawStep && !isView(rawStep)) ignored = true;
  const reason = isReason(rawReason) ? rawReason : undefined;
  const rawProduct = queryValue(query, 'produit');
  const product = rawProduct ? source.products.find(p => p.slug === rawProduct) : undefined;
  const selection = product ? readSelection(product, query) : undefined;
  if ((rawStore && !store) || (rawReason && !reason) || (rawProduct && !product) || selection?.rejected.length) ignored = true;
  if (!product && ['variante', 'couleur', 'sphere'].some(key => queryValue(query, key))) ignored = true;
  const storeCorrected = reason === prosthesisReason && !!store && store !== prosthesisStore;
  if (reason === prosthesisReason) store = prosthesisStore;
  return { store, reason, selection, storeCorrected, ignored, skippedStep: isView(rawStep) && rawStep !== 'visite' };
}
