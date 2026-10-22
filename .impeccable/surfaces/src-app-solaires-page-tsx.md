---
version: 1
slug: "src-app-solaires-page-tsx"
primary_target: "src/app/solaires/page.tsx"
related_targets: ["src/app/catalogue/page.tsx","src/app/produits/[slug]/page.tsx","src/components/catalog/product-experience.tsx","src/components/catalog/lens-picker.tsx","src/components/catalog/catalogue-view.tsx","src/components/catalog/filter-panel.tsx","src/components/catalog/product-card.tsx"]
---

# Catalogue et fiche — S5/r3
Mode : Operate. Découvrir un modèle, filtrer/comparer puis transmettre sa sélection publique au magasin. La direction commune S5/r3 remplace l'ancien habillage ; aucune logique métier n'est redessinée.
## Direction contract
THESIS: Le produit arrive tôt ; les contrôles se lisent sans s'interposer entre la visite et les montures.
OWN-WORLD: Blanc dominant, noir précis, jaune d'action, lavande d'état. Packshots entiers sur blanc sans double enveloppe, noms complets, commandes tactiles d'au moins44px.
STORY: Chercher, filtrer, trier ; ouvrir le modèle avec son retour filtré ; regarder toutes ses vues, choisir un vrai coloris ou une correction, retrouver le prix et joindre un magasin.
FIRST VIEWPORT: Catalogue : titre direct, collections et formulaire compact, première rangée avec images et noms à1280×800. Fiche : grande photo et informations rapprochées sur bureau ; sur mobile, une photo puis un rail secondaire d'une seule rangée avant le nom/prix. Les quinze vues initiales et les cinq coloris Glory Glory restent tous disponibles sans présélection.
FORM: Déclinaison opérable du studio de l'accueil, construction directe en code ; seed:3115cd6f4e783bf2. Choix de composition précisément demandé au brief, pas de tournoi additionnel.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
## Invariants
URL/retour et filtres GET ; galerie/prix/ID synchronisés ; vide/invalide/fallback/chargement/erreur. Lentilles : +/−, zéro, absence et sphère ouverte distincts, Grey1949 indépendant de la sphère ; boîte simple sans choix. Aucun stock, achat ou disponibilité inventés.
