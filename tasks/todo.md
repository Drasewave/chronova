# Audit design + bonnes pratiques, montres 3D, mise en prod — 2026-10-06

Branche `audit-prod-3d` (worktree `~/dev/chronova-wt`). La prod (`~/dev/chronova`, service
`chronova`) n'est touchée qu'au déploiement final. Rapports complets : `docs/audit-2026-10-06.md`.

Décisions prises avec le propriétaire :
- 3D sur la vitrine (accueil, fiche modèle, configurateur) ; SVG conservé pour miniatures,
  panier, commandes, CRM, OG et comme repli sans WebGL.
- Références img2threejs = rendus SVG actuels des 9 modèles.
- Hébergement : on garde la VM (systemd), recos Vercel/Next appliquées au code.
- Arbre non commité du 4 oct. commité en base (`eca350e`).

## 0. Base
- [x] Commit de base de l'arbre de travail (typecheck OK, 176 tests)
- [x] Worktree isolé, `next` 16.3.8 (T3), `three`, `.npmrc` retiré (T23), `npm audit fix`

## 1. Correctifs techniques (audit T*)
- [x] T4 contrôle ADMIN par page atelier (DAL `exigerAdmin` mis en cache, copies supprimées)
- [x] T5 `global-error.tsx`, `(site)/error.tsx`, `atelier/error.tsx`
- [x] T10 `src/lib/env.ts` : URL du site unique et validée, garde démo en prod
- [x] T9 `instrumentation.ts` (`onRequestError`, validation env) + `GET /api/sante`
- [x] T7a IP du client : en-tête posé par le proxy de confiance, pas la 1re valeur XFF
- [x] T11 déploiement : build dans un dossier séparé puis bascule atomique, `db:deploy`
- [x] T12 ESLint flat config (`eslint-config-next`), `lint` = `eslint .`
- [x] T14 `loading.tsx` (atelier, compte, composer)
- [x] T15 CSP `img-src 'self' data: blob:`
- [x] T17 panier hors du layout racine (pas sur le CRM)
- [x] T19 sitemap `lastModified` réel
- [x] T21 e-mail du webhook dans `after()`
- [x] T18 `summary_large_image` + image OG statique (public/og-chronova.png, référencée dans les métadonnées)
- [ ] Hors périmètre ou à décider par le propriétaire : T1 (clé Stripe live / mode démo),
      T2 (TLS sur le proxy), T6 (domaine final / basePath), T8 (mot de passe oublié : il faut Resend),
      T13 (Cache Components, chantier séparé), T22a (Vercel uniquement), T24 (E2E)

## 2. Correctifs design (audit D*)
- [x] D1 focus visible des options du configurateur (`has-[:focus-visible]`)
- [x] D3 prix/délai annoncés (`aria-live`) · D4 copie du lien avec repli + annonce · D5 phrase du délai
- [x] D6 texte de la gamme Pilote conforme aux montres · D7 vue éclatée : légende conforme au dessin
- [x] D8 récap panier groupé par étape · D11 « Retirer » annulable
- [x] D9 champs à 16 px (zoom iOS) · D27 champ gravure · D28 `autoFocus` desktop seulement
- [x] D12 plus d'écouteur `deviceorientation` (bloqué par la Permissions-Policy) · D26 reflet sans re-rendu React
- [x] D13/D14 + ligne « MOUVEMENT AUTOMATIQUE » : collisions des cadrans Abysse et Méridien
- [x] D15 `<dl>` valide · D17 contraste `::selection`
- [ ] D16 `theme-color` clair/sombre (autre agent)
- [x] D19/D20/D24 hiérarchie des CTA (héros, mobile, en-tête du configurateur)
- [x] D21 slug affiché comme référence · D22 double prix de la fiche · D23 fil d'Ariane
- [x] D25 LCP : l'intro ne retarde plus le chapô · D29 bande translucide mobile · D31 combobox CRM
- [x] D2 cadres « PHOTO » masqués tant qu'il n'y a pas de photo
- [ ] À fournir par le propriétaire : D2 identité légale (SIRET, TVA, adresse, médiateur), D10/T8 (e-mail sortant)
- [ ] Différé : D18 typographie française sur ~800 chaînes (chantier de contenu), D30 refonte « Comment ça se passe »

## 3. Montres 3D (img2threejs)
- [x] Analyse, admission, évaluation, inventaire, voie de projection (`.img2threejs/`)
- [ ] Spec de sculpture stricte
- [ ] Fabrique `src/watch/three/` : `createWatchModel(render)` paramétrique
      (carrure ronde/coussin, lunette, cadran projeté depuis le SVG, verre, aiguilles à l'heure réelle,
      couronne, fond, bracelets)
- [ ] Composant `Montre3D` : SVG affiché d'abord (LCP), three chargé à l'approche, fondu,
      repli SVG sans WebGL, rotation à la souris/au doigt, `prefers-reduced-motion`
- [ ] Branchement : héros d'accueil, fiche modèle, configurateur (vues = caméras)
- [ ] Passes de revue img2threejs (rendu vs référence, face/profil/dos/¾) sur les 9 modèles
- [ ] Poids : three dans un chunk séparé, jamais dans le bundle initial

## 4. Vérification et mise en prod
- [ ] typecheck, lint, tests, `next build` (dans le worktree)
- [ ] Contrôle visuel desktop + mobile, Lighthouse accueil / fiche
- [ ] Revue du diff (code-review-and-quality)
- [ ] Merge, build séparé, bascule, redémarrage du service, contrôle en ligne
- [ ] `graphify update .`

## Revue
(à remplir)
