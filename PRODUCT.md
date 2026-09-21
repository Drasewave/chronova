# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Acheteur** : amateur de montres mécaniques, francophone, qui veut une pièce composée par lui et montée par un artisan plutôt qu'une référence de catalogue. Il compare longuement, revient plusieurs fois, partage sa configuration pour avis avant de payer plus de 1 000 €. Il consulte souvent sur mobile, décide sur grand écran.
- **L'horloger** (utilisateur unique du CRM `/atelier`) : travaille à l'établi, souvent sur tablette, entre deux gestes de montage. Il suit les commandes, le stock, les fournisseurs, les demandes et l'après-vente.

## Product Purpose

Chronova est le site de vente et le back-office d'un horloger indépendant qui assemble ses montres à la main. Le client compose sa montre pièce par pièce (9 étapes, 83 options, 27 règles de compatibilité) ; l'horloger reçoit la commande, commande et contrôle les pièces, monte, règle, teste 72 heures, expédie. Le succès : une configuration payée, puis un client qui suit l'assemblage de sa montre sans avoir à écrire.

## Positioning

La montre que le client voit est exactement celle qu'il a composée : un rendu SVG en calques piloté par la même configuration que la nomenclature d'atelier. Une seule personne assemble, contrôle et signe chaque pièce ; chaque montre part avec sa fiche de contrôle mesurée (écart en s/j, pression testée, références des pièces).

## Operating Context

- Parcours public : accueil → collection → fiche modèle → configurateur (`/composer`) → panier → paiement Stripe → compte avec frise d'assemblage.
- Pages éditoriales : l'horloger, entretien & garantie, FAQ, contact, sur-mesure, pages légales (LCEN, RGPD, CGV/CGU, cookies).
- CRM : tableau de bord, kanban des commandes, fiche d'atelier, stock en journal de mouvements, fournisseurs et bons de commande, clients et RGPD, demandes et devis, après-vente, catalogue éditable, paramètres. Thème clair et thème nuit.
- Le service tourne en build de production sur le port 3000 (unité systemd utilisateur), mode démonstration `CHRONOVA_DEMO`.

## Capabilities and Constraints

- Next.js 16 (App Router), React 19, Tailwind 4, Prisma 7 / PostgreSQL, Auth.js (lien magique), Stripe, Resend, Motion, Lenis.
- Le moteur de montre est un seul SVG inline `viewBox 0 0 1000 1000`, jamais démonté ; la géométrie vit dans le code (`src/watch/parts`), l'apparence (couleurs, `renderMeta`) vit dans la base. Vues face, profil, dos. Le moteur 3D a été retiré volontairement.
- Le panier ne fixe aucun prix ; le serveur rechiffre tout. Le stock est un journal.
- Lignes de boîtiers : plongée, terrain, GMT, habillée, chronographe ; calibres NH35 / NH34 / NH38.
- Les contrastes des tokens sont garantis par `src/design/tokens.test.ts` (WCAG 2.1 AA).
- Terminologie française d'horlogerie : carrure, cornes, lunette, insert, réhaut, index appliqués, trotteuse, couronne vissée, fond vissé.

## Brand Commitments

- Nom « Chronova », voix à la première personne de l'horloger (« Je l'assemble, pièce par pièce »), ton factuel, sans emphase.
- Aucun chiffre inventé, aucune promesse invérifiable ; ce qui n'est pas décidé reste marqué `[À REMPLIR]`.
- Prix, délais et disponibilités d'exemple portent la pastille « Exemple ».
- Préférence durable du propriétaire (21 sept. 2026) : le standard du secteur, joué sans détour, avec seiko et rolex comme barre de finition ; les modèles s'inspirent de leurs grandes familles (plongeuse, GMT bicolore, habillée cannelée, terrain, chronographe) sans jamais reprendre un nom, un logo ou une signature.
- Refonte de septembre 2026 : le propriétaire a demandé un nouvel univers visuel (l'ancien thème « marbre / chrome » n'est plus une contrainte) et un rendu des montres nettement plus réaliste.

## Evidence on Hand

- Catalogue, options et règles réels en base (données d'exemple marquées `isSample`).
- Textes : `src/lib/content/home.ts`, `legal.ts`, pages éditoriales.
- Aucune photographie de montre, d'atelier ou de l'horloger : les emplacements photo sont des blocs `[PHOTO]` décrits. Aucun avis client publié (`AVIS_PUBLIES` vide) : ne pas en inventer.
- Le rendu SVG paramétrique est le seul visuel produit de la marque.

## Product Principles

1. La montre affichée est la montre livrée : le rendu ne ment jamais sur une option.
2. Dire ce qui est mesuré, taire ce qui ne l'est pas.
3. Le client n'a jamais à demander où en est sa montre.
4. À l'établi, l'outil s'efface : une action, un geste.
5. Tout ce qui est coloris, prix, stock se règle depuis le CRM, sans code.

## Accessibility & Inclusion

WCAG 2.1 AA : contrastes testés, focus toujours visible, `prefers-reduced-motion` respecté (intro sautée, Lenis non monté), plancher typographique 13 px, déclaration d'accessibilité publiée.
