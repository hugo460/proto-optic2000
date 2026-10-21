// Site destinations shared by the header, mobile menu, footer and home index. Kept free of data
// imports so the client header does not bundle the catalogue snapshot.
export interface Destination { href: string; label: string; summary: string }
// Order of the universes in the header panel, the mobile menu, the footer and the home index.
export const universes: Destination[] = [
  { href: '/lunettes-de-vue', label: 'Lunettes de vue', summary: 'Seize marques de montures à essayer en magasin.' },
  { href: '/solaires', label: 'Les solaires', summary: 'La collection Maui Jim en ligne, coloris par coloris.' },
  { href: '/lentilles', label: 'Lentilles', summary: 'Cinq lentilles de couleur en ligne, l’entretien en magasin.' },
  { href: '/jumelles-et-telescopes', label: 'Jumelles et télescopes', summary: 'Bosma, Celestron et Perl, conseillés selon votre pratique.' },
  { href: '/basse-vision', label: 'Basse vision', summary: 'Loupes et systèmes optiques pour lire, écrire, utiliser un écran.' },
  { href: '/protheses-oculaires', label: 'Prothèses oculaires', summary: 'Un opticien-oculariste à Mamao, uniquement sur rendez-vous.' },
];
export const houseLinks: Destination[] = [
  { href: '/services-et-garanties', label: 'Services et garanties', summary: 'Devis, entretien, garanties et adaptation, avec leurs conditions.' },
  { href: '/qui-sommes-nous', label: 'Qui sommes-nous', summary: 'L’équipe et les articles qui lui ont été consacrés.' },
];
export const legalLinks = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/politique-de-confidentialite', label: 'Confidentialité' },
  { href: '/cgv', label: 'CGV' },
];
