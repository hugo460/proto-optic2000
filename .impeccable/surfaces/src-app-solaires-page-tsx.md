---
version: 1
slug: "src-app-solaires-page-tsx"
primary_target: "src/app/solaires/page.tsx"
related_targets: ["src/app/catalogue/page.tsx","src/app/produits/[slug]/page.tsx","src/components/catalog/product-experience.tsx","src/components/catalog/lens-picker.tsx"]
---

# Parcours catalogue et produit

Mode: Operate. Routes: `/solaires`, `/catalogue`, `/produits/[slug]`. Structure métier prescrite par le brief et le benchmark ; extension du monde visuel de l’accueil.

## Direction contract

THESIS: Trouver une monture et comprendre exactement le coloris choisi, puis joindre un magasin.

OWN-WORLD: Fond blanc, plateaux produit sobres, texte noir, filtres regroupés et jaune d’action. Photos contenues sans déformation ; coloris montrés par leur vraie miniature et leur nom.

STORY: Recherche et filtres réversibles, compte réel, ouverture de la fiche, sélection prix/photo, retour au contexte ou accès magasin.

FIRST VIEWPORT: Titre compact, recherche, filtres nommés, tri, compte et premiers modèles. Sur fiche, galerie et choix côte à côte sur ordinateur, galerie puis contenu sur téléphone ; nom long sans troncature.

FORM: Grille fonctionnelle et galerie à variantes, héritées du nuancier confirmé ; seed:ec9ae70fdd93869f. Les données et la tâche fixent la structure ; aucune nouvelle direction autonome.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

États: URL partagée, cumul, tri, aucun résultat, reset, filtre invalide, route inconnue, variante absente/invalide, photo indisponible, réduction du mouvement, clavier et retour.

Lentilles (S2): couleur puis correction choisies séparément, comme deux questions. Couleurs en boutons nommés (aria-pressed, coche, sans pastille inventée), sphère en `select` natif trié par valeur avec libellés exacts signés. Un statut poli dit ce qui manque, ce qui est choisi ou pourquoi le lien a été corrigé ; jamais de couleur déduite d’un défaut de sphère. Produit simple : une seule version, pas de sélecteur. Prix et photo de la référence réelle ; prix commun nommé comme tel. Sélection dans l’URL (`variante`, `couleur`, `sphere`) et transmise au magasin et à la demande simulée.

Caractéristiques lentilles (S2 paquet 2) : conditionnement et renouvellement affichés comme faits (Colorblends boîte de 2 et renouvellement mensuel ; 1-Day et TruBlends boîte de 10 ; TruBlends 5 couleurs sans correction) ; stock, délais et règle « hors période de fêtes » de 2022 seulement en réserve datée (`src/data/lens-facts.ts`). Le lien de famille sous les lentilles associées mène à `/lentilles` (« Toutes les lentilles ») ; `retour=/lentilles` est accepté.
