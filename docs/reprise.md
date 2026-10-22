# Reprise

Lire `PRODUCT.md`, `DESIGN.md`, les contrats `.impeccable/surfaces/`, l’inventaire, [l’architecture](architecture.md) et les décisions avant modification. `PRODUCT.md`, `DESIGN.md`, son sidecar et `.impeccable/config.json` ne sont pas modifiés par S2 ni S3. Le nuancier solaire a été confirmé par Hugo pendant S1 ; construction directe en code. S1 a été acceptée localement par le pilote le 21/10/2026 au commit `e3ee64e`, S2 le même jour au commit `49458ec` ; ce ne sont pas des validations commerciales du client.

Le checkout unique est sur `main`, avec `origin` égal à `https://github.com/hugo460/proto-optic2000.git`. Les rapports et preuves restent hors dépôt, et les processus temporaires sont arrêtés à la clôture.

Pour reprendre : `pnpm install --frozen-lockfile`, `pnpm check:data`, `pnpm test`, puis lancer le serveur selon README (port 3018 pour la recette). Les JSON normalisés se reproduisent avec `pnpm import:data` ; le build utilise uniquement les fichiers du dépôt. Ne pas dépendre d’un dossier personnel.

À préserver (S4) : créneaux fictifs isolés dans `appointment-demo.ts`, jour calculé en Pacific/Tahiti, aucune saisie hors de l’état React, résultat jamais récupérable après modification, Mamao seul pour les prothèses, copie du bandeau cachée aux technologies d’assistance et hors tabulation, avec liens utilisables au pointeur.

À préserver : 83 IDs, 264 variantes, termes de correction signés, défauts et attributs ouverts, correspondance prix/image, 38 identités, données magasin centralisées, réserve Taravao (une seule réponse), liens exacts et contexte de retour. De S2 : sélection de lentilles par URL (signe, 0.00 ≠ absence ≠ joker, ID réel séparé de la sphère), contexte public sans saisie en URL, formulaire local sans stockage ni envoi, Mamao seul pour les prothèses, redirections exactes sans chaîne, 404 comptes/panier/commande, citations de garanties mot pour mot, mentions historiques distinctes du prototype. Aucun panier ni reprise automatique du commerce historique.

Chiffres de contrôle (preuves S2 du 21/10/2026, build `CseoB7SqY03WHnX7vWnIO`) : 11 nouvelles routes (7 univers ou pages maison, contact, 3 légales) ; 140 pages HTML canoniques, `robots.txt` et 13 états de requête soit 154 contrôles HTTP ; 452 liens distincts, 216 contrôles de redirection, 20 vraies 404 ; 16 tests unitaires, 41 tests navigateur, 157 contrôles de qualité navigateur, 55 captures. Le pilote a rejoué ces contrôles avant d’accepter S2. Les rapports de ces exécutions sont hors dépôt. Les 120 avis du détecteur de design sont informatifs, non des défauts visuels ; il n’a pas été relancé.

S4 ajoute 5 tests métier (21 au total) et 14 scénarios navigateur (`tests/browser/s4.spec.ts`, 55 au total avec les 41 historiques) : bandeau (pause, survol, clavier sans copie, hors champ, onglet masqué, mouvement réduit), nuancier animé (changements rapides, photo manquante), rendez-vous (entrées, erreurs et focus, jour sans créneau, modification amont, Retour/Avant, rechargement, liens inconnus, Mamao, horloge avancée et reculée, pause tactile, 360 px). Les assertions historiques adaptées concernent seulement l’action jaune de l’en-tête (`.header-cta`) et l’ajout de `/rendez-vous` aux listes de liens du menu mobile et du pied de page. `check:routes`, `check:browser-quality` et `capture:ui` couvrent aussi `/rendez-vous`, ses états et des images horodatées du mouvement ; les chiffres de recette de S4 sont dans le rapport hors dépôt.

S3 ajoute à `capture:ui`, sans retirer la matrice existante : navigation fermée puis ouverte à 1024 px sur l’accueil et sur Services et garanties, basse vision en 768×1024 et 1440×1000, contact direct en 390×844, et les trois pages légales en 1440×1000. Le script échoue aussi si une valeur saisie apparaît dans une URL demandée.

Limites historiques S1–S3 : aucune recette dans le navigateur intégré pendant ces sessions. S4 a ouvert ses propres onglets intégrés et parcouru le RDV ; les suites Chromium isolées complètent les contrôles. Aucun navigateur personnel utilisé. Prix, stocks, horaires, garanties et mentions historiques restent à confirmer par le client ; ne pas résoudre silencieusement Taravao ni transformer les indicateurs techniques WooCommerce en stock magasin.

## Publication Vercel

URL de présentation : [proto-optic2000.vercel.app](https://proto-optic2000.vercel.app).

Cible : équipe `devlab-tahiti`, projet `proto-optic2000` (`prj_axPUZYfZoTrAdShea4m8KPG31nUv`), environnement production, racine du dépôt (Next.js, Node `24.x` via `engines`). Aucun secret, base ou service métier payant. La seule configuration ajoutée à la construction est `ENABLE_EXPERIMENTAL_COREPACK=1` en production, pour sélectionner pnpm 11.5.2 depuis `packageManager`, conformément à la [documentation Vercel](https://vercel.com/docs/builds/configure-a-build#corepack). Aucune liaison Git automatique : la publication part de la CLI, depuis le commit déjà poussé.

1. Arbre propre et poussé : `git status --short` vide, `git fetch origin` puis `main` identique à `origin/main`. Noter le SHA (`git rev-parse HEAD`).
2. Déployer depuis un export propre du commit poussé (`git archive <sha>`) : uniquement les fichiers versionnés. Conserver séparément le manifeste SHA-256 de l’export et le SHA Git ; ne pas envoyer les résultats de recette, les fichiers d’environnement ou les preuves privées.
3. Vérifier la cible sans la modifier : `vercel project inspect proto-optic2000 --scope devlab-tahiti --non-interactive`. Ne jamais lier un projet homonyme qui servirait un autre dépôt.
4. Dans le répertoire de l’export, lier le projet : `vercel link --yes --project proto-optic2000 --scope devlab-tahiti`. `.vercel/` reste hors des sources versionnées.
5. Depuis l’export lié, vérifier `vercel project inspect --scope devlab-tahiti --non-interactive`, puis publier : `vercel deploy --prod --scope devlab-tahiti`. Vérifier `vercel inspect <url-du-déploiement> --scope devlab-tahiti` (statut READY, alias) et `vercel inspect <url-du-déploiement> --logs` pour les versions Node/pnpm utilisées. Recouper les fichiers sources du déploiement avec l’export ; une étiquette de SHA seule ne prouve pas leur identité.
6. Vérifier l’alias stable en navigation anonyme, sans session Vercel : HTTPS, aucun écran de connexion, accueil, liens profonds du [guide](demo.md), images, polices, `noindex` et `robots.txt`. Rejouer `OPTIC_BASE_URL=<alias> pnpm test:browser` et `OPTIC_BASE_URL=<alias> pnpm check:routes`.

Revenir à une version antérieure : `vercel rollback <url-du-déploiement> --scope devlab-tahiti`, ou republier le commit voulu. Le domaine historique du client, son WordPress, ses comptes et commandes ne sont jamais concernés.

Les réserves commerciales restent inchangées après la publication.
