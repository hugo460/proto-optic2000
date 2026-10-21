# Inventaire des contenus publics

Snapshot du 21 octobre 2026. Les sources exécutables, captures de recherche, échanges privés et originaux volumineux ne sont pas versionnés.

## Couverture S1 et S2

| Entité | Nombre | Traitement |
| --- | --- | --- |
| Produits | 83 IDs uniques | Tous conservés, accessibles dans le catalogue général et par URL |
| Produits solaires | 78 | Maui Jim ; 75 catégories solaires d’origine + 3 corrections proposées |
| Lentilles | 5 | Fiches factuelles, contact et sélection S2 opérante (couleur et sphère signées, ID réel de variante) ; produit simple sans sélecteur ; nom exact « FreshLook® Colorblends » |
| Variantes | 264 IDs uniques | 231 solaires + 33 lentilles ; prix, images, SKU et attributs conservés |
| Types | 76 variables / 7 simples | Aucune variante synthétique ajoutée |
| Images de galeries | 716 références | Ordre et correspondance des images préservés |
| Identités | 38 | 36 marques/gammes avec logo + TruBlends et Colourvue sans logo confirmé |
| Pages publiques utiles | 25 | Page d’exemple exclue ; statut de chacune ci-dessous |
| Médias livrés | 760 WebP | 755 de S1 + 5 visuels éditoriaux S2 réellement affichés (campagnes vue, équipe, deux instruments) |
| Magasins | 3 | Coordonnées centralisées, photos authentiques et liens de lieux précis |

## Sources et reproduction

Entrées publiques archivées : [API Woo Store](https://optic2000tahiti.com/wp-json/wc/store/v1/products?per_page=100), [pages WordPress](https://optic2000tahiti.com/wp-json/wp/v2/pages?per_page=100), fiches publiques `/produit/<slug>/`, pages de marques et magasins. Les variantes détaillées viennent du JSON public présent dans les fiches. Le site n’est jamais interrogé pendant la démonstration.

`src/data/source/catalogue.public.json` contient les champs publics utiles des 83 fiches, leurs 264 variantes et les sélections par défaut lues dans les formulaires HTML. Les descriptions sont du texte inerte, sans HTML ni scripts historiques. `brands.public.json` conserve les preuves publiques, sans chemin local d’enquête. `assets.public.json` conserve URL, hash original et dimensions pour les médias référencés par les données sources ; tous ne sont pas nécessaires à S1. `pages.public.json` contient les 25 pages utiles avec identifiant, URL, titre, date de création, date de modification et SHA-256 du contenu rendu ; seules les huit pages dont la formulation est reprise (accueil, lunettes de vue, lentilles, jumelles et télescopes, basse vision, prothèses, qui sommes-nous, mentions légales) gardent un texte brut inerte, shortcodes Divi retirés. Aucun HTML, script ni donnée privée (compte, commande, échange) n’est versionné ; les coordonnées publiques des magasins et de l’exploitant historique y figurent.

Les contenus réorganisés sont typés dans `src/data/content.ts` (navigation dans `src/data/navigation.ts`, caractéristiques lentilles dans `src/data/lens-facts.ts`). Transformation : regroupement et orthographe corrigée, sans changement d’information commerciale ; toute mention historique est datée et signalée à confirmer. `pnpm check:data` vérifie que chaque phrase de garantie/service reprise figure mot pour mot dans le texte source de l’accueil.

Depuis un checkout seul :

```sh
pnpm install --frozen-lockfile
pnpm import:data
pnpm check:data
pnpm build
```

Le résultat de `import:data` doit rester identique. Les WebP livrés suffisent au build. Pour réactualiser à partir d’une nouvelle archive publique compatible : `python3 scripts/prepare-snapshot.py --source-dir /archive-publique`, puis `pnpm import:data`. Les fichiers d’entrée attendus sont les deux réponses API, `site/html-fetch-index.json`, les fiches `site/html/<slug>.html`, `brands-inventory.json` et `assets-manifest.json`. Le script lit seulement ces noms et n’importe aucun échange privé. Ne pas lui donner une archive de comptes/commandes.

Pour reconstruire les médias depuis les originaux publics de cette archive : `python3 scripts/prepare-media.py --assets-dir /archive-publique/assets --impeccable /chemin/du/skill/scripts/impeccable`. L’option `--missing-only` ne convertit que les fichiers absents (utilisée en S2 pour les 5 ajouts, sans réécrire les 755 existants). Le script ne convertit que les médias référencés dans `src/data/media.json`. Sans Impeccable, les fichiers restent utilisables mais leur provenance devra être embarquée avant une livraison soumise à ce workflow. Les fichiers actuels la portent déjà. Compression WebP qualité 88, alpha préservé, largeur maximale 1600 px, proportions conservées. URL et hash source restent aussi dans les données.

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
| Promotions | Trois visuels de « Nos offres » (2022) | Non affichés ; motifs ci-dessous |
| Descriptions lentilles | Stock, délais 15/17 jours, « hors période de fêtes » | Conditionnement/renouvellement affichés ; le reste en réserve datée sur la fiche |

Les descriptions de lentilles restent intactes dans le modèle. Les fiches affichent : FreshLook 1-Day boîte de 10 ; Colorblends boîte de 2 et renouvellement mensuel ; TruBlends One-Day boîte de 10 ; TruBlends 5 couleurs boîte de 10, 5 couleurs, sans correction. Stock, délais et la règle CrazyLens (avec correction sur commande hors période de fêtes) sont présentés comme mentions de 2022 à confirmer, sans chiffre de délai.

## Magasins

Centre-ville et Mamao : lun–ven 7h30–17h30, sam 8h–13h, dim fermé, à confirmer client. Téléphones : +68940427754 et +68940421944 ; e-mail commun `optic2000tahiti@gmail.com`. Mamao est le point de contact prothèses, uniquement sur rendez-vous.

Taravao : +68940575700, `optic2000taravao@gmail.com`, galerie Carrefour. La liste publique annonce lundi 13h–17h et ouverture à 8h30 les autres jours ; la fiche indique 8h et pause 13h–14h. Codes postaux 98719 / 98713. Les deux sources et leurs horaires complets sont conservés dans `stores.ts`. L’affichage utilise une seule réponse : horaires à confirmer auprès du magasin, sans code postal chiffré ni badge d’ouverture calculé.

Les trois CID Google Maps proviennent des identifiants de lieux des cartes intégrées sur les fiches publiques. Les contrôles ne passent aucun appel, n’envoient aucun e-mail et ne demandent pas de géolocalisation.

## Marques et gammes

Les catégories ci-dessous viennent des pages portant les logos ou des fiches produits ; aucune forme/matière de monture n’est déduite visuellement. FreshLook reste rattaché à Alcon, pas un laboratoire indépendant. Les liens laboratoire/gamme non établis restent à confirmer. DENCOTT est cité uniquement comme laboratoire partenaire sur `/protheses-oculaires`, sans fiche ni logo : ce n’est pas une 39e identité.

Destinations S2 : chaque identité garde sa fiche `/marques/<id>` ; les 16 marques Vue sont aussi en grille sur `/lunettes-de-vue`, les 9 identités lentilles sur `/lentilles` (avec leur relation), Bosma/Celestron/Perl sur `/jumelles-et-telescopes`, les marques Soleil via `/solaires` et `/marques?univers=Soleil`.

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

Statuts : **repris** (contenu présenté), **réorganisé** (regroupé/corrigé sans changement commercial), **remplacé** (fonction assurée autrement), **exclu** (motif), **non récupérable**. Alias = redirection native `next.config.ts` (307, `src/lib/legacy-redirects.ts`) : sources exactes, aucun catch-all, query conservée, pas de chaîne ni boucle (contrôlé par `check:data`). Next peut d’abord retirer la barre finale (308), puis appliquer l’alias (307) : une normalisation précède l’alias, sans chaîne entre alias. 13 règles d’alias (12 chemins fixes + le motif des 83 slugs produit). Aucune bascule du domaine client.

| Ancien chemin (modif. source) | Statut | Destination / traitement |
| --- | --- | --- |
| `/` (13/06/2023) | Réorganisé | `/` ; textes services/garanties → `/services-et-garanties` ; ancien hero Huelo non récupérable (404) |
| `/lunettes-de-vue/` (06/09/2022) | Réorganisé | `/lunettes-de-vue` : 16 marques, 2 campagnes ; forfaits de 2022 exclus |
| `/lunettes-de-soleil/` (16/12/2022) | Remplacé | alias → `/solaires` ; posts sociaux non repris (catalogue d’abord) |
| `/maui-jim-pour-femmes/` | Remplacé | alias → `/solaires?genre=femme` (autres paramètres conservés) |
| `/maui-jim-pour-hommes/` | Remplacé | alias → `/solaires?genre=homme` |
| `/boutique/`, `/boutique-en-ligne/` | Remplacé | alias → `/catalogue` |
| `/lentilles/` (16/12/2022) | Réorganisé | `/lentilles` : 5 produits, familles, entretien, laboratoires ; lien « Docteur vidéo » (site tiers non vérifié) exclu |
| `/lentille-couleur-et-fantaisie/` | Remplacé | alias → `/lentilles#couleur-et-fantaisie` (mêmes 5 produits) |
| `/jumelles-et-telescopes/` (06/09/2022) | Réorganisé | même chemin ; 2 photos d’instruments, 3 logos ; 13 autres photos produits sans prix/stock non reprises (pas de faux rayon) |
| `/basse-vision/` (31/08/2022) | Repris | même chemin, texte corrigé |
| `/protheses-occulaires/` (01/09/2022) | Réorganisé | alias de la faute → `/protheses-oculaires` ; Mamao uniquement sur RDV ; photos de prothèses et avant/après exclues (sobriété, pas de démonstration spectaculaire) |
| `/nos-offres/` (06/09/2022) | Exclu (motivé) | alias → `/services-et-garanties#offres-historiques` ; voir promotions ci-dessous |
| `/qui-sommes-nous/` (18/09/2022) | Réorganisé | même chemin ; photo entière, 2 articles ; anciennetés, « plus anciens », magasins partenaires Fare Mata exclus |
| `/nos-magasins/`, `/centre-ville/`, `/mamao/`, `/taravao/` | Remplacé | alias → `/magasins`, `/magasins/<slug>` (S1) |
| `/contact/` (12/12/2022) | Remplacé | même chemin : formulaire de demande simulée, local, sans envoi |
| `/mentions-legales/` (15/12/2022) | Réorganisé | statut du prototype + mentions historiques à valider (SARL S2M, n° Tahiti 976464, BP 775 98713 Papeete, directeur S. Ganancia) ; OVH/JK = ancien site uniquement ; e-mails non repris |
| `/politique-de-confidentialite/` (04/05/2023) | Remplacé | fonctionnement réel du prototype ; ancienne politique (WordPress, PayPal, Gravatar, cookies) incompatible et non reprise |
| `/cgv/` (« en vigueur au 29/11/2022 ») | Remplacé | `/cgv` : disposition « aucune vente en ligne », conditions de 2022 non applicables ni republiées, sortie magasin |
| `/mon-compte/`, `/panier/`, `/commander/` | Exclu | 404 volontaire : aucun compte, panier ni commande |
| `/produit/<slug>/` (83) | Remplacé | alias → `/produits/<slug>` pour les 83 slugs exacts ; `/produit/<inconnu>` reste 404 |

### Promotions et médias non repris

- `4b6bfaecb3-48424401…jpg` (« 2e paire offerte toute l’année ») et forfaits `dae11e15c8-fofait-simple-vision.png` (9 900 F à partir de, monture et verres garantis 2 ans, étui et microfibre) et `2e358fced4-forfait-prog.png` (24 900 F à partir de, progressifs HD, mêmes conditions) : visuels datés de 2022, non confirmés, distincts des garanties de l’accueil. Ils ne sont pas affichés ; seule leur existence est mentionnée sur `/services-et-garanties#offres-historiques`.
- Autres campagnes sociales (POST01/13/14/24…), visuels « équipe offre », photos magasin supplémentaires : non nécessaires, non repris. Essai virtuel Fittingbox et vidéos : non repris, aucun faux bouton.
- Médias S2 ajoutés (WebP q88, dimensions/proportions d’origine, provenance embarquée + sidecar Impeccable) : campagnes `4fc6abc0d6` (POST27) et `62e14c3acf` (POST21), photo d’équipe `6b3c1455b1` (sans identification des personnes), `b413c0bdf9` (Perl) et `16bd866170` (Celestron).
