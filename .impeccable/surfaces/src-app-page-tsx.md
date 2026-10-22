---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/components/catalog/home-showcase.tsx","src/components/catalog/hero-video.tsx","src/components/catalog/brand-marquee.tsx","src/components/layout/header.tsx","src/components/layout/footer.tsx","src/components/layout/footer-visit-action.tsx"]
---

# Accueil — S1, recomposé en S5/r2

Mode: Persuade. Cible: `/`. Décision de session: construction en code confirmée par Hugo ; composition « Le nuancier solaire » confirmée par Hugo via question structurée pendant S1. S5/r2 recompose cette surface sans changer d’identité (logo réel, noir, lavande, jaune, Sora, Manrope ; seed historique `ec9ae70fdd93869f` inchangé).

Public et tâche: découvrir les vraies solaires d’Optic 2000 Tahiti puis inspecter une référence ou choisir un magasin. Preuves: montures du snapshot, identité réelle et photos des magasins. Contraintes: aucun panier, aucune promesse de stock, aucun visuel touristique.

## Direction contract

THESIS: Un accueil d’opticien éditorial et clair : le message et la matière dominent, la vraie monture reste le sujet d’un nuancier secondaire, et la sélection agit immédiatement.

OWN-WORLD: Lavande franche, noir lisible, jaune réservé à l’action ; petit plateau blanc pour la fidélité des montures. Lettres géométriques Sora et lecture Manrope, contours simples, peu de rayons, aucun effet de verre, de gradient décoratif ni de doré.

STORY: Le visiteur reconnaît Optic 2000 et Tahiti, parcourt trois modèles réels, ouvre leur fiche, retrouve les marques, les univers puis l’un des trois magasins.

FIRST VIEWPORT: Navigation noire avec logo intact ; un hero en deux parts, texte sur lavande unie et film de matière sans visage dans sa propre part. Titre, courte proposition, une action jaune « Toutes les solaires », lien « Préparer un rendez-vous », puis le nuancier compact. Le début du bandeau de marques reste dans le premier écran à 390×844 et 360×800.

FORM: Nuancier de collection, candidat 4 ; seed:ec9ae70fdd93869f. Les challengers déclinent devant l’identification et la clarté métier. Leurs apports sont la composition d’ensemble, les couleurs informatives, la traçabilité, le changement perceptible, le contexte conservé et l’échelle stable. Palette adaptée aux preuves Optic 2000, sans prétendre à une charte officielle.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

États: choix initial/changé, focus, survol, clavier, réduction du mouvement, économie de données, mobile et desktop. Sortie: fiche réelle ou catalogue partageable, puis fiche magasin. Incertitude client: actualité des prix et horaires.

## Contrat S5/r2 — accueil recomposé

### Hero

- **Partage** : plus de 1100 px, texte 45 % / film 55 % ; de 801 à 1100 px, 50 / 50 ; jusqu’à 800 px, bande de film (`clamp(172px, 33vw, 256px)`, 172 px sur téléphone) puis texte. Le texte s’aligne sur la colonne du conteneur à toutes les largeurs (marge `max(48px, (100vw − 1344px) / 2 + 48px)`) ; le film déborde jusqu’au bord droit.
- **Contenu** : titre « Le soleil. À votre façon. », proposition courte, une seule action jaune (« Toutes les solaires ») et le lien texte « Préparer un rendez-vous ». Actions en colonne jusqu’à 1280 px, en ligne avec retour à la ligne au-dessus. Aucune commande de média dans cette rangée.
- **Texte et film** : le texte sombre n’est jamais posé sur l’image en mouvement. Aucun voile, filtre ni désaturation ; le contraste se mesure sur la lavande unie.
- **Nuancier secondaire** : trois boutons nommés (Glory Glory, Baby Beach, The Bird ; `aria-pressed`, 44 px, soulignement d’encre), puis la vraie monture seule sur un petit plateau blanc sans cadre ni panneau d’informations : 208 × 104 px (184 × 96 jusqu’à 1100 px, 136 × 82 de 801 à 960 px, 136 × 76 jusqu’à 600 px, 116 × 68 jusqu’à 370 px), photo entière. Nom, « Maui Jim · n coloris », prix source et « Découvrir ce modèle » à côté. Photo et fiche forment la région d’annonce polie. Aucune sélection automatique.
- **Mouvement de la monture** : `frame-arrive`, 520 ms, une fois au chargement puis à chaque choix (opacité .75 → 1, translation (−10 px, 4 px), (−8 px, 3 px) sur téléphone, rotation −1,5°), puis repos ; transform/opacity seulement, pas de faux 3D. Mouvement réduit : pose stable.
- **Film** : trois plans Pexels distincts de lunettes et de matières, sans visage, à vitesse native (24,32 s, 1920 × 1080, 25 i/s, muet, 4 895 212 octets ; poster 42 206 octets) ; fondus de .48 s et raccord circulaire, ni marche arrière, ni répétition ajoutée, ni ralenti. Provenance et plages dans `docs/hero-media.json` ; aucune légende ne relie le film au catalogue ou à un magasin.
- **États du film** : le serveur et l’hydratation rendent le poster sans source ; la source n’est posée qu’après lecture de `prefers-reduced-motion` et de `navigator.connection.saveData`, et retirée si l’une change. Lecture seulement dans le champ et sur un onglet visible (sur téléphone, la bande seule) ; refus d’autoplay ou erreur : poster, sans démarrage manuel. **Aucune commande Pause/Lire**, visible, masquée ou remplacée par une icône.

### Sous le hero

- **Bandeau de marques** : 13 logos réels dérivés (canevas extérieur vide retiré seulement ; originaux intacts), boucle de 52 s dans une piste masquée aux bords, cellules entières (3 jusqu’à 800 px, 4 de 801 à 1100 px, 5 de 1101 à 1280 px, 6 au-delà), « Toutes les marques » dans sa propre colonne. **Aucun bouton** : pause au vrai survol, au focus clavier (retour à la liste originale immobile et défilable), hors champ et onglet masqué ; clones `aria-hidden`, hors tabulation, liens utilisables au pointeur ; mouvement réduit = rangée manuelle de la liste originale.
- **Sélection produits** : Mamane, Alulu, Pehu, Liquid Sunshine (cartes produit existantes), distincte des trois modèles du nuancier.
- **Index des univers** : autour de la photo d’équipe existante, six liens courts en deux colonnes (Sora, sans descriptif ni filet), puis « Services et garanties » et « Qui sommes-nous » en liens soulignés. Pas de série de cartes icône + texte, pas de réplique du menu.
- **Magasins** : les trois réels (Centre-ville, Mamao, Taravao à confirmer).

### Navigation et pied de page

- **En-tête** : noir, 84 px (76 jusqu’à 800 px, 74 jusqu’à 600 px), logo intact. « Nos univers » ouvre un panneau de papier ancré sous la barre (≤ 820 px) : six univers sur deux colonnes, enseigne sur une colonne étroite, libellés de 17 px sans descriptif ni filet ; les `summary` restent dans les données. Fermeture : Échap (focus au bouton), clic extérieur, sortie clavier, lien ou navigation. À 801–1100 px l’action jaune se réduit à « RDV » ; de 801 à 960 px seulement, le doublon « Les solaires » quitte la barre et reste dans les univers.
- **Menu mobile** (jusqu’à 800 px) : dialogue blanc nommé « Menu », largeur `min(92vw, 420px)`, défilable, toutes les destinations, action visible « Préparer un RDV » (nom accessible identique au texte visible), retour du focus au déclencheur. Sur le rendez-vous sans paramètre, l’action conserve l’étape et le hash ; le focus va au titre de l’étape depuis le menu.
- **Pied de page** : compact, identité et actions sur une ligne, magasins (nom, adresse, téléphone) à côté du plan du site, mention du prototype ; sur le rendez-vous l’action devient « Préparer une demande » en lien texte. L’état React du rendez-vous est conservé.

## Historique remplacé

- **S1** : grand plateau pleine largeur avec choix dessous ; menu lavande plein écran « Nos univers » — remplacés.
- **S4** : piste de marques avec pause/reprise ; « aucune vidéo » — pause retirée en S5/r2, vidéo introduite en S5.
- **S5/r1** (demandé puis rejeté par Hugo le 21/10/2026) : cadre opaque à filet d’encre avec onglets cloisonnés, film de 8 s en aller-retour sous voile lavande désaturé, commande Pause/Lire du film et des marques. Ces prescriptions sont **remplacées** par le contrat ci-dessus ; elles ne s’appliquent plus.
- **S6/r1** : prévue seulement, pour les listes, fiches, marques/magasins, formulaires et contenus ; ses détails ne sont pas figés ici.
