# Architecture

## Socle

Next.js 16.4.2, React 19.3.1, App Router et TypeScript strict. Installation manuelle officielle pour préserver les deux fichiers de cadrage présents dans le dossier initial. CSS natif, aucun framework de composants ou backend ajouté. Les scripts lint et TypeScript sont distincts du build, conformément aux [instructions Next](https://nextjs.org/docs/app/getting-started/installation).

TypeScript 6.0.3 respecte la plage prise en charge par typescript-eslint. ESLint 9.39.5 est conservé pour la compatibilité déclarée des plugins React/import/a11y de `eslint-config-next` ; sa branche est signalée dépréciée par le registre. Une migration vers ESLint 10 demandera de vérifier ces dépendances ensemble. Les scripts d’installation pnpm autorisés se limitent à esbuild et unrs-resolver. Un lockfile, aucun monorepo malgré le fichier de configuration pnpm.

## Découpage

- `src/app/` : routes, metadata noindex, layout, chargement, erreurs et 404. Pages serveur par défaut. Les [params et searchParams](https://nextjs.org/docs/app/api-reference/file-conventions/page) sont asynchrones.
- `src/components/ui/` : image locale avec repli, liens d’action, pictogrammes SVG.
- `layout/` : navigation et pied de page. Le menu mobile utilise `dialog`, son focus natif et Escape.
- `catalog/` : cartes serveur, filtres GET, sélecteur d’accueil et expérience produit.
- `stores/` : cartes, lecture du contexte produit et récapitulatif de sélection.
- `src/data/` : types, produits, variantes, marques, médias et magasins. Les JSON générés proviennent du snapshot public réduit.
- `src/lib/` : XPF sans décimales, filtres/tri, URL de retour autorisées, sélection des variantes et regroupement des vues.
- `scripts/` : transformation, contrôles et captures reproductibles ; `tests/` : comportements métier et parcours Chromium.

## Flux

Le serveur lit les données locales → rend la liste correspondant à l’URL → un lien transmet cette URL comme contexte de retour → la fiche choisit une variante réelle → son prix, sa photo et ses caractéristiques changent → la sélection accompagne le visiteur vers la liste puis la fiche du magasin. Les liens téléphone, e-mail et Google Maps ouvrent les outils de l’utilisateur ; ils ne déclenchent aucun envoi ou appel automatique.

Les filtres utilisent des formulaires GET. Le volet repliable, sur tablette et téléphone jusqu’à 800 px, est un petit îlot client ; l’envoi du formulaire est natif. Recherche, genre d’origine, coloris exact, budget et tri sont dans l’URL ; les valeurs inconnues sont ignorées avec explication. Le retour n’accepte que `/solaires` et `/catalogue` sur le même site. Aucun localStorage ni état persistant à effacer avant la démonstration.

Les variantes solaires sont des boutons nommés et pressés, utilisables au clavier. La sélection met à jour `variante` dans l’URL avec l’API d’historique prise en charge par Next. L’absence de sélection conserve la fourchette et la galerie complète. Les vues d’un coloris suivent le groupement de la galerie source jusqu’au premier visuel de la variante suivante ; le premier visuel sélectionné vient toujours de la variante elle-même.

Les slugs connus sont déclarés par `generateStaticParams`, avec `dynamicParams=false`. Les slugs inconnus renvoient une 404 avant le streaming. Le chargement est limité aux listes catalogue/solaires : un fallback global commencerait le streaming avant de connaître la validité d’un slug.

## Magasins et réseau

`src/data/stores.ts` centralise tous les récapitulatifs, coordonnées et réserves. Les CID Google Maps sont les entiers exacts des identifiants de lieux inclus dans les cartes de la source. L’action « Plan et itinéraire » mène à la fiche Google du lieu exact, où l’utilisateur peut choisir son itinéraire. Pas de géolocalisation ni de carte embarquée.

Next optimise les images locales via son propre endpoint. Les fontes variables Sora et Manrope, obtenues du [répertoire officiel Google Fonts](https://github.com/google/fonts), sont servies localement par `next/font/local`, avec les licences OFL incluses. Pas d’analytics, cookies métier, API, paiement ou collecte de document médical.

## Évolution CMS

Une future intégration pourra remplacer les JSON par une lecture serveur de contenus validés : mêmes IDs, marque/gamme/laboratoire, variantes avec options signées, médias et provenance, état de validation magasin. Ne pas construire une couche de repository générique ou une synchronisation de stock pour S1. Le choix et le contrat du CMS restent hors de ce prototype.
