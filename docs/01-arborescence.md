# Chronova — Arborescence & stack

> Document de cadrage. Rien n'est implémenté tant qu'il n'est pas validé.

## 1. Choix techniques (et pourquoi)

| Sujet | Choix | Raison |
|---|---|---|
| Framework | **Next.js 16**, App Router, React 19, TypeScript strict | Server Components pour le catalogue et le CRM (pas de JSON inutile envoyé au client), Server Actions pour les mutations, streaming pour le tableau de bord. |
| CSS | **Tailwind v4** (configuration CSS-first `@theme`) | Les tokens du design system sont *littéralement* des variables CSS, réutilisables hors Tailwind (SVG de la montre, e-mails). Pas de `tailwind.config.js` à maintenir en double. |
| Base de données | **PostgreSQL + Prisma**, en local comme en production | Voir §4. |
| Auth | **Auth.js v5** (adaptateur Prisma), lien magique par e-mail | Aucun mot de passe stocké, donc aucune fuite possible. Le rôle `ADMIN` ouvre `/atelier`, vérifié dans le middleware **et** dans chaque Server Action. |
| Paiement | **Stripe Checkout** + webhook signé | La commande n'est créée en base qu'au webhook `checkout.session.completed`, jamais au retour navigateur. |
| E-mails | **Resend** + **React Email** | Les gabarits sont modifiables depuis le CRM (corps en Markdown + variables), le rendu reste maîtrisé. |
| Animation | Transitions CSS et Web Animations sur les tokens de `globals.css`, **Lenis** (défilement doux sur les pages de vitrine seulement : absent du CRM, de `/composer/*` et sous `prefers-reduced-motion`), **View Transitions API** en progressive enhancement, horloge unique des montres (`src/watch/horloge-vivante.tsx`) | |
| Tests | **Vitest** sur la logique pure (prix, compatibilités, stock, encodage d'URL), **Playwright** sur 3 parcours critiques | Chromium est déjà présent sur l'environnement. |
| Hébergement | **Vercel** + Postgres managé (Neon ou Supabase Postgres) | |

## 2. Arborescence du site public

```
/                                  Accueil
/collection                        Vue d'ensemble : un bloc par gamme, puis « Tous les modèles » (filtres : style, diamètre, mouvement, prix)
/gammes/[style]                    Page de gamme — scène nuit, repères, modèles, autres gammes
/collection/[modele]               Fiche modèle — galerie sur platine tournante, fiche technique, deux montres sur le même boîtier
/composer                          Choix du modèle de base (si on arrive sans modèle)
/composer/[modele]                 LE CONFIGURATEUR — rendu SVG + étapes + prix en direct
                                   Configuration portée par l'URL : ?c=boitier:40-brosse~cadran:bleu-abysse~…
/panier                            Panier pleine page (repli du panneau latéral)
/commande/confirmation             Retour Stripe — succès
/commande/interrompue              Retour Stripe — abandon
/compte                            Tableau de bord client
/compte/commandes                  Historique
/compte/commandes/[numero]         Suivi d'assemblage (frise + photos de l'horloger)
/compte/adresses
/compte/profil                     Coordonnées, tour de poignet, newsletter, export/suppression RGPD
/connexion                         Lien magique
/connexion/verification            « Consultez votre boîte mail »
/l-horloger                        L'atelier & l'horloger (à propos)   ← voir note sur /atelier
/entretien-garantie
/sur-mesure                        Demander une pièce unique (formulaire → CRM)
/contact
/faq
/mentions-legales
/cgv
/cgu
/confidentialite
/cookies                           Gestion fine des consentements
/sitemap.xml  /robots.txt  /llms.txt  /icon.svg
```

**Note sur `/atelier`** — `/atelier` est réservé au CRM ; la page publique « à propos » est `/l-horloger`, libellée « L'horloger » dans la navigation. La navigation « Collection » ouvre un panneau des gammes (`/gammes/[style]`).

## 3. Arborescence du CRM (`/atelier`, rôle `ADMIN` requis)

```
/atelier                                   Tableau de bord
/atelier/commandes                         Kanban par étape d'atelier
/atelier/commandes/liste                   Vue liste filtrable + export CSV
/atelier/commandes/[numero]                Fiche : rendu, nomenclature auto, checklist, contrôle, photos, notes, suivi
/atelier/clients
/atelier/clients/[id]                      Coordonnées, commandes, total, poignet, tags, notes, échanges, RGPD
/atelier/stock                             Toutes catégories, alertes en tête
/atelier/stock/[id]                        Fiche pièce + historique des mouvements
/atelier/stock/mouvements                  Journal (entrées, réservations, sorties, ajustements)
/atelier/catalogue/modeles
/atelier/catalogue/modeles/[id]            Prix de base, délai, groupes d'options actifs, publication
/atelier/catalogue/options                 Options par groupe — nom, teinte, calque SVG, prix, pièce liée
/atelier/catalogue/regles                  Règles de compatibilité + message affiché au client
/atelier/catalogue/apercu                  Aperçu en direct du configurateur avant publication
/atelier/demandes                          Contact + sur-mesure (non lues en tête)
/atelier/demandes/[id]                     → devis → commande
/atelier/sav                               Garanties, révisions, réparations
/atelier/sav/[id]
/atelier/fournisseurs
/atelier/fournisseurs/[id]
/atelier/fournisseurs/commandes            Commandes fournisseurs + réception
/atelier/parametres                        Délais, frais de port, gabarits d'e-mails, informations légales, seuils
```

Transverse : recherche globale `Cmd/Ctrl + K` (commandes, clients, pièces, options), mode sombre `--night`, cibles tactiles 44 px pour l'usage sur tablette à l'établi.

## 4. Base de données : pourquoi Postgres partout plutôt que SQLite en local

Le schéma s'appuie sur des `enum` et des colonnes `Json` (instantanés de configuration, différentiels d'audit). Prisma ne gère pas les `enum` sur SQLite : il faudrait deux schémas divergents, donc des bugs qui n'apparaissent qu'en production. Un `docker compose up` lance `postgres:16-alpine` en local ; si Docker n'est pas disponible, une base Neon gratuite fait l'affaire. Une seule `DATABASE_URL` change entre les environnements.

**Supabase** reste possible (c'est du Postgres) mais n'apporte rien ici : il y a un seul administrateur, les règles métier (réservation de stock, compatibilités) doivent vivre côté serveur dans des transactions, et Auth.js couvre déjà l'authentification. On garderait Supabase uniquement pour le stockage des photos d'assemblage — Vercel Blob fait la même chose avec moins de pièces.

## 5. Frontières nettes

- **Montant en centimes entiers** partout (`Int`), jamais de flottant. Même unité que Stripe.
- **Instantané de commande** : chaque ligne de commande garde une copie figée des libellés et des prix. Modifier le catalogue demain ne réécrit pas l'historique d'hier.
- **Le webhook Stripe fait foi** pour le passage à l'état payé.
- **Géométrie SVG dans le code, apparence dans la base** : voir `02-design-system.md` §7.
- **Projection publique du catalogue** (`src/lib/configurateur/public.ts`) : la seule forme du catalogue autorisée à traverser la frontière serveur → client (props d'un composant `"use client"`, donc sérialisée dans le HTML). Liste blanche champ par champ : ni prix d'achat, ni fournisseur, ni quantité ni référence de pièce ; le stock devient un état (disponible, dernière pièce, de retour bientôt + délai). Jamais de `...option`.
- **En-têtes de sécurité** posés par `next.config.ts` sur toutes les routes : `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `X-DNS-Prefetch-Control`, HSTS hors développement.
- **Limitation de débit** (`src/lib/securite/`) : fenêtre glissante en mémoire par clé (`action:ip`, `action:email`), appliquée aux liens magiques, formulaires et créations de commande ; l'adresse IP vient de `X-Forwarded-For` et n'est fiable que derrière un proxy qui l'écrase, d'où une seconde clé que l'attaquant ne choisit pas. Mémoire du processus : à remplacer par Postgres ou Redis le jour où il y a plusieurs instances.
