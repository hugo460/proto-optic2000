# Inventaire des contenus publics

Snapshot du 21 octobre 2026. Les sources exécutables, captures de recherche, échanges privés et originaux volumineux ne sont pas versionnés.

## Couverture S1

| Entité | Nombre | Traitement |
| --- | --- | --- |
| Produits | 83 IDs uniques | Tous conservés, accessibles dans le catalogue général et par URL |
| Produits solaires | 78 | Maui Jim ; 75 catégories solaires d’origine + 3 corrections proposées |
| Lentilles | 5 | Fiches factuelles et contact ; choix des corrections en S2 |
| Variantes | 264 IDs uniques | 231 solaires + 33 lentilles ; prix, images, SKU et attributs conservés |
| Types | 76 variables / 7 simples | Aucune variante synthétique ajoutée |
| Images de galeries | 716 références | Ordre et correspondance des images préservés |
| Identités | 38 | 36 marques/gammes avec logo + TruBlends et Colourvue sans logo confirmé |
| Pages publiques utiles | 25 | Page d’exemple exclue ; correspondances ci-dessous |
| Médias livrés | 755 WebP | Uniquement produits/variantes, logos retenus et photos réellement affichées |
| Magasins | 3 | Coordonnées centralisées, photos authentiques et liens de lieux précis |

## Sources et reproduction

Entrées publiques archivées : [API Woo Store](https://optic2000tahiti.com/wp-json/wc/store/v1/products?per_page=100), [pages WordPress](https://optic2000tahiti.com/wp-json/wp/v2/pages?per_page=100), fiches publiques `/produit/<slug>/`, pages de marques et magasins. Les variantes détaillées viennent du JSON public présent dans les fiches. Le site n’est jamais interrogé pendant la démonstration.

`src/data/source/catalogue.public.json` contient les champs publics utiles des 83 fiches, leurs 264 variantes et les sélections par défaut lues dans les formulaires HTML. Les descriptions sont du texte inerte, sans HTML ni scripts historiques. `brands.public.json` conserve les preuves publiques, sans chemin local d’enquête. `assets.public.json` conserve URL, hash original et dimensions pour les médias référencés par les données sources ; tous ne sont pas nécessaires à S1. `pages.public.json` contient les 25 identités de pages utiles.

Depuis un checkout seul :

```sh
pnpm install --frozen-lockfile
pnpm import:data
pnpm check:data
pnpm build
```

Le résultat de `import:data` doit rester identique. Les WebP livrés suffisent au build. Pour réactualiser à partir d’une nouvelle archive publique compatible : `python3 scripts/prepare-snapshot.py --source-dir /archive-publique`, puis `pnpm import:data`. Les fichiers d’entrée attendus sont les deux réponses API, `site/html-fetch-index.json`, les fiches `site/html/<slug>.html`, `brands-inventory.json` et `assets-manifest.json`. Le script lit seulement ces noms et n’importe aucun échange privé. Ne pas lui donner une archive de comptes/commandes.

Pour reconstruire les médias depuis les originaux publics de cette archive : `python3 scripts/prepare-media.py --assets-dir /archive-publique/assets --impeccable /chemin/du/skill/scripts/impeccable`. Le script ne convertit que les médias référencés dans `src/data/media.json`. Sans Impeccable, les fichiers restent utilisables mais leur provenance devra être embarquée avant une livraison soumise à ce workflow. Les fichiers actuels la portent déjà. Compression WebP qualité 88, alpha préservé, largeur maximale 1600 px, proportions conservées. URL et hash source restent aussi dans les données.

## Écarts de source

| Fiche / point | Donnée brute conservée | Normalisation / affichage |
| --- | --- | --- |
| The Bird | Aucune catégorie | Ajout proposé de soleil et Maui Jim, cohérent avec les références et la fiche |
| Kalani | Aucune catégorie | Même correction proposée, références HS818 |
| Kanaha Asian Fit | Homme et Maui Jim ; pas Solaire | Ajout proposé de solaire |
| Catalogue historique | Compteurs publics incohérents, 75 fiches classées solaires dans l’API | 78 solaires dans le jeu normalisé ; 83 au total, compteurs calculés sur ces données |
| Glory Glory | 5 variantes, dont noir brillant Manchester United à 38 100 XPF | Prix et photo de variante prioritaires ; les 4 autres restent à 34 600 XPF |
| FreshLook et corrections | Slugs parfois sans signe ; libellés signés exacts | Afficher les noms, jamais reconstruire le signe depuis le slug |
| Sphère vide | Option libre compatible pour la couleur concernée | Chaîne vide conservée, distincte de 0.00 ; aucune multiplication des combinaisons |
| Défaut sphère | 0-00 sur quatre fiches de lentilles, sans couleur par défaut | Le défaut partiel ne choisit pas silencieusement une couleur |
| Stocks Woo | `is_in_stock` et commande différée peuvent coexister ; champ produit parfois absent | Conserver l’absence comme null ; aucun badge de stock magasin ; confirmation explicite |
| Entités textuelles | Certains noms contiennent `&amp;` | Décodage pour les libellés affichés ; termes bruts inchangés dans le snapshot |
| Hero Huelo | Ancien média en 404 | Écart conservé ; aucun hotlink. Le nuancier utilise les montures disponibles |
| Promotions | Visuels historiques datés | Aucune promotion publiée comme offre actuelle |

Les descriptions de lentilles de S1 se limitent aux caractéristiques factuelles d’ouverture, avec contact magasin ; les délais/mentions de stock historiques restent dans le modèle pour leur traitement prudent en S2.

## Magasins

Centre-ville et Mamao : lun–ven 7h30–17h30, sam 8h–13h, dim fermé, à confirmer client. Téléphones : +68940427754 et +68940421944 ; e-mail commun `optic2000tahiti@gmail.com`. Mamao est le point de contact prothèses, uniquement sur rendez-vous.

Taravao : +68940575700, `optic2000taravao@gmail.com`, galerie Carrefour. La liste publique annonce lundi 13h–17h et ouverture à 8h30 les autres jours ; la fiche indique 8h et pause 13h–14h. Codes postaux 98719 / 98713. Les deux sources et leurs horaires complets sont conservés dans `stores.ts`. L’affichage utilise une seule réponse : horaires à confirmer auprès du magasin, sans code postal chiffré ni badge d’ouverture calculé.

Les trois CID Google Maps proviennent des identifiants de lieux des cartes intégrées sur les fiches publiques. Les contrôles ne passent aucun appel, n’envoient aucun e-mail et ne demandent pas de géolocalisation.

## Marques et gammes

Les catégories ci-dessous viennent des pages portant les logos ou des fiches produits ; aucune forme/matière de monture n’est déduite visuellement. FreshLook reste rattaché à Alcon, pas un laboratoire indépendant. Les liens laboratoire/gamme non établis restent à confirmer. DENCOTT est réservé à la page de service prothèses de S2.

| Identité | Univers source | Produits récupérés |
| --- | --- | --- |
| ACUVUE | Lentilles | Présentation + magasins |
| ad-lib | Vue | Présentation + magasins |
| Alcon | Lentilles | Présentation + magasins |
| Azzaro | Vue | Présentation + magasins |
| Bausch + Lomb | Lentilles | Présentation + magasins |
| Bosma | Observation | Présentation + magasins |
| Celestron | Observation | Présentation + magasins |
| Charmant | Vue | Présentation + magasins |
| Colourvue | Lentilles | 1 |
| CooperVision | Lentilles | Présentation + magasins |
| Demetz | Vue / Soleil | Présentation + magasins |
| Dilem | Vue | Présentation + magasins |
| Elite Eyewear | Soleil | Présentation + magasins |
| FreshLook | Lentilles | 2 |
| Gucci | Vue / Soleil | Présentation + magasins |
| INVU | Vue / Soleil | Présentation + magasins |
| Julbo | Soleil | Présentation + magasins |
| LCS | Lentilles | Présentation + magasins |
| Longchamp | Soleil | Présentation + magasins |
| Marius Morel 1880 | Vue | Présentation + magasins |
| Mauboussin | Vue / Soleil | Présentation + magasins |
| Maui Jim | Soleil | 78 |
| Michael Kors | Soleil | Présentation + magasins |
| Minima | Vue | Présentation + magasins |
| Miru | Lentilles | Présentation + magasins |
| Morel | Vue | Présentation + magasins |
| Nike | Soleil | Présentation + magasins |
| Oakley | Vue / Soleil | Présentation + magasins |
| Oxibis | Vue | Présentation + magasins |
| Perl | Observation | Présentation + magasins |
| Persol | Soleil | Présentation + magasins |
| Ray-Ban | Soleil | Présentation + magasins |
| Rip Curl | Soleil | Présentation + magasins |
| Schott N.Y.C. | Vue | Présentation + magasins |
| TruBlends | Lentilles | 2 |
| Versace | Vue | Présentation + magasins |
| Vogue Eyewear | Vue | Présentation + magasins |
| Vuarnet | Soleil | Présentation + magasins |

## Anciens chemins et couverture

Ce tableau décrit les correspondances documentaires, pas des redirections déjà mises en service sur le domaine client.

| Ancien chemin | Destination ou traitement |
| --- | --- |
| `/` | `/` — S1 |
| `/mentions-legales/` | Contenu et destination à réaliser en S2 |
| `/cgv/` | Commerce historique non repris ; conditions utiles à examiner en S2 |
| `/lentille-couleur-et-fantaisie/` | Contenu et destination à réaliser en S2 |
| `/maui-jim-pour-femmes/` | `/solaires?genre=femme` — S1 |
| `/maui-jim-pour-hommes/` | `/solaires?genre=homme` — S1 |
| `/boutique-en-ligne/` | `/catalogue` — S1 |
| `/qui-sommes-nous/` | Contenu et destination à réaliser en S2 |
| `/basse-vision/` | Contenu et destination à réaliser en S2 |
| `/protheses-occulaires/` | Contenu et destination à réaliser en S2 |
| `/jumelles-et-telescopes/` | Contenu et destination à réaliser en S2 |
| `/mon-compte/` | Exclu : aucun compte |
| `/commander/` | Exclu : aucune commande |
| `/panier/` | Exclu : aucun panier |
| `/boutique/` | `/catalogue` — S1 |
| `/nos-offres/` | Inventaire en S2, sans promotion datée présentée comme actuelle |
| `/contact/` | Coordonnées via `/magasins` en S1 ; formulaire local explicite en S2 |
| `/taravao/` | `/magasins/taravao` — S1 |
| `/mamao/` | `/magasins/mamao` — S1 |
| `/centre-ville/` | `/magasins/centre-ville` — S1 |
| `/nos-magasins/` | `/magasins` — S1 |
| `/lentilles/` | Contenu et destination à réaliser en S2 |
| `/lunettes-de-soleil/` | `/solaires` — S1 |
| `/lunettes-de-vue/` | Contenu et destination à réaliser en S2 |
| `/politique-de-confidentialite/` | Contenu et destination à réaliser en S2 |

Les 83 chemins produit ont leur équivalent `/produits/<slug>`. Les autres univers ne sont pas proposés comme destinations de navigation tant que leurs pages ne sont pas livrées. Les marques de ces univers possèdent dès S1 une présentation et une sortie utile vers les magasins.
