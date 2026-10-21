# Guide de démonstration

URL publique : [proto-optic2000.vercel.app](https://proto-optic2000.vercel.app)

Prototype de présentation, non officiel, qui n’est pas destiné à être indexé. Il fonctionne sans compte et sans dépendance au WordPress historique ; images et polices sont servies par le site.

Liens prêts à ouvrir : [Glory Glory](https://proto-optic2000.vercel.app/produits/glory-glory), [Colorblends Grey/+2.00](https://proto-optic2000.vercel.app/produits/freshlook-colorblends?variante=1949&couleur=grey&sphere=2-00), [Taravao avec Grey/−2.00](https://proto-optic2000.vercel.app/magasins/taravao?produit=freshlook-colorblends&variante=1949&couleur=grey&sphere=2-00-2), [Prothèses](https://proto-optic2000.vercel.app/protheses-oculaires), [demande à Mamao](https://proto-optic2000.vercel.app/contact?sujet=protheses&magasin=mamao).

## Avant de commencer

- Ouvrir une fenêtre de navigation propre, à partir de la racine `/`. Rien n’est à effacer : le prototype ne stocke rien.
- N’utiliser que des données fictives : `Marie Fictive`, `demo@example.com`, un téléphone et un message d’exemple. Aucun vrai document ni donnée médicale.
- Ne pas activer les liens téléphone, e-mail et plan pendant la présentation : ils ouvrent les outils de l’appareil.

## Parcours 1 — Solaire : le prix suit la variante, puis le magasin

1. À l’accueil, parcourir le nuancier : Baby Beach, puis **Glory Glory**. L’image, le prix et le lien suivent le modèle.
2. Ouvrir Glory Glory (`/produits/glory-glory`). Choisir **Cannelle transparente** : **34 600 XPF**. Choisir **Noir brillant Manchester United** : **38 100 XPF**, la photo change et l’URL indique `variante=1608`.
3. « Se renseigner en magasin » : la sélection accompagne la liste des magasins, puis la fiche choisie (`/magasins?produit=glory-glory&variante=1608`). Sur Taravao, les horaires sont « à confirmer auprès du magasin ».

## Parcours 2 — Lentille Colorblends Grey → Taravao → demande simulée

1. Ouvrir **FreshLook® Colorblends** (`/produits/freshlook-colorblends`). Choisir **Grey** : la référence réelle **1949** est retenue, le prix reste **2 900 XPF** et la **photo est commune** aux couleurs. Colorblends ne change ni de prix ni de photo selon la couleur ou la sphère.
2. Choisir la sphère `+2.00`, puis `-2.00`, puis `0.00` : les libellés restent signés, l’URL suit (`sphere=2-00`, `sphere=2-00-2`, `sphere=0-00`) et l’ID 1949 ne change pas. Recharger, puis retour/avant : la sélection est conservée car elle est dans l’URL.
3. « Se renseigner en magasin », puis **Taravao** : couleur, sphère et prix suivent ; horaires à confirmer. Lien direct : `/magasins/taravao?produit=freshlook-colorblends&variante=1949&couleur=grey&sphere=2-00-2`.
4. « Préparer une demande à ce magasin ». Soumettre à vide : les erreurs sont reliées aux champs et le focus va au premier. Saisir `Marie Fictive`, `demo@example.com` et un message d’exemple, puis « Préparer la demande » : le récapitulatif indique qu’aucun message n’a été envoyé et qu’aucun rendez-vous n’a été réservé.
5. « Préparer une autre demande » vide nom, e-mail, téléphone, message et erreurs ; magasin, objet et sélection restent. Un rechargement efface aussi la saisie. L’URL ne contient jamais les données saisies.

## Parcours 3 — Prothèses oculaires → Mamao

1. Ouvrir **Prothèses oculaires** (`/protheses-oculaires`) : uniquement à **Mamao**, sur rendez-vous à demander par téléphone. DENCOTT apparaît comme laboratoire partenaire, pas comme marque.
2. « Préparer une demande » : le formulaire arrive avec l’objet « Prothèses oculaires » et Mamao (`/contact?sujet=protheses&magasin=mamao`).
3. Renseigner les mêmes données fictives, choisir Taravao et préparer la demande : la validation explique que ce service n’existe qu’à Mamao. Revenir à Mamao, préparer, puis ouvrir la fiche du magasin.

## Limites à annoncer

- Prix, stocks, horaires (dont Taravao), garanties, équipe et mentions historiques viennent des pages publiques de l’ancien site, relevées le 21/10/2026 ; ils restent à confirmer par l’enseigne.
- Le formulaire est une simulation : aucun envoi au magasin, aucune réservation, aucun compte, panier ni paiement. La saisie reste dans la page et disparaît au rechargement.
- L’hébergeur reçoit, comme pour tout site, les requêtes techniques de navigation ; jamais la saisie du formulaire (voir la page Confidentialité).
- Le domaine historique, le site WordPress et ses comptes ou commandes ne sont pas touchés. Les CGV de 2022 ne s’appliquent pas.

## Vérifications rapides

Un ancien chemin comme `/maui-jim-pour-femmes/` mène à `/solaires?genre=femme` ; `/panier` et un produit inconnu donnent une 404. Le catalogue général (`/catalogue`) contient les 83 références.

## Présentation locale

Sans réseau : `pnpm build`, puis `pnpm start --hostname 127.0.0.1 --port 3018`, et ouvrir `http://127.0.0.1:3018`. Les mêmes parcours s’appliquent.
