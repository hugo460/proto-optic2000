# Architecture

## Socle

Next.js 16.4.2, React 19.3.1, App Router et TypeScript strict. Installation manuelle officielle pour préserver les deux fichiers de cadrage présents dans le dossier initial. CSS natif, aucun framework de composants ou backend ajouté. Les scripts lint et TypeScript sont distincts du build, conformément aux [instructions Next](https://nextjs.org/docs/app/getting-started/installation).

TypeScript 6.0.3 respecte la plage prise en charge par typescript-eslint. ESLint 9.39.5 est conservé pour la compatibilité déclarée des plugins React/import/a11y de `eslint-config-next` ; sa branche est signalée dépréciée par le registre. Une migration vers ESLint 10 demandera de vérifier ces dépendances ensemble. Les scripts d’installation pnpm autorisés se limitent à esbuild et unrs-resolver. Un lockfile, aucun monorepo malgré le fichier de configuration pnpm.

## Découpage

- `src/app/` : routes, metadata noindex, layout, chargement, erreurs et 404. Pages serveur par défaut. Les [params et searchParams](https://nextjs.org/docs/app/api-reference/file-conventions/page) sont asynchrones.
- `src/components/ui/` : image locale avec repli, liens d’action, pictogrammes SVG.
- `layout/` : navigation et pied de page. Le menu mobile utilise `dialog`, son focus natif et Escape. Seule l’action du pied de page est un petit îlot lié au chemin courant : sur le RDV, elle mène au contact en lien texte, sans répéter le CTA principal de l’étape.
- `catalog/` : cartes serveur, filtres GET, sélecteur d’accueil et expérience produit.
- `stores/` : cartes, lecture du contexte produit et récapitulatif de sélection.
- `src/data/` : types, produits, variantes, marques, médias et magasins ; `content.ts` (pages éditoriales), `navigation.ts` (univers, pages de la maison, légaux, sans import du catalogue pour ne pas l’embarquer dans l’en-tête client) et `lens-facts.ts` (caractéristiques des lentilles). Les JSON générés proviennent du snapshot public réduit.
- `src/lib/` : XPF sans décimales, filtres/tri, URL de retour autorisées, sélection des variantes et regroupement des vues ; `lens-selection.ts` (options signées), `contact-context.ts` (contexte public et validation) et `legacy-redirects.ts` (anciens chemins).
- `contact/` : formulaire en îlot client. `content/` : gabarits éditoriaux partagés. `catalog/lens-picker.tsx` : sélecteur couleur/sphère.
- S5 : `catalog/hero-video.tsx` (film d’ambiance de l’accueil : préférences, lecture, commande) utilisé par `catalog/home-showcase.tsx`.
- S4 : `appointment/` (parcours de rendez-vous en îlot client, progression, récapitulatif et colonne magasin), `catalog/brand-marquee.tsx` (bandeau de marques), `src/data/appointment-demo.ts` (motifs et créneaux **fictifs**) et `src/lib/appointment.ts` (fonctions pures : dates, créneaux, validation, invalidation, contexte public).
- `scripts/` : transformation, contrôles et captures reproductibles ; `tests/` : comportements métier et parcours Chromium.

## Flux

Le serveur lit les données locales → rend la liste correspondant à l’URL → un lien transmet cette URL comme contexte de retour → la fiche choisit une variante réelle → son prix, sa photo et ses caractéristiques changent → la sélection accompagne le visiteur vers la liste puis la fiche du magasin. Les coordonnées ne sont définies que dans `stores.ts` et les tests vérifient les `href` sans les activer. Les liens téléphone, e-mail et Google Maps ouvrent les outils de l’utilisateur ; ils ne déclenchent aucun envoi ou appel automatique.

Les filtres utilisent des formulaires GET. Le volet repliable, sur tablette et téléphone jusqu’à 800 px, est un petit îlot client ; l’envoi du formulaire est natif. Recherche, genre d’origine, coloris exact, budget et tri sont dans l’URL ; les valeurs inconnues sont ignorées avec explication. Le retour n’accepte que `/solaires`, `/lentilles` et `/catalogue` sur le même site. Aucun localStorage ni état persistant à effacer avant la démonstration, y compris pour le formulaire.

Les variantes solaires sont des boutons nommés et pressés, utilisables au clavier. La sélection met à jour `variante` dans l’URL avec l’API d’historique prise en charge par Next. L’absence de sélection conserve la fourchette et la galerie complète. Les vues d’un coloris suivent le groupement de la galerie source jusqu’au premier visuel de la variante suivante ; le premier visuel sélectionné vient toujours de la variante elle-même.

Les slugs connus sont déclarés par `generateStaticParams`, avec `dynamicParams=false`. Les slugs inconnus renvoient une 404 avant le streaming. Le chargement est limité aux listes catalogue/solaires : un fallback global commencerait le streaming avant de connaître la validité d’un slug.

## Lentilles : sélection signée

`lens-selection.ts` lit l’URL (`couleur`, `sphere`, `variante`) et la valide contre le produit ; l’URL est donc l’unique état et un lien direct, un rechargement ou l’historique redonnent la même sélection.

- Les libellés viennent des termes source signés (`+2.00`, `-2.00`, `0.00`). Les slugs ne portent pas le signe et `+2`/`-2` ont des slugs différents : on ne reconstruit jamais un signe depuis un slug. L’ordre numérique est calculé sur les noms signés.
- `0.00`, l’absence de valeur et une valeur vide sont trois choses distinctes. Une sphère vide dans une variante est un joker (compatible avec toute sphère), jamais une correction choisie ni un `0.00`.
- Pour Colorblends, l’identifiant réel de variante (Grey, 1949) reste séparé de la sphère choisie : la couleur détermine la référence et le prix, la sphère accompagne la demande au magasin. Un ID inconnu, étranger au produit ou contradictoire avec les autres paramètres est ignoré avec une notice ; un défaut de sphère partiel (`0-00`, sans couleur) ne choisit aucune couleur.
- États : `fixed` (produit simple, par exemple TruBlends 5 couleurs : aucun sélecteur), `empty`, `incomplete`, `complete`, `incompatible`. Une variante n’est résolue que si le visiteur a lui-même choisi tout attribut spécifique.
- `changeSelection` retourne les paramètres canoniques. Au changement d’option, le composant relit l’URL courante avant de modifier ses clés, pour ne pas perdre le choix précédent si deux choix précèdent le rendu différé du routeur. Écriture par `history.replaceState`.
- Limites assumées : plusieurs couleurs partagent une photo ; la légende le dit. Plusieurs lentilles ont un prix public unique pour toutes les couleurs ; la note précise qu’il est à confirmer en magasin.

## Contexte public et contact

`contact-context.ts` transmet seulement des identifiants publics : `produit`, `variante`, `couleur`, `sphere`, `sujet`, `magasin`. Le sujet est celui de l’URL, sinon déduit de la famille du produit (`lentilles` ou `soleil`). Les valeurs inconnues sont ignorées et listées pour une notice. Le sujet `protheses` impose Mamao : un autre magasin est remplacé, et la validation refuse la combinaison. Les liens vers le magasin et la fiche produit conservent sélection et sujet courants ; les retours explicitement filtrés restent prioritaires, et une carte de lentille revient par défaut vers `/lentilles`.

Le formulaire garde ses champs dans l’état React local. Rien n’est envoyé, enregistré (ni `localStorage` ni cookie) ni écrit dans l’URL ou un journal : seuls `magasin` et `sujet` sont synchronisés par `replaceState`. Validation à la soumission, focus sur le premier champ en erreur, erreurs corrigées au fil de la saisie, puis récapitulatif de succès qui annonce qu’aucun message ni rendez-vous n’existe. « Préparer une autre demande » ne vide que nom, e-mail, téléphone, message et erreurs ; magasin, objet et la sélection jointe restent. Il n’agit sur aucun stockage.

## Rendez-vous de démonstration (S4)

`/rendez-vous` est une page serveur qui lit le contexte public (`magasin`, `motif`, `produit` et sa sélection ; `etape` ne saute aucune étape ; une valeur suivante est signalée, une valeur inconnue ou toute autre clé est ignorée avec une notice, sans rien choisir ni réafficher) puis passe à l’îlot client des données minimales : coordonnées des trois magasins, résumé léger du produit validé, date du jour à Tahiti. L’îlot n’importe ni `data/index.ts` ni `stores.ts`.

- **Données** : `appointment-demo.ts` est séparé de `stores.ts` et sans import de données. Trois motifs illustratifs (contrôle de vue, conseil et essai de montures, prothèses oculaires à Mamao seulement) et une semaine type de créneaux par magasin. Aucun créneau le dimanche (donc un jour sans créneau dans toute fenêtre de sept jours), ni lundi et jeudi à Taravao. Ces créneaux ne sont pas déduits des horaires publiés ; Taravao garde « horaires à confirmer ».
- **Dates** : `tahitiToday(now)` calcule le jour en `Pacific/Tahiti` par `Intl`, indépendamment du fuseau de la machine ou du visiteur ; les sept jours proposés commencent au lendemain. Libellés français écrits en dur pour un rendu identique serveur/navigateur. À minuit Tahiti (minuterie nettoyée et reprogrammée même si l’horloge système recule), au retour de visibilité et à chaque passage d’étape ou simulation, l’îlot relit l’horloge : un jour devenu aujourd’hui ou passé est retiré avec une notice. Les paramètres répétés contradictoires sont ignorés avec notice ; un nouveau contexte public validé réinitialise le flow. Le focus rejoint instantanément le titre utile, sans défilement animé de la page.
- **Étapes** : visite → créneau → coordonnées → récapitulatif, puis résultat. `allowedView` borne toute demande (lien, Retour/Avant, modification) à la première étape incomplète ; le résultat n’existe qu’après simulation et disparaît à la moindre modification. Changer magasin, motif ou jour retire un créneau devenu incompatible (`reconcileSlot`) et l’explique. Choisir les prothèses déplace la visite à Mamao ; un autre magasin avec ce motif est refusé à la validation.
- **Historique** : `history.pushState` n’écrit que des ancres publiques (`#creneau`, `#coordonnees`, `#recapitulatif`, `#resultat`) ; aucune saisie dans l’URL ni dans `history.state`. Un chargement direct ou un rechargement sur une ancre repart à la première étape, avec une notice.
- **Validation** : nom, e-mail et téléphone facultatif reprennent `validatePerson`, extrait de `contact-context.ts` et commun aux deux formulaires ; la validation du contact n’est pas appelée avec de fausses valeurs. Focus sur le titre de chaque étape et sur le premier champ en erreur.
- **Recommencer** garde le magasin et efface motif, jour, heure, coordonnées, erreurs et résultat. Aucun stockage, cookie, requête ou journal.

## Mouvement (S4)

- **Nuancier** : seule la photographie est remontée par clé de modèle ; elle se pose en 650 ms (`frame-arrive`, translation de 56 px et rotation de 4° en 2D en S4, ramenées en S5 à 20 px et 2,5° pour rester dans la marge du cadre, sortie amortie) puis reste immobile. Nom, prix, coloris et lien changent immédiatement ; un nouveau choix interrompt l’arrivée en cours. Les deux autres photos sont préchargées après hydratation (`preload` de React DOM). Mouvement réduit : aucune animation.
- **Bandeau de marques** : la piste contient la liste originale de liens puis une copie `aria-hidden`, sans ID, avec liens hors tabulation utilisables au pointeur, qui ferme la boucle (déplacement de 50 % de la piste). Pause au survol sur les appareils qui le permettent, par le bouton « Pause / Reprendre », hors champ (`IntersectionObserver`) et quand l’onglet est masqué (`visibilitychange`), écouteurs nettoyés au démontage. Au focus clavier, la copie disparaît et la liste originale devient une rangée immobile défilable ; le logo focalisé est ramené dans le champ. Mouvement réduit : rangée manuelle, sans copie ni bouton.

## Accueil composé et film d’ambiance (S5)

- **Composition** : titre, proposition et actions à gauche ; cadre opaque à droite (photo, fiche, lien du modèle, trois choix). Empilé jusqu’à 800 px dans l’ordre du DOM. `sizes` des photos du cadre : `calc(100vw - 72px)` jusqu’à 600 px, `52vw` jusqu’à 800 px, `38vw` jusqu’à 1100 px, puis `430px` ; la photo affichée reste préchargée, les deux autres en priorité basse après hydratation.
- **Préférences** : `useSyncExternalStore` lit `prefers-reduced-motion` et `navigator.connection.saveData` et s’abonne à leurs changements ; l’instantané serveur vaut « inconnu ». Le HTML serveur contient donc un `<video>` sans source et le poster en fond CSS. La source (`preload="none"`) n’est posée qu’en l’absence des deux préférences ; elle est retirée (`removeAttribute('src')` puis `load()`, ce qui interrompt le transfert) dès que l’une apparaît, au démontage et après une erreur.
- **Lecture** : l’état affiché vient des événements du média (`playing`, `pause`, `ended`, `error`). `play()` n’est appelé que si le hero est dans le champ (`IntersectionObserver`) et l’onglet visible ; un jeton écarte les promesses dépassées. `AbortError` (lecture interrompue par une pause ou une nouvelle source) est ignorée ; `NotAllowedError` laisse le poster et propose « Lire la vidéo » ; toute autre erreur bascule sur le poster. La pause du visiteur est mémorisée dans une référence et prime sur toute reprise automatique.
- **Couches** : le hero isole son empilement ; poster, film et voile lavande sont en `z-index: -1` derrière le contenu, sans opacité sur celui-ci. Aucune dépendance, aucun lecteur tiers, aucun stockage ; les fichiers viennent de `public/media/ambience/`.

## Anciens chemins

`legacy-redirects.ts` est la source unique de `redirects()` dans `next.config.ts` : chemins exacts, redirections temporaires 307, aucun catch-all, aucune chaîne. Next retire d’abord la barre finale (308) ; un ancien chemin peut donc passer par 308 puis 307. Les 83 slugs `/produit/<slug>` sont énumérés ; un slug inconnu reste une vraie 404. Compte, panier et commande n’existent pas et renvoient 404. `check:data` contrôle l’absence de chaîne ou de boucle. Aucune bascule du domaine client.

## Magasins et réseau

`src/data/stores.ts` centralise tous les récapitulatifs, coordonnées et réserves. Les CID Google Maps sont les entiers exacts des identifiants de lieux inclus dans les cartes de la source. L’action « Plan et itinéraire » mène à la fiche Google du lieu exact, où l’utilisateur peut choisir son itinéraire. Pas de géolocalisation ni de carte embarquée.

Next optimise les images locales via son propre endpoint. Les fontes variables Sora et Manrope, obtenues du [répertoire officiel Google Fonts](https://github.com/google/fonts), sont servies localement par `next/font/local`, avec les licences OFL incluses. Le film d’ambiance et son poster sont des fichiers statiques du prototype : aucune requête vers la banque d’images d’origine. Pas d’analytics, cookies métier, API, paiement ou collecte de document médical. Hébergement : Vercel, production, racine du dépôt, Node `24.x`, sans secret ni service métier distant ; les en-têtes `X-Robots-Tag` et les redirections viennent de `next.config.ts`. La configuration de construction `ENABLE_EXPERIMENTAL_COREPACK=1` fait utiliser le `packageManager` du dépôt (`pnpm@11.5.2`).

## Pages S2 et système visuel

Les pages éditoriales partagent les gabarits de `content/editorial.tsx` : titre, sommaire « Sur cette page » (ancres simples, sans pictogramme d’accordéon), sections, grilles de logos, panneau de demande en lavande douce. Le menu « Nos univers » (en-tête, filet bas), le formulaire et ses états réutilisent la palette, les polices, les boutons, champs et cartes de `DESIGN.md` ; aucune couleur, police ou composant de base n’est ajouté. Les logos blancs de Bosma et Perl sont posés sur une tuile sombre ; une identité sans logo confirmé (TruBlends, Colourvue) s’affiche en texte, sans faux logo.

Cinq tailles de titre locales apparaissent dans `globals.css` : 1.15rem (sous-titres de lecture), 1.4–1.9rem (index des univers), 1.5–2rem (produits de lentilles), 1.6–2.25rem (sections de lecture et panneau de demande), 2.3–3.5rem (titre du contact). Elles prolongent l’échelle existante sans nouvelle famille ni nouveau rôle. `DESIGN.md` et son sidecar n’ont pas été modifiés pour S2 (voir [les décisions](decisions.md)).

## Évolution CMS

Une future intégration pourra remplacer les JSON par une lecture serveur de contenus validés : mêmes IDs, marque/gamme/laboratoire, variantes avec options signées, médias et provenance, état de validation magasin. Ne pas construire une couche de repository générique ou une synchronisation de stock pour S1. Le choix et le contrat du CMS restent hors de ce prototype.
