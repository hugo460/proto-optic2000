# Décisions du prototype (S1 à S5/r3)

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

## Décisions de S4 (complément après le retour d’Omar)

| Décision | Conséquence |
| --- | --- |
| S3 acceptée par le pilote ; Hugo tranche le 21/10/2026 : lunettes animées, nuancier conservé, RDV simulé | Pas de vidéo ni de nouvelle composition d’accueil (remplacé en S5, voir ci-dessous) ; monde, palette et polices inchangés |
| Monture posée en 650 ms puis immobile | Transform/opacity CSS, image entière, sans faux 3D, boucle ni changement automatique ; mouvement réduit sans animation |
| Bandeau de marques défilant (avec pause/reprise en S4, retirée en S5/r2) | 13 vrais logos choisis ; annuaire complet inchangé (38 identités) ; copie cachée aux technologies d’assistance et hors Tab, dont les liens visibles restent cliquables ; rangée immobile au focus et en mouvement réduit |
| RDV simulé distinct du contact | Quatre étapes, créneaux fictifs séparés de `stores.ts`, aucune réservation ni e-mail ; « poser une question » reste la demande |
| Motifs illustratifs | Contrôle de vue sans consultation médicale ni ophtalmologique promise ; prothèses à Mamao uniquement, vrai rendez-vous par téléphone |
| Dates rejouables | Jour calculé en Pacific/Tahiti avec horloge injectable ; sept jours à partir du lendemain ; aucune date figée |
| Navigation | Action jaune « Préparer un RDV » à la place de « Trouver mon magasin » (« Nos magasins » reste dans la navigation) ; entre 801 et 1100 px, « Les solaires », déjà dans « Nos univers », laisse sa place à l’action compacte « RDV » |
| Recommencer | Garde le magasin, efface tout le reste ; un rechargement efface tout sauf le contexte public de l’URL |
| Lisibilité | Légendes, réserves, prix secondaires et repères de marques passent de 10–11 px à 12 px sur téléphone et ordinateur |

## Décisions de S5 (accueil recomposé), puis remplacées par S5/r2

S5/r1 a été demandé par Hugo le 21/10/2026 (plateau plus petit et encadré, film discret derrière, gros plans de lunettes et matières sans visage) puis **rejeté** par Hugo malgré des tests verts. Ses prescriptions suivantes sont **remplacées** et ne s’appliquent plus : cadre opaque à filet d’encre de 1 px (440–476 px) avec fiche et bande de trois choix à filets ; film désaturé sous voile lavande ; film de 8 s composé de 4 s suivies de 4 s inversées ; commande Pause/Lire du film et commande Pause du bandeau ; menu « Nos univers » lavande plein écran à filets. Restent valables de S5 : le choix « sans visage », le film local et décoratif sans lien affirmé avec le catalogue ou les magasins, le poster seul en mouvement réduit, économie de données ou échec, et l’absence de dépendance.

## Historique S5/r2 (prescriptions visuelles remplacées par S5/r3)

| Décision | Conséquence |
| --- | --- |
| Hugo, 21/10/2026 : rendu S5/r1 jugé vieillot (bordures noires, grand cadre de lunettes, Pause, boucle reconnaissable) ; il veut donner envie à Optic 2000 de changer de site | Reprise en deux sessions : S5/r2 (accueil, film, menus, marques, pied de page, règles communes) était livrée ; S6/r1 était prévue, puis a été déclarée dépassée au profit de S5/r3 et S6/r2 |
| Identité conservée | Logo réel, noir, lavande, jaune, Sora, Manrope ; seed historique `ec9ae70fdd93869f` inchangé. Recomposition éditoriale directement en code, ni décomposition en maquettes ni nouvelle identité |
| Hero en deux parts | Texte 45 % / film 55 % au-dessus de 1100 px, 50 / 50 de 801 à 1100 px, bande de film puis texte jusqu’à 800 px. Texte aligné sur la colonne du conteneur ; jamais de texte sur le film, donc ni voile ni filtre à simuler |
| Actions du hero | Une action jaune « Toutes les solaires » et le lien « Préparer un rendez-vous » ; en colonne jusqu’à 1280 px, en ligne avec retour à la ligne au-dessus |
| Nuancier secondaire | Plus de carte ni d’onglets : trois boutons nommés `aria-pressed` (44 px) et la monture seule sur un petit plateau blanc sans cadre ni panneau (208 × 104 px, 184 × 96, 136 × 82, 136 × 76, 116 × 68 selon la largeur). Arrivée de 520 ms puis repos, aucune sélection automatique |
| Sélection produits sous le hero | Mamane, Alulu, Pehu, Liquid Sunshine : distincte des trois modèles du nuancier (un doublon entre ces deux séries avait été relevé par la revue) |
| Film de 24,32 s | Trois plans Pexels distincts à vitesse native (5241102 de 0 à 8,40 s ; 5241104 de 2 à 10,24 s ; 5241100 de 0 à 9,12 s), sans visage, sans inversion, répétition ajoutée ni ralenti ; fondus de .48 s et raccord circulaire. 1920 × 1080, 25 i/s, H.264 High, yuv420p, faststart, muet, 4 895 212 octets (sous les 5 Mo visés) ; poster de 42 206 octets. Seul l’auteur de 5241104 (Kaboompics) est confirmé ; aucune attribution à un magasin ou au catalogue |
| Aucune commande Pause/Lire | Film : condition seule (champ, onglet visible, préférences, économie de données) ; refus d’autoplay ou erreur = poster sans démarrage manuel. Marques : survol, focus, champ, onglet masqué ; mouvement réduit = rangée manuelle de la liste originale |
| Bandeau de marques | 13 logos dérivés des logos existants, ne retirant que le canevas extérieur vide ; originaux de 760 images intacts. Cellules entières (3, 4, 5, 6 selon la largeur), « Toutes les marques » dans sa colonne. La boucle reste de 52 s |
| En-tête et menus | Barre noire de 84 px (76 / 74). Panneau de papier ancré sous la barre (≤ 820 px) : univers sur deux colonnes, enseigne sur une, libellés de 17 px, sans descriptif ni filets ; les `summary` restent dans les données. De 801 à 960 px seulement, « Les solaires » quitte la barre (il reste dans les univers). Menu mobile : dialogue blanc nommé « Menu », défilable, action RDV visible, retour de focus et reprise du RDV inchangés |
| Pied de page compact | Identité et actions sur une ligne, magasins à côté du plan du site, mention du prototype ; sur le rendez-vous l’action devient « Préparer une demande » en lien texte (état du RDV conservé) |
| Contrôles | `check:media` mesure durée, codec, faststart, poids, empreintes, manifeste, 760 images et 13 dérivés : contrôle technique, ni certificat artistique ni des droits. `check:contrast` mesure 17 paires dérivées de la feuille de style en plus des paires historiques ; aucun texte n’étant sur le film, le composite est celui de la lavande pure |
| Revue visuelle indépendante (Claude Opus, contexte neuf) | Six constats corrigés, puis un verdict a jugé les six résolus tout en notant deux régressions (R1 texte hors colonne ; R2 marques tassées de 1101 à 1280 px) ; le dernier verdict, ciblé sur R1 et R2, les juge résolues. Pas une acceptation globale ni du client ; visionnage outillé réel de 55 s dont deux raccords à vitesse normale, captures toutes les 2 s, sans vision continue du mouvement du relecteur. Détecteur passé une fois : 109 avis, 0 primaire, informatif |
| Tests adaptés | Les scénarios qui exigeaient les boutons Pause sont réécrits pour le nouveau comportement demandé (aucune commande) ; des scénarios de responsive et de navigation sont ajoutés sans retirer d’assertion métier. Le nombre « 72 scénarios identiques » n’est plus promis |
| Publication | Même projet Vercel `proto-optic2000`, export propre du commit de `main` poussé, sources comparées ; cible et URL publique inchangées (voir la reprise) ; aucune publication n’est affirmée par ce document avant d’avoir eu lieu |

### Extension de DESIGN.md : non, à ce stade

Le rôle documenteur demande de ne pas écrire pour prouver qu’on est passé. (Cette section date de S2 ; `DESIGN.md` et son sidecar ont été actualisés ensuite pour S5/r2, qui change réellement le système d’accueil et de navigation.) S2 ne change ni le monde, ni la palette, ni les polices ; le nuancier et ses boutons, champs, cartes, focus et états sont réutilisés, et la revue visuelle finale constate une échelle cohérente. Les composants S2 (menu « Nos univers », formulaire et états, sommaire, grilles de logos) sont décrits dans [l’architecture](architecture.md) et testés. Les cinq tailles locales sont des valeurs de page, utilisées une ou deux fois chacune : les inscrire au système les rendrait réutilisables par défaut. Elles seront à promouvoir en tokens seulement si une autre surface les réutilise ou si la direction visuelle change. Le décalage de date préexistant entre `DESIGN.md` et son sidecar n’est pas réparé ici.

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

La finition S4 garde l’action principale au niveau de l’étape : sur le RDV, le pied de page propose la demande en lien texte. Les calendriers précèdent les libellés ; les flèches de fin désignent une sortie. Sur le RDV sans contexte public, l’action de l’en-tête ramène le focus à l’étape courante sans modifier l’historique ; depuis un contexte prérempli, elle ouvre une nouvelle entrée générique.

## Décisions de S5/r3 (22/10/2026)

| Décision | Conséquence |
| --- | --- |
| Hugo rejette le hero et demande une refonte ambitieuse | La composition S5/r2 est remplacée ; ses tests fonctionnels et données restent la base. S6/r1 est dépassée, S6/r2 prévue seulement. |
| Montures réelles au premier plan | Hero sur un champ blanc commun, titre maîtrisé, grande monture entière, trois modèles manuels et légende ; le film quitte le premier écran. Aucun faux produit ni nouvelle promesse commerciale. |
| Blanc, noir, jaune et lavande précise | Logo authentique et couleurs reconnaissables ; typographie et proportions de prototype révisées, sans prétendre disposer d’une charte officielle. |
| Média animé secondaire | Fichier et poster locaux conservés, sans visage ni attribution fictive ; mêmes replis et aucun téléchargement en mouvement réduit ou saveData, aucune commande Pause/Lire. |
| Catalogue compact | Recherche/filtres GET et URL conservés, produits visibles tôt, packshots sur un seul champ blanc ; aucune option masquée pour la capture. |
| Fiche produit | Galerie secondaire dans un rail horizontal, toutes les vues conservées ; cinq coloris nommés compacts, aucune présélection ; prix/image/ID/contexte synchronisés. Lentilles partagées inchangées dans leurs règles. |
| Trois noms contenant une entité littérale dans l’archive | `&rsquo;` devient l’apostrophe typographique dans les noms normalisés de Pu’u Kukui, Ho’okipa Asian fit et Dragon’s Teeth. Slugs, IDs, graphie des mots et sources restent intacts ; aucun rendu HTML injecté. |
| Construction directe en code | Proposition concrète de composition affichée ; aucun choix humain ni satisfaction esthétique présumés. Contrats de surface mis à jour, revue visuelle indépendante distincte de la revue code. |
| Livraison | Main, push normal et même cible Vercel depuis export propre ; aucun message à Omar ni lancement de S6. Réserves commerciales inchangées. |
