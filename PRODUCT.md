# Product — Optic 2000 Tahiti

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js, demandé explicitement par Hugo le 21 octobre 2026. Prototype autonome dans ce dépôt, destiné à être déployé sur Vercel et relié à `https://github.com/hugo460/proto-optic2000.git`. App Router et TypeScript sont la proposition technique du pilote, à réaliser avec des dépendances stables vérifiées. Aucun CMS requis pour le prototype ; Kauehi concerne une éventuelle réalisation après accord client.

## Users

Omar présente le prototype au client Optic 2000 Tahiti. D'après le PRD et le site existant, le site s'adresse aux visiteurs qui découvrent les collections, comparent des lunettes ou lentilles et cherchent un magasin et des conseils à Tahiti. Aucun persona démographique plus précis n'a été confirmé.

## Product Purpose

Montrer une refonte professionnelle, cohérente avec Optic 2000, qui organise mieux les marques et contenus existants, facilite la découverte du catalogue et l'accès aux trois magasins. Le prototype doit permettre une présentation fluide sur ordinateur et téléphone, avec des parcours complets et des interactions compréhensibles.

## Positioning

Optic 2000 Tahiti associe l'enseigne Optic 2000, un assortiment multimarque récupérable, trois magasins locaux (Centre-ville, Mamao, Taravao) et des services d'optique, de basse vision et de prothèses oculaires présents sur le site existant. Les coordonnées, photos et contenus locaux constituent les preuves ; aucune promesse de stock, prix actuel, disponibilité ou ancienneté supplémentaire ne doit être inventée.

## Operating Context

Prototype commercial destiné à être présenté par Omar. Le mail du 21 octobre 2026 précise que la migration Kauehi ne viendrait qu'après accord du client. Les données publiques sont figées pour une démonstration reproductible ; le parcours principal ne dépend pas de la disponibilité du WordPress historique. La préparation et la remise à zéro de la démonstration doivent rester simples.

## Capabilities and Constraints

- Hugo a confirmé le 21 octobre 2026 : **catalogue et contact magasin**, sans panier ni commande simulée.
- Complément S4 demandé par Hugo le 21 octobre 2026 : marques défilantes (leur bouton de pause a été retiré en S5/r2 à la demande de Hugo : l’arrêt vient du survol, du focus, du champ et de l’onglet), présentation animée des montures dans le nuancier conservé, et **rendez-vous simulé** distinct du contact. Quatre temps : magasin/motif, jour/heure fictifs en heure de Tahiti, coordonnées, récapitulatif modifiable ; résultat sans réservation ni e-mail, puis recommencement. Aucun agenda ni prestation médicale confirmés.
- Complément S5 demandé par Hugo le 21 octobre 2026, recomposé en S5/r2 après le rejet du rendu S5/r1 (cadre à filet noir, commandes Pause, boucle reconnaissable, menu lavande) : accueil éditorial où le texte et les actions occupent une zone calme et la matière filmée (gros plans de lunettes et matières, sans visage) sa propre part, nuancier secondaire compact, menus clairs et compacts, aucune commande Pause/Lire. Le film est décoratif, local, sans lien affirmé avec le catalogue, les magasins ou une approbation de marque ; poster seul si mouvement réduit, économie de données, refus d’autoplay ou échec. La reprise des autres parcours (S6) est seulement prévue, hors de ce document.
- Couvrir les univers existants : vue, soleil, lentilles et entretien, jumelles et télescopes, basse vision, prothèses oculaires, services et garanties, marques, magasins et contact. Les anciens chemins et écarts de reprise sont à inventorier.
- Préserver tous les produits et variantes récupérés, leurs photos, noms, prix et attributs. Les marques présentes uniquement en magasin doivent être représentées sans faux produits en ligne.
- Français, prix XPF sans décimales, contexte horaire Pacific/Tahiti. Les signes de correction des lentilles doivent rester exacts.
- Les demandes de contact ou préparation de visite dans la démonstration sont simulées et doivent l'indiquer clairement ; aucune réservation effective, aucun paiement ni envoi au magasin n'est à effectuer par l'application.
- Les liens publics téléphone, e-mail et itinéraire peuvent être réels et doivent être exacts.
- Tarifs, stocks, horaires, offres et garanties sont repris de sources publiques non validées par le client. Les horaires et le code postal de Taravao divergent selon les pages : garder la provenance, signaler « à confirmer auprès du magasin » et ne pas annoncer une ouverture calculée pour ce point de vente.
- Pas de bascule du domaine client, migration de comptes/commandes, CMS, administration, synchronisation de stocks ou traitement d'ordonnances dans ce prototype.

## Brand Commitments

Respecter l'identité Optic 2000 et son logo réel, les marques réellement présentes sur le site tahitien et les éléments locaux authentiques. Améliorer la présentation sans inventer de nouvelles informations commerciales. Ne pas représenter des personnes ou lieux fictifs comme l'équipe ou les magasins réels. La composition et les tokens d'interface relèvent du contrat visuel et de DESIGN.md, pas de ce document produit.

## Evidence on Hand

Sources publiques relevées le 21 octobre 2026 : [site Optic 2000 Tahiti](https://optic2000tahiti.com/), APIs WordPress/WooCommerce publiques et sitemaps. L'enquête du pilote a récupéré 25 pages utiles, 83 produits uniques, 264 variantes détaillées et 818 médias valides sur 819 URL recensées. 36 identités de marques ou gammes ont été identifiées par leurs logos ; TruBlends et Colourvue sont également identifiés dans les produits. Les données normalisées, leur provenance et les écarts doivent être documentés dans l'inventaire du projet. Les sources privées d'échanges restent hors Git.

L'ancien hero Huelo est en 404 ; ne pas le réutiliser comme média distant. Les anciens visuels promotionnels ne prouvent pas que leurs offres sont toujours applicables. Aucune donnée de compte client ou commande n'est fournie pour la démo.

## Product Principles

- Partir des contenus réels et rendre les écarts de source traçables.
- Relier découverte du produit et accès au magasin par des parcours complets.
- Rendre chaque interaction visible, compréhensible, réversible et rejouable en démonstration.
- Privilégier un socle simple et structuré, adapté au prototype et à sa reprise future.

## Accessibility & Inclusion

Navigation utilisable sur mobile et ordinateur, texte lisible, contraste et focus perceptibles, commandes accessibles au clavier, noms et erreurs associés aux champs. Ne pas utiliser la couleur seule pour expliquer une variante ou un état. Les pages de basse vision et prothèses doivent rester calmes, explicatives et orientées vers le spécialiste, sans nouvelle promesse médicale.
