# Chronova

Site de vente et back-office d'un horloger indépendant qui assemble ses montres
à la main. Le client compose sa montre pièce par pièce ; l'horloger reçoit la
commande, monte, contrôle et expédie depuis le CRM.

- **Site public** — vitrine, configurateur, panier, paiement, compte client
- **CRM `/atelier`** — commandes, clients, stock de pièces, catalogue, SAV

Les fondations (arborescence, design system, schéma de données) sont documentées
dans `docs/`. Les lire avant d'ajouter quoi que ce soit fait gagner du temps.

## État du projet

| Phase | Contenu | État |
|---|---|---|
| 1 | Arborescence, design system, schéma de données | ✅ `docs/` |
| 2 | Design system codé, animation d'entrée, page d'accueil | ✅ |
| 3 | Configurateur (rendu SVG, étapes, prix, compatibilités), panier | ✅ |
| 4 | Collection, pages du site, connexion, compte client, paiement Stripe | ✅ |
| 5 | CRM : commandes, clients, stock, catalogue | à venir |
| 6 | Données d'exemple, finitions, tests, mise en ligne | à venir |

Le back-office `/atelier` n'existe pas encore : c'est la phase 5.

Le panier vit dans le navigateur (`localStorage`) et conserve un instantané de
chaque configuration. **Ce prix n'engage rien** : au départ vers le paiement, le
serveur ne reçoit que le modèle, la configuration et la quantité, et refait tout
le chiffrage à partir du catalogue en base.

## Installation

```bash
npm install
npm run dev          # http://localhost:3000
```

> Utilisez bien `localhost` et non `127.0.0.1` : le serveur de développement de
> Next bloque ses ressources internes depuis une autre origine, ce qui empêche
> l'hydratation (voir `allowedDevOrigins` dans `next.config.ts`).

### Base de données

PostgreSQL, en local comme en production — un seul schéma Prisma, avec `enum` et
colonnes `Json`. SQLite obligerait à maintenir un schéma différent, donc des
écarts qui n'apparaîtraient qu'en production.

```bash
cp .env.example .env           # DATABASE_URL pour la CLI Prisma
cp .env.example .env.local     # ... et pour l'application

npm run db:migrate             # crée le schéma
npm run db:seed                # catalogue, stock, clients et commandes d'exemple
npm run db:reset               # repart de zéro (migrations + seed)
```

La base doit être joignable **au moment du build** : la page d'accueil, la
collection et le choix de modèle sont prérendus avec les données du catalogue,
puis revalidés toutes les cinq minutes (`export const revalidate`).

> `npm audit` signale des vulnérabilités dans `mysql2` et `deepmerge-ts`. Elles
> proviennent de la CLI Prisma, qui est une dépendance de développement et n'est
> jamais exécutée en production ; le pilote MySQL n'est de toute façon pas
> utilisé. Le seul correctif proposé est un retour à Prisma 6.

## Variables d'environnement

À créer dans `.env.local`. Aucune n'est nécessaire tant que la phase 3 n'est pas
commencée : le site tourne actuellement sur des données d'exemple en dur.

| Variable | Utilité | Requise à partir de |
|---|---|---|
| `DATABASE_URL` | Connexion PostgreSQL | tout de suite |
| `AUTH_SECRET` | Signature des sessions Auth.js (`npx auth secret`) | tout de suite |
| `AUTH_URL` | URL publique du site | tout de suite |
| `RESEND_API_KEY` | Envoi des e-mails transactionnels | mise en ligne |
| `RESEND_FROM` | Expéditeur des e-mails | mise en ligne |
| `STRIPE_SECRET_KEY` | Paiement | mise en ligne |
| `STRIPE_WEBHOOK_SECRET` | Vérification du webhook de paiement | mise en ligne |
| `NEXT_PUBLIC_SITE_URL` | Liens absolus, métadonnées, sitemap | mise en ligne |

### Deux replis de développement, jamais actifs en production

- **Sans `RESEND_API_KEY`**, les e-mails — dont les liens de connexion — sont
  écrits dans la console du serveur au lieu d'être envoyés. En production,
  l'absence de clé lève une erreur : un lien de connexion perdu dans des logs
  serait un bug silencieux.
- **Sans `STRIPE_SECRET_KEY`**, le bouton « Passer au paiement » enregistre la
  commande, réserve le stock et ouvre le suivi client comme si Stripe avait
  confirmé, avec une pastille « Paiement simulé » bien visible. Ce repli est
  conditionné à `NODE_ENV !== "production"` : il ne peut pas se déclencher sur un
  site en ligne, où l'absence de clé affiche un message clair.

### Webhook Stripe

C'est le webhook qui fait foi, jamais le retour du navigateur. En local :

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

La signature est vérifiée sur le corps brut de la requête, et la confirmation
est idempotente : Stripe peut livrer deux fois le même évènement sans que le
stock soit réservé en double.

## Commandes

```bash
npm run dev          # développement
npm run build        # build de production
npm run start        # serveur de production
npm run typecheck    # TypeScript, sans émission
npm run test         # Vitest : contrastes du design system, géométrie du cadran,
                     # prix, délais, compatibilités, stock, nomenclature, URL
```

## Ajouter une option au configurateur

Le partage des rôles est volontairement net :

- **la géométrie vit dans le code** — `src/watch/parts/`, référencée par
  `src/watch/registry.ts` ;
- **l'apparence vit en base** — teinte, libellé, prix, pièce de stock liée,
  activation.

**Cas courant : un nouveau coloris (cadran, insert, cuir, caoutchouc).**
Aucune ligne de code. Depuis le CRM : *Catalogue → Options → Nouvelle option*,
choisir le groupe, saisir le nom de la teinte, sa valeur hexadécimale, le
supplément de prix, la pièce de stock associée, puis publier. Le rendu SVG prend
la nouvelle teinte immédiatement.

**Cas plus rare : une forme inédite** (un modèle d'aiguille, un type de lunette).

1. Créer la pièce dans `src/watch/parts/<calque>.tsx`, dessinée dans le repère
   `1000 × 1000` du moteur (`src/watch/geometry.ts` donne les rayons).
2. Déclarer sa clé dans `PART_REGISTRY` (`src/watch/registry.ts`) — c'est cette
   liste que le CRM propose dans son menu déroulant.
3. Créer l'option depuis le CRM en la pointant sur cette nouvelle clé.

**Règles de compatibilité.** Elles sont des données, pas du code :
*Catalogue → Règles*, forme unique « cette option **exige l'une de** / **exclut**
ces options », plus le message affiché au client quand l'option est grisée
(« Nécessite le mouvement GMT »).

## Structure

```
docs/                  cadrage : arborescence, design system, schéma de données
src/app/               routes (App Router)
  (site)/              site public — en-tête, pied de page, rideau d'entrée
  globals.css          TOUS les tokens du design system
src/components/
  ui/                  primitives (boutons, pastilles, sections, pictos)
  layout/              en-tête, pied de page, grain, cookies, défilement doux
  home/                sections de la page d'accueil
  intro/               animation d'entrée
  motion/              apparition au défilement
src/watch/             moteur de rendu SVG de la montre
  parts/               un fichier par calque
  registry.ts          frontière code / base
src/lib/               données d'exemple, contenus, utilitaires
```

## Points d'attention

- **Tokens.** `globals.css` est la source unique des couleurs. Les composants
  n'utilisent jamais une couleur brute mais un token sémantique (`--accent`,
  `--positive`, `--alert`), qui bascule en mode sombre. `npm run test` échoue si
  un contraste passe sous le niveau WCAG AA.
- **Rien d'inventé.** Les prix, délais et informations légales manquants sont
  affichés en `[À REMPLIR]` bien visible. Les données de démonstration portent
  une pastille « Exemple ».
- **Mouvement.** Toute animation est coupée sous `prefers-reduced-motion` :
  rideau d'entrée sauté, défilement doux non monté, transitions à zéro.

## Déploiement

Vercel. Connecter le dépôt, renseigner les variables ci-dessus dans *Settings →
Environment Variables*, puis déployer. Le webhook Stripe devra pointer sur
`https://<domaine>/api/stripe/webhook` (phase 4).
