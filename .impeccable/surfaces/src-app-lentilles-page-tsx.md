---
version: 1
slug: "src-app-lentilles-page-tsx"
primary_target: "src/app/lentilles/page.tsx"
related_targets: ["src/components/content/editorial.tsx"]
---

# Lentilles — univers et accès aux fiches

Mode: Operate. Route: `/lentilles` (ancre `#couleur-et-fantaisie` pour l’alias `/lentille-couleur-et-fantaisie`). Trouver une des cinq lentilles réelles, puis comprendre familles, entretien et laboratoires.

## Direction contract

THESIS: Les cinq vrais produits d’abord, après une introduction courte ; refuse le rayon fictif, le conseil clinique, l’ordonnance et le délai promis.

OWN-WORLD: Système commun S5/r3 de DESIGN.md : photos produit entières sur blanc, grille catalogue existante, titres et lecture Manrope, liens soulignés, lavande douce pour la demande, jaune pour la seule action. La composition détaillée reste prévue en S6/r2.

STORY: Le visiteur lit deux phrases, choisit une lentille dans la grille (retour vers `/lentilles`), ou descend vers familles, entretien et laboratoires, puis prépare une demande `sujet=lentilles`.

FIRST VIEWPORT: Titre compact, une phrase, rangée d’ancres (familles, entretien, laboratoires), puis la grille des cinq lentilles visible sans défilement sur desktop (5 colonnes au-dessus de 1100px, 3 puis 2 colonnes).

FORM: Extension du catalogue confirmé ; seed:ec9ae70fdd93869f. Sections de lecture à deux colonnes (titre / texte ≤66ch), tuiles de marques reprises du répertoire avec relation laboratoire/gamme (FreshLook = gamme Alcon, autres à confirmer).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

États: ancre directe, retour depuis fiche, logos sans fichier (TruBlends, Colourvue) en nom texte, clavier, 360px. Aucune mention de stock, délai ou conseil médical comme garantie ; « Docteur vidéo » non repris.
