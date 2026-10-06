#!/usr/bin/env bash
# Déploiement : migrations, build dans un dossier séparé, bascule atomique,
# redémarrage, contrôle de santé — et retour au build précédent s'il échoue.
#
# Un build qui échoue ne touche ni `.next` ni le service en cours.
# Les migrations passent AVANT le build : si celui-ci échoue, l'ancien code
# tourne sur le nouveau schéma. Elles doivent donc rester additives (colonnes
# et tables ajoutées, jamais renommées ni supprimées dans le même déploiement).
set -euo pipefail
cd "$(dirname "$0")/.."

npm run db:deploy

rm -rf .next-build
NEXT_DIST_DIR=.next-build npx next build

# Bascule : deux renommages sur le même volume, `.next` n'est absent qu'un instant.
rm -rf .next-precedent
[ -d .next ] && mv .next .next-precedent
mv .next-build .next

export XDG_RUNTIME_DIR="/run/user/$(id -u)"
systemctl --user restart chronova

# Santé : le service répond-il, et sa base aussi ? Sinon, retour arrière.
for _ in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3000/chronova/api/sante > /dev/null; then
    echo "Déployé : /chronova/api/sante répond."
    exit 0
  fi
  sleep 1
done
echo "Le nouveau build ne répond pas : retour au précédent." >&2
if [ -d .next-precedent ]; then
  rm -rf .next-casse
  mv .next .next-casse
  mv .next-precedent .next
  systemctl --user restart chronova
fi
exit 1
