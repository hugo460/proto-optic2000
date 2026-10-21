---
name: "Optic 2000 Tahiti"
description: "Le nuancier solaire — système visuel livré du prototype catalogue et magasins."
colors:
  yellow: "#ffda00"
  yellow-hover: "#f1c900"
  lavender: "#aba5d2"
  lavender-soft: "#eeecf6"
  lavender-ink: "#38314f"
  focus: "#43328b"
  ink: "#171717"
  paper: "#ffffff"
  surface: "#f3f3f5"
  muted: "#56565e"
  line: "#c7c7ce"
  inverse-muted: "#c7c7ce"
  header-black: "#000000"
typography:
  display:
    fontFamily: "Sora, sans-serif"
    fontSize: "clamp(2.5rem, 5vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-.035em"
  headline:
    fontFamily: "Sora, sans-serif"
    fontSize: "clamp(1.8rem, 3.4vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-.035em"
  title:
    fontFamily: "Sora, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-.025em"
  card-title:
    fontFamily: "Sora, sans-serif"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-.025em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "12px"
    fontWeight: 750
    lineHeight: 1.6
  action:
    fontFamily: "Manrope, sans-serif"
    fontSize: ".94rem"
    fontWeight: 750
    lineHeight: 1.35
  navigation:
    fontFamily: "Manrope, sans-serif"
    fontSize: "14px"
    fontWeight: 650
    lineHeight: 1.6
  option:
    fontFamily: "Manrope, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  control: "4px"
  square: "0"
spacing:
  step-1: "4px"
  step-2: "8px"
  step-3: "12px"
  step-4: "16px"
  step-6: "24px"
  step-8: "32px"
  step-12: "48px"
  step-16: "64px"
  step-24: "96px"
components:
  button-primary:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "14px 22px"
  button-primary-hover:
    backgroundColor: "{colors.yellow-hover}"
  button-dark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "14px 22px"
  button-dark-hover:
    backgroundColor: "{colors.lavender-ink}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "14px 22px"
  button-secondary-hover:
    backgroundColor: "{colors.surface}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "12px 0"
  search-input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 16px"
  navigation:
    backgroundColor: "{colors.header-black}"
    textColor: "{colors.paper}"
    typography: "{typography.navigation}"
  filter-chip:
    backgroundColor: "{colors.lavender-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.option}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  product-card:
    textColor: "{colors.ink}"
    typography: "{typography.card-title}"
  product-plateau:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.square}"
    padding: "12px"
  variant-option:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.option}"
    rounded: "{rounded.control}"
    padding: "7px 12px"
  variant-option-selected:
    padding: "6px 11px"
  product-details:
    textColor: "{colors.ink}"
---

# Design System: Optic 2000 Tahiti

## Overview

**Creative North Star: "Le nuancier solaire"**

« Le nuancier solaire » associe une lavande franche, des lettres géométriques, des informations noires et des actions jaunes. Le sujet reste la vraie monture : elle apparaît sur un plateau clair, à son échelle et sans déformation. Les magasins sont représentés par leurs photographies authentiques et les marques par leurs logos intacts.

Le système est direct et calme dans les parcours de recherche, de comparaison et de contact. Les surfaces sont planes, les contours simples et la densité s’adapte à la tâche. Sora donne de la présence aux titres ; Manrope maintient la lisibilité des informations, des prix et des commandes. La lavande contextualise, le jaune invite à agir et le focus reste distinct.

Cette documentation décrit le prototype effectivement livré en S1 : Next.js 16.4.2, React 19.3.1 et CSS natif, sans bibliothèque UI. La palette et les polices constituent une direction de prototype confirmée, pas une charte officielle du client. La composition du seul accueil et ses trois modèles appartiennent à son contrat de surface ; elles ne deviennent pas un gabarit pour les écrans suivants.

**Key Characteristics:**

- Montures fidèles sur plateaux clairs ; photos et logos authentiques.
- Lavande de contexte, jaune d’action, encre de lecture.
- Titres Sora et lecture Manrope, avec polices locales variables.
- Surfaces planes, coins simples et séparateurs fins.
- Choix explicites, focus visible et parcours réversibles.

## Colors

La palette met en relation un jaune franc, une famille lavande et des neutres de lecture. Les valeurs normatives sont dans le frontmatter ; les noms ci-dessous en précisent les usages.

### Primary

- **Jaune d’action** (`yellow`) : actions principales, liens actifs de la navigation noire, sélection de texte et focus sur les zones sombres. **Jaune au survol** (`yellow-hover`) : réponse des actions jaunes, sans changement de géométrie.

### Secondary

- **Lavande franche** (`lavender`) : environnement de sélection et menu mobile.
- **Lavande douce** (`lavender-soft`) : contexte produit conservé, filtres actifs, présentations de marques et accompagnement.
- **Encre lavande** (`lavender-ink`) : texte sur lavande et survol d’une action sombre.
- **Violet de focus** (`focus`) : contour clavier sur fond clair et repère du curseur dans les champs. Ce rôle est fonctionnel ; il ne remplace pas un état sélectionné.

### Neutral

- **Encre** (`ink`) : texte principal, sélection encadrée, bouton sombre et pied de page.
- **Papier** (`paper`) : fond principal, intérieur des photographies produit, champs et texte inversé.
- **Plateau gris** (`surface`) : entourage des photographies produit, zone de filtres, états vides et fallback média.
- **Texte secondaire** (`muted`) : marques, explications, légendes et réserves.
- **Filet** (`line`) : bordures de champs, séparateurs, miniatures et options non sélectionnées.
- **Texte inversé secondaire** (`inverse-muted`) : informations secondaires du pied de page ; même valeur source que le filet, rôle distinct.
- **Noir d’en-tête** (`header-black`) : fond noir du bandeau de navigation, distinct de l’encre du pied de page.

**The Plateau fidèle Rule.** Présenter les montures et les logos entiers avec object-fit: contain ; réserver object-fit: cover aux photographies de magasin.

**The Action jaune Rule.** Associer le jaune aux actions principales et aux repères interactifs ; conserver les libellés et les états sémantiques pour que la couleur ne porte jamais seule le sens.

Le code n’emploie pas de rampe tonale complète. Les huit étapes OKLCH par couleur dans le sidecar sont synthétiques, documentaires et sans effet sur le rendu livré ; elles ne constituent ni des variantes approuvées ni des tokens supplémentaires.

## Typography

**Display Font:** Sora, avec repli sans-serif. **Body Font:** Manrope, avec repli sans-serif. Les deux familles sont locales : `public/fonts/Sora.ttf` (poids 100–800) et `public/fonts/Manrope.ttf` (poids 200–800), chargées par `next/font/local` avec `display: swap` dans `src/app/layout.tsx`. Les variables exposées sont `--font-display` et `--font-body`. Les titres ne doivent pas basculer vers une police système de présentation.

**Character:** La géométrie de Sora porte les titres sans effet de matière. Manrope accepte les poids intermédiaires du prototype et garde une lecture stable dans les filtres, les variantes et les coordonnées.

### Hierarchy

| Rôle normatif | Usage réel |
| --- | --- |
| `display` | Base des titres principaux ; variante locale plus compacte pour les pages de tâche. |
| `headline` | Titres de sections, avec largeur et retour à la ligne adaptés au contenu. |
| `title` | Base des titres de troisième niveau. |
| `card-title` | Nom de produit en carte, sans troncature ; devient (16px, interligne 1.3) jusqu’à 600px. |
| `body` | Texte principal, paragraphes et informations de magasin. |
| `label` | Libellés des filtres et choix courts qui demandent un repère fort. |
| `action` | Liens d’action et boutons ; ne pas les transformer en capitales espacées. |
| `navigation` | Navigation de bureau. |
| `option` | Libellés de coloris et puces de filtre, avec retour à la ligne possible. |

Les titres principaux de catalogue utilisent une taille locale (`clamp(2rem, 3.2vw, 3rem)`, puis 30px jusqu’à 600px). Les fiches produit utilisent `clamp(2.5rem, 4vw, 3.5rem)`, puis 38px jusqu’à 800px. L’accueil possède son titre propre ; sa grande taille et ses retours à la ligne restent dans le contrat d’accueil.

Le texte suit un interligne aéré. Les introductions de sections sont contenues autour de (65–66ch), les notes de catalogue à (74ch) et les textes de marque à (58ch). Les prix et horaires utilisent des chiffres tabulaires ; les montants sont en XPF sans décimales. Les petites légendes existantes descendent à (10–11px) sur téléphone : ce sont des usages secondaires situés, pas une taille de lecture à généraliser.

**The Deux voix Rule.** Réserver Sora aux titres et Manrope à la lecture, aux prix et aux commandes ; conserver les noms longs sans troncature.

## Layout

Le contenu est centré dans un conteneur de largeur maximale (1344px), marges internes incluses. Ses gouttières passent de (48px) à (32px) jusqu’à 1100px, puis (20px) jusqu’à 600px et (16px) jusqu’à 370px. La grille utilise des colonnes `minmax(0, 1fr)` pour que les noms longs n’élargissent pas la page.

Les pas du frontmatter correspondent à l’échelle déclarée en CSS et à des valeurs effectivement réemployées dans les marges, écarts et espacements internes. Le code livré exprime encore la plupart de ces valeurs en littéraux : les variables `--space-*` sont déclarées mais ne sont pas consommées. L’échelle ne prétend pas que tous les intervalles du site sont des multiples d’un pas unique ; les contrôles et certaines sections possèdent des ajustements locaux observés.

| Seuil du CSS livré | Réorganisation |
| --- | --- |
| Plus de 1100px | Catalogue et marques sur 4 colonnes ; magasins sur 3 colonnes. Gouttière horizontale de produit (24px), verticale (40px). |
| Jusqu’à 1100px | Catalogue et marques sur 3 colonnes ; écart de produit (20px / 36px). La sélection de quatre produits de l’accueil reste sur 4 colonnes jusqu’au seuil suivant. |
| Jusqu’à 800px | Navigation remplacée par le menu. Filtres et tri en accordéon, fermés initialement, avec champs sur 2 colonnes lorsqu’ils sont ouverts. Produits de l’accueil sur 2 colonnes ; catalogue toujours sur 3. Magasins en une liste, chaque carte photo/texte sur 2 colonnes. |
| Jusqu’à 600px | Catalogue et marques sur 2 colonnes ; produit (16px d’écart horizontal, 32px vertical). Image de carte et fallback à (122px) de haut, avec (6px) d’espacement intérieur du plateau. Fiches produit empilées : galerie puis informations. Cartes magasin empilées ; présentation de marque avec logo avant le texte. |
| Jusqu’à 370px | Gouttières encore resserrées et ajustements de la seule composition d’accueil. |
| À partir de 1600px | Plafond local du grand titre d’accueil ; aucune nouvelle grille du système. |

Les introductions du catalogue sont compactes : espacement haut/bas (32px / 20px), ramené à (24px / 16px) sur téléphone. Les pages de marque et de magasins gardent une introduction plus ample. Une section générale utilise un espacement vertical de (88px), puis (64px) jusqu’à 800px et (52px) jusqu’à 600px.

La fiche produit juxtapose galerie et informations dans un rapport (1.3fr / 1fr), avec un écart de (64px), réduit à (36px), puis (28px). La galerie reste collante à (24px) du haut au-dessus de 800px ; elle devient statique ensuite. La photo principale conserve un plateau clair et un ratio (1.35), puis (1.7) sur téléphone. La fiche magasin réemploie le rapport (1.3fr / 1fr) ; elle s’empile dès 800px, où les informations pratiques passent temporairement sur deux colonnes avant de revenir à une seule sur téléphone.

Les détails de composition et de priorité de chaque première vue sont dans les contrats existants de `.impeccable/surfaces/` : accueil, catalogue/produit, marques et magasins. Ces contrats conservent leurs modes de surface ; ce document n’étend pas le mode de l’accueil aux parcours de tâche.

## Elevation & Depth

Le système est plat : aucun `box-shadow` n’est livré. La profondeur est donnée par les plateaux gris, la lavande douce, les blancs, les filets et les bordures de sélection. Le menu mobile ajoute seulement un fond d’occultation (`rgb(0 0 0 / 55%)`) derrière son dialogue natif. L’en-tête est dans le flux, avec un niveau de superposition (20) ; il n’est pas un bandeau flottant.

**The Plan de travail Rule.** Séparer les contenus par le ton du fond, les blancs et les filets ; ne pas ajouter une ombre pour transformer une carte plane en objet flottant.

La réponse au survol des actions est une transition de fond et de couleur (`160ms ease`). La sélection d’un modèle dans le nuancier d’accueil remplace son contenu en (`260ms`, `cubic-bezier(.16, 1, .3, 1)`) avec une entrée d’opacité (0.65 → 1) et de déplacement vertical (7px → 0). Cette animation ne devient pas une entrée systématique de toutes les cartes. `prefers-reduced-motion: reduce` remplace le défilement doux par un défilement automatique et ramène animations/transitions à (`.01ms`, une itération).

## Shapes

Les grandes surfaces, photographies, cartes et plateaux sont rectangulaires et sans arrondi visible. Le rayon de contrôle du frontmatter est réservé aux actions, champs, puces et choix de variante. Les sélecteurs textuels et le déclencheur de filtres restent droits. Le rayon `--radius-card` déclaré dans le CSS n’est appliqué à aucun composant livré : il n’est pas canonisé.

Les bordures ordinaires sont fines (1px). Les miniatures et variantes choisies passent à (2px d’encre) ; leur padding diminue d’un pixel pour garder leur taille. Les formes ne portent pas seules le choix : coche, nom et `aria-pressed` le confirment. Les icônes sont des SVG en ligne, habituellement (22px, trait 1.7, extrémités et jointures arrondies) ; les tailles locales de carte sont plus petites. Aucun caractère typographique ne sert de pictogramme.

## Components

Les exemples autonomes de `.impeccable/design.json` montrent dix composants réels. Ils développent le CSS natif, préfixent les classes par `ds-`, intègrent les icônes SVG et n’exigent aucun runtime React. Les couleurs restent liées aux variables de l’application, avec repli littéral ; les polices locales sont déclarées pour le rendu isolé. Les exemples utilisent les chemins publics du projet (`/fonts/` et `/media/`) : leur hôte doit servir ces assets pour afficher les mêmes polices et photographies. Ils documentent l’apparence et les états CSS ; le remplacement de variante et la recherche restent des comportements de l’application.

### Buttons

Les actions sont franches, avec libellé lisible et icône directionnelle. Leur géométrie commune et les quatre variantes sont normatives dans le frontmatter. La hauteur minimale est (52px), l’écart texte/icône (20px), la bordure (1px) ; la variante texte conserve une hauteur minimale de (44px).

- **Primaire** : jaune avec texte encre ; jaune plus sombre au survol.
- **Sombre** : encre avec texte papier ; encre lavande au survol. Elle sert notamment à soumettre une recherche.
- **Secondaire** : transparente, bordure encre ; plateau gris au survol. Elle fournit une sortie alternative sur les pages d’erreur.
- **Texte** : sans fond ni bordure ; soulignement au survol.

Le focus clavier utilise un contour (3px, décalage 4px) : violet sur les zones claires, jaune dans l’en-tête et le pied de page. Le menu lavande rétablit le violet. Les boutons désactivés ont une opacité (0.55) et un curseur d’attente ; aucun nouveau style de statut métier ne doit en être déduit. Les adaptations mobiles restent locales : recherche soumise par icône jusqu’à 600px avec nom accessible conservé, action de contact produit pleine largeur (54px minimum).

### Inputs / Fields

Les recherches sont sur papier, avec bordure filet, icône et rayon de contrôle. La hauteur minimale est (52px), ramenée à (48px) sur téléphone. Le focus englobe le groupe (`:focus-within`, contour 2px, décalage 1px) ; le curseur est violet et le placeholder secondaire reste opaque. Le survol n’ajoute pas de couleur distincte.

Les `select` restent natifs : hauteur minimale (46px), puis (44px), libellés visibles au-dessus pour les filtres. Recherche, filtres et tri sont soumis explicitement. Un accordéon intitulé « Filtres et tri » remplace l’affichage permanent des filtres jusqu’à 800px ; son état est exposé par `aria-expanded` et `aria-controls`. Aucun résultat ne disparaît pendant la simple ouverture des filtres.

### Chips

Les filtres actifs sont des liens lavande douce avec libellé complet et croix SVG. Leur action retire le filtre nommé ; un nom accessible précise cette action. Ils reviennent à la ligne et gardent le rayon de contrôle. Le CSS livré ne définit pas de changement de fond au survol ; le focus visible demeure la réponse clavier. « Tout effacer » reste une action textuelle distincte.

### Cards / Containers

La carte produit est un lien entier : plateau gris, photographie sur papier, nom, marque et nombre de coloris, puis prix. Le survol souligne le nom ; le focus entoure le lien. La photo est contenue et ne se déforme pas. La hauteur de référence est (185px), puis (122px) jusqu’à 600px ; la sélection d’accueil emploie une hauteur intermédiaire propre à sa grille. Les cartes n’ont ni ombre ni bordure de contour.

La carte marque protège le logo dans un plateau adapté : gris pour la majorité, encre pour les logos blancs. Nom, univers et destination sont lisibles séparément. La carte magasin réemploie une vraie photo recadrée, suivie du nom, de l’adresse, des horaires et de liens de contact ; un filet sépare les actions. Le contexte produit conservé vers le magasin est un bandeau lavande douce avec miniature, nom, coloris et réserve sur le prix, sans badge de réservation.

### Navigation

La navigation principale est blanche sur noir ; la page courante et le survol deviennent jaunes, avec `aria-current="page"`. Le logo Optic 2000 conserve ses proportions et sa signature Tahiti reste séparée par un filet. La hauteur du bandeau est (96px), puis (80px) jusqu’à 800px et (74px) jusqu’à 600px. Jusqu’à 800px, un bouton « Menu » ouvre un `dialog` natif lavande ; sa largeur est `min(92vw, 460px)` et sa hauteur `100dvh`. Fermeture par commande dédiée, Échap natif ou fond prévu ; le focus revient au déclencheur à la fermeture.

Les onglets de collection utilisent un filet inférieur de sélection (2px encre), `aria-current` et le compte. Sur téléphone, le lien annexe des autres marques s’efface de cette rangée ; les destinations restent disponibles dans la navigation générale. Un lien d’évitement devient visible au premier focus et rejoint le contenu principal.

### Gallery / Variants / Details

La galerie présente une image principale et des miniatures tactiles, chacune nommée « Voir la vue… » et marquée par `aria-pressed`. Les miniatures mesurent (86 × 62px), puis (68 × 50px) sur téléphone. La variante se choisit dans un groupe nommé : vraie miniature, libellé complet et coche SVG. L’option choisie change sa bordure et son poids sans saut de dimensions ; le survol utilise le plateau gris. Le changement réinitialise la vue et actualise le prix, la photo, le contexte magasin et le paramètre `variante` de l’URL.

Les caractéristiques et la préparation de visite sont des `details` natifs, séparés par un filet. Le `summary` a une hauteur minimale de (60px) et une flèche tournée de (180deg) lorsque le panneau est ouvert. Entrée/Espace suivent le comportement natif. Le nuancier de l’accueil emploie aussi `aria-pressed`, une sélection soulignée et une annonce polie ; son assemblage complet reste local à l’accueil.

### Feedback / Resilience

Le résultat d’une recherche est compté et les filtres sont réversibles. Un filtre invalide produit une notice lavande douce et est ignoré. Le vide a un titre, une explication et une action de réinitialisation. La sélection de variante inconnue demande de choisir une option existante. Le chargement est un statut textuel accompagné d’une ligne lavande, sans squelette animé. Les pages d’erreur et de route inconnue proposent des sorties catalogue ou magasin.

Une image indisponible est remplacée dans son plateau par un libellé explicite et un texte de recours ; la hauteur du média reste celle du composant. Les annonces de prix et de modèle sont polies ; les icônes décoratives sont cachées aux technologies d’assistance. Les états décrits ici ne constituent aucune confirmation de stock, d’ouverture, de rendez-vous ou de réservation.

## Do's and Don'ts

### Do:

- Do — Préserver les photographies de monture entières, les logos intacts et les images locales avec leur provenance.
- Do — Réutiliser les primitives du frontmatter et les états de focus du composant avant d’ajouter une valeur locale.
- Do — Garder la distinction entre surface persuasive et parcours de tâche ; appliquer les règles du monde sans recopier la composition de l’accueil.
- Do — Associer chaque choix à un libellé, aria-pressed ou aria-current selon le cas, et une réponse visible.
- Do — Laisser la grille, les noms longs, les prix XPF et les contrôles se réorganiser aux seuils documentés.
- Do — Conserver les états vide, invalide, chargement, erreur et photo indisponible, avec une sortie utile.

### Don't:

- Don't — Présenter cette palette, Sora ou Manrope comme une charte officielle Optic 2000.
- Don't — Ajouter de verre dépoli, de relief décoratif ou de recadrage qui altère une monture ou un logo.
- Don't — Utiliser la couleur seule pour un coloris, une sélection, une disponibilité ou une erreur.
- Don't — Donner aux rampes synthétiques documentaires du sidecar le statut de couleurs livrées ; seuls les tokens du frontmatter font autorité.
- Don't — Hériter du rayon de carte inutilisé, créer une variante visuelle de bouton non livrée ou annoncer un état métier absent du prototype.

Périmètre non canonisé : rayon de carte inutilisé et variables d’espacement non consommées comme variables ; aucun de ces écarts n’est corrigé par cette extraction. Les petites légendes mobiles restent situées. Le document décrit les valeurs observées sans transformer ces limites en règles de futures surfaces.

Sources d’extraction : `src/app/globals.css`, `src/app/layout.tsx`, les composants de `src/components/`, `PRODUCT.md`, `.impeccable/config.json` et les quatre contrats de `.impeccable/surfaces/`. Extraction de l’état S1 après correction du catalogue compact et des images mobiles ; aucune nouvelle décision de composition.
