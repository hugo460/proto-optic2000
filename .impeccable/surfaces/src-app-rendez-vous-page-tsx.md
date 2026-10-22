---
version: 1
slug: "src-app-rendez-vous-page-tsx"
primary_target: "src/app/rendez-vous/page.tsx"
related_targets: ["src/components/appointment/appointment-flow.tsx", "src/lib/appointment.ts", "src/data/appointment-demo.ts"]
---

# Préparer un rendez-vous de démonstration

Mode: Operate. Monde existant du nuancier solaire, code direct ; structure quatre temps fixée par le brief de Hugo. Aucune nouvelle comp ou calibration humaine approuvée.

## Direction contract

THESIS: Préparer une visite en quatre choix courts, sans pouvoir la confondre avec une réservation réelle.
OWN-WORLD: Sora/Manrope, papier, filets, lavande de contexte et jaune pour continuer ; champs et choix du contact réutilisés, aucune nouvelle palette.
STORY: Magasin/motif → jour/heure fictifs → coordonnées → récapitulatif dont chaque section se modifie → simulation achevée et sortie vers le vrai magasin ou recommencement.
FIRST VIEWPORT: Titre compact, avertissement de démonstration lisible, progression nommée en quatre étapes ; choix de magasin puis motifs illustratifs. Sur bureau, colonne de contexte calme à droite, sans répéter le formulaire ; sur mobile, progression compacte puis tâche puis contexte, aucun pied collant. Boutons et aides 14–16 px, champs ≥52 px.
FORM: Îlot client, aucun dialogue ni calendrier complexe ; sept jours à venir calculés en Pacific/Tahiti, choix jour puis heure explicitement fictive. Aucun créneau pour un jour de démonstration, avec action vers un autre jour.
FINISH: Revue sur rendus et interactions, verdict spécialisé et documentation au périmètre réellement livré.

États : choix vide/sélectionné, étapes à venir/en cours/terminées, erreur reliée et premier focus, aucun créneau, changement amont qui efface le créneau et l’explique, retour avec saisie conservée, édition du récapitulatif, résultat honnête, reset.

Contrats métier : contrôle de vue et conseil/essai de montures sont illustratifs ; aucune consultation ophtalmologique promise. Prothèses : Mamao seulement, correction explicite d’un magasin contradictoire, vrai RDV par téléphone. Taravao : horaires à confirmer, aucun lien entre planning fictif et horaires réels.

Confidentialité : uniquement nom/e-mail/téléphone facultatif en état React ; jamais requête, stockage, cookie, console, URL ou history.state personnel. Paramètres publics magasin/motif validés ; inconnus/contradictions signalés ; étape finale directe ne contourne rien. Retour/avant sûrs, reload efface saisie et résultat. Recommencer conserve le magasin pour rejouer, efface motif, jour/heure, coordonnées, erreurs et résultat. Rien n’est envoyé, pas de fausse attente serveur.

Mouvement : retour de focus vers le titre/champ utile, transitions de contrôle rapides, aucune entrée spatiale des formulaires ; préférence réduite stable.
