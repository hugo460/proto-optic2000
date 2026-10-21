import pageData from './source/pages.public.json';
import { findMedia } from './index';
import type { SubjectSlug } from '@/lib/contact-context';
// Editorial content reorganised from the public pages of the former site (snapshot 2026-10-21).
// Wording is corrected and regrouped without changing commercial meaning; anything dated or
// historical is labelled as such and stays to be confirmed by the stores.
export interface SourcePage { id: number; slug: string; url: string; title: string; date: string; modified: string; contentSha256: string; text?: string }
export const sourcePages = pageData as SourcePage[];
export const collectedAt = '2026-10-21';
export const getSourcePage = (slug: string) => {
  const page = sourcePages.find(p => p.slug === slug);
  if (!page) throw new Error(`Unknown source page: ${slug}`);
  return page;
};

export const contactHrefFor = (subject: SubjectSlug, store?: string) => `/contact?sujet=${subject}${store ? `&magasin=${store}` : ''}`;

export const editorialMedia = {
  campaignGold: findMedia('4fc6abc0d6'),
  campaignBlue: findMedia('62e14c3acf'),
  team: findMedia('6b3c1455b1'),
  telescope: findMedia('b413c0bdf9'),
  binoculars: findMedia('16bd866170'),
};

// Services published on the former home page (« Nos services »). Each `source` sentence must be
// present in the snapshot text of that page (checked by `pnpm check:data`).
export interface ServiceBlock { id: string; title: string; paragraphs: string[]; terms?: { label: string; value: string }[]; note?: string; source: string[] }
export const services: ServiceBlock[] = [
  {
    id: 'devis', title: 'Devis gratuits',
    paragraphs: ['Lors de votre passage en magasin, nos opticiens réalisent gratuitement un ou plusieurs devis sur les équipements qui vous conviennent, pour associer vos besoins à votre budget.'],
    source: ['nous réalisons gratuitement un ou plusieurs devis sur les équipements qui vous conviennent'],
  },
  {
    id: 'entretien', title: 'Entretien et petites réparations',
    paragraphs: ['Un nettoyage complet des lunettes est proposé aux clients.', 'En atelier, nos techniciens réalisent une vérification en 10 points pour retrouver le confort d’origine de votre équipement.', 'Le changement des plaquettes et les réparations mineures sont offerts aux clients.'],
    source: ['nettoyage complet des lunettes de nos clients', 'une vérification en 10 points', 'Le changement des plaquettes et tout type de réparations mineures sera offert à nos clients'],
  },
  {
    id: 'garanties', title: 'Garanties des montures et des verres',
    paragraphs: ['Les garanties publiées couvrent la monture et les verres, avec les limites ci-dessous.'],
    terms: [
      { label: 'Montures', value: 'Garantie de deux ans, pour chaque partie de vos lunettes. Une casse accidentelle de la monture est prise en charge à 100 %.' },
      { label: 'Verres', value: 'Garantie à 100 %, jusqu’à 3 ans, contre tout défaut de fabrication.' },
      { label: 'Ne couvre pas', value: 'Les dégradations dues à une mauvaise utilisation, une chute, une rayure ou toute autre action de votre part.' },
      { label: 'Dans ces cas', value: 'Une remise de 60 % pendant 2 ans est accordée pour l’échange d’un produit identique.' },
    ],
    note: 'Les phrases sur la casse accidentelle et sur les chutes sont reprises telles qu’elles étaient publiées : leur articulation exacte est à faire préciser en magasin.',
    source: ['Toutes nos montures bénéficient d’une garantie de deux ans et cela pour chaque partie de vos lunettes', 'Même une casse accidentel de votre monture sera prise en charge à 100%', 'garantie à 100%, jusqu’à 3 ans, contre tout défaut de fabrication', 'Cette garantie ne couvre pas les dégradations suite à une mauvaise utilisation, chute, rayure ou toute autre action de votre part', 'une remise de 60% pendant 2 ans en échange produit à l’identique'],
  },
  {
    id: 'adaptation', title: 'Garantie d’adaptation',
    paragraphs: ['Après un changement de correction, il faut souvent un peu de temps pour se sentir bien dans ses lunettes.', 'Pour l’achat d’une paire de lunettes avec verres correcteurs, une garantie d’adaptation est offerte automatiquement : si l’inconfort persiste dans les trois mois suivant l’achat, passez en magasin.'],
    source: ['en achetant une paire de lunettes avec des verres correcteurs, nous vous offrons automatiquement une garantie d’adaptation', 'si dans les trois mois suivant l’achat, vous ressentez toujours de l’inconfort, nous vous invitons à passer en magasins'],
  },
  {
    id: 'financement', title: 'Solutions de financement',
    paragraphs: ['L’ancien site mentionnait plusieurs solutions de financement : paiement en plusieurs fois, carte de crédit à débit différé, financement longue durée.', 'Les solutions proposées aujourd’hui et leurs conditions sont à demander en magasin.'],
    source: ['paiement en plusieurs fois, carte de crédit débit différé, financement longue durée'],
  },
];

// Former « Nos offres » page: three dated 2022 visuals, deliberately not displayed as offers.
export const historicalOffers = ['deuxième paire offerte', 'forfait simple vision', 'forfait verres progressifs'];

export const teamArticles = [
  { href: 'https://hommesdepolynesie.com/societe/prendre-soin-de-vue-coulisses-doptic-2000/', site: 'Hommes de Polynésie', about: 'Serge' },
  { href: 'https://femmesdepolynesie.com/carriere/optic-2000-tahiti/', site: 'Femmes de Polynésie', about: 'Magali et Maeva' },
];

// Former legal notice: historical, to be validated, never presented as the operator of this prototype.
export const historicalLegal = [
  { label: 'Société', value: 'SARL S2M' },
  { label: 'Adresse', value: 'BP 775, 98713 Papeete, Tahiti, Polynésie française' },
  { label: 'Numéro Tahiti', value: '976464' },
  { label: 'Directeur de la publication', value: 'S. Ganancia' },
];
