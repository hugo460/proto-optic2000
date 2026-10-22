# Roadmap

## S1 — lot local (accepté localement le 21/10/2026)

Accueil et nuancier de trois modèles ; marques/gammes complètes ; recherche, filtres, tri, URL et aucun résultat ; catalogue 83/83, parcours solaire 78 modèles ; variantes solaires et galeries ; trois magasins et leur contexte de sélection. Sources, outils de contrôle, documentation et Git local. Acceptation du pilote au commit `e3ee64e`, sans validation commerciale du client.

## S2 — lot local (accepté localement le 21/10/2026)

- Livré : lunettes de vue, lentilles et entretien, jumelles et télescopes, basse vision, prothèses oculaires, services et garanties, équipe, contact et trois pages légales (11 nouvelles routes).
- Livré : sélection précise des lentilles par URL, avec signes, défauts partiels et sphères ouvertes, sans multiplier les variantes.
- Livré : formulaire local de simulation (validation, correction, succès, reprise), sans envoi, rendez-vous, stockage ni donnée dans l’URL.
- Livré : 25 anciennes pages traitées, redirections natives locales, offres de 2022 exclues, comptes/panier/commande en 404.
- Livré : démonstration S1 conservée et deux scénarios S2 (lentille signée → magasin → formulaire ; services/prothèses → Mamao).
- Reste à confirmer avec le client : prix, stocks, horaires (dont Taravao), garanties et mentions légales historiques. Aucune de ces réserves n’est levée par S2.
- Acceptation du pilote au commit `49458ec`, sans validation commerciale du client.

## S3 — version de présentation (acceptée par le pilote au commit `11575d3`)

- Textes légaux à l’hébergement réel (devlab, Vercel ; ancien OVH/JK distingué), confidentialité hébergée, captures complémentaires (navigation à 1024 px, basse vision, contact et légaux), guide de démonstration et procédure de publication.
- Cible : [prototype de présentation](https://proto-optic2000.vercel.app), équipe `devlab-tahiti`, projet `proto-optic2000`, production ; source sur `main`. Les commandes de recette sont dans le README et la procédure de publication dans la reprise. La remise à Omar porte sur le lien qualifié sans compte ; S3 a été acceptée techniquement par le pilote ; les réserves commerciales restent ouvertes.

## S4 — complément de présentation

- Bandeau de marques défilant (survol, focus, hors champ, mouvement réduit ; son bouton de pause/reprise a été retiré en S5/r2), arrivée animée des montures dans le nuancier conservé.
- Rendez-vous simulé `/rendez-vous` en quatre étapes, créneaux fictifs en heure de Tahiti, entrées depuis l’accueil, la navigation, le pied de page, les trois magasins, la vue, les services et les prothèses.
- Passe de finition : hiérarchie de l’en-tête entre 801 et 1100 px, légendes et réserves lisibles, pictogrammes calendrier/horloge dans la famille existante ; pause/lecture retirés en S5/r2.
- Reste hors prototype : agenda connecté, confirmation de prestations, horaires de Taravao, envoi de rendez-vous. S4 a été acceptée par le pilote après S4/r2 (correctif documentaire, commit `5406830`).

## S5 — refonte visuelle et correction du hero (S5/r3–r4)

- S5/r1 puis S5/r2 constituent l’historique technique ; leurs compositions d’accueil ont été rejetées visuellement par Hugo. Les invariants et les comportements éprouvés restent acquis.
- **S5/r3 intégrée, direction d’accueil remplacée en S5/r4** : nouveau hero où la monture réelle devient le sujet, trois modèles au choix, film déplacé dans une séquence secondaire ; accueil entier, navigation, pied de page, primitives, catalogue et fiches produits recomposés. Les photos, options, prix et liens source sont conservés.
- **S5/r4** : vidéo dans le hero initial sur demande explicite de Hugo, puis recomposition immersive après le rejet du premier essai S5/r4 : header intégré, titre/actions dans le film, deux plans de solaires et nuancier complet dans la section suivante. Le passage secondaire est supprimé ; catalogue, fiches et protections média restent conservés. Publication et contrôle documentés dans le rapport du correctif ; acceptation du pilote en attente.
- Validation technique et revue visuelle indépendante documentées dans le rapport de livraison ; elles ne préjugent pas de l’acceptation esthétique de Hugo, du pilote ou du client.

## S6 — prévue seulement

- **S6/r1 dépassée, non exécutée** : sa consigne de préserver le hero ne correspond plus à la demande du 22/10.
- **S6/r2 prévue, non lancée** : recomposition détaillée des marques, magasins, univers éditoriaux, contact et rendez-vous, après contrôle du correctif S5/r4. Ces pages restent fonctionnelles et lisibles avec le nouveau système commun. Aucun brief suivant lancé par cette livraison.

La migration CMS/Kauehi, le domaine client, les comptes historiques, les ordonnances, le paiement et les stocks synchronisés ne sont pas construits dans ce prototype.
