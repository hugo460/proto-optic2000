# Guide de démonstration

URL publique : [proto-optic2000.vercel.app](https://proto-optic2000.vercel.app)

Prototype de présentation, non officiel, qui n’est pas destiné à être indexé. Il fonctionne sans compte et sans dépendance au WordPress historique ; images et polices sont servies par le site.

Liens prêts à ouvrir : [Rendez-vous](https://proto-optic2000.vercel.app/rendez-vous), [Rendez-vous à Taravao](https://proto-optic2000.vercel.app/rendez-vous?magasin=taravao), [Rendez-vous prothèses à Mamao](https://proto-optic2000.vercel.app/rendez-vous?magasin=mamao&motif=protheses), [Glory Glory](https://proto-optic2000.vercel.app/produits/glory-glory), [Colorblends Grey/+2.00](https://proto-optic2000.vercel.app/produits/freshlook-colorblends?variante=1949&couleur=grey&sphere=2-00), [Taravao avec Grey/−2.00](https://proto-optic2000.vercel.app/magasins/taravao?produit=freshlook-colorblends&variante=1949&couleur=grey&sphere=2-00-2), [Prothèses](https://proto-optic2000.vercel.app/protheses-oculaires), [demande à Mamao](https://proto-optic2000.vercel.app/contact?sujet=protheses&magasin=mamao).

## Avant de commencer

- Ouvrir une fenêtre de navigation propre, à partir de la racine `/`. Rien n’est à effacer : le prototype ne stocke rien.
- N’utiliser que des données fictives : `Marie Fictive`, `demo@example.com`, un téléphone et un message d’exemple. Aucun vrai document ni donnée médicale.
- Ne pas activer les liens téléphone, e-mail et plan pendant la présentation : ils ouvrent les outils de l’appareil.

## Parcours 0 — Accueil vivant

1. L’accueil s’ouvre sur **Le soleil, autrement.** et une vraie monture Maui Jim en grand. « Toutes les solaires » mène au catalogue ; « Préparer un rendez-vous » reste une sortie discrète. Choisir **Baby Beach**, puis **The Bird** : photo, nom, prix et lien changent immédiatement, avec une courte arrivée de la monture puis repos. Aucun changement de modèle automatique.
2. Ouvrir **Nos univers** dans la barre : un panneau clair et compact donne accès aux univers et pages de l’enseigne. Échap, un clic à côté ou la sortie au clavier le referment. Sur téléphone, **Menu** ouvre le dialogue blanc avec l’action « Préparer un RDV ».
3. Le bandeau de marques défile lentement, sans bouton : le survol à la souris l’arrête ; au clavier, la rangée s’immobilise et chaque logo reste entier. « Toutes les marques » rejoint l’annuaire.
4. En dessous : sélection de quatre Maui Jim (Mamane, Alulu, Pehu, Liquid Sunshine), séquence de matière filmée, univers, équipe réelle et trois magasins. Le film ne montre ni un magasin ni un modèle attribué au catalogue. Il se joue seulement dans son champ et sur un onglet visible, si le navigateur l’autorise.
5. En mouvement réduit ou en économie de données, le film n’est pas téléchargé ; le poster reste visible. Refus d’autoplay ou erreur donnent aussi le poster. Aucune commande Pause/Lire. Le mouvement réduit rend également les montures immobiles et les marques défilables manuellement.

## Parcours 1 — Solaire : le prix suit la variante, puis le magasin

1. À l’accueil, parcourir le nuancier : Baby Beach, puis **Glory Glory**. L’image, le prix et le lien suivent le modèle.
2. Ouvrir Glory Glory (`/produits/glory-glory`). Parcourir les quinze vues initiales dans le rail de miniatures, sans coloris présélectionné. Choisir **Gris transparent** : **34 600 XPF**, trois vues et référence **1607**. Choisir **Cannelle transparente** : **34 600 XPF**. Choisir **Noir brillant Manchester United** : **38 100 XPF**, la photo change et l’URL indique `variante=1608`.
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

## Parcours 4 — Rendez-vous simulé

Rejouable à toute date : les sept jours proposés commencent toujours au lendemain, en heure de Tahiti.

1. Depuis l’accueil (« Préparer un rendez-vous »), l’en-tête (« Préparer un RDV ») ou la fiche **Taravao** (« Préparer un rendez-vous » : le magasin est déjà choisi).
2. **Votre visite** : « Continuer » sans motif montre l’erreur reliée et y place le focus. Choisir « Conseil et essai de montures ». Les motifs sont illustratifs ; le contrôle de vue n’est pas une consultation médicale.
3. **Votre créneau** : les créneaux sont **fictifs** et ne viennent pas des horaires de Taravao (à confirmer). Choisir un jour marqué « Aucun » (le dimanche, ou lundi/jeudi à Taravao) : « Aucun créneau de démonstration ce jour-là », puis le bouton vers le jour suivant. Choisir une heure.
4. **Vos coordonnées** : `Marie Fictive`, d’abord `demo@` (erreur), puis `demo@example.com`, téléphone `+689 00 00 00 00` facultatif.
5. **Récapitulatif** : « Modifier votre visite », passer à Centre-ville : si l’heure n’existe pas là, elle est retirée avec une explication et le créneau est à rechoisir ; « Revenir au récapitulatif ».
6. « Simuler le rendez-vous » : **aucune réservation ni e-mail**, coordonnées réelles du magasin pour un vrai rendez-vous. Retour/Avant du navigateur passent d’une étape à l’autre ; une modification efface le résultat. Un rechargement repart à la première étape et efface la saisie.
7. « Refaire la démonstration » garde le magasin et efface motif, créneau et coordonnées.
8. Prothèses : [ce lien](https://proto-optic2000.vercel.app/rendez-vous?magasin=taravao&motif=protheses) corrige Taravao en Mamao et rappelle que le vrai rendez-vous se demande par téléphone.

## Limites à annoncer

- Prix, stocks, horaires (dont Taravao), garanties, équipe et mentions historiques viennent des pages publiques de l’ancien site, relevées le 21/10/2026 ; ils restent à confirmer par l’enseigne.
- Le formulaire et le rendez-vous sont des simulations : aucun envoi au magasin, aucune réservation, aucun compte, panier ni paiement. Les créneaux sont fictifs. La saisie reste dans la page et disparaît au rechargement.
- Le film d’accueil est une ambiance de lunettes tirée de trois plans d’une banque d’images (Pexels) : il ne montre ni un magasin ni une monture du catalogue ; il n’a pas de commande de lecture.
- L’hébergeur reçoit, comme pour tout site, les requêtes techniques de navigation ; jamais la saisie du formulaire (voir la page Confidentialité).
- Le domaine historique, le site WordPress et ses comptes ou commandes ne sont pas touchés. Les CGV de 2022 ne s’appliquent pas.

## Vérifications rapides

Un ancien chemin comme `/maui-jim-pour-femmes/` mène à `/solaires?genre=femme` ; `/panier` et un produit inconnu donnent une 404. Le catalogue général (`/catalogue`) contient les 83 références.

## Présentation locale

Sans réseau : `pnpm build`, puis `pnpm start --hostname 127.0.0.1 --port 3018`, et ouvrir `http://127.0.0.1:3018`. Les mêmes parcours s’appliquent.
