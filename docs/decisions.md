# Décisions de S1, S2 et S3

| Décision | Conséquence |
| --- | --- |
| Next.js et code direct confirmés | App Router strict ; pas de maquette image préalable |
| Catalogue + contact magasin | Aucun panier, compte, commande ou réservation simulée |
| Nuancier solaire confirmé par Hugo pendant S1 | Grande monture réelle dès l’accueil ; trois modèles peuvent être parcourus ; noir, lavande et jaune cohérents avec les éléments existants |
| Identité réelle prioritaire | Logo intact, photos de produits et magasins authentiques, aucune image externe ou générée |
| Données publiques figées le 21/10/2026 | 83 produits et 264 variantes sans requête au site historique pendant la démo |
| Trois catégories sources à corriger explicitement | 78 solaires normalisées ; données brutes et raisons conservées, validation client encore nécessaire |
| Taravao non arbitré | Aucune heure chiffrée ni code postal contradictoire affiché ; appel pour confirmation |
| Marques sans produits en ligne | Présentation, univers et magasins ; aucun assortiment ou prix inventé |
| Laboratoires et gammes distingués | FreshLook reste une gamme Alcon ; aucune assimilation des 38 identités à 38 fournisseurs indépendants |
| S1 locale | Aucun push, déploiement ou envoi ; étapes de S3 laissées ouvertes. Acceptée localement par le pilote le 21/10/2026 au commit `e3ee64e` ; ce n’est ni une validation commerciale du client ni une publication |

## Décisions de S2

| Décision | Conséquence |
| --- | --- |
| Code direct dans le nuancier choisi | Aucune nouvelle identité, comp ou interview ; S1 n’avait validé que F1/F2 |
| Libellés signés des lentilles | `+2.00` et `-2.00` ont des slugs distincts ; jamais de signe reconstruit depuis un slug ; `0.00`, absence et sphère vide (joker) sont distincts |
| ID réel et sphère séparés | Colorblends garde l’ID de variante réel (Grey, 1949) ; la sphère choisie accompagne la demande, elle ne crée pas de variante |
| URL canonique | Options invalides ignorées avec notice ; un défaut partiel ne choisit pas de couleur ; produit simple sans sélecteur |
| Formulaire de simulation | Mémoire locale, aucun backend, envoi, rendez-vous, stockage ou saisie dans l’URL. Réinitialisation limitée aux champs personnels et aux erreurs |
| Contexte public seulement | Produit, option, sujet et magasin voyagent jusqu’au contact et aux liens retour |
| Taravao | Une seule réponse affichée : horaires à confirmer, sans code postal chiffré |
| Prothèses | Uniquement à Mamao, sur rendez-vous à demander par téléphone. DENCOTT est un laboratoire partenaire de service, pas une 39e identité |
| Offres de 2022 exclues | Forfaits et « 2e paire » non affichés comme actuels ; seule leur existence datée est signalée sur Services et garanties |
| Garanties et services | Reprises mot pour mot de l’accueil source, avec leurs limites à confirmer. Le nettoyage est « proposé aux clients » : le texte source ne le dit pas gratuit, on ne l’invente pas ; plaquettes et réparations mineures sont offertes aux clients |
| Anciens chemins | Redirections natives exactes en local (307, 308 pour la barre finale) ; compte, panier et commande en 404 ; vraies inconnues en 404 avant le streaming |
| Pages légales | Distinguent le prototype (sans vente) de l’exploitant historique ; OVH et JK ne sont pas attribués au nouveau prototype. Actualisées en S3 (voir ci-dessous) |
| Pas d’extension de DESIGN.md | Voir ci-dessous |

## Décisions de S3 (préparation de la publication)

| Décision | Conséquence |
| --- | --- |
| S2 acceptée localement par le pilote le 21/10/2026 au commit `49458ec` | Base de S3 ; ni validation commerciale du client ni publication |
| Hébergement Vercel, équipe `devlab-tahiti`, projet `proto-optic2000` | Mentions : réalisation devlab, hébergement Vercel, adresse technique distincte du domaine de l’enseigne ; aucune identité ni adresse d’éditeur officiel inventée |
| Confidentialité hébergée | La saisie reste en mémoire du navigateur, non transmise ni persistée ; l’hébergeur reçoit les requêtes techniques (adresse IP, URL publique, données du navigateur) pour le fonctionnement et la sécurité. Ni promesse d’absence de trace ni durée de conservation inventée ; aucun cookie ou outil de mesure ajouté |
| Déploiement par la CLI depuis le commit poussé | Production à la racine du dépôt ; aucune liaison Git automatique nécessaire, donc pas de publication implicite d’un état non vérifié. `.vercel/` reste hors Git |
| Node `24.x` déclaré dans `engines` | Même version majeure en local et à la construction Vercel ; aucune dépendance modifiée |
| Aucune refonte | Monde, système et composants inchangés ; seules les copies d’hébergement et la matrice de captures évoluent |

### Extension de DESIGN.md : non, à ce stade

Le rôle documenteur demande de ne pas écrire pour prouver qu’on est passé. S2 ne change ni le monde, ni la palette, ni les polices ; le nuancier et ses boutons, champs, cartes, focus et états sont réutilisés, et la revue visuelle finale constate une échelle cohérente. Les composants S2 (menu « Nos univers », formulaire et états, sommaire, grilles de logos) sont décrits dans [l’architecture](architecture.md) et testés. Les cinq tailles locales sont des valeurs de page, utilisées une ou deux fois chacune : les inscrire au système les rendrait réutilisables par défaut. Elles seront à promouvoir en tokens seulement si une autre surface les réutilise ou si la direction visuelle change. Le décalage de date préexistant entre `DESIGN.md` et son sidecar n’est pas réparé ici.

Le lien FreshLook/Alcon est corroboré par la [présentation officielle Alcon](https://www.myalcon.com/car/contact-lenses/colors/). Les autres rattachements non établis sont indiqués à confirmer. DENCOTT est un laboratoire partenaire de service pour la reprise des prothèses (page livrée en S2), pas une marque du catalogue.

## Références et adaptations

Benchmark Mobbin préparé et inspecté lors du cadrage le 21/10/2026, puis relu pour S1. Pas de nouvelle recherche générale ni de copie d’assets de référence.

| Besoin | Observation fournie | Adaptation / compromis | Vérification |
| --- | --- | --- | --- |
| Choisir et revenir sur ses choix | [Walmart, lunettes](https://mobbin.com/screens/9dc0fed9-e815-4e92-ba47-e97e9c4cb0ed) : produits détourés, filtres, compteurs | Photos proportionnées, filtres connus seulement ; champs au-dessus des résultats ; aucun stock inventé | Recherche Glory, cumul, URL copiée, retour et reset |
| Comparer des modèles | [Selfridges, liste filtrée](https://mobbin.com/screens/97e038fa-5fd3-4e29-a891-d8d5d40034f0) : échelle homogène, marque et prix distincts | Grille 4/3/2 colonnes ; coloris exacts plutôt qu’une forme déduite des photos | Captures, tri de prix et aucun résultat |
| Comprendre une variante | [lululemon, produit](https://mobbin.com/screens/013f6a05-d050-4f9d-a225-2cebc8560981) : galerie et couleur nommée | Miniatures des vrais coloris ; prix/photo liés à la variante ; action magasin | Cinq Glory Glory, Baby Beach et rechargement du lien |
| Préparer une visite | [H&M, magasin](https://mobbin.com/screens/7d6dd63b-5792-402a-8f90-11093fcdad2d) : informations pratiques avant la carte | Trois magasins en liste ; liens de lieux précis ; pas de géolocalisation imposée | Trois fiches, téléphone, e-mail et CID |

Recherche officielle standard du 21/10/2026 pour S2, aperçus inspectés :

| Besoin | Observation | Adaptation / compromis | Vérification |
| --- | --- | --- | --- |
| Demande avec récapitulatif | [GetYourGuide](https://mobbin.com/screens/ce62c79e-a6a8-4673-a3ad-3fb8b5a1d8c5) : formulaire à gauche, récapitulatif à droite | Même disposition au-dessus de 800 px ; sur téléphone, formulaire puis récapitulatif. Ni modal, paiement, téléversement ni promesse | Tests de contact et captures |
| Catégorie puis précision | [Mintlify](https://mobbin.com/screens/806c8140-cf45-4b34-ae8c-9c58a8337009) : catégorie, sujet, description | Magasin, objet, coordonnées, message, avec notre vocabulaire | Idem |

Les comportements mobile/clavier, les états d’erreur et de succès et le nuancier d’accueil sont notre adaptation, vérifiés séparément ; ils ne sont pas une propriété démontrée par les captures Mobbin. Couleurs et polices d’interface ne constituent pas une charte officielle du client.
