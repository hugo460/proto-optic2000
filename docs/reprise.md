# Reprise après S1

Lire `PRODUCT.md`, `DESIGN.md`, les contrats `.impeccable/surfaces/`, l’inventaire et les décisions avant modification. `PRODUCT.md` et `.impeccable/config.json` ont été préservés depuis le cadrage. Le nuancier solaire a été confirmé par Hugo pendant S1 ; construction directe en code.

Le checkout unique est sur `main`, avec `origin` égal à `https://github.com/hugo460/proto-optic2000.git`. Aucun push ou déploiement en S1. Voir l’historique Git pour les SHA ; le rapport de session et les preuves restent hors dépôt. Les processus temporaires sont arrêtés à la clôture.

Pour reprendre : `pnpm install --frozen-lockfile`, `pnpm check:data`, `pnpm test`, puis lancer le serveur selon README. Les JSON normalisés se reproduisent avec `pnpm import:data` ; le build utilise uniquement les fichiers du dépôt. Ne pas dépendre d’un dossier personnel pour relancer le site.

À préserver : 83 IDs, 264 variantes, termes de correction signés, défauts et attributs ouverts, correspondance prix/image, 38 identités, données magasin centralisées, réserve Taravao, liens exacts et contexte de retour. Aucun panier ni reprise automatique du commerce historique.

Le pilote doit accepter S1 avant de préparer S2. Les réserves commerciales restent à traiter avec le client ; ne pas résoudre silencieusement Taravao ou transformer les indicateurs techniques WooCommerce en stock magasin. La publication et la transmission restent S3.
