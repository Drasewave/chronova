#!/usr/bin/env bash
# Déploiement : migrations, build dans un dossier séparé, bascule atomique, redémarrage.
#
# Le build précédent reste dans `.next-precedent` pour un retour arrière :
#   mv .next .next-casse && mv .next-precedent .next && systemctl --user restart chronova
# Un build qui échoue ne touche ni `.next` ni le service en cours.
set -euo pipefail
cd "$(dirname "$0")/.."

npm run db:deploy

rm -rf .next-build
NEXT_DIST_DIR=.next-build npx next build

# Bascule : deux renommages sur le même volume, `.next` n'est absent qu'un instant.
rm -rf .next-precedent
[ -d .next ] && mv .next .next-precedent
mv .next-build .next

XDG_RUNTIME_DIR="/run/user/$(id -u)" systemctl --user restart chronova
