---
name: "Optic 2000 Tahiti"
description: "La lumière sur les montures — accueil immersif et système conservé du catalogue, relevé sur le build W-ERYR6iucw2MWkcWN1BR."
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
  brand-black: "#000000"
  inverse-line: "#3a3a40"
  brand-separator: "#73737a"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(2.5rem, 5vw, 4.5rem)"
    fontWeight: 550
    lineHeight: 1.1
    letterSpacing: "-.035em"
  home-hero:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(3rem, 7.2vw, 6rem)"
    fontWeight: 650
    lineHeight: .96
    letterSpacing: "-.04em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(1.8rem, 3.4vw, 3rem)"
    fontWeight: 550
    lineHeight: 1.1
    letterSpacing: "-.035em"
  title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-.02em"
  card-title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "19px"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-.02em"
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
    fontWeight: 700
    lineHeight: 1.35
  navigation:
    fontFamily: "Manrope, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.6
  option:
    fontFamily: "Manrope, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.6
  field:
    fontFamily: "Manrope, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  control: "4px"
  square: "0"
spacing:
  space-1: "4px"
  space-2: "8px"
  space-3: "12px"
  space-4: "16px"
  space-6: "24px"
  space-8: "32px"
  space-12: "48px"
  space-16: "64px"
  space-24: "96px"
components:
  button-primary:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "14px 22px"
  button-primary-hover:
    backgroundColor: "{colors.yellow-hover}"
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
  button-dark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "10px 13px"
  button-dark-hover:
    backgroundColor: "{colors.lavender-ink}"
  search-input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 14px"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.field}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
  navigation:
    backgroundColor: "{colors.brand-black}"
    textColor: "{colors.paper}"
    typography: "{typography.navigation}"
  navigation-home:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    typography: "{typography.navigation}"
  button-text-inverse:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "12px 0"
  filter-chip:
    backgroundColor: "{colors.lavender-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.option}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  product-card:
    textColor: "{colors.ink}"
    typography: "{typography.card-title}"
  variant-option:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.option}"
    rounded: "{rounded.control}"
    padding: "7px 12px"
  variant-option-selected:
    backgroundColor: "{colors.lavender-soft}"
    padding: "6px 11px"
  model-selector:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.square}"
    padding: "14px 0 0"
---

# Design System: Optic 2000 Tahiti

## Overview

**Creative North Star: "La lumière sur les montures"**

La lumière sur le verre et le métal donne sa présence à l’accueil : une scène photographique occupe le premier écran, avec la signature Optic 2000, le titre et les actions dans le même espace. Après cette arrivée, les photographies de montures retrouvent le blanc continu du catalogue et des fiches. Les logos gardent leurs proportions et leurs couleurs ; les photographies authentiques de magasins et d’équipe portent le contexte local.

La présence vient de l’échelle, des alignements, des blancs et des filets, ainsi que de la profondeur propre aux médias. Le jaune rend les actions principales immédiatement repérables ; la lavande ponctue les choix et les accompagnements. Manrope locale relie titres, lecture, prix et commandes : grands titres partagés calmes, titre du hero plus affirmé, petits repères fermes.

Ce relevé décrit le code final du build `W-ERYR6iucw2MWkcWN1BR`, après le recadrage S5/r4 du 22 octobre 2026 et sa revue visuelle SHIP. Il ne constitue ni une charte officielle Optic 2000 ni une acceptation esthétique humaine. La composition précise reste dans les contrats de surface. Le hero d’accueil révoque les anciennes règles de blanc dominant, de texte hors film et de vidéo secondaire ; le blanc et les légendes séparées restent la grammaire des produits et de la lecture hors hero.

**Key Characteristics:**

- Film plein cadre dès le sommet, navigation fine intégrée et lecture basse gauche à l’accueil.
- Montures et logos entiers ; blanc calme du catalogue après la scène photographique.
- Noir et blanc de marque, jaune d’action précis et lavande ponctuelle.
- Manrope locale unique, titres resserrés et informations lisibles.
- Cartes planes, contours fins et petits angles adoucis sur les commandes.
- Choix nommés et manuels, focus distinct de la sélection, médias soumis aux préférences.

## Colors

Les valeurs du frontmatter sont normatives ; les noms suivants décrivent leur fonction dans l’interface. La palette construite associe une base blanche et noire à deux accents, sans fond crème.

### Primary

- **Jaune d’action** (`yellow`) : actions principales, destinations actives sur noir, sélection de texte et focus des zones noires. **Jaune de survol** (`yellow-hover`) : réponse des actions jaunes sans déplacement.

### Secondary

- **Lavande de ponctuation** (`lavender`) : filet de l’index des univers et repère de chargement ; elle ne couvre plus le premier écran d’accueil.
- **Lavande douce** (`lavender-soft`) : options choisies, filtres actifs, accompagnements et passages de contexte.
- **Encre lavande** (`lavender-ink`) : texte des accompagnements lavande et survol de l’action sombre.
- **Violet de focus** (`focus`) : contour clavier sur fond clair et curseur de saisie. Ce rôle fonctionnel reste distinct d’une sélection.

### Neutral

- **Encre de lecture** (`ink`) : texte principal, filets forts, option choisie et action sombre.
- **Blanc de studio** (`paper`) : fond principal, champs, menu mobile et panneau des univers ; couleur du texte inversé.
- **Gris de soutien** (`surface`) : états vides, replis médias, supports de logos et fonds de survol. Les montures de l’accueil, du catalogue et des fiches restent sur blanc.
- **Texte secondaire** (`muted`) : explications, marques, légendes et réserves.
- **Filet clair** (`line`) : séparation, bordure des champs, options et miniatures.
- **Texte inversé secondaire** (`inverse-muted`) : informations secondaires du pied de page ; sa valeur rejoint le filet clair avec un rôle distinct.
- **Noir du logo** (`brand-black`) : en-tête des routes hors accueil et pied de page, au même noir que le fond de leur logo authentique. Le header d’accueil est transparent.
- **Filet inversé** (`inverse-line`) : séparation du pied de page.
- **Séparation de signature** (`brand-separator`) : petit filet entre le logo et la mention Tahiti.

**The Action lisible Rule.** Employer le jaune pour les actions principales et les repères interactifs du fond noir. Accompagner toute sélection ou destination courante d’un libellé et d’un signe visible, sans faire porter le sens à la couleur seule.

**The Photographie entière Rule.** Conserver les montures et les logos entiers avec object-fit: contain. Les cadrages à couverture appartiennent aux photographies de contexte et au film ; ils ne deviennent pas un traitement des produits.

Les huit nuances de chaque rampe du sidecar sont des interpolations OKLCH documentaires. Elles aident à examiner une couleur ; elles ne sont ni des tokens livrés ni des variantes approuvées.

## Typography

**Display Font:** Manrope locale variable, repli sans-serif.
**Body Font:** la même Manrope locale variable, repli sans-serif.

**Character:** une sans-serif nette, avec une grande amplitude de taille. Les grands titres restent modérés en graisse ; les petits repères, prix et commandes prennent davantage de poids. Les tailles fluides sont réglées par rôle, sans ratio unique imposé.

### Hierarchy

- **Display** (`display`) : titre de page partagé, graisse (550), interligne (1.1) et interlettrage resserré. Le rôle `headline` porte les titres de section avec la même voix.
- **Title** (`title`) : sous-titres partagés, graisse (650). `card-title` adapte cette voix aux noms de produit, avec un interligne plus ouvert et sans troncature.
- **Body** (`body`) : lecture courante, graisse (400). Les introductions et contenus de lecture sont généralement bornés entre (62ch) et (66ch), selon la surface.
- **Label** (`label`) : petits libellés des filtres, graisse (750), sans capitalisation décorative ajoutée. Les libellés de formulaire ont leur taille locale (14px).
- **Action / Navigation / Option / Field** : rôles distincts pour commandes, liens du bandeau, choix de variante et champs. Le frontmatter conserve leurs valeurs de base plutôt qu’une seule taille de petit texte.

Les exceptions de page restent locales : le titre d’accueil utilise le rôle `home-hero`, graisse (650), interligne (.96) et interlettrage (-.04em). Il devient (clamp(2.75rem, 9vw, 4.25rem)) sous (800px), puis (clamp(2.5rem, 12.4vw, 3.375rem)), interligne (.98), sous (600px). Son introduction est en graisse (500), interligne (1.5), limitée à (36ch), avec taille (18px), puis (17px) sous (1100px) et (16px) sous (600px). Le titre du catalogue utilise (clamp(2.25rem, 3.4vw, 3rem)), puis (32px) sur téléphone. La fiche produit utilise (clamp(2.25rem, 3.6vw, 3.25rem)), puis (38px) à partir du seuil (800px) vers le bas. Ces tailles ne remplacent pas le titre partagé.

Les noms de carte passent à (16px) sur téléphone. Les prix utilisent des chiffres tabulaires ; les préfixes et réserves restent séparés du montant. Les légendes et notes partagées sont à (12px) ou (13px). Dans la colonne principale du rendez-vous, aides, champs obligatoires et notes de soumission sont à (14px), tandis que les erreurs restent à (13px).

**The Une seule famille Rule.** Utiliser Manrope pour les titres comme pour la lecture et les commandes. Changer l’échelle, la graisse et l’interlettrage avant d’introduire une autre voix typographique.

## Layout

Le conteneur commun a une largeur extérieure maximale de (1344px), centrée, avec des gouttières de (48px) incluses dans cette largeur. Elles passent à (32px) sous (1100px), (20px) sous (600px), puis (16px) sous (370px). La grille est souple ; aucun nombre de colonnes ne s’applique à toutes les pages.

La grille produit part de quatre colonnes, passe à trois sous (1100px) et à deux sous (600px). Ses écarts passent de (48px 24px) à (40px 20px), puis (32px 16px). Les sections partagées passent de (88px) de respiration verticale à (64px) sous (800px), puis (52px) sous (600px). Les valeurs de la gamme d’espacement sont présentes dans le CSS, souvent écrites directement ; elles décrivent un rythme observé, pas une obligation de n’employer que des multiples de quatre.

Les seuils partagés de (1100px), (800px) et (600px) réorganisent les grands blocs. À (800px), la navigation de bureau cède sa place au menu en dialogue, les zones éditoriales s’empilent et les éléments collants deviennent statiques selon leur composant. Le pied de page passe à une colonne principale sous (1100px), puis adapte son plan de site sur téléphone.

Les filtres ont trois seuils locaux supplémentaires : à (1350px) et moins, recherche et filtres occupent des rangées séparées ; à (960px) et moins, les quatre champs se répartissent sur deux colonnes avec Appliquer sur la largeur ; à (400px) et moins, les champs ouverts occupent chacun une ligne. Sous (800px), leur volet est fermé au départ et commandé par « Filtres et tri ». Ces seuils servent le catalogue et ne constituent pas une grille de rupture générale. La plage (801px–960px) simplifie séparément la navigation de bureau, sans la basculer en menu mobile.

La galerie de fiche garde une seule rangée de miniatures à défilement horizontal, accompagnée d’un compteur. Les vues restent toutes accessibles ; une nouvelle rangée ne doit pas repousser le nom et le prix. Les options de monture ont deux colonnes sur grand écran, une entre les seuils (800px) et (600px), puis deux petites colonnes sous (600px), avec retour à la ligne des noms.

Les compositions de l’accueil, ses proportions de photo et les listes de magasins sont des adaptations de page. Le bandeau de marques possède ses propres densités : six logos, cinq entre (1101px) et (1280px), quatre sous (1100px), trois sous (800px). Les lentilles ont cinq colonnes au-dessus de (1100px). Ces exceptions sont consignées dans le sidecar avec leur périmètre.

## Elevation & Depth

Hors hero, le système reste plan : blanc continu, plages lavande ou grises et filets produisent la séparation. Les packshots ne reçoivent ni plateau ajouté ni ombre CSS. Le panneau de navigation superposé possède une ombre diffuse ; le dialogue mobile atténue le fond derrière lui.

Dans le hero, la profondeur vient du film et du poster. Les protections de lecture sont locales : dégradé du header sur (168px), protection radiale en bas à gauche et dégradé de bas de scène, remplacés par un dégradé vertical sous (800px). Ils ne constituent pas un filtre uniforme sur le film. Le titre porte une ombre de texte diffuse, limitée au hero ; les liens du header ont leur propre ombre de lisibilité. Les valeurs exactes figurent dans le sidecar.

### Shadow Vocabulary

- **Panneau ancré** (`0 24px 48px -28px rgb(23 23 23 / 45%)`) : uniquement sous le panneau des univers.
- **Fond de dialogue mobile** (`rgb(0 0 0 / 45%)`) : voile de la page derrière le menu modal, pas un filtre posé sur une image.

**The Cartes planes Rule.** Séparer les contenus par le blanc, le ton du fond et les filets. L’ombre diffuse du panneau des univers indique sa superposition ; elle ne devient pas une ombre de carte.

## Shapes

Les commandes utilisent de petits angles adoucis (`control`) ; les champs, boutons, options, miniatures et puces partagent ce rayon. Les images produit, cartes et grands champs de page restent rectilignes (`square`). Le panneau des univers n’adoucit que ses deux angles inférieurs. Il n’existe pas de vocabulaire de cartes flottantes ou de pilules.

Les contours ordinaires sont fins (1px). Les choix et miniatures sélectionnés passent à (2px) d’encre ; leur remplissage ou leur graisse apporte un repère complémentaire. La réduction correspondante du padding évite que le changement de contour agrandisse l’option. Les filets d’index séparent les lignes sans les enfermer dans des cartes.

## Components

### Buttons

Les actions sont franches, compactes et nommées. La primitive partagée aligne le libellé et une flèche SVG, avec un espace de (20px), une hauteur minimale de (52px) et le rayon `control`.

- **Primary** : jaune d’action et encre, padding du token `button-primary` ; le survol prend `yellow-hover`.
- **Secondary** : fond transparent et contour d’encre (1px) ; fond `surface` au survol.
- **Text** : fond transparent, sans bordure, padding vertical du token `button-text`, hauteur minimale de (44px) ; soulignement au survol.
- **Dark** : encre et texte blanc, encre lavande au survol. Son usage construit est la recherche du catalogue : bouton carré à flèche, libellé « Rechercher » conservé pour les technologies d’assistance et hauteur minimale de (48px). Le sidecar montre cette adaptation réelle.
- **Focus / disabled** : contour de focus global (3px), décalé de (4px), violet sur clair et jaune dans l’en-tête et le pied de page. Un bouton désactivé prend une opacité de (.55) et le curseur d’attente.

Les changements de couleur durent (160ms) avec ease, sans translation du bouton. Les appels du bandeau, du catalogue et de la fiche ont des adaptations locales de taille ; leurs minimums et libellés restent explicites.

### Chips

Les filtres actifs sont de petites commandes rectangulaires en lavande douce, texte encre et croix SVG. Ils gardent une cible minimale de (44px), se répartissent sur plusieurs lignes et autorisent la coupure des contenus longs. Le lien retire le filtre nommé, avec un focus clavier visible ; ce n’est pas un indicateur de stock.

### Cards / Containers

La carte produit est une photographie entière sur le blanc de la page, suivie du nom complet, de la marque, du nombre de coloris quand il existe et du prix. L’image a un rapport (16 / 9), object-fit: contain et une séparation basse de (14px), puis (10px) sur téléphone. Le lien souligne le nom au survol ; il n’ajoute ni cadre ni déplacement. Les cartes de magasin réservent le cadrage à couverture à leur photographie ; les blocs d’aide et états vides utilisent les fonds de soutien.

### Inputs / Fields

La recherche est un champ blanc bordé par `line`, avec une icône SVG, une hauteur minimale de (48px) et un focus sur son enveloppe (2px), décalé de (1px). Les champs de contact ont une hauteur minimale de (52px), leur label au-dessus et un padding défini par `field`. Les listes natives du catalogue gardent leurs libellés séparés et le volet se redistribue selon les seuils locaux.

L’erreur de saisie combine un contour d’encre (2px), un message nommé et une icône ; elle ne dépend pas d’un rouge absent de la palette. L’option choisie combine contour d’encre, lavande douce et graisse renforcée. Les choix natifs de magasin gardent leur contrôle radio visible et un contour de groupe au focus.

### Navigation

Sur l’accueil seulement, l’en-tête est absolu et transparent au-dessus du film, dès le sommet. Sa barre garde une hauteur de (78px), puis (72px) sous (800px) et (68px) sous (600px). Le logo officiel blanc transparent `/media/brand/optic2000-white.svg` est affiché entier : largeur (150px), (132px) entre (801px–960px), (128px) sous (600px), (116px) sous (370px). La mention Tahiti garde un filet blanc translucide. Aucun rectangle noir n’est ajouté derrière ce SVG.

Sur les autres routes, le bandeau noir et le pied de page reprennent le fond de leur logo réel. La barre de bureau utilise le rôle `navigation`, des liens d’au moins (44px) et une destination courante jaune également soulignée. Le panneau des univers est un papier compact, groupé par l’espace, avec une ligne courante lavande et soulignée. Les liens du panneau ont une taille locale de (16px) et un survol gris. Le menu mobile est blanc, dans un dialogue latéral de largeur (min(92vw, 420px)), à hauteur (100dvh), défilable ; ses liens sont nommés et la destination courante est soulignée.

### Accueil immersif

Le hero est un champ plein cadre depuis le sommet, contenant le film et le poster en couverture centrée (50% 50%), le titre blanc, l’introduction et les actions en bas à gauche. Sa hauteur minimale est (clamp(560px, 100svh, 1040px)), puis (max(560px, 94svh)) sous (800px) ; il peut grandir avec son texte. La colonne de titre est bornée à (760px). Les marges internes sont (128px 48px 64px), puis (120px 32px 56px) sous (1100px), (104px 20px 32px) sous (600px) et gouttières (16px) sous (370px). Les deux actions sont sur une ligne souple, puis en colonne sous (600px). L’action principale reste jaune et encre ; l’action texte hérite du blanc et souligne son libellé au survol. Le focus de cette scène est jaune.

**The Lecture dans la scène Rule.** À l’accueil, composer navigation, titre et actions dans la scène filmique avec une protection locale de lecture. Garder l’éclat du film hors de ces zones ; ne pas transformer cette exception de hero en superposition sur les packshots ou les pages explicatives.

### Sélections de modèle et de variante

Le nuancier est une découverte secondaire sur blanc immédiatement après le hero : trois modèles réels (Glory Glory, Baby Beach, The Bird), leurs coloris, prix et lien de fiche. La photographie garde son rapport (900 / 320), une largeur maximale de (760px) et object-fit: contain. Sous (600px), sa largeur atteint (128%) du champ avec marges (-14%) : seules ses marges blanches sortent du cadre. La section respire de (48px 32px), puis (44px 32px) sous (800px) et (40px 24px) sous (600px). Ce nuancier compact ne devient pas un second hero.

Les trois noms du choix d’accueil partagent un filet horizontal ; une sélection épaissit le filet au-dessus du nom (3px) et passe le texte de secondaire à encre. Le choix est manuel. La première monture est immobile ; après un changement demandé, la photographie entre une fois, de (-32px) vers sa place, avec une opacité initiale de (.5), pendant (650ms) et l’easing d’arrivée du sidecar. Sous (600px), le déplacement devient (-16px). Le texte et la légende se mettent à jour sans entrée spatiale.

Les options de coloris associent une petite image entière à leur nom complet et à une coche SVG quand elles sont choisies. Leur contour, leur fond et leur graisse rendent la sélection visible. Les miniatures de galerie restent dans un rail unique ; la miniature courante épaissit son contour sans changer de dimensions. Les valeurs de correction de lentilles gardent leurs signes et leur sens ; leur style ne doit pas transformer une absence de choix en sélection.

### Médias et mouvement

Le bandeau de marques utilise une boucle linéaire de durée (nombre de marques × 4s). Il s’arrête au survol, au focus, hors champ et quand l’onglet est masqué. Au focus clavier, la copie décorative disparaît et la liste d’origine devient fixe et défilable, sans masquer le logo focalisé. Le mouvement réduit donne directement cette liste immobile.

Le film décoratif est le fond du hero initial, derrière le titre et les actions, avec les protections locales décrites ci-dessus et sans filtre appliqué au média. Un seul lecteur utilise `/media/ambience/eyewear-loop.mp4` et le poster `/media/ambience/eyewear-poster.webp` ; ce film de banque n’est pas présenté comme un produit du catalogue ou un magasin tahitien. Le poster est présent dès le départ ; le film apparaît par une transition d’opacité de (.6s) seulement après une lecture effective. Le mouvement réduit, l’économie de données, le refus de lecture automatique et l’erreur gardent le poster. Hors champ ou onglet masqué, la lecture se met au repos. Aucune commande Pause/Lire n’est offerte.

Les préférences de mouvement suppriment l’arrivée et la boucle, rendent le défilement instantané et réduisent les durées résiduelles à (.01ms). Les déplacements du panneau de navigation (220ms) et de la flèche d’index (4px) restent des comportements locaux ; ils ne constituent pas un effet d’entrée général.

## Do's and Don'ts

### Do:

- Do — Partir des tokens du frontmatter et des primitives existantes pour étendre une surface.
- Do — Préserver les proportions des montures, les logos complets et les photographies authentiques avec leur provenance.
- Do — Garder les noms, les coloris et les valeurs sélectionnées lisibles ; redistribuer les contrôles avant de manquer de largeur.
- Do — Conserver les libellés et les repères de sélection en plus de la couleur, avec un focus visible au clavier.
- Do — Laisser les images produit se poser directement sur le blanc et garder leurs légendes hors de l’image ; à l’accueil, conserver le texte dans la scène filmique avec protection locale.
- Do — Maintenir des commandes tactiles d’au moins (44px) dans les parcours de catalogue et de fiche.
- Do — Garder les états vide, invalide, chargement, erreur et média indisponible avec une issue compréhensible.
- Do — Respecter les préférences de mouvement et les replis des médias ; conserver le choix manuel de la monture.
- Do — Appliquer les seuils de chaque composant dans leur périmètre, en vérifiant les largeurs intermédiaires.

### Don't:

- Don't — Présenter cette direction de prototype ou ses choix de rédaction comme une charte officielle ou un comp approuvé.
- Don't — Réintroduire Sora dans les titres : elle n’est plus chargée par le layout final.
- Don't — Entourer les packshots d’une double surface grise, d’un cadre décoratif ou d’une ombre de carte.
- Don't — Étendre les seuils locaux des filtres à l’ensemble du site ou prendre une ellipse native pour un modèle de lisibilité.
- Don't — Faire de la couleur le seul indicateur d’un choix, d’une erreur, d’un état ou d’une disponibilité.
- Don't — Rétablir un bloc blanc de titre avant le film d’accueil, assombrir uniformément toute la scène ou ajouter une commande Pause/Lire à ces médias décoratifs.
- Don't — Transformer l’arrivée bornée d’une monture en carrousel automatique, ni ajouter une entrée spatiale aux formulaires.
- Don't — Employer les rampes synthétiques du sidecar comme de nouvelles couleurs du produit.
- Don't — Déduire des images ou du style une promesse de stock, de prix actuel, de droits supplémentaires ou de réservation.

**Non canonisé :** le rayon de carte déclaré mais inutilisé ne figure pas dans les tokens normatifs. Le cadrage serré d’un portrait d’équipe signalé dans une revue antérieure n’est pas promu en règle ; la revue finale ne retient aucun défaut matériel dans les échantillons inspectés. Les remarques historiques de taille de police ne constituent pas des tokens supplémentaires. Aucun de ces points n’est réparé par ce relevé documentaire.
