---
version: 1
slug: "src-app-contact-page-tsx"
primary_target: "src/app/contact/page.tsx"
related_targets: ["src/components/contact/contact-form.tsx"]
---

# Préparer une demande au magasin (simulation)

Mode: Operate. Route: `/contact`, ouverte directement ou depuis produit, magasin ou univers (`sujet`, `magasin`, `produit`, `variante`, `couleur`, `sphere`). Aucune transmission : la page prépare une demande de démonstration.

## Direction contract

THESIS: Une demande claire au bon magasin, dont la simulation est dite avant et après l’action ; refuse la modale, le faux envoi et la promesse de réponse.

OWN-WORLD: Fond blanc, champs papier à filet et focus violet, titres Sora, jaune pour la seule action, lavande douce pour la sélection jointe et l’annonce de simulation, encre pour les erreurs nommées.

STORY: Le visiteur comprend que rien n’est envoyé, choisit son magasin et l’objet, écrit nom, e-mail et message, corrige les erreurs signalées, voit la demande préparée puis revient à sa sélection, au magasin ou recommence.

FIRST VIEWPORT: Titre compact et phrase de simulation en tête ; à gauche, magasin en trois choix puis objet, puis champs lisibles ; à droite, récapitulatif produit et coordonnées du magasin choisi. Téléphone : titre, formulaire, puis récapitulatif.

FORM: Formulaire de tâche dans le nuancier confirmé ; seed:ec9ae70fdd93869f. Inspirations Mobbin adaptées : formulaire à gauche et résumé à droite (GetYourGuide), catégorie puis sujet et description (Mintlify).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

États: vide, erreurs associées (aria-invalid, describedby, focus du premier champ invalide), saisie préservée, succès immédiat annonçant aucun message envoyé et aucun rendez-vous réservé, réinitialisation du seul état local, contexte inconnu ignoré avec explication. Prothèses : Mamao seul, rendez-vous à demander par téléphone. Taravao : horaires à confirmer. Pas de collecte médicale.
