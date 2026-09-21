---
name: Chronova
description: Montres mécaniques composées par leur propriétaire, assemblées à la main — univers « Vitrine ».
colors:
  papier: "#f5f5f3"
  papier-alt: "#ebebe8"
  panneau: "#fdfdfc"
  encre: "#111417"
  encre-douce: "#555b63"
  filet: "#dadad6"
  champ-contour: "#767c84"
  marine: "#14263a"
  marine-vive: "#1f3b5a"
  or: "#7d5e27"
  or-clair: "#d9bc7a"
  or-pale: "#ead7a6"
  sapin: "#1e6b4c"
  sapin-clair: "#7fd0a8"
  grenat: "#a12a3c"
  grenat-clair: "#f09aaa"
  nuit: "#0b1118"
  nuit-alt: "#111923"
  nuit-panneau: "#16202c"
  nuit-encre: "#eef0f2"
  nuit-douce: "#a3abb5"
  nuit-filet: "#263241"
  nuit-champ-contour: "#78828e"
  studio-centre: "#ffffff"
  studio-bord: "#e3e4e6"
  studio-nuit-centre: "#223246"
typography:
  display-1:
    fontFamily: "Jost, Futura, 'Century Gothic', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(2.6rem, 6.4vw, 5.5rem)"
    fontWeight: 300
    lineHeight: 1.02
    letterSpacing: "-0.025em"
  display-2:
    fontFamily: "Jost, Futura, 'Century Gothic', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(2rem, 4.2vw, 3.5rem)"
    fontWeight: 300
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  title-1:
    fontFamily: "Jost, Futura, 'Century Gothic', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1.18
    letterSpacing: "-0.012em"
  title-2:
    fontFamily: "Jost, Futura, 'Century Gothic', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 500
    lineHeight: 1.28
    letterSpacing: "-0.005em"
  lead:
    fontFamily: "'Hanken Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "clamp(1.0625rem, 0.95rem + 0.55vw, 1.25rem)"
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "'Hanken Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
  body-lg:
    fontFamily: "'Hanken Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.65
  ui:
    fontFamily: "'Hanken Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.4
  caption:
    fontFamily: "'Hanken Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.45
  mono:
    fontFamily: "'Hanken Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.14em"
    fontFeature: "'tnum' 1, 'lnum' 1"
rounded:
  field: "8px"
  card: "14px"
  pill: "999px"
spacing:
  gutter: "clamp(20px, 4vw, 56px)"
  section-y: "clamp(72px, 9vw, 136px)"
  section-y-compact: "clamp(40px, 5vw, 72px)"
components:
  button-primary:
    backgroundColor: "{colors.marine}"
    textColor: "{colors.panneau}"
    typography: "{typography.ui}"
    rounded: "{rounded.pill}"
    padding: "12px 28px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.marine-vive}"
  button-primary-sm:
    backgroundColor: "{colors.marine}"
    textColor: "{colors.panneau}"
    rounded: "{rounded.pill}"
    padding: "8px 20px"
    height: "40px"
  button-primary-night:
    backgroundColor: "{colors.or-clair}"
    textColor: "{colors.nuit}"
    typography: "{typography.ui}"
    rounded: "{rounded.pill}"
    padding: "12px 28px"
    height: "48px"
  button-primary-night-hover:
    backgroundColor: "{colors.or-pale}"
  button-contour:
    textColor: "{colors.encre}"
    typography: "{typography.ui}"
    rounded: "{rounded.pill}"
    padding: "12px 28px"
    height: "48px"
  button-contour-hover:
    backgroundColor: "{colors.marine}"
    textColor: "{colors.panneau}"
  button-discret:
    textColor: "{colors.encre}"
    typography: "{typography.ui}"
    height: "44px"
  button-discret-hover:
    textColor: "{colors.or}"
  pill:
    textColor: "{colors.encre-douce}"
    typography: "{typography.mono}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  pill-exemple:
    textColor: "{colors.grenat}"
    typography: "{typography.mono}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  chip-filter:
    backgroundColor: "{colors.panneau}"
    textColor: "{colors.encre}"
    typography: "{typography.ui}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  chip-filter-active:
    backgroundColor: "{colors.marine}"
    textColor: "{colors.panneau}"
  input:
    backgroundColor: "{colors.panneau}"
    textColor: "{colors.encre}"
    typography: "{typography.ui}"
    rounded: "{rounded.field}"
    padding: "0 12px"
    height: "44px"
  option-card:
    backgroundColor: "{colors.papier}"
    textColor: "{colors.encre}"
    rounded: "{rounded.card}"
    padding: "16px"
  option-card-selected:
    backgroundColor: "{colors.panneau}"
  watch-tile:
    rounded: "{rounded.card}"
    padding: "24px 16px 8px"
  surface-atelier:
    backgroundColor: "{colors.panneau}"
    textColor: "{colors.encre}"
    rounded: "{rounded.card}"
  nav-link:
    textColor: "{colors.encre}"
    typography: "{typography.ui}"
  nav-link-active:
    textColor: "{colors.or}"
---

# Design System: Chronova

## Overview

**Creative North Star: "La Vitrine"**

La montre est photographiée, la page s'efface. Le système reprend sans détour le standard des grandes maisons horlogères : une vitrine de papier neutre et clair où la pièce est posée sur un fond de studio, une nuit bleu-noir pour les scènes où l'acier doit briller, et un or champagne, rare, pour ce qui compte. Rien ne passe devant le produit : ni texture, ni illustration, ni effet de carte. Le seul visuel de la marque est le rendu SVG paramétrique de la montre, exactement celle que le client a composée.

La densité est celle d'une vitrine : grands titres légers en Jost, beaucoup d'air (rythme de section de 72 à 136 px), texte de lecture en Hanken Grotesk, étiquettes techniques en petites capitales espacées comme une gravure de fond de boîte. Le CRM de l'atelier hérite du même monde en mode outil : titres à échelle réduite, cibles de 44 px, thème clair ou nuit au choix.

Le système ne montre que ce qui existe. Aucune photographie inventée : un emplacement photo décrit la prise de vue attendue. Aucun avis inventé : la section reste un emplacement explicite tant qu'aucun client n'a écrit. Toute donnée fictive porte la pastille « Exemple ».

**Key Characteristics:**
- Deux scènes : papier clair (`papier`) et nuit bleu-noir (`nuit`), basculées par `data-theme="night"` ; les composants ne consomment que des tokens sémantiques.
- Deux accents, jamais ensemble : la marine sur papier, l'or clair sur la nuit.
- L'or est le seul ornement : filet d'or, prix, repères numérotés, liens actifs.
- Boutons en pilule, champs à 8 px, cartes à 14 px.
- Tuiles de montre : un dégradé radial de studio, sans bordure ni ombre.
- Une bordure ou une ombre, jamais les deux ; l'ombre est réservée aux éléments flottants.
- Aucun surtitre au-dessus des titres du site public.
- Plancher typographique de 13 px ; `prefers-reduced-motion` coupe tout mouvement.

## Colors

Une palette à deux scènes — un papier neutre légèrement chaud et une nuit bleu-noir froide — reliées par un seul métal précieux, l'or champagne.

### Primary
- **Marine d'horloger** (`marine`) : l'accent sur papier. Fond du bouton plein, puce de filtre active, vue active du sélecteur face / profil / dos, anneau de focus, bordure de l'option choisie. Son survol est la **Marine vive** (`marine-vive`).

### Secondary
- **Or champagne clair** (`or-clair`) : l'accent des scènes nuit, où la marine disparaît (1,24:1 sur `nuit`). Fond du bouton plein sur la nuit, focus nuit, couronne graduée du héros, traits du rideau d'entrée, fond de la sélection de texte. Sur papier il tombe à 1,68:1 : décor uniquement, jamais de texte. Son survol nuit est l'**Or pâle** (`or-pale`).
- **Or champagne profond** (`or`) : le même or, assombri pour rester lisible sur papier (5,49:1). Prix, repères numérotés de la frise, lien de navigation actif, soulignement du bouton discret, puces de liste, filet d'or, curseur de saisie.

### Tertiary
- **Vert sapin** (`sapin`, `sapin-clair` sur la nuit) : statuts positifs — stock disponible, étape validée.
- **Grenat** (`grenat`, `grenat-clair` sur la nuit) : alerte, erreur de champ, information à remplir, pastille « Exemple ».

### Neutral
- **Papier de vitrine** (`papier`) : fond principal du site clair.
- **Papier alterné** (`papier-alt`) : bandes alternées (l'horloger, FAQ), petits blocs teintés du CRM.
- **Panneau** (`panneau`) : surfaces posées sur le papier — champs, puces, panneaux du CRM ; c'est aussi le texte du bouton marine.
- **Encre** (`encre`) et **Encre douce** (`encre-douce`) : texte principal et texte secondaire sur papier.
- **Filet** (`filet`) : séparateurs décoratifs de 1 px. Trop faible pour délimiter un champ : les champs utilisent le **Contour de champ** (`champ-contour`, 3,86:1 sur papier).
- **Nuit** (`nuit`), **Nuit alternée** (`nuit-alt`), **Panneau nuit** (`nuit-panneau`) : fonds des scènes nuit, du pied de page et du thème nuit du CRM.
- **Encre de nuit** (`nuit-encre`), **Encre de nuit douce** (`nuit-douce`), **Filet de nuit** (`nuit-filet`), **Contour de champ nuit** (`nuit-champ-contour`) : leurs équivalents sur fond sombre.
- **Fond de studio** (`studio-centre` → `studio-bord` ; `studio-nuit-centre` → `nuit` sur la nuit) : les deux arrêts du dégradé radial placé derrière chaque montre.

### Named Rules
**Règle de l'or seul.** L'or est le seul ornement du site. Il marque ce qui est précieux sur la page — un prix, un repère, un filet, un lien actif — et rien d'autre ne décore.

**Règle des deux accents.** La marine porte l'accent sur papier, l'or clair sur la nuit. Le basculement est fait par les tokens sémantiques (`--accent`, `--accent-hover`, `--on-accent`, `--gold`, `--positive`, `--alert`, `--focus`) ; un composant n'écrit jamais une couleur de palette en dur.

**Règle du contraste testé.** Chaque couple texte / fond est garanti AA (4,5:1) par `src/design/tokens.test.ts`, qui lit les valeurs dans `globals.css`. Changer une teinte sans tenir le seuil fait échouer la suite de tests.

## Typography

**Display Font:** Jost (repli Futura, Century Gothic, Helvetica Neue, Arial)
**Body Font:** Hanken Grotesk (repli Helvetica Neue, Helvetica, Arial)
**Label/Mono Font:** Hanken Grotesk en petites capitales espacées pour les étiquettes ; Geist Mono n'est chargée que pour les vraies chaînes machine du CRM (identifiants, clés, journaux).

**Character:** Jost est le géométrique des cadrans : léger et très grand en vitrine, plus ferme dans les intertitres. Hanken Grotesk porte tout ce qui se lit et se manipule, sans caractère marqué, pour laisser la montre parler.

### Hierarchy
- **Display** (`display-1`, Jost 300, `clamp(2.6rem, 6.4vw, 5.5rem)`, interligne 1,02) : titre du héros et de la scène de clôture uniquement.
- **Headline** (`display-2`, Jost 300, `clamp(2rem, 4.2vw, 3.5rem)`, 1,08) : titre de section et titre des pages intérieures.
- **Title** (`title-1`, Jost 400, 1,875 rem, 1,18 ; `title-2`, Jost 500, 1,375 rem, 1,28) : nom de modèle, étape de la frise, question de FAQ, prix du héros, lien du menu mobile.
- **Body** (`body`, Hanken Grotesk 400, 1,0625 rem, 1,6 ; `lead` en chapô jusqu'à 1,25 rem ; `body-lg` 1,125 rem pour l'éditorial) : mesure de lecture plafonnée à 68 caractères.
- **Label** (`ui`, Hanken Grotesk 500, 0,9375 rem : boutons, champs, navigation ; `caption`, 0,8125 rem ; `mono`, Hanken Grotesk 500, 0,8125 rem, interlettrage 0,14 em, capitales, chiffres tabulaires) : calibre, diamètre, étanchéité, référence, numéro de commande, légendes, pastilles.

### Named Rules
**Règle de la gravure.** L'étiquette technique (`.type-mono`) est composée dans la police de lecture, en petites capitales espacées, comme une gravure de fond de boîte. Aucune police à chasse fixe ne sert de décor ; Geist Mono reste réservée aux chaînes machine du CRM, sensibles à la casse.

**Règle du plancher.** 13 px (0,8125 rem) est le plus petit corps du projet. Quand la place manque, c'est le conteneur qui grandit — la pastille du panier, par exemple — jamais le texte qui rétrécit.

**Règle du titre nu.** Sur le site public, aucun surtitre ni libellé ne coiffe un titre. Le titre ouvre la section ; le chapô vient après.

## Layout

Chaque bande du site est une `Section` : elle pose la gouttière latérale (`gutter`, 20 à 56 px) et le rythme vertical (`section-y`, 72 à 136 px ; variante compacte 40 à 72 px) une seule fois, et centre un conteneur de 80 rem (1280 px). L'en-tête, le héros, la bande macro, la clôture et le pied de page utilisent le conteneur large de 90 rem (1440 px). Aucun composant enfant ne gère ses propres marges de bord d'écran. Le texte long est plafonné à 68 caractères.

La conception part du mobile. Points de rupture : 640, 768, 1024, 1280 px (défauts Tailwind) et un `3xl` à 1440 px, la référence large du projet. La navigation principale apparaît à 1024 px ; en dessous, un tiroir plein écran à un seul niveau, avec des cibles d'au moins 44 px. Les grilles de modèles passent de 1 à 2 colonnes à 640 px, puis 3 à 1024 px ; la frise « Comment ça se passe » de 1 à 2 colonnes à 768 px, puis 4 à 1280 px.

Dans le héros, l'ordre du DOM est l'ordre de lecture mobile (titre, montre, promesse et bouton) ; en grand écran la grille replace la montre à droite sur deux rangées sans recourir à `order`. Le héros se glisse sous l'en-tête collant par une marge négative égale à sa hauteur (64 px, 80 px à partir de 768 px). Les ancres réservent 6 rem au-dessus d'elles pour ne pas passer sous l'en-tête.

## Elevation & Depth

Le système est plat. La profondeur vient de la lumière du studio — le dégradé radial derrière la montre, le halo froid de la scène nuit — et des ombres dessinées à l'intérieur du SVG de la montre, jamais d'ombres portées sur les surfaces. Les séparations sont des filets de 1 px. Deux ombres existent, teintées nuit, réservées aux éléments qui flottent réellement au-dessus de la page.

### Shadow Vocabulary
- **Levée** (`box-shadow: 0 18px 48px -20px rgb(11 17 24 / 0.38)`) : tiroir du panier, palette de recherche du CRM en thème clair.
- **Feuille** (`box-shadow: 0 -12px 40px -18px rgb(11 17 24 / 0.36)`) : barre de total collée en bas du configurateur sur mobile.
- **Voile d'en-tête** (fond à 82 % + `backdrop-filter: saturate(1.6) blur(18px)`) : l'en-tête collant une fois la page défilée ; sur le héros, il est transparent et prend le thème nuit.

### Named Rules
**Règle de la bordure ou de l'ombre.** Une surface porte une bordure ou une ombre, jamais les deux. En thème nuit, la palette de recherche du CRM échange ainsi son ombre contre un filet.

**Règle du fond de studio.** Une tuile de montre n'a ni bordure ni ombre : c'est un fond de studio, un dégradé radial (ellipse 78 % × 70 % centrée à 50 % / 42 %) du `studio-centre` vers le `studio-bord`, arrondi à 14 px.

## Shapes

Trois rayons, trois rôles. La pilule (999 px) pour tout ce qui se presse ou étiquette : boutons, puces de filtre, pastilles, sélecteur de vue, boutons d'icône, repères numérotés, pastilles de couleur. Des angles doucement arrondis (8 px) pour les champs de saisie et les petits blocs. Des angles plus amples (14 px) pour les cartes : tuiles de montre, cartes d'option, panneaux du CRM, boîte de zoom, emplacements photo. L'anneau de focus a son propre rayon de 4 px.

Les filets font 1 px. Les bordures en pointillés signalent exclusivement ce qui manque : emplacement photo, avis à venir, information `À remplir`. Le cercle est la forme récurrente, empruntée à la montre : couronne graduée de soixante traits derrière la montre du héros, repères ronds de la frise, masque circulaire du rideau d'entrée. Le filet d'or est un trait de 1 px qui s'efface en dégradé à ses deux extrémités (opacité 0,55).

## Components

### Buttons
Des pilules franches, sans ombre, qui s'enfoncent de 1 px à l'appui.
- **Shape:** pilule complète (999 px), hauteur minimale 48 px (`md`, retrait 12 × 28 px) ou 40 px (`sm`, 8 × 20 px), corps `ui`.
- **Primary (`primaire`):** fond d'accent, texte sur accent — marine et panneau sur papier, or clair et nuit sur les scènes nuit. Accompagné au besoin d'une flèche qui avance de 4 px au survol.
- **Hover / Focus:** le fond passe à l'accent de survol en 200 ms sur la courbe `cubic-bezier(0.16, 1, 0.3, 1)` ; focus en anneau de 2 px décalé de 3 px ; désactivé à 45 % d'opacité.
- **Contour (`contour`):** bordure de 1 px en encre à 70 %, sans fond ; au survol il se remplit de l'accent.
- **Discret (`discret`):** pas de boîte ; texte souligné d'or (1 px, décalage 6 px), qui passe à l'or au survol ; hauteur minimale 44 px.
- **CRM :** `Bouton` (plein) et `BoutonLeger` (contour `champ-contour`), mêmes pilules à 44 px.

### Chips
- **Style:** pastille (`Pill`) en `mono`, bordure de 1 px, sans fond, retrait 4 × 10 px ; quatre tons — neutre, accent, positif, alerte. La pastille « Exemple » (`SamplePill`) est le ton alerte et accompagne toute donnée fictive. Sur une tuile de montre, la pastille de style perd sa bordure et prend un fond panneau à 80 % flouté.
- **State:** les puces de filtre de la collection (44 px, corps `ui`) sont panneau et filet au repos, bordure encre au survol, accent plein quand elles sont actives (`aria-pressed`). Le sélecteur de vue face / profil / dos est une capsule bordée contenant trois pilules `mono`.

### Cards / Containers
- **Corner Style:** 14 px.
- **Background:** la tuile de montre est le fond de studio ; la carte d'option est papier au repos, panneau une fois choisie ; le panneau du CRM est panneau.
- **Shadow Strategy:** aucune (voir Elevation & Depth).
- **Border:** aucune sur les tuiles de montre ; filet de 1 px sur les cartes d'option (accent quand elle est choisie, or clair au survol) et sur les panneaux du CRM.
- **Internal Padding:** 16 px pour une carte d'option, 28 à 32 px pour un panneau.
- La carte de modèle n'est pas une carte : une tuile de studio, puis le nom, l'accroche, trois étiquettes `mono` et le prix, posés directement sur le papier.

### Inputs / Fields
- **Style:** fond panneau, contour de 1 px en `champ-contour` (au moins 3:1 sur tous les fonds), rayon 8 px, hauteur 44 px, corps `ui`.
- **Focus:** la bordure passe à l'accent, avec l'anneau de focus global. Survol : bordure encre.
- **Error / Disabled:** bordure et message en couleur d'alerte (`aria-invalid`) ; désactivé sur fond alterné, bordure filet, texte doux.
- Les pastilles de couleur du configurateur sont des ronds de 44 px ; la teinte choisie porte un double anneau (fond, puis accent) et son nom est toujours écrit dessous.

### Navigation
En-tête collant de 64 px (80 px dès 768 px) : le nom « CHRONOVA » composé en Jost, interlettré à 0,22 em — aucun fichier logo ; liens en `ui` dont le soulignement se trace de gauche à droite en 280 ms ; lien actif et survol en or ; boutons d'icône ronds de 44 px (compte, panier avec pastille de quantité en accent) ; bouton « Composer ma montre » en pilule `sm`. Sur l'accueil non défilé, l'en-tête est transparent et prend le thème nuit ; défilé, il prend le voile flouté et un filet bas. Sous 1024 px : tiroir plein écran, liens en `title-2` séparés par des filets, bouton plein en pied. L'en-tête est exclu des transitions de page. Le pied de page est toujours en thème nuit : intertitres en `mono`, liens soulignés au survol, mentions en `caption`.

### Scène nuit
Le cyclorama du héros et de la clôture : fond `nuit`, halo froid elliptique derrière la montre, lueur d'or très faible au sol, dégradé vertical. La montre du héros se pose une seule fois depuis un flou (1400 ms) pendant que titre, chapô, boutons et fiche montent par paliers de 110 ms. En pied de scène, la fiche de la pièce sur un filet : modèle, boîtier, étanchéité, calibre en paires `mono` / `ui`, puis le prix en `title-2` et sa pastille « Exemple ».

### Tuile de montre et gros plans
La montre est un SVG vectoriel unique (`WatchSvg`, repère 1000 × 1000) ; enveloppée par `InteractiveWatch`, le reflet du saphir suit le pointeur ou l'inclinaison du téléphone. Au survol d'une carte de modèle, la montre grossit de 4,5 % et pivote de 2°, un reflet traverse le verre et le second coloris apparaît en fondu. Les gros plans de la bande macro recadrent le même SVG (propriété `crop`) dans des tuiles carrées sombres de 14 px de rayon ; ils restent nets parce que le rendu est vectoriel.

### Frise du parcours
Quatre étapes reliées par un filet : un repère rond de 48 px bordé d'or, chiffre en or, puis le filet court jusqu'au repère suivant. Ni cartes, ni pictogrammes : la numérotation porte ici une information, l'ordre.

### Emplacements honnêtes
`PhotoPlaceholder` : un fond de studio bordé de pointillés, qui décrit en `mono` la prise de vue attendue. `FillMe` : un bloc en pointillés grenat, « À remplir · … », volontairement visible avant la mise en ligne. Avis : un cadre en pointillés « Avis à venir » tant que la liste des avis publiés est vide.

## Do's and Don'ts

### Do:
- **Do** passer par les tokens sémantiques (`bg`, `bg-alt`, `panel`, `fg`, `fg-soft`, `rule`, `field`, `accent`, `on-accent`, `gold`, `positive`, `alert`) ; ils basculent seuls avec `data-theme="night"`.
- **Do** réserver l'or à ce qui est précieux : prix, repères, filet d'or, lien actif, soulignement du bouton discret.
- **Do** poser chaque montre sur un fond de studio (dégradé radial, 14 px de rayon), sans bordure ni ombre.
- **Do** garder les boutons en pilule, les champs à 8 px, les cartes à 14 px.
- **Do** composer les étiquettes techniques en `mono` : Hanken Grotesk 500, 13 px, capitales, interlettrage 0,14 em.
- **Do** marquer toute donnée fictive de la pastille « Exemple », et toute information manquante d'un bloc `À remplir`.
- **Do** décrire une photo absente par un emplacement en pointillés qui dit quoi photographier.
- **Do** garder un focus visible partout (2 px, décalage 3 px) et des cibles d'au moins 44 px pour les commandes isolées.
- **Do** prévoir le rendu sans mouvement : `prefers-reduced-motion` coupe animations, transitions, rideau d'entrée et défilement doux ; le contenu reste complet.
- **Do** vérifier tout nouveau couple texte / fond dans `src/design/tokens.test.ts` (AA, 4,5:1).

### Don't:
- **Don't** placer de surtitre ni de libellé au-dessus d'un titre sur le site public.
- **Don't** cumuler bordure et ombre sur une même surface ; l'ombre est réservée aux éléments flottants.
- **Don't** utiliser la marine sur la nuit (1,24:1) ni l'or clair comme texte sur papier (1,68:1).
- **Don't** ajouter d'autre ornement que l'or : ni texture, ni grain, ni illustration, ni pictogramme dans un cercle coloré.
- **Don't** inventer une photographie, un avis client ou un chiffre.
- **Don't** descendre sous 13 px.
- **Don't** employer une police à chasse fixe comme décor ; Geist Mono est réservée aux chaînes machine du CRM.
- **Don't** écrire une couleur de palette ou un hexadécimal en dur dans un composant.
- **Don't** reprendre le nom, le logo ou la signature d'une maison existante : les modèles s'inspirent des grandes familles du secteur, rien de plus.
