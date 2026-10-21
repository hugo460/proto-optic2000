# Démonstration locale — S1 et S2

Utiliser une fenêtre de navigateur propre à partir de la racine `/`. Aucun compte ni remise à zéro de stockage nécessaire : le prototype ne stocke rien. Construire puis servir : `pnpm build` et `pnpm start --hostname 127.0.0.1 --port 3018`, ouvrir `http://127.0.0.1:3018`. Images et polices sont embarquées ; en recette, bloquer le domaine historique du client pour vérifier qu’aucune requête ne le sollicite. Les pages sont `noindex`. Toutes les données de saisie ci-dessous sont des exemples (`demo@example.com`) : n’utiliser aucune vraie donnée.

## Parcours solaire (S1)

1. À l’accueil, identifier Optic 2000 Tahiti, choisir Baby Beach puis Glory Glory dans le nuancier. L’image, le prix et le lien suivent le modèle.
2. Ouvrir toutes les solaires. Rechercher **Glory**, puis cumuler collection Femme, coloris Cannelle transparente et budget 30 000–40 000 XPF. Appliquer, puis copier l’URL dans un autre onglet.
3. Ouvrir Glory Glory. Parcourir ses cinq coloris : 34 600 XPF pour les quatre premiers, 38 100 XPF pour Noir brillant Manchester United. Vérifier la photo et les vues de chaque choix.
4. Revenir aux résultats filtrés, puis utiliser le retour navigateur. Le contexte reste dans l’URL. Effacer les filtres. Rechercher **zzzintrouvable**, puis rétablir tous les modèles.
5. Ouvrir Maui Jim depuis les marques ; sa collection est accessible. Ouvrir Ray-Ban : présentation et trois magasins, sans faux produits.
6. Depuis un coloris, choisir « Se renseigner en magasin », puis Taravao. La sélection accompagne la visite et les horaires sont à confirmer. Inspecter les liens de téléphone, e-mail et plan sans les activer.
7. Sur téléphone, ouvrir le menu, le fermer avec Escape, vérifier le retour de focus et ouvrir les filtres. Baby Beach et « Argenté verre bleu hawaii » servent de second exemple.

## Scénario lentille signée → magasin → formulaire (S2)

1. Menu « Nos univers » → **Lentilles**. Lire les cinq lentilles, l’entretien et la relation FreshLook / Alcon, puis ouvrir **FreshLook® Colorblends**.
2. Choisir **Grey** : la référence réelle 1949 est sélectionnée ; le prix public reste à 2 900 XPF et la photo est commune aux couleurs. La sphère n’est pas encore choisie. Choisir ensuite `+2.00`, puis `-2.00`, puis `0.00` : les libellés restent signés, l’URL se met à jour et l’ID de variante ne change pas. Recharger et utiliser retour/avant : la sélection est conservée. Ouvrir un lien avec une valeur invalide (par exemple `?sphere=inconnue`) : elle est ignorée avec une notice, sans couleur choisie à la place du visiteur. Rappeler que le prix est à confirmer en magasin.
3. Ouvrir **TruBlends 5 couleurs** : version unique, aucun sélecteur.
4. Revenir à Colorblends complet, « Se renseigner en magasin », choisir **Taravao** : sélection, sujet « Lentilles et entretien » et horaires à confirmer suivent.
5. Ouvrir la demande de contact. Envoyer à vide : erreurs reliées aux champs, focus sur le premier. Saisir `demo@example.com` avec un nom et un message de moins de 10 caractères : corriger au clavier. Préparer la demande : le succès annonce qu’aucun message ni rendez-vous n’existe, avec récapitulatif, retour à la sélection et fiche du magasin.
6. « Préparer une autre demande » : nom, e-mail, téléphone, message et erreurs sont vidés ; le magasin, l’objet et la sélection restent. Vérifier que l’URL ne contient aucune donnée saisie. Ne pas activer les liens externes.

## Scénario services et prothèses → Mamao (S2)

1. **Services et garanties** : lire les conditions et leurs dates (le nettoyage est « proposé aux clients » ; contrôle atelier en 10 points ; plaquettes et réparations mineures offertes aux clients), puis la mention des offres de 2022 non reprises.
2. **Prothèses oculaires** : page sobre, Mamao uniquement sur rendez-vous, à demander par téléphone ; DENCOTT apparaît comme laboratoire partenaire, pas comme marque.
3. Demander un rendez-vous : le formulaire arrive avec le sujet « Prothèses oculaires » et Mamao. Essayer un autre magasin : la validation l’explique. Corriger, préparer, revenir au magasin.

## Vérifications rapides

Un ancien chemin comme `/maui-jim-pour-femmes/` mène à `/solaires?genre=femme` ; `/panier` et un produit inconnu donnent une 404. Les pages légales précisent que ce prototype ne vend rien en ligne. Le catalogue général contient les 83 références. Ces versions ne sont pas publiées et ne sont pas remises au client final.
