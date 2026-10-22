# Optic 2000 Tahiti — prototype

Lot S1 (accepté localement par le pilote le 21/10/2026 au commit `e3ee64e`, sans validation commerciale du client ni publication) : accueil interactif, 38 présentations de marques et gammes, catalogue de 83 produits dont 78 solaires, fiches de produits et de magasins.

Lot S2 (accepté localement par le pilote le 21/10/2026 au commit `49458ec`, sans validation commerciale du client) : tous les univers utiles (lunettes de vue, lentilles et entretien, jumelles et télescopes, basse vision, prothèses oculaires, services et garanties, équipe), sélection précise des lentilles, formulaire de contact local, trois pages légales, 25 anciennes pages traitées (redirections, regroupements ou exclusions motivées). Toujours sans panier, compte, commande, envoi ni rendez-vous réel.

Version de présentation S3 : [ouvrir le prototype](https://proto-optic2000.vercel.app). Mentions adaptées à Vercel, matrice de recette complétée et [guide de démonstration](docs/demo.md). S3 a été acceptée par le pilote.

Complément S4 (demandé par Hugo après le retour d’Omar du 21/10/2026) : bandeau de marques défilant, présentation animée des montures du nuancier, **rendez-vous simulé** en quatre étapes sur `/rendez-vous` (créneaux fictifs en heure de Tahiti, rien n’est réservé ni envoyé) et passe de finition des parcours. S4 a été acceptée techniquement par le pilote après le correctif documentaire S4/r2 ; les informations commerciales restent à confirmer par l’enseigne.

S5/r3 refond l’accueil après le rejet visuel de S5/r2 : une vraie monture en grand dans un espace clair, trois modèles interactifs, film d’ambiance secondaire, navigation et pied de page recomposés. Catalogue et fiches rapprochent recherche, photos, options et accès au magasin ; les quinze vues initiales de Glory Glory restent dans un rail de miniatures. Les données et parcours de simulation sont conservés. L’acceptation visuelle de Hugo et du pilote reste à recueillir. S6/r1 est dépassée ; S6/r2 est prévue seulement pour les autres familles de pages. Voir [les décisions](docs/decisions.md) et [DESIGN.md](DESIGN.md).

## Lancer

Node 24 (`engines` : `24.x`, utilisé aussi par Vercel ; minimum Next : 20.9), pnpm 11.5.2. Un seul projet à la racine.

```sh
pnpm install --frozen-lockfile
pnpm dev --hostname 127.0.0.1 --port 3011
```

Pour la version de présentation locale :

```sh
pnpm build
pnpm start --hostname 127.0.0.1 --port 3018
```

Ouvrir `http://127.0.0.1:3018` (le port 3012 reste valable pour S1 ; les recettes S2 utilisent 3018). Pas de variable secrète, compte, CMS ou service distant requis. Les images et polices sont embarquées. Aucun appel au WordPress historique à l’exécution.

## Vérifier

```sh
pnpm lint
pnpm typecheck
pnpm check:data
pnpm check:media
pnpm check:contrast
pnpm test
OPTIC_BASE_URL=http://127.0.0.1:3018 pnpm check:routes
OPTIC_BASE_URL=http://127.0.0.1:3018 pnpm test:browser
OPTIC_BASE_URL=http://127.0.0.1:3018 OPTIC_PROOF_DIR=/chemin/hors-du-depot pnpm capture:ui
OPTIC_BASE_URL=http://127.0.0.1:3018 OPTIC_PROOF_DIR=/chemin/hors-du-depot pnpm check:browser-quality
```

`check:media` contrôle techniquement le film (durée, codec, faststart, poids, empreintes, manifeste `docs/hero-media.json`), les 760 images et les 13 logos du bandeau ; `check:contrast` mesure les paires de couleurs de la feuille de style. Ni l’un ni l’autre ne certifient les droits ni la qualité artistique. `node scripts/prepare-marquee.mjs` régénère les 13 logos du bandeau (`src/data/marquee-media.json`, `docs/marquee-media.json`) à partir des logos existants, sans toucher aux originaux.

`check:routes` contrôle toutes les pages canoniques (dont `/rendez-vous` et ses liens publics), `robots.txt`, des états de requête, les liens internes, les redirections de l’ancien site et les vraies 404. `check:browser-quality` rejoue les routes à 360 px, 720×500 en 2×, au clavier (contact, rendez-vous, bandeau de marques), avec le mouvement par défaut et aux seuils 801/1101/1280 px. `capture:ui` ajoute les états du rendez-vous et des images horodatées de l’animation. `check:data` vérifie les décomptes, la couverture des 25 pages sources et les citations de garanties. Les tests navigateur couvrent aussi les href de téléphone, e-mail et plan sans les activer, et échouent sur tout trafic hors origine locale (dont l’ancien domaine). Les tests navigateur utilisent Chromium via Playwright. Sur une machine sans navigateur de test : `pnpm exec playwright install chromium`. Le serveur doit tourner avant les quatre dernières commandes. Les captures et logs volumineux restent hors Git ; `.impeccable/review/` est ignoré.

## Données et reprise

Le snapshot public réduit est inclus dans `src/data/source/`. `pnpm import:data` reproduit les entités normalisées, sans accès au dossier d’enquête. Les médias optimisés sont déjà fournis : aucune génération ou connexion nécessaire pour construire la démo.

Lire [le scénario](docs/demo.md), [l’architecture](docs/architecture.md), [l’inventaire](docs/content-inventory.md), [les décisions](docs/decisions.md) et [la reprise](docs/reprise.md). `PRODUCT.md` et `.impeccable/config.json` préexistaient au code ; ils sont conservés. `DESIGN.md` et son sidecar décrivent les tokens réellement livrés.

Les prix, stocks, horaires, garanties et mentions légales historiques sont publics et datés ; le client ne les a pas validés. Taravao garde une seule réponse : horaires à confirmer. Les cinq fiches de lentilles proposent une sélection signée (voir [l’architecture](docs/architecture.md)) ; les prix restent « à confirmer en magasin ». Le formulaire de contact et le rendez-vous sont des simulations en mémoire locale : aucun envoi, réservation, stockage ou donnée saisie dans l’URL. Les créneaux du rendez-vous sont fictifs (`src/data/appointment-demo.ts`), sans lien avec l’agenda ni les horaires des magasins. Les pages sont `noindex` ; les images et polices sont embarquées ; les tests échouent si le site historique est sollicité.

Les pages légales désignent devlab (réalisation) et Vercel (hébergement) sans inventer d’éditeur officiel ; OVH et JK restent attribués à l’ancien site. La confidentialité distingue la saisie, qui ne quitte pas le navigateur, des requêtes techniques reçues par l’hébergeur. `noindex`, l’en-tête `X-Robots-Tag` et `Disallow: /` sont conservés.

Dépôt : `https://github.com/hugo460/proto-optic2000.git`, branche `main`. Publication : équipe Vercel `devlab-tahiti`, projet `proto-optic2000`, production, racine du dépôt ; procédure dans [la reprise](docs/reprise.md#publication-vercel). Aucun message au client final. Les réserves commerciales restent inchangées.
