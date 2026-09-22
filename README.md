# Chronova

Site de vente et back-office d'un horloger indépendant qui assemble ses montres
à la main. Le client compose sa montre pièce par pièce ; l'horloger reçoit la
commande, monte, contrôle et expédie depuis le CRM.

- **Site public** — vitrine, configurateur, panier, paiement, compte client
- **CRM `/atelier`** — commandes, stock, clients, demandes, après-vente,
  catalogue, fournisseurs, paramètres

Le cadrage — arborescence, design system, schéma de données — est dans `docs/`.
Le lire avant d'ajouter quoi que ce soit fait gagner du temps.

## Ce qui est là

| | |
|---|---|
| Vitrine | accueil, collection, fiches modèles, l'horloger, entretien, FAQ, contact, sur-mesure, pages légales |
| Configurateur | 9 étapes, options et règles de compatibilité éditables depuis l'atelier, calibres NH35 / NH36 / NH34 / NH38 / VK64, rendu SVG en calques sur platine tournante, montres à l'heure du visiteur, lien partageable |
| Commerce | panier, paiement Stripe, compte client avec suivi d'assemblage |
| Atelier | tableau de bord, kanban des commandes, fiche d'atelier, stock et journal, fournisseurs et bons de commande, clients et RGPD, demandes et devis, après-vente, catalogue éditable, paramètres |

Trois choses à savoir avant de lire le code :

**Le panier ne fixe aucun prix.** Il vit dans le navigateur et conserve un
instantané de chaque configuration, mais au départ vers le paiement le serveur
ne reçoit que le modèle, la configuration et la quantité, puis refait tout le
chiffrage depuis le catalogue en base. Un panier vieux de trois semaines, ou
trafiqué, ne peut pas imposer son tarif.

**Le catalogue ne traverse pas la frontière serveur → client tel quel.** Tout ce qui
est passé en prop à un composant client finit sérialisé dans le HTML de la page ;
le catalogue complet y exposait prix d'achat, fournisseurs et quantités en stock.
`src/lib/configurateur/public.ts` (`versCataloguePublic`, type `CataloguePublic`)
est la seule projection autorisée : une liste blanche champ par champ, où le stock
devient un état (disponible, dernière pièce, de retour bientôt). Un champ ajouté
en base ne fuit pas tant qu'il n'est pas recopié là explicitement.

**Le stock est un journal, pas un compteur.** Chaque entrée, réservation, sortie
d'assemblage et perte laisse un mouvement daté ; les deux quantités portées par
une pièce sont la somme de ce journal, recalculée après chaque écriture. Une
erreur se corrige donc en ajoutant un mouvement, jamais en retouchant un chiffre.

## Installation

```bash
npm install
cp .env.example .env           # pour la CLI Prisma
cp .env.example .env.local     # pour l'application
npm run db:migrate             # crée le schéma
npm run db:seed                # catalogue, stock, clients et commandes d'exemple
npm run dev                    # http://localhost:3000
```

Le compte d'atelier créé par l'amorçage est `atelier@chronova.test`. La connexion
se fait par lien magique : sans clé Resend, le lien s'affiche dans la console du
serveur.

> Utilisez `localhost` et non `127.0.0.1` : le serveur de développement de Next
> bloque ses ressources internes depuis une autre origine, ce qui empêche
> l'hydratation (voir `allowedDevOrigins` dans `next.config.ts`).

### Base de données

PostgreSQL, en local comme en production — un seul schéma Prisma, avec `enum` et
colonnes `Json`. SQLite obligerait à maintenir un second schéma, donc des écarts
qui n'apparaîtraient qu'en production.

La base doit être joignable **au moment du build** : l'accueil, la collection et
le choix de modèle sont prérendus avec les données du catalogue, puis revalidés
toutes les cinq minutes.

> `npm audit` signale des vulnérabilités dans `mysql2` et `deepmerge-ts`. Elles
> viennent de la CLI Prisma, dépendance de développement jamais exécutée en
> production ; le pilote MySQL n'est de toute façon pas utilisé. Le seul
> correctif proposé est un retour à Prisma 6.

## Variables d'environnement

| Variable | Utilité | Requise |
|---|---|---|
| `DATABASE_URL` | Connexion PostgreSQL | toujours |
| `AUTH_SECRET` | Signature des sessions Auth.js (`npx auth secret`) | toujours |
| `AUTH_URL` | URL publique du site, sans barre oblique finale | toujours |
| `NEXT_PUBLIC_SITE_URL` | Liens absolus, métadonnées, sitemap | toujours |
| `RESEND_API_KEY` | Envoi des e-mails transactionnels | mise en ligne |
| `RESEND_FROM` | Expéditeur des e-mails | mise en ligne |
| `STRIPE_SECRET_KEY` | Paiement | mise en ligne |
| `STRIPE_WEBHOOK_SECRET` | Vérification du webhook de paiement | mise en ligne |

### Deux replis de développement, jamais actifs en production

- **Sans `RESEND_API_KEY`**, les e-mails — dont les liens de connexion — sont
  écrits dans la console du serveur au lieu d'être envoyés. En production,
  l'absence de clé lève une erreur : un lien de connexion perdu dans des logs
  serait un bug silencieux.
- **Sans `STRIPE_SECRET_KEY`**, « Passer au paiement » enregistre la commande,
  réserve le stock et ouvre le suivi client comme si Stripe avait confirmé, avec
  une pastille « Paiement simulé » bien visible. Ce repli est conditionné à
  `NODE_ENV !== "production"` : il ne peut pas se déclencher sur un site en
  ligne, où l'absence de clé affiche un message clair.

### Serveur de démonstration (`CHRONOVA_DEMO`)

`next start` impose `NODE_ENV=production`, donc coupe les deux replis. Le serveur
de démonstration tourne pourtant en build de production — `next dev` recompile à
chaque requête et met plusieurs secondes à servir une page que le build sert en
25 ms. `CHRONOVA_DEMO="1"` dans `.env.local` rétablit les replis sur cette
machine seulement. La variable ne doit jamais exister sur le site en ligne ; une
clé Resend ou Stripe renseignée désactive de toute façon le repli concerné.

Le service est une unité systemd utilisateur :

```bash
npm run deploy                          # build + redémarrage du service
systemctl --user status chronova        # état
journalctl --user -u chronova -f        # journaux (liens de connexion compris)
```

Pour retravailler le code avec rechargement à chaud : `PORT=3001 npm run dev`,
le port 3000 restant au service.

### Webhook Stripe

C'est le webhook qui fait foi, jamais le retour du navigateur. En local :

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

La signature est vérifiée sur le corps brut de la requête, et la confirmation est
idempotente : Stripe peut livrer deux fois le même évènement sans que le stock
soit réservé en double.

## Commandes

```bash
npm run dev          # développement
npm run build        # build de production
npm run start        # serveur de production
npm run deploy       # build, puis redémarrage du service systemd `chronova`
npm run typecheck    # TypeScript, sans émission
npm run test         # Vitest : contrastes, géométrie, prix, délais,
                     # compatibilités, stock, nomenclature, URL, étapes
npm run db:migrate   # applique les migrations
npm run db:seed      # insère les données d'exemple
npm run db:purge     # vide les tables applicatives et les clients d'exemple
npm run db:reset     # purge puis réamorce
npm run db:verifier  # contrôle de cohérence de la base
```

Scripts ponctuels, à lancer avec `npx tsx` (ils chargent `.env` eux-mêmes) :

```bash
npx tsx prisma/ajout-calibre-nh36.ts                        # ajoute le calibre NH36
npx tsx prisma/annuler-commandes-essai.ts CHR-2026-0008 …   # annule des commandes d'essai
```

`ajout-calibre-nh36.ts` est strictement additif et relançable : il crée la pièce
de stock, l'option et la règle « le jour-date exige le NH36 » (dans la famille NH,
seul le NH36 porte un disque des jours ; NH35 et NH34 n'ont que le quantième),
puis bascule sur NH36 les modèles d'exemple qui portent le jour-date. Un libellé
modifié depuis le CRM est conservé ; rien n'est supprimé.

`annuler-commandes-essai.ts` rend leurs pièces au stock comme le veut le journal :
un mouvement LIBERATION en face de chaque RESERVATION, la commande passe à
ANNULEE avec une note interne. Seules les commandes du compte d'essai de
l'atelier, non expédiées, sont acceptées ; relancer ne fait rien de plus.

`db:verifier` vérifie la base réelle, ce qu'aucun test en mémoire ne peut faire :
compteurs de stock contre journal, réservations contre commandes ouvertes,
configurations figées réaffichables, règles sans message. Il liste aussi ce qui
reste à faire avant la mise en ligne et sort en erreur sur une incohérence — de
quoi l'enchaîner dans un script de déploiement.

## Ajouter une option au configurateur

Le partage des rôles est volontairement net :

- **la géométrie vit dans le code** — `src/watch/parts/`, un fichier par calque,
  pilotée par les clés typées de `src/watch/types.ts` (il n'y a plus de registre) ;
- **l'apparence vit en base** — teinte, libellé, prix, pièce de stock liée,
  activation.

**Cas courant : un nouveau coloris** (cadran, insert, cuir, caoutchouc). Aucune
ligne de code. *Atelier → Catalogue*, choisir l'étape, puis l'option : nom de la
teinte, valeur hexadécimale, supplément, pièce de stock liée. La montre se
redessine avec la teinte essayée **avant** d'enregistrer — un hexadécimal ne dit
rien de ce que donne un soleillé sous un saphir bombé.

**Cas plus rare : une forme inédite** (un modèle d'aiguille, un type de lunette).

1. Dessiner la pièce dans `src/watch/parts/<calque>.tsx`, dans le repère
   `1000 × 1000` du moteur (`src/watch/geometry.ts` donne les rayons).
2. Ajouter sa clé au type correspondant de `src/watch/types.ts` (`HandShape`,
   `BezelStyle`…) : c'est la frontière entre la base et le dessin.
3. Créer l'option depuis le CRM en la pointant sur cette clé.

**Règles de compatibilité.** Des données, pas du code : *Catalogue → Règles*,
forme unique « cette option **exige l'une de** / **exclut** ces options », plus le
message affiché au client quand l'option est grisée. Ce message n'est pas
décoratif : c'est la seule chose qui explique le refus. « Nécessite le mouvement
GMT » dit tout ; « option indisponible » ne dit rien.

**Couper une option** sans la supprimer : le bouton *Couper* la retire du
configurateur public immédiatement, et la remet aussi vite. Une option dont la
pièce liée est en rupture reste visible mais non sélectionnable, avec le délai de
réapprovisionnement du fournisseur.

## Structure

```
docs/                  cadrage : arborescence, design system, schéma de données
prisma/
  schema.prisma        37 modèles, tous les montants en centimes entiers
  seed.ts              données d'exemple, toutes marquées isSample
  purge.ts             vide les tables applicatives
  verifier.ts          contrôle de cohérence de la base
  ajout-calibre-nh36.ts, annuler-commandes-essai.ts   scripts ponctuels (npx tsx)
src/app/
  (site)/              site public
  atelier/             CRM, réservé au rôle ADMIN
  actions/             Server Actions, rôle revérifié à chaque écriture
  api/                 webhook Stripe, exports RGPD et CSV
  globals.css          TOUS les tokens du design system
  icon.svg             favicon
next.config.ts         en-têtes de sécurité (CSP, HSTS, Referrer-Policy…)
src/components/
  ui/                  primitives (boutons, pastilles, sections, pictos, rendu différé des montres)
  layout/              en-tête, pied de page, défilement doux
  home/                sections de la page d'accueil, défilé des modèles, cadrages des gros plans
  collection/          blocs de gamme, galerie de fiche, grille et filtres de modèles
  intro/               ouverture du site
  motion/              apparition au défilement, platine tournante, fondu de studio
  configurateur/       étapes, grilles d'options, scène de la montre
  atelier/             coquille du CRM, champs, panneaux, graphiques
src/watch/             moteur de rendu SVG de la montre
  parts/               un fichier par calque
  types.ts             frontière code / base (`WatchRender`)
  geometry.ts          repère, rayons, échelles
  horloge-vivante.tsx  l'horloge unique qui met toutes les montres à l'heure
  facettes.ts          ombrage des aiguilles, partagé serveur / navigateur
src/lib/
  configurateur/       prix, règles, nomenclature, stock, URL, projection publique
  securite/            limitation de débit
  commandes/           étapes, création, réservation, confirmation
  atelier/             journal de stock, libellés, navigation
```

## Points d'attention

- **Tokens.** `globals.css` est la source unique des couleurs. Les composants
  n'utilisent jamais une couleur brute mais un token sémantique (`--accent`,
  `--positive`, `--alert`), qui bascule en mode sombre. `npm run test` échoue si
  un contraste passe sous le niveau WCAG AA.
- **Rien d'inventé.** Prix, délais et informations légales manquants s'affichent
  en `[À REMPLIR]` bien visible. Les données de démonstration portent une
  pastille « Exemple » et se comptent dans `db:verifier`.
- **Le rôle est revérifié à chaque écriture.** Le gabarit de `/atelier` protège
  les pages, mais les Server Actions et les routes d'API ne le traversent pas :
  chacune revérifie. Un compte client reçoit un 404, jamais un 403 — répondre
  « interdit » confirmerait que l'adresse existe.
- **Mouvement.** Toute animation est coupée sous `prefers-reduced-motion` :
  ouverture sautée, défilement doux non monté, transitions de vue à zéro,
  trotteuses immobiles, platine sans inertie. Le défilement doux est aussi absent
  du CRM et du configurateur, où il doit rester natif.
- **Sécurité.** En-têtes posés par `next.config.ts` (CSP, `X-Frame-Options: DENY`,
  HSTS en production) ; limitation de débit en mémoire (`src/lib/securite/`) sur
  les liens magiques, les formulaires et la création de commande — par IP et par
  une clé que l'attaquant ne choisit pas (e-mail visé, compte).
- **Accessibilité.** Un `<h1>` par page, hiérarchie sans saut, lien d'évitement
  en tête de tabulation, focus toujours visible, cibles tactiles d'au moins
  24 px et de 44 px dans le CRM, qui sert sur une tablette posée à l'établi.

## Mise en ligne

1. **Base** — créer une base PostgreSQL (Neon, Supabase, Railway…), renseigner
   `DATABASE_URL`, puis `npx prisma migrate deploy`.
2. **Vercel** — connecter le dépôt, renseigner les variables ci-dessus dans
   *Settings → Environment Variables*, déployer.
3. **Stripe** — créer le webhook vers `https://<domaine>/api/stripe/webhook`,
   écouter `checkout.session.completed`, reporter le secret de signature dans
   `STRIPE_WEBHOOK_SECRET`.
4. **Resend** — vérifier le domaine d'envoi, renseigner `RESEND_API_KEY` et
   `RESEND_FROM`.
5. **Remplir ce qui manque** — `npm run db:verifier` liste les réglages
   incomplets. À faire depuis *Atelier → Paramètres* :
   - identité légale (raison sociale, SIRET, TVA, adresse du siège) ;
   - durée de garantie et conditions ;
   - frais de port et montant du port offert ;
   - délais d'assemblage et de contrôle.

   Puis, dans les pages `mentions-legales`, `cgv`, `confidentialite` et
   `cookies`, remplacer les blocs `[À REMPLIR]` restants : médiateur de la
   consommation, hébergeur de la base, coordonnées de contact.
6. **Supprimer les données d'exemple** — modèles, options, pièces, clients,
   commandes et demandes d'amorçage portent `isSample`, et `db:verifier` les
   compte. `npm run db:purge` efface tout cela d'un coup en conservant les
   comptes d'atelier et les sessions ouvertes, mais il emporte aussi le
   catalogue : en pratique, mieux vaut partir du catalogue d'exemple et le
   corriger option par option depuis le CRM, puis supprimer les commandes,
   clients et demandes fictifs.
7. **Faire relire les CGV.** La vente de montres personnalisées relève sans doute
   de l'exception au droit de rétractation de l'article L221-28 3° du Code de la
   consommation, mais cette page porte une mention
   `[À FAIRE VALIDER PAR UN JURISTE]` qui doit être levée par un professionnel
   avant l'ouverture.
