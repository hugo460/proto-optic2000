# Optic 2000 Tahiti — prototype

Premier lot S1 : accueil interactif, 38 présentations de marques et gammes, catalogue de 83 produits dont 78 solaires, fiches de produits et de magasins. Catalogue et contact magasin, sans panier.

## Lancer

Node 24 recommandé (minimum Next : 20.9), pnpm 11.5.2. Un seul projet à la racine.

```sh
pnpm install --frozen-lockfile
pnpm dev --hostname 127.0.0.1 --port 3011
```

Pour la version de présentation locale :

```sh
pnpm build
pnpm start --hostname 127.0.0.1 --port 3012
```

Ouvrir `http://127.0.0.1:3012`. Pas de variable secrète, compte, CMS ou service distant requis. Les images et polices sont embarquées. Aucun appel au WordPress historique à l’exécution.

## Vérifier

```sh
pnpm lint
pnpm typecheck
pnpm check:data
pnpm check:media
pnpm check:contrast
pnpm test
OPTIC_BASE_URL=http://127.0.0.1:3012 pnpm check:routes
OPTIC_BASE_URL=http://127.0.0.1:3012 pnpm test:browser
OPTIC_BASE_URL=http://127.0.0.1:3012 OPTIC_PROOF_DIR=/chemin/hors-du-depot pnpm capture:ui
OPTIC_BASE_URL=http://127.0.0.1:3012 OPTIC_PROOF_DIR=/chemin/hors-du-depot pnpm check:browser-quality
```

Les tests navigateur utilisent Chromium via Playwright. Sur une machine sans navigateur de test : `pnpm exec playwright install chromium`. Le serveur doit tourner avant les quatre dernières commandes. Les captures et logs volumineux restent hors Git ; `.impeccable/review/` est ignoré.

## Données et reprise

Le snapshot public réduit est inclus dans `src/data/source/`. `pnpm import:data` reproduit les entités normalisées, sans accès au dossier d’enquête. Les médias optimisés sont déjà fournis : aucune génération ou connexion nécessaire pour construire la démo.

Lire [le scénario](docs/demo.md), [l’architecture](docs/architecture.md), [l’inventaire](docs/content-inventory.md), [les décisions](docs/decisions.md) et [la reprise](docs/reprise.md). `PRODUCT.md` et `.impeccable/config.json` préexistaient au code ; ils sont conservés. `DESIGN.md` et son sidecar décrivent les tokens réellement livrés.

Les prix, stocks et horaires publics ne sont pas validés par le client. Taravao reste explicitement à confirmer. Les cinq fiches de lentilles sont conservées et consultables ; le choix détaillé des corrections appartient à S2. Aucun effet métier réel ni formulaire d’envoi dans S1.

Dépôt : `https://github.com/hugo460/proto-optic2000.git`, branche `main`. S1 reste locale. Publication et transmission réservées à S3 après validation des lots précédents.
