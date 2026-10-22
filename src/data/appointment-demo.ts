import type { Store } from './stores';
// Demonstration appointment data. Everything here is FICTITIOUS: it is not the stores' agenda, it is not
// derived from their published hours (Taravao's stay « à confirmer »), and it books nothing. Kept apart from
// `stores.ts` so the real store data stays free of invented availability, and free of data imports so the
// client island can use it without bundling the catalogue.
export type StoreSlug = Store['slug'];
export const appointmentReasons = [
  {
    slug: 'controle-vue', label: 'Contrôle de vue',
    summary: 'Faire vérifier votre vue par un opticien avant de choisir un équipement.',
    caution: 'Ce n’est pas une consultation médicale ni ophtalmologique.',
  },
  {
    slug: 'conseil-montures', label: 'Conseil et essai de montures',
    summary: 'Essayer des montures et comparer des modèles avec un opticien.',
    caution: null,
  },
  {
    slug: 'protheses', label: 'Prothèses oculaires',
    summary: 'Uniquement à Mamao, avec l’opticien-oculariste.',
    caution: 'Le vrai rendez-vous se demande par téléphone au magasin de Mamao.',
  },
] as const;
export type ReasonSlug = (typeof appointmentReasons)[number]['slug'];
// Prosthesis appointments exist only at Mamao (same rule as the contact form).
export const prosthesisReason: ReasonSlug = 'protheses';
// Weekday (0 = Sunday … 6 = Saturday) → fictitious times per reason, in Tahiti time. No store has a demo slot on
// Sunday, so every seven-day window offers a day without any slot; Taravao also has none on Monday and Thursday.
type Times = readonly string[];
type DaySlots = Partial<Record<ReasonSlug, Times>>;
type Week = Partial<Record<0 | 1 | 2 | 3 | 4 | 5 | 6, DaySlots>>;
const town: DaySlots = { 'conseil-montures': ['08:30', '10:00', '11:30', '14:00', '15:30'], 'controle-vue': ['09:00', '13:30', '16:00'] };
const townLate: DaySlots = { 'conseil-montures': ['09:30', '11:00', '14:30', '16:00'], 'controle-vue': ['10:30', '15:00'] };
const saturday: DaySlots = { 'conseil-montures': ['08:30', '10:00', '11:30'], 'controle-vue': ['09:30'] };
export const demoWeek: Record<StoreSlug, Week> = {
  'centre-ville': { 1: town, 2: townLate, 3: town, 4: townLate, 5: town, 6: saturday },
  mamao: {
    1: townLate, 2: { ...town, protheses: ['09:00', '10:30'] }, 3: { 'conseil-montures': ['09:00', '14:00', '15:30'] },
    4: { ...townLate, protheses: ['08:30', '13:30'] }, 5: town, 6: saturday,
  },
  taravao: {
    2: { 'conseil-montures': ['09:00', '10:30', '14:30'], 'controle-vue': ['11:00'] },
    3: { 'conseil-montures': ['09:30', '15:00'] },
    5: { 'conseil-montures': ['09:00', '14:00', '16:00'], 'controle-vue': ['10:00', '15:00'] },
    6: { 'conseil-montures': ['09:00', '10:30'] },
  },
};
