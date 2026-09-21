---
name: Chronova
description: Montres mécaniques composées par leur propriétaire, assemblées à la main — univers « Vitrine ».
colors:
  papier: "#ffffff"
  papier-alt: "#f2f3f5"
  panneau: "#ffffff"
  encre: "#0a0a0a"
  encre-douce: "#4b5058"
  filet: "#dfe1e5"
  champ-contour: "#767b83"
  bleu: "#0b3d91"
  bleu-vif: "#0a2f70"
  bleu-clair: "#6fa3ff"
  bleu-pale: "#9bbfff"
  sapin: "#1e6b4c"
  sapin-clair: "#7fd0a8"
  grenat: "#a12a3c"
  grenat-clair: "#f09aaa"
  nuit: "#0a0b0d"
  nuit-profonde: "#000000"
  nuit-scene: "#1a2942"
  nuit-alt: "#0d0f12"
  nuit-panneau: "#15181d"
  nuit-encre: "#f2f3f5"
  nuit-douce: "#a0a6b0"
  nuit-filet: "#262a31"
  nuit-champ-contour: "#78828e"
  studio-bord: "#e4e6ea"
typography:
  display-1:
    fontFamily: "Jost, Futura, 'Century Gothic', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(2.25rem, 4.6vw, 4rem)"
    fontWeight: 300
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  display-2:
    fontFamily: "Jost, Futura, 'Century Gothic', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(1.75rem, 3vw, 2.5rem)"
    fontWeight: 300
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  title-1:
    fontFamily: "Jost, Futura, 'Century Gothic', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.012em"
  title-2:
    fontFamily: "Jost, Futura, 'Century Gothic', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.005em"
  lead:
    fontFamily: "'Hanken Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "clamp(1.0625rem, 0.98rem + 0.3vw, 1.1875rem)"
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "'Hanken Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  body-lg:
    fontFamily: "'Hanken Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: "1.0625rem"
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
  gutter: "clamp(20px, 4vw, 48px)"
  section-y: "clamp(56px, 6.5vw, 104px)"
  section-y-compact: "clamp(40px, 5vw, 72px)"
components:
  button-primary:
    backgroundColor: "{colors.bleu}"
    textColor: "{colors.panneau}"
    typography: "{typography.ui}"
    rounded: "{rounded.pill}"
    padding: "10px 24px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.bleu-vif}"
  button-primary-sm:
    backgroundColor: "{colors.bleu}"
    textColor: "{colors.panneau}"
    rounded: "{rounded.pill}"
    padding: "8px 20px"
    height: "40px"
  button-primary-night:
    backgroundColor: "{colors.bleu-clair}"
    textColor: "{colors.nuit}"
    typography: "{typography.ui}"
    rounded: "{rounded.pill}"
    padding: "10px 24px"
    height: "44px"
  button-primary-night-hover:
    backgroundColor: "{colors.bleu-pale}"
  button-contour:
    textColor: "{colors.encre}"
    typography: "{typography.ui}"
    rounded: "{rounded.pill}"
    padding: "10px 24px"
    height: "44px"
  button-contour-hover:
    backgroundColor: "{colors.bleu}"
    textColor: "{colors.panneau}"
  button-discret:
    textColor: "{colors.encre}"
    typography: "{typography.ui}"
    height: "44px"
  button-discret-hover:
    textColor: "{colors.bleu}"
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
    backgroundColor: "{colors.bleu}"
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
  nav-panel:
    backgroundColor: "{colors.panneau}"
    textColor: "{colors.encre}"
    rounded: "{rounded.card}"
    padding: "8px"
    width: "256px"
  nav-link:
    textColor: "{colors.encre}"
    typography: "{typography.ui}"
  nav-link-active:
    textColor: "{colors.bleu}"
---

# Design System: Chronova

## Overview

**Creative North Star: "La Vitrine"**

La montre est photographiée, la page s'efface. Le système reprend sans détour le standard des grandes maisons horlogères, en noir, blanc et un bleu profond : des pages blanches où la pièce est posée sur un fond de studio, des scènes noires où l'acier brille, et le bleu comme unique accent — profond sur le blanc, clair sur le noir. Rien ne passe devant le produit : ni texture, ni illustration, ni effet de carte. Le seul visuel de la marque est le rendu SVG paramétrique de la montre, exactement celle que le client a composée.

Les proportions sont resserrées : titres légers en Jost qui culminent à 4 rem, texte de lecture à 16 px en Hanken Grotesk, rythme de section de 56 à 104 px, conteneur de 84 rem, grilles de modèles à quatre colonnes. Les étiquettes techniques sont en petites capitales espacées, comme une gravure de fond de boîte. Le CRM de l'atelier hérite du même monde en mode outil : titres à échelle réduite, cibles de 44 px, thème clair ou nuit au choix.

Le mouvement suit une seule grammaire, sans rebond ni élastique : ce qui entre se pose, ce qui sort accélère et dure un cran de moins, ce qui se déplace glisse. Le système ne montre que ce qui existe. Aucune photographie inventée : un emplacement photo décrit la prise de vue attendue. Aucun avis inventé : la section reste un emplacement explicite tant qu'aucun client n'a écrit. Toute donnée fictive porte la pastille « Exemple ».

**Key Characteristics:**
- Noir, blanc, et le bleu comme unique accent ; le sapin et le grenat ne sont que des statuts.
- Deux scènes : page blanche (`papier`) et scène noire (`nuit`), basculées par `data-theme="night"` ; les composants ne consomment que des tokens sémantiques.
- Un aplat (`accent` + `on-accent`) pour ce qui se presse, un accent écrit (`accent-ink`) pour ce qui se lit : liens, repères, filets, bordures de sélection.
- Boutons en pilule, champs à 8 px, cartes à 14 px.
- Tuiles de montre : un dégradé radial de studio, sans bordure ni ombre.
- Une bordure ou une ombre, jamais les deux ; l'ombre est réservée aux éléments flottants.
- Aucun surtitre au-dessus des titres du site public.
- Plancher typographique de 13 px ; `prefers-reduced-motion` coupe tout mouvement.

## Colors

Noir, blanc et un bleu profond. Le blanc et le noir sont purs ou presque ; le bleu est la seule couleur, et seule sa clarté change selon le fond.

### Primary
- **Bleu profond** (`bleu`) : l'unique accent sur le blanc, aplat et accent écrit à la fois (10,04:1 sur `papier`). Fond du bouton plein, puce de filtre active, pastille du contrôle segmenté, pastille de quantité du panier, barres des graphiques du CRM, avec un texte blanc ; et aussi liens, survols, repères numérotés de la frise, lien de navigation actif, soulignement du bouton discret, bordure de l'option choisie, cadre de la vignette active, focus, fond de la sélection de texte. Son survol d'aplat est le **Bleu nuit** (`bleu-vif`).
- **Bleu clair** (`bleu-clair`) : le même bleu, éclairci pour le noir (7,84:1 sur `nuit`), où il tient les deux rôles, avec un texte `nuit` sur l'aplat : bouton plein, liens, ligne d'accent du titre du héros, couronne graduée, filet du rideau d'ouverture, focus. Trop faible pour s'écrire sur le blanc (2,51:1). Son survol est le **Bleu pâle** (`bleu-pale`).

### Secondary
- **Vert sapin** (`sapin`, `sapin-clair` sur le noir) : statuts positifs — stock disponible, étape validée.
- **Grenat** (`grenat`, `grenat-clair` sur le noir) : alerte, erreur de champ, information à remplir, pastille « Exemple ».

### Neutral
- **Blanc de page** (`papier`) et **Panneau** (`panneau`) : le même blanc pur ; fond du site clair, champs, puces, panneaux, centre du fond de studio clair, texte du bouton bleu.
- **Gris de page** (`papier-alt`) : bandes alternées, petits blocs teintés du CRM, survol des lignes.
- **Encre** (`encre`) et **Encre douce** (`encre-douce`) : texte principal, presque noir, et texte secondaire.
- **Filet** (`filet`) : séparateurs décoratifs de 1 px. Trop faible pour délimiter un champ : les champs utilisent le **Contour de champ** (`champ-contour`, 4,26:1 sur blanc).
- **Noir de scène** (`nuit`), **Noir alterné** (`nuit-alt`), **Panneau nuit** (`nuit-panneau`) : fonds des scènes nuit, du pied de page, du rideau d'ouverture et du thème nuit du CRM ; `nuit` est aussi le texte posé sur l'aplat bleu clair.
- **Noir profond** (`nuit-profonde`) : noir pur ; fond des gros plans macro et haut du cyclorama. **Bleu de scène** (`nuit-scene`) : halo froid des scènes nuit et centre du fond de studio nuit.
- **Encre de nuit** (`nuit-encre`), **Encre de nuit douce** (`nuit-douce`), **Filet de nuit** (`nuit-filet`), **Contour de champ nuit** (`nuit-champ-contour`) : leurs équivalents sur fond noir.
- **Fond de studio** (`panneau` → `studio-bord` ; `nuit-scene` → `nuit` sur le noir) : les deux arrêts du dégradé radial placé derrière chaque montre.

### Named Rules
**Règle du noir, du blanc et du bleu.** Trois valeurs seulement : le noir, le blanc, et le bleu comme unique accent. Le sapin et le grenat ne sont que des statuts. Aucune autre teinte n'entre dans l'interface ; les couleurs vives appartiennent aux montres.

**Règle de l'aplat et du trait.** `--accent` est un aplat (bouton, puce active, pastille du contrôle segmenté, barre de graphique) et porte toujours un texte `--on-accent` : blanc sur bleu en clair, nuit sur bleu clair en sombre. `--accent-ink` est l'accent qui s'écrit : liens, survols, repères, bordures de sélection, filets. Le basculement est fait par les tokens sémantiques (`--accent`, `--accent-hover`, `--on-accent`, `--accent-ink`, `--positive`, `--alert`, `--focus`) ; un composant n'écrit jamais une couleur de palette en dur.

**Règle du contraste testé.** Chaque couple texte / fond est garanti AA (4,5:1) par `src/design/tokens.test.ts`, qui lit les valeurs dans `globals.css` ; l'aplat bleu doit aussi se détacher du blanc à 3:1 au moins (WCAG 1.4.11). Changer une teinte sans tenir les seuils fait échouer la suite de tests.

## Typography

**Display Font:** Jost (repli Futura, Century Gothic, Helvetica Neue, Arial)
**Body Font:** Hanken Grotesk (repli Helvetica Neue, Helvetica, Arial)
**Label/Mono Font:** Hanken Grotesk en petites capitales espacées pour les étiquettes ; Geist Mono n'est chargée que pour les vraies chaînes machine du CRM (identifiants, clés, journaux).

**Character:** Jost est le géométrique des cadrans : léger en vitrine, plus ferme dans les intertitres. Hanken Grotesk porte tout ce qui se lit et se manipule, sans caractère marqué, pour laisser la montre parler.

### Hierarchy
- **Display** (`display-1`, Jost 300, `clamp(2.25rem, 4.6vw, 4rem)`, interligne 1,05) : titre du héros, des pages de gamme et de la scène de clôture.
- **Headline** (`display-2`, Jost 300, `clamp(1.75rem, 3vw, 2.5rem)`, 1,12) : titre de section et titre des pages intérieures.
- **Title** (`title-1`, Jost 400, 1,5 rem, 1,2 ; `title-2`, Jost 500, 1,1875 rem, 1,3) : nom de modèle et de gamme, étape de la frise, question de FAQ, prix du héros, lien du menu mobile.
- **Body** (`body`, Hanken Grotesk 400, 1 rem, 1,6 ; `lead` en chapô jusqu'à 1,1875 rem ; `body-lg` 1,0625 rem pour l'éditorial) : mesure de lecture plafonnée à 68 caractères.
- **Label** (`ui`, Hanken Grotesk 500, 0,9375 rem : boutons, champs, navigation ; `caption`, 0,8125 rem ; `mono`, Hanken Grotesk 500, 0,8125 rem, interlettrage 0,14 em, capitales, chiffres tabulaires) : calibre, diamètre, étanchéité, référence, numéro de commande, légendes, pastilles, fil d'Ariane.

### Named Rules
**Règle de la gravure.** L'étiquette technique (`.type-mono`) est composée dans la police de lecture, en petites capitales espacées, comme une gravure de fond de boîte. Aucune police à chasse fixe ne sert de décor ; Geist Mono reste réservée aux chaînes machine du CRM, sensibles à la casse.

**Règle du plancher.** 13 px (0,8125 rem) est le plus petit corps du projet. Quand la place manque, c'est le conteneur qui grandit — la pastille du panier, par exemple — jamais le texte qui rétrécit.

**Règle du titre nu.** Sur le site public, aucun surtitre ni libellé ne coiffe un titre. Le titre ouvre la section ; le chapô vient après.

## Layout

Chaque bande du site est une `Section` : elle pose la gouttière latérale (`gutter`, 20 à 48 px) et le rythme vertical (`section-y`, 56 à 104 px ; variante compacte 40 à 72 px) une seule fois, et centre le conteneur large de 84 rem (1344 px). Toutes les bandes du site public — en-tête, héros, sections, vue éclatée, bande macro, clôture, pied de page — s'alignent sur ce même conteneur. Aucun composant enfant ne gère ses propres marges de bord d'écran. Le texte long est plafonné à 68 caractères.

La conception part du mobile. Points de rupture : 640, 768, 1024, 1280 px (défauts Tailwind) et un `3xl` à 1440 px. La navigation principale apparaît à 1024 px ; en dessous, un tiroir plein écran où les gammes sont dépliées d'office sous « Collection », avec des cibles d'au moins 44 px. Les grilles de modèles passent de 1 à 2 colonnes à 640 px, 3 à 1024 px, puis 4 à 1280 px. La vue d'ensemble de la collection range les gammes sur une grille à six colonnes dont les rangées sont toujours pleines (deux grands blocs, puis trois moyens). La frise « Comment ça se passe » passe de 1 à 2 colonnes à 768 px, puis 4 à 1280 px.

Dans le héros, l'ordre du DOM est l'ordre de lecture mobile (titre, montre, promesse et boutons) ; en grand écran la grille replace la montre à droite sur deux rangées sans recourir à `order`. Le héros se glisse sous l'en-tête collant par une marge négative égale à sa hauteur (64 px, 80 px à partir de 768 px). Les ancres réservent 6 rem au-dessus d'elles pour ne pas passer sous l'en-tête.

## Elevation & Depth

Le système est plat. La profondeur vient de la lumière du studio — le dégradé radial derrière la montre, le halo froid de la scène nuit — et des ombres dessinées à l'intérieur du SVG de la montre, jamais d'ombres portées sur les surfaces. Les séparations sont des filets de 1 px. Deux ombres existent, teintées nuit, réservées aux éléments qui flottent réellement au-dessus de la page.

### Shadow Vocabulary
- **Levée** (`box-shadow: 0 18px 48px -20px rgb(11 17 24 / 0.38)`) : tiroir du panier, palette de recherche du CRM en thème clair.
- **Feuille** (`box-shadow: 0 -12px 40px -18px rgb(11 17 24 / 0.36)`) : barre de total collée en bas du configurateur sur mobile.
- **Voile d'en-tête** (fond à 82 % + `backdrop-filter: saturate(1.6) blur(18px)`) : l'en-tête collant une fois la page défilée ; sur le héros, il est transparent, et il prend le thème nuit chaque fois qu'une section nuit passe dessous.

### Named Rules
**Règle de la bordure ou de l'ombre.** Une surface porte une bordure ou une ombre, jamais les deux. En thème nuit, la palette de recherche du CRM échange ainsi son ombre contre un filet ; le panneau déroulant « Collection » est bordé, sans ombre.

**Règle du fond de studio.** Une tuile de montre n'a ni bordure ni ombre : c'est un fond de studio, un dégradé radial (ellipse 78 % × 70 % centrée à 50 % / 42 %) du `panneau` vers le `studio-bord`, arrondi à 14 px.

## Shapes

Trois rayons, trois rôles. La pilule (999 px) pour tout ce qui se presse ou étiquette : boutons, puces de filtre, pastilles, contrôle segmenté, boutons d'icône, repères numérotés, pastilles de couleur. Des angles doucement arrondis (8 px) pour les champs de saisie, les petits blocs et les lignes du panneau de navigation. Des angles plus amples (14 px) pour les cartes : tuiles de montre, blocs de gamme, vignettes de galerie, cartes d'option, panneaux, boîte de zoom, emplacements photo. L'anneau de focus a son propre rayon de 4 px.

Les filets font 1 px. Les bordures en pointillés signalent exclusivement ce qui manque : emplacement photo, avis à venir, information `À remplir`. Le cercle est la forme récurrente, empruntée à la montre : couronne graduée de soixante traits derrière la montre du héros, repères ronds de la frise. Le filet d'accent (classe `.filet-or`, nom hérité) est un trait de 1 px en `accent-ink` qui s'efface en dégradé à ses deux extrémités (opacité 0,55) : le seul ornement du site.

## Components

### Buttons
Des pilules franches, sans ombre, qui se contractent légèrement à l'appui.
- **Shape:** pilule complète (999 px), hauteur minimale 44 px (`md`, retrait 10 × 24 px) ou 40 px (`sm`, 8 × 20 px), corps `ui`.
- **Primary (`primaire`):** aplat d'accent, texte sur accent — blanc sur `bleu` en clair, `nuit` sur `bleu-clair` dans les scènes nuit. Accompagné au besoin d'une flèche qui avance de 4 px au survol.
- **Hover / Focus:** le fond passe à l'accent de survol en 350 ms sur la courbe d'entrée `cubic-bezier(0.16, 1, 0.3, 1)` ; appui : échelle 0,98 en 120 ms ; focus en anneau de 2 px décalé de 3 px ; désactivé à 45 % d'opacité.
- **Contour (`contour`):** bordure de 1 px en encre à 70 %, sans fond ; au survol il se remplit de l'aplat d'accent.
- **Discret (`discret`):** pas de boîte ; texte souligné d'accent (1 px, décalage 6 px), qui passe à l'accent au survol ; hauteur minimale 44 px.
- **CRM :** `Bouton` (plein) et `BoutonLeger` (contour `champ-contour`), mêmes pilules à 44 px.

### Chips
- **Style:** pastille (`Pill`) en `mono`, bordure de 1 px, sans fond, retrait 4 × 10 px ; quatre tons — neutre, accent, positif, alerte. La pastille « Exemple » (`SamplePill`) est le ton alerte et accompagne toute donnée fictive. Sur une tuile de montre, la pastille de style perd sa bordure et prend un fond panneau à 80 % flouté.
- **State:** les puces de filtre de la collection (44 px, corps `ui`) sont panneau et filet au repos, bordure encre au survol, aplat d'accent quand elles sont actives (`aria-pressed`).
- **Contrôle segmenté:** le sélecteur face / profil / dos est une capsule bordée de trois options `mono` de même largeur ; l'option active n'est pas repeinte : une seule pastille d'aplat glisse de l'une à l'autre en 350 ms sur la courbe de passage.

### Cards / Containers
- **Corner Style:** 14 px.
- **Background:** la tuile de montre est le fond de studio ; la carte d'option est papier au repos, panneau une fois choisie ; le panneau du CRM est panneau.
- **Shadow Strategy:** aucune (voir Elevation & Depth).
- **Border:** aucune sur les tuiles de montre ; filet de 1 px sur les cartes d'option (accent écrit quand elle est choisie, accent de décor au survol) et sur les panneaux.
- **Internal Padding:** 16 px pour une carte d'option, 28 à 32 px pour un panneau.
- La carte de modèle et le bloc de gamme ne sont pas des cartes : une tuile de studio, puis le nom, l'accroche, les étiquettes `mono` et le prix, posés directement sur la page. Au survol, la montre s'approche (3,5 à 4 %, 900 ms), sans rotation.

### Inputs / Fields
- **Style:** fond panneau, contour de 1 px en `champ-contour` (au moins 3:1 sur tous les fonds), rayon 8 px, hauteur 44 px, corps `ui`.
- **Focus:** la bordure passe à l'accent écrit, avec l'anneau de focus global (bleu sur blanc, bleu clair sur noir). Survol : bordure encre.
- **Error / Disabled:** bordure et message en couleur d'alerte (`aria-invalid`) ; désactivé sur fond alterné, bordure filet, texte doux.
- Les pastilles de couleur du configurateur sont des ronds de 44 px ; la teinte choisie porte un double anneau (fond, puis accent) et son nom est toujours écrit dessous.

### Navigation
En-tête collant de 64 px (80 px dès 768 px) : le nom « CHRONOVA » composé en Jost, interlettré à 0,22 em — aucun fichier logo ; liens en `ui` dont le soulignement se trace de gauche à droite en 350 ms ; lien actif et survol en accent écrit ; boutons d'icône ronds de 44 px (compte, panier avec pastille de quantité en aplat) ; bouton « Composer ma montre » en pilule `sm`. L'entrée « Collection » ouvre un panneau des gammes : un bloc de 256 px, panneau bordé à 14 px, lignes de 44 px à 8 px de rayon ; il s'ouvre au survol, au focus clavier ou par son bouton à chevron, se ferme sur Échap, et le lien reste un lien. Panneau et tiroir mobile sont des volets : ils entrent en fondu glissé en 500 ms et sortent en 350 ms. Sur l'accueil non défilé, l'en-tête est transparent ; défilé, il prend le voile flouté et un filet bas. Il passe en thème nuit chaque fois qu'une section nuit se trouve sous lui. Sous 1024 px : tiroir plein écran, liens en `title-2` séparés par des filets, gammes dépliées d'office, bouton plein en pied. L'en-tête est exclu des transitions de page. Le pied de page est toujours en thème nuit : intertitres en `mono`, liens soulignés au survol, mentions en `caption`.

### Scène nuit et ouverture
Le cyclorama du héros, des pages de gamme et de la clôture, entièrement en tokens : fond `nuit`, halo froid elliptique en `nuit-scene` derrière la montre, lueur de `bleu-clair` très faible au sol, dégradé vertical de `nuit-profonde` à `nuit-alt`. À la première visite de la session, un rideau noir écrit « CHRONOVA » lettre à lettre, trace un filet bleu clair dessous, puis se lève en volet (1,4 s en tout, bouton « Passer » de 44 px) ; le héros entre dessous : la montre tourne de 7°, grandit et se met au point pendant que ses aiguilles balaient jusqu'à leur heure, la couronne graduée tourne, le titre sort ligne à ligne de son masque, chapô, boutons et fiche suivent en cascade. Tout est en CSS, démarre avant l'hydratation, et n'existe pas sans JavaScript ni sous mouvement réduit.

### Défilé des modèles
Dans le héros, toute la collection défile : une montre à la fois, cinq secondes chacune. La sortante recule et glisse de 40 px, l'entrante arrive de l'autre côté, floue au départ seulement (850 ms), la couronne graduée tourne d'un cran de 30°, le nom et la fiche de pied de scène (modèle, boîtier, étanchéité, calibre, prix et pastille « Exemple ») passent en fondu enchaîné sans changer de largeur. Commandes : flèches rondes de 44 px, une barre de progression par modèle, compteur en `mono`, lecture et pause. Jamais plus de deux montres montées ; sans JavaScript la première reste, fixe, avec sa fiche.

### Tuile de montre, galerie et gros plans
La montre est un SVG vectoriel unique (`WatchSvg`, repère 1000 × 1000) ; enveloppée par `InteractiveWatch`, le reflet du saphir suit le pointeur ou l'inclinaison du téléphone. Au survol d'une carte de modèle, la montre s'approche, un reflet traverse le verre et le second coloris apparaît en fondu. Changer de vue (configurateur, zoom, galerie d'une fiche) enchaîne deux prises de studio : la sortante recule et s'éteint, l'entrante se pose depuis 4 px de flou, une bande de lumière traverse la pièce (700 ms). La galerie d'une fiche aligne une grande tuile et quatre vignettes ; le repère de la vignette active est un seul cadre d'accent qui glisse. Les gros plans recadrent le même SVG (propriété `crop`) dans des tuiles carrées en `nuit-profonde` ; ils restent nets parce que le rendu est vectoriel.

### Frise du parcours
Quatre étapes reliées par un filet : un repère rond de 48 px bordé d'accent, chiffre en accent, puis le filet court jusqu'au repère suivant. Ni cartes, ni pictogrammes : la numérotation porte ici une information, l'ordre.

### Accordéons et replis
Les questions de la FAQ sont des `<details>` : la hauteur s'interpole jusqu'à `auto`, le contenu entre en fondu un temps après, le chevron d'accent pivote. Les étapes du configurateur se replient du même geste. Sans les fonctions CSS récentes, l'ouverture est sèche ; elle fonctionne toujours sans JavaScript.

### Emplacements honnêtes
`PhotoPlaceholder` : un fond de studio bordé de pointillés, qui décrit en `mono` la prise de vue attendue. `FillMe` : un bloc en pointillés grenat, « À remplir · … », volontairement visible avant la mise en ligne. Avis : un cadre en pointillés « Avis à venir » tant que la liste des avis publiés est vide.

## Do's and Don'ts

### Do:
- **Do** passer par les tokens sémantiques (`bg`, `bg-alt`, `panel`, `fg`, `fg-soft`, `rule`, `field`, `accent`, `on-accent`, `accent-ink`, `positive`, `alert`) ; ils basculent seuls avec `data-theme="night"`.
- **Do** faire du bleu l'unique accent : aplat `accent` avec texte `on-accent` pour ce qui se presse, `accent-ink` pour ce qui s'écrit — liens, repères, filet, lien actif, bordure de sélection, soulignement du bouton discret.
- **Do** poser chaque montre sur un fond de studio (dégradé radial, 14 px de rayon), sans bordure ni ombre.
- **Do** garder les boutons en pilule, les champs à 8 px, les cartes à 14 px.
- **Do** composer les étiquettes techniques en `mono` : Hanken Grotesk 500, 13 px, capitales, interlettrage 0,14 em.
- **Do** marquer toute donnée fictive de la pastille « Exemple », et toute information manquante d'un bloc `À remplir`.
- **Do** décrire une photo absente par un emplacement en pointillés qui dit quoi photographier.
- **Do** garder un focus visible partout (2 px, décalage 3 px) et des cibles d'au moins 44 px pour les commandes isolées.
- **Do** animer avec les tokens de mouvement : `--ease` pour ce qui entre, `--ease-sortie` et un cran de durée en moins pour ce qui sort, `--ease-passage` pour ce qui se déplace ; un seul repère qui glisse plutôt que deux états repeints.
- **Do** prévoir le rendu sans mouvement : `prefers-reduced-motion` coupe animations, transitions, ouverture, défilé et défilement doux ; le contenu reste complet.
- **Do** vérifier tout nouveau couple texte / fond dans `src/design/tokens.test.ts` (AA, 4,5:1).

### Don't:
- **Don't** placer de surtitre ni de libellé au-dessus d'un titre sur le site public.
- **Don't** cumuler bordure et ombre sur une même surface ; l'ombre est réservée aux éléments flottants.
- **Don't** écrire en bleu clair sur le blanc (2,51:1) ni en bleu profond sur le noir (1,96:1) : chaque fond a son bleu.
- **Don't** introduire un second accent ni une autre teinte que le noir, le blanc et le bleu ; les couleurs appartiennent aux montres.
- **Don't** ajouter d'ornement : ni texture, ni grain, ni illustration, ni pictogramme dans un cercle coloré.
- **Don't** utiliser de rebond ni d'élastique, ni animer autre chose que transform, opacité et flou léger — hauteur d'accordéon exceptée.
- **Don't** inventer une photographie, un avis client ou un chiffre.
- **Don't** descendre sous 13 px.
- **Don't** employer une police à chasse fixe comme décor ; Geist Mono est réservée aux chaînes machine du CRM.
- **Don't** écrire une couleur de palette ou un hexadécimal en dur dans un composant.
- **Don't** reprendre le nom, le logo ou la signature d'une maison existante : les modèles s'inspirent des grandes familles du secteur, rien de plus.
