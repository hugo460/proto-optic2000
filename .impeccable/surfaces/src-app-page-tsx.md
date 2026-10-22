---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/components/catalog/home-showcase.tsx","src/components/layout/header.tsx","src/components/layout/footer.tsx"]
---

# Accueil — S1

Mode: Persuade. Cible: `/`. Décision de session: construction en code confirmée par Hugo ; composition « Le nuancier solaire » confirmée par Hugo via question structurée pendant S1.

Public et tâche: découvrir les vraies solaires d’Optic 2000 Tahiti puis inspecter une référence ou choisir un magasin. Preuves: montures du snapshot, identité réelle et photos des magasins. Contraintes: aucun panier, aucune promesse de stock, aucun visuel touristique.

## Direction contract

THESIS: Un nuancier solaire vivant : les montures sont le sujet du premier écran, la sélection agit immédiatement.

OWN-WORLD: Lavande franche, noir lisible, jaune réservé à l’action ; plateau blanc pour la fidélité des montures. Lettres géométriques Sora et lecture Manrope, contours simples, peu de rayons, aucun effet de verre.

STORY: Le visiteur reconnaît Optic 2000 et Tahiti, parcourt trois modèles réels, ouvre leur fiche puis rejoint l’un des trois magasins.

FIRST VIEWPORT: Navigation noire avec logo intact, titre ample sur lavande, grand plateau blanc montrant une vraie monture et sa fiche courte, trois choix de modèle alignés. L’action collection et l’action magasin restent visibles ; sur mobile le plateau suit le titre et les choix restent tactiles. Interaction signature: changer de modèle remplace l’image, le nom, le prix source et le lien en une transition courte, sans masquer le contenu au chargement.

FORM: Nuancier de collection, candidat 4 ; seed:ec9ae70fdd93869f. Les challengers déclinent devant l’identification et la clarté métier. Leurs apports sont la composition d’ensemble, les couleurs informatives, la traçabilité, le changement perceptible, le contexte conservé et l’échelle stable. Palette adaptée aux preuves Optic 2000, sans prétendre à une charte officielle.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

États: choix initial/changé, focus, survol, clavier, réduction du mouvement, mobile et desktop. Sortie: fiche réelle ou catalogue partageable, puis fiche magasin. Incertitude client: actualité des prix et horaires.

Extension S2 (paquet 2) : nuancier, première grille de quatre produits et raccourci magasin inchangés. Après la première grille, un index typographique « Bien plus que le soleil. » liste les six univers (nom Sora, phrase factuelle, flèche ; deux colonnes puis une à 800px) et renvoie vers Services et Qui sommes-nous ; aucune carte icône+texte, aucun long texte avant les produits. En-tête : bouton « Nos univers » (disclosure lavande, Échap/clic extérieur/sortie au clavier/navigation ferment, focus rendu au bouton) puis Les solaires, Nos marques, Nos magasins, Contact ; le bouton jaune magasin se masque entre 801 et 1100px où « Nos magasins » reste présent. Menu mobile groupé et défilable. Pied de page : toutes les destinations et les trois pages légales.


## Extension S4 — contrat avant implémentation

Le monde et la composition du nuancier sont conservés. Le lien de l’introduction prépare un RDV de démonstration ; catalogue, modèles et magasins restent accessibles. Aucun nouveau bloc ne repousse la première grille de produits.

Contrat de mouvement : moment focal = la vraie monture vient se poser sur le plateau blanc par une translation et une faible rotation 2D amorties (environ 650 ms, une fois à l’arrivée puis à chaque sélection). Pose finale stable, image entière ; aucun flottement, changement automatique de modèle ou faux rendu 3D. Continuité = image seule remonte sur une clé de modèle, nom/prix/coloris/lien changent ensemble immédiatement. Feedback = sélection soulignée, aria-pressed et annonce polie ; interruption par un autre choix immédiate. Budget = transform/opacity CSS seulement, aucune dépendance, pas de révélation généralisée ; la clause « aucune vidéo » de S4 est remplacée par l’extension S5 ci-dessous. Réduction = pose stable sans mouvement spatial et état sélectionné conservé.

Bandeau : vrais logos dans une piste lente, boucle sans joint ; annuaire et pause/reprise fixes, pause au survol/focus, hors champ et onglet masqué. Les clones sont cachés aux technologies d’assistance, sans ID ni tabulation ; leurs liens restent utilisables au pointeur quand ils sont visibles. Au focus la piste revient à sa liste originale accessible ; au mouvement réduit, liste statique ou manuelle. Dimension du média réservée.

Navigation : RDV visible dans le bureau/mobile/pied de page ; action jaune « Préparer un RDV » et lien magasins préservé. Alléger les liens répétés de l’en-tête dans 801–1100 px, sans cacher une destination. Disclosure univers/enseigne et contact restent atteignables. Vérifier 801/1024/1101/1280, Échap et retour de focus.

## Extension S5 — hero composé et film d’ambiance

Demande de Hugo du 21/10/2026 : plateau moins présent, conservé plus petit et encadré, film discret derrière, même couleur ; direction confirmée « gros plans de lunettes et matières, sans visage ». Remplace la première vue S1 (grand plateau pleine largeur, choix sous le plateau) et la clause « aucune vidéo » de S4. Monde, palette, polices, trois modèles et sélection manuelle inchangés.

- **Composition (plus de 800 px)** : à gauche, titre (2 lignes, `clamp(2.75rem, 5vw, 4.75rem)`, puis `clamp(2.25rem, 4.6vw, 3.25rem)` jusqu’à 1100 px), proposition en encre puis actions ; à droite, cadre de `clamp(440px, 33vw, 476px)` (`clamp(340px, 38vw, 420px)` jusqu’à 1100 px), soit environ 38 % de la largeur utile à 1440 px. Une seule action jaune dans le hero : « Toutes les solaires » ; « Préparer un rendez-vous » en action texte ; commande du film à la suite.
- **Cadre** : papier opaque, filet d’encre de 1 px, sans ombre ni arrondi. Photo entière (boîte de 265 px de haut au-dessus de 1100 px, 200 px jusqu’à 1100 px, 180 px à côté de la fiche entre 601 et 800 px, 150 px sur téléphone, puis 128 px jusqu’à 370 px), fiche courte (nom, « Maui Jim · n coloris », prix source) avec « Découvrir ce modèle » en action texte, puis bande des trois choix séparés par des filets (`aria-pressed`, soulignement d’encre). Seules photo et fiche forment la région d’annonce polie.
- **Mobile** : ordre DOM et visuel identiques — titre, proposition, actions (la commande du film réduite à son icône au bout de la ligne du rendez-vous, nom complet conservé), puis cadre. Jusqu’à 370 px, les informations et le lien du modèle occupent chacun la largeur du cadre pour préserver les noms et les prix. Cibles de 44 px minimum. Le bandeau de marques commence dans le premier écran à 390×844 et 360×800.
- **Film** : fond décoratif (`aria-hidden`, hors tabulation, muet, en boucle, inline), désaturé, sous un voile lavande (88 % côté texte vers 72 % côté cadre ; 88 → 84 % empilé). Contenu à opacité pleine, peint au-dessus. Source et provenance : `docs/content-inventory.md`. Aucune légende ne relie le film au catalogue ou à un magasin.
- **États** : le serveur et l’hydratation rendent le poster sans source vidéo ; la source n’est posée qu’après lecture de `prefers-reduced-motion` et de `navigator.connection.saveData`, et retirée si l’une change en cours de visite. Lecture seulement visible et dans le champ ; pause hors champ et onglet masqué. Commande « Pause vidéo / Lire la vidéo » (noms complets « … d’ambiance »), présente seulement pendant une lecture réelle ou quand un démarrage manuel est possible ; sa place reste réservée. Une pause volontaire survit au défilement, à l’onglet et aux changements de préférence. Refus d’autoplay : poster et « Lire la vidéo ». Fichier absent ou illisible : poster seul, sans commande. Mouvement réduit ou économie de données : poster seul, aucune requête vidéo, aucune commande.
- **Mouvement de la monture** : même arrivée de 650 ms à chaque choix, amplitude réduite au cadre (translation −20 px / 8 px, −12 px / 6 px sur téléphone, rotation −2,5°), sans coupe visible de la monture ; le blanc périphérique de la boîte peut dépasser et être masqué. Le film porte désormais l’ambiance ; aucune animation permanente du produit.
- **Proportions** : la boîte photo de 265 px au-dessus de 1100 px conserve un espace blanc autour des photos très allongées. Le cadre est compact par sa largeur et son regroupement ; la photographie et son repli gardent la même hauteur. Aucune validation client du rendu.
