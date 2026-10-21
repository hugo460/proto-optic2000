// Characteristics read in the five public lens descriptions (product.description, unchanged in the
// catalogue). Packaging and renewal are shown as facts; stock, order delays and seasonal rules
// were conditions of the former online shop and are shown only as dated reservations.
export interface LensFacts { facts: string[]; history?: string }
export const lensFacts: Record<string, LensFacts> = {
  'freshlook-1-day': {
    facts: ['Boîte de 10 lentilles.'],
    history: 'La fiche publique de 2022 annonçait un stock sans correction et un délai de commande pour les corrections (sphère).',
  },
  'freshlook-colorblends': {
    facts: ['Boîte de 2 lentilles.', 'Renouvellement mensuel.'],
    history: 'La fiche publique de 2022 annonçait un stock sans correction, sauf mention contraire, et un délai pour les commandes.',
  },
  'trublends-one-day': {
    facts: ['Boîte de 10 lentilles.'],
    history: 'La fiche publique de 2022 indiquait des corrections (sphère) sur commande uniquement, avec un délai de commande.',
  },
  'trublends-one-day-5-couleurs': {
    facts: ['Boîte de 10 lentilles, 5 couleurs dans la boîte.', 'Sans correction.'],
  },
  'colourvue-crazylens-one-day': {
    facts: [],
    history: 'La fiche publique de 2022 indiquait une version sans correction et une version avec correction (sphère) sur commande, hors période de fêtes, avec un délai : règle historique à confirmer.',
  },
};
