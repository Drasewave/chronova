# Chronova — Design system « Vitrine »

Référence interne du système visuel tel qu'il est dans le code. Source unique des valeurs : `src/app/globals.css`. Le format portable pour les outils (tokens en frontmatter, règles nommées) est `DESIGN.md` à la racine, avec son annexe `.impeccable/design.json`.

Parti pris : le standard du secteur horloger, sans détour. La montre est photographiée, la page s'efface. Noir, blanc et un bleu profond : des pages blanches où la montre est photographiée, des scènes noires où l'acier brille, et le bleu comme unique accent — profond sur le blanc, clair sur le noir.

## 1. Couleurs

### Palette de marque

Valeurs brutes, déclarées dans `@theme`. Les composants ne les utilisent pas directement : ils passent par les tokens sémantiques plus bas.

| Token | Hex | Usage |
|---|---|---|
| `--color-papier` | `#ffffff` | Fond principal du site clair |
| `--color-papier-alt` | `#f2f3f5` | Sections alternées, petits blocs teintés du CRM, survols de ligne |
| `--color-panneau` | `#ffffff` | Champs, puces, panneaux ; centre du fond de studio clair ; texte du bouton bleu |
| `--color-encre` | `#0a0a0a` | Texte principal |
| `--color-encre-douce` | `#4b5058` | Texte secondaire |
| `--color-filet` | `#dfe1e5` | Filets décoratifs de 1 px |
| `--color-bleu` | `#0b3d91` | L'unique accent sur le blanc : aplat (bouton plein, puce active, barres de graphique) ET accent écrit (liens, repères, filets, focus) |
| `--color-bleu-vif` | `#0a2f70` | Survol de l'aplat sur le blanc |
| `--color-bleu-clair` | `#6fa3ff` | Accent sur le noir, aplat comme texte ; décor seul sur le blanc |
| `--color-bleu-pale` | `#9bbfff` | Survol de l'accent sur le noir |
| `--color-sapin` | `#1e6b4c` | Statuts positifs |
| `--color-sapin-clair` | `#7fd0a8` | Statut positif sur le noir |
| `--color-grenat` | `#a12a3c` | Alerte, erreur, `À remplir`, pastille « Exemple » |
| `--color-grenat-clair` | `#f09aaa` | Alerte sur le noir |
| `--color-nuit` | `#0a0b0d` | Scènes nuit, pied de page, rideau d'ouverture, thème nuit du CRM ; texte posé sur l'aplat bleu clair |
| `--color-nuit-profonde` | `#000000` | Fond des gros plans macro, haut du cyclorama |
| `--color-nuit-scene` | `#1a2942` | Halo des scènes nuit, centre du fond de studio nuit |
| `--color-nuit-alt` | `#0d0f12` | Fond alterné sur le noir |
| `--color-nuit-panneau` | `#15181d` | Panneaux sur le noir |
| `--color-nuit-encre` | `#f2f3f5` | Texte sur le noir |
| `--color-nuit-douce` | `#a0a6b0` | Texte secondaire sur le noir |
| `--color-nuit-filet` | `#262a31` | Filets sur le noir |

Valeurs déclarées hors `@theme`, directement dans les tokens sémantiques : contour de champ `--field` (`#767b83` clair, `#78828e` nuit) et bord du fond de studio clair `--stage-out` (`#e4e6ea`). Les autres arrêts du fond de studio sont des tokens : `panneau` au centre en clair, `nuit-scene` → `nuit` sur le noir.

### Tokens sémantiques

Le thème nuit s'active par `data-theme="night"` sur n'importe quel conteneur : scènes nuit du site (héros, en-tête des pages de gamme, bande macro, clôture, pied de page, en-tête quand une section nuit passe dessous) et thème nuit du CRM. Une variante Tailwind `night:` existe côté markup. Les utilitaires (`bg-bg`, `text-fg-soft`, `border-rule`, `bg-accent`, `text-accent-ink`…) sont générés par `@theme inline` et pointent sur la variable : ils suivent le thème sans recompilation.

| Token | Clair | Nuit |
|---|---|---|
| `--bg` | papier | nuit |
| `--bg-alt` | papier-alt | nuit-alt |
| `--panel` | panneau | nuit-panneau |
| `--fg` | encre | nuit-encre |
| `--fg-soft` | encre-douce | nuit-douce |
| `--rule` | filet | nuit-filet |
| `--field` | `#767b83` | `#78828e` |
| `--accent` (aplat) | bleu | bleu-clair |
| `--accent-hover` | bleu-vif | bleu-pale |
| `--accent-decor` | bleu-clair | bleu |
| `--on-accent` | panneau (blanc) | nuit |
| `--accent-ink` (l'accent qui s'écrit) | bleu | bleu-clair |
| `--positive` | sapin | sapin-clair |
| `--alert` | grenat | grenat-clair |
| `--focus` | bleu | bleu-clair |
| `--stage-in` → `--stage-out` | panneau → `#e4e6ea` | nuit-scene → nuit |
| `--lueur` (lumière d'un reflet) | `--panel` | `--fg` |

Principes :

- Noir, blanc, et le bleu comme unique accent. Le sapin et le grenat ne sont que des statuts ; les couleurs vives appartiennent aux montres.
- `--accent` est un **aplat** : bouton plein, puce de filtre active, pastille du contrôle segmenté, pastille de quantité, barres de graphique — toujours avec un texte `--on-accent` dessus (blanc sur bleu en clair, nuit sur bleu clair en sombre). Dans les composants : `bg-accent` + `text-on-accent`.
- `--accent-ink` est **l'accent qui s'écrit** : liens et survols, repères numérotés, filet d'accent, lien de navigation actif, soulignement du bouton discret, bordure de l'option choisie et du champ en focus, cadre de la vignette active, puces de liste, curseur de saisie. Dans les composants : `text-accent-ink`, `border-accent-ink`. Sur le blanc, aplat et accent écrit sont le même bleu ; sur le noir, le même bleu clair. La sélection de texte est blanc sur bleu.
- `--rule` est réservé aux séparateurs décoratifs. Un champ de saisie se délimite avec `--field`, qui tient 3:1 sur tous les fonds (WCAG 1.4.11).

### Règles de contraste vérifiées

Ratios calculés (WCAG 2.1) à partir des hex de `globals.css`. Les couples marqués « testé » sont garantis par `src/design/tokens.test.ts`, qui lit les valeurs dans la feuille de style : un changement de teinte qui descend sous le seuil fait échouer `npm run test`. Seuil texte : 4,5:1 (11:1 exigé pour l'encre sur son fond principal) ; seuil d'un aplat contre son fond : 3:1.

| Couple | Ratio | Verdict |
|---|---|---|
| `encre` sur `papier` / `papier-alt` | 19,80:1 / 17,83:1 | ✅ testé |
| `encre-douce` sur `papier` / `papier-alt` | 8,12:1 / 7,31:1 | ✅ testé |
| `bleu` sur `papier` / `papier-alt` (texte, et aplat contre la page) | 10,04:1 / 9,05:1 | ✅ testé (4,5:1 et 3:1) |
| `bleu-vif` sur `papier` / `papier-alt` | 12,70:1 / 11,44:1 | ✅ testé |
| `sapin` sur `papier` / `papier-alt` | 6,44:1 / 5,80:1 | ✅ testé |
| `grenat` sur `papier` / `papier-alt` | 7,21:1 / 6,50:1 | ✅ testé |
| `panneau` sur `bleu` / `bleu-vif` (bouton plein, repos / survol) | 10,04:1 / 12,70:1 | ✅ testé |
| `bleu-clair` sur `papier` | **2,51:1** | ❌ testé < 4,5 : réservé au noir, décor seul sur le blanc |
| `nuit-encre` sur `nuit` / `nuit-panneau` | 17,73:1 / 16,03:1 | ✅ testé |
| `nuit-douce` sur `nuit` / `nuit-panneau` | 8,04:1 / 7,27:1 | ✅ testé |
| `bleu-clair` sur `nuit` / `nuit-panneau` | 7,84:1 / 7,08:1 | ✅ testé |
| `bleu-pale` sur `nuit` / `nuit-panneau` | 10,59:1 / 9,57:1 | ✅ testé |
| `sapin-clair` sur `nuit` / `nuit-panneau` | 10,77:1 / 9,74:1 | ✅ testé |
| `grenat-clair` sur `nuit` / `nuit-panneau` | 9,29:1 / 8,39:1 | ✅ testé |
| `nuit` sur `bleu-clair` (bouton plein nuit) | 7,84:1 | ✅ testé |
| `bleu` sur `nuit` | **1,96:1** | ❌ testé < 3 → sur le noir l'accent passe à `bleu-clair` |
| `sapin` sur `nuit` | **3,06:1** | ❌ testé < 4,5 → `sapin-clair` |

Couples calculés mais non couverts par la suite de tests :

| Couple | Ratio | Remarque |
|---|---|---|
| `encre` / `encre-douce` / `bleu` sur `--stage-out` clair (`#e4e6ea`) | 15,84:1 / 6,49:1 / 8,04:1 | ✅ bord le plus dense d'une tuile de montre |
| `nuit` sur `bleu-pale` (bouton plein nuit au survol) | 10,59:1 | ✅ |
| `nuit-encre` / `nuit-douce` sur `nuit-alt` | 17,29:1 / 7,84:1 | ✅ |
| `nuit-encre` / `nuit-douce` / `bleu-clair` sur `nuit-scene` (`--stage-in` nuit) | 13,14:1 / 5,96:1 / 5,81:1 | ✅ |
| `nuit-encre` / `nuit-douce` / `bleu-clair` sur `nuit-profonde` | 18,91:1 / 8,58:1 / 8,36:1 | ✅ fond des gros plans |
| `--field` clair sur `papier` / `papier-alt` | 4,26:1 / 3,84:1 | ✅ contour de champ ≥ 3:1 |
| `--field` nuit sur `nuit` / `nuit-panneau` | 5,05:1 / 4,56:1 | ✅ contour de champ ≥ 3:1 |
| `filet` sur `papier` | 1,31:1 | décor : séparateur, jamais un contour porteur de sens |
| `nuit-filet` sur `nuit` | 1,37:1 | décor |

**Conséquence** : chaque fond a son bleu. `bleu` est à la fois l'aplat et l'accent écrit sur le blanc ; il disparaît sur le noir, où `bleu-clair` tient les deux rôles — et `bleu-clair` est interdit en texte sur le blanc. Les tokens sémantiques (`--accent`, `--accent-hover`, `--on-accent`, `--accent-ink`, `--positive`, `--alert`, `--focus`) basculent avec le thème ; les composants n'utilisent pas de couleur brute.

```css
:root {
  --accent: var(--color-bleu);        --accent-hover: var(--color-bleu-vif);
  --on-accent: var(--color-panneau);  --accent-ink: var(--color-bleu);
  --positive: var(--color-sapin);     --alert: var(--color-grenat);
  --focus: var(--color-bleu);
}
[data-theme="night"] {
  --accent: var(--color-bleu-clair);  --accent-hover: var(--color-bleu-pale);
  --on-accent: var(--color-nuit);     --accent-ink: var(--color-bleu-clair);
  --positive: var(--color-sapin-clair); --alert: var(--color-grenat-clair);
  --focus: var(--color-bleu-clair);
}
```

## 2. Typographie

Trois familles chargées via `next/font/google` (`display: swap`, sous-ensemble latin) dans `src/app/layout.tsx`, exposées en `--font-title`, `--font-ui`, `--font-mono` :

- **Jost** (variable) — titrage. Le géométrique des cadrans : léger et grand en vitrine, plus ferme dans les intertitres. Replis : Futura, Century Gothic, Helvetica Neue, Arial.
- **Hanken Grotesk** — tout ce qui se lit et se manipule, étiquettes comprises. Replis : Helvetica Neue, Helvetica, Arial.
- **Geist Mono** — réservée aux vraies chaînes machine du CRM (identifiants, clés, journaux), via la constante `CODE` de `src/components/atelier/gabarit.tsx`. Elle n'a aucun rôle décoratif.

| Rôle (classe `type-*`) | Police | Taille | Interligne | Interlettrage |
|---|---|---|---|---|
| `display-1` (héros, pages de gamme, clôture) | Jost 300 | `clamp(2.25rem, 4.6vw, 4rem)` | 1,05 | −0,025em |
| `display-2` (titres de section et de page) | Jost 300 | `clamp(1.75rem, 3vw, 2.5rem)` | 1,12 | −0,02em |
| `title-1` | Jost 400 | 1,5rem (24 px) | 1,20 | −0,012em |
| `title-2` | Jost 500 | 1,1875rem (19 px) | 1,30 | −0,005em |
| `lead` (chapô) | Hanken Grotesk 400 | `clamp(1.0625rem, 0.98rem + 0.3vw, 1.1875rem)` | 1,55 | 0 |
| `body` | Hanken Grotesk 400 | 1rem (16 px) | 1,60 | 0 |
| `body-lg` (éditorial) | Hanken Grotesk 400 | 1,0625rem (17 px) | 1,65 | 0 |
| `ui` (boutons, champs, navigation) | Hanken Grotesk 500 | 0,9375rem (15 px) | 1,40 | 0 |
| `caption` | Hanken Grotesk 400 | 0,8125rem (13 px) | 1,45 | 0 |
| `mono` (étiquette technique) | Hanken Grotesk 500 | 0,8125rem (13 px) | 1,40 | +0,14em, capitales, chiffres tabulaires |

Règles :

- 13 px est le plancher absolu. Quand la place manque, le conteneur grandit (la pastille de quantité du panier, par exemple), le texte ne rétrécit pas.
- `.type-mono` n'est plus une police à chasse fixe : ce sont des petites capitales espacées en Hanken Grotesk, comme une gravure de fond de boîte. Elle sert aux références techniques — calibre, diamètre, étanchéité, référence, numéro de commande, légendes de la vue éclatée — aux pastilles, au fil d'Ariane des pages de gamme et aux intertitres du pied de page.
- Pas de surtitre (kicker) au-dessus des titres sur le site public : le titre ouvre la section, le chapô suit. `SectionHeader` ne propose que `titre`, `intro` et `action`.
- Titres `h1`–`h4` en Jost 400 par défaut, `text-wrap: balance`.
- Mesure de lecture : 68 caractères (`--measure`, classe `.measure`). Contenu long (pages légales, garantie) : `.prose-atelier`, 17 px, interligne 1,7, liens soulignés d'accent, puces en accent.
- Chiffres tabulaires et alignés (`tabular-nums lining-nums`) dans les tableaux et sur tout élément `[data-numeric]` : prix, quantités, mesures.
- Proportions resserrées : l'échelle culmine à 4 rem. Corps de page : 16 px, interligne 1,6, `font-synthesis-weight: none`.

## 3. Espacements, grille, formes

Pas d'échelle d'espacement propre : les espacements courants sont ceux de Tailwind (pas de 4 px). Les tokens du projet portent sur le cadre.

- Gouttière : `--gutter: clamp(20px, 4vw, 48px)` — jamais moins de 20 px sur les bords. Elle est posée une seule fois, par `Section` (ou par la bande elle-même) ; aucun composant enfant ne gère ses marges de bord d'écran.
- Rythme vertical des sections : `--section-y: clamp(56px, 6.5vw, 104px)` ; variante `compact` : `clamp(40px, 5vw, 72px)`.
- Conteneurs : `--container-prose: 68ch`, `--container-wide: 84rem` (1344 px). Tout le site public — en-tête, héros, `Section`, vue éclatée, bande macro, clôture, pied de page — s'aligne sur `max-w-wide`.
- Grilles : définies section par section en utilitaires Tailwind. Modèles (accueil, gamme, « Tous les modèles ») : 1 → 2 colonnes (640 px) → 3 (1024 px) → 4 (1280 px). Vue d'ensemble de la collection : grille à six colonnes dès 1024 px, rangées toujours pleines (blocs de gamme en demi ou en tiers). Galerie de fiche : colonne de vignettes de 5,5 rem et grande tuile dès 1024 px, quatre vignettes en rangée en dessous. Frise du parcours : 1 → 2 (768 px) → 4 (1280 px). Gros plans macro : 3 colonnes dès 768 px. Héros : deux colonnes dès 1024 px, la montre sur deux rangées à droite, sans `order` (l'ordre du DOM reste l'ordre de lecture).
- Rayons : `--radius-field: 8px` (champs, petits blocs), `--radius-card: 14px` (tuiles de montre, cartes d'option, panneaux, boîte de zoom), `--radius-pill: 999px` (boutons, puces, pastilles, sélecteur de vue, boutons d'icône, repères). Anneau de focus : 4 px.
- Séparation : filet de 1 px `--rule` (`Rule`, `hr`). **Une bordure ou une ombre, jamais les deux.**
- Ombres : deux seulement, teintées nuit, réservées aux éléments flottants. `--shadow-lift: 0 18px 48px -20px rgb(11 17 24 / 0.38)` (tiroir du panier, palette de recherche du CRM en thème clair — en thème nuit elle échange son ombre contre un filet) ; `--shadow-sheet: 0 -12px 40px -18px rgb(11 17 24 / 0.36)` (barre de total collée en bas du configurateur mobile).
- Aucune texture de surface, aucun grain.
- Mise en scène des montres : `.cadre-montre` est un fond de studio — dégradé radial `--stage-in` → `--stage-out` (ellipse 78 % × 70 % centrée à 50 % / 42 %), rayon 14 px, **sans bordure ni ombre**. `.scene-nuit` est le cyclorama du héros, de l'en-tête des pages de gamme et de la clôture, entièrement en tokens : fond `nuit`, halo froid elliptique en `nuit-scene` derrière la montre, lueur de `bleu-clair` très faible au sol, dégradé vertical de `nuit-profonde` à `nuit-alt` ; sous 1024 px le halo se recentre. Les gros plans macro sont posés sur `nuit-profonde`. Derrière la montre du héros, une couronne graduée de soixante traits en accent, qui tourne d'un cran de 30° à chaque modèle du défilé.
- Filet d'accent (classe `.filet-accent`, nom hérité) : trait de 1 px en `--accent-ink`, fondu aux deux extrémités, opacité 0,55. Le seul ornement du site.
- Pointillés : réservés à ce qui manque (emplacement photo, avis à venir, `À remplir`).
- En-tête collant : transparent sur le héros de l'accueil ; il prend le thème nuit chaque fois qu'une section nuit passe sous lui (pour ne pas couper la page en deux palettes) ; une fois la page défilée (12 px), voile translucide flouté (`.entete-voile` : fond à 82 %, `saturate(1.6) blur(18px)`) et filet bas.
- Focus : `outline: 2px solid var(--focus); outline-offset: 3px; border-radius: 4px` — bleu sur le blanc, bleu clair sur le noir, jamais supprimé. Lien d'évitement `.skip-link` en premier élément focusable.
- Cibles : 44 px au moins pour les commandes isolées (`.lien-atelier`, boutons d'icône, puces, boutons du CRM). Bouton `md` : 44 px (retrait 10 × 24 px) ; `sm` : 40 px.
- Ancres : `scroll-margin-top: 6rem` pour ne pas passer sous l'en-tête.
- Zones à défilement horizontal du CRM (`.defilement-atelier`) : barre fine toujours visible, pouce en accent sur piste filet.

## 4. Points de rupture

Points de rupture Tailwind par défaut — `640` (`sm`) · `768` (`md`, tablette, CRM à l'établi) · `1024` (`lg`, navigation principale visible, héros en deux colonnes) · `1280` (`xl`) · `1536` (`2xl`) — plus un point propre au projet : `--breakpoint-3xl: 90rem` (1440 px), la référence large.

Conception mobile d'abord. En dessous de 1024 px, la navigation passe dans un tiroir plein écran où les gammes sont dépliées d'office sous « Collection ». Sur téléphone, la montre du configurateur est bornée en hauteur (27 vh) pour laisser la place aux options.

## 5. Iconographie

Jeu dessiné sur mesure dans `src/components/ui/icons.tsx` : grille 24 px, affichage 20 px par défaut, trait 1,5 px, extrémités droites (`square` / `miter`), `currentColor`, aucun remplissage, `aria-hidden`. Onze pictos existent : `IconFleche`, `IconChevron`, `IconCroix`, `IconMenu`, `IconZoom`, `IconPanier`, `IconCompte`, `IconEtancheite`, `IconMouvement`, `IconTournevis`, `IconColis`.

Aucun picto dans un cercle coloré, aucun emoji, aucune icône multicolore. La frise du parcours n'emploie aucun pictogramme : seul le numéro d'ordre la ponctue.

## 6. Inventaire des composants

Seuls les composants présents dans `src/components` et `src/watch` sont listés.

**Primitives** (`ui/`) — `Button` et `ButtonLink` (variantes `primaire` / `contour` / `discret`, tailles `md` 44 px / `sm` 40 px, toujours en pilule, appui à l'échelle 0,98), `Pill` (tons `neutre` / `accent` / `positif` / `alerte`, en `type-mono`), `SamplePill` (pastille « Exemple », ton alerte, sur toute donnée fictive), `Section` (fonds `papier` / `alterne` / `nuit`, option `compact`), `SectionHeader` (titre, chapô, action — pas de surtitre), `Rule`, `PhotoPlaceholder` (fond de studio en pointillés qui décrit la photo attendue), `FillMe` (bloc grenat en pointillés « À remplir · … »), `LegalPage` (gabarit des pages longues, date de mise à jour obligatoire), icônes.

**Mise en page** (`layout/`) — `Header` (collant, suit le thème de la section qui passe dessous, entrée « Collection » à panneau déroulant des gammes — survol, focus, bouton à chevron, Échap —, tiroir mobile en `.volet`, exclu des transitions de page), `Footer` (toujours en thème nuit, identité légale commune aux mentions), `Wordmark` (« CHRONOVA » en Jost interlettré à 0,22em, aucun fichier logo), `SmoothScroll` (Lenis, site public seulement).

**Accueil** (`home/`) — `Hero` (scène nuit, composant serveur ; titre en quatre lignes dont une en accent), `DefileModeles` avec `DefileScene`, `DefileFiche` et `LienComposerModele` (carrousel du héros : toute la collection défile, cinq secondes par modèle, flèches, barres de progression, compteur, pause ; fiche de la pièce et prix en pied de scène ; jamais plus de deux montres montées), `ExplodedView` (vue éclatée en sept plans au défilement, servie dépliée sans JavaScript), `MacroBand` (trois gros plans recadrés du même SVG), `ModelsSection` et `ModelCard` (tuile de studio, second coloris au survol, élément partagé vers la fiche), `Process` (frise en quatre temps, repères bordés d'accent), `Watchmaker` (emplacements photo et blocs `À remplir`), `Testimonials` (emplacement « Avis à venir » tant qu'aucun avis réel n'existe), `FaqSection` (accordéon `<details class="accordeon">`), `ClosingCta` (seconde scène nuit, montre à demi hors champ).

**Collection et configurateur** — pages `/collection` (vue d'ensemble : un `BlocGamme` par gamme, puis « Tous les modèles » filtrables), `/gammes/[style]` (en-tête en scène nuit avec fil d'Ariane, repères et premier prix, grille des modèles, `RappelComposer`, autres gammes en `BlocGamme` compact) et fiche modèle (`GalerieModele` : grande vue et quatre vignettes — face, profil, dos, cadran — reliées par `FonduStudio`, repère de vignette qui glisse ; fiche technique ; `RappelComposer`). `CollectionBrowser` (puces de filtre en pilule, `aria-pressed`, filtres recopiés dans l'adresse), `Configurator`, `StepSection` (étape repliable, `.repli`), `OptionGrid` (radios natifs : cartes d'option de 14 px bordées, pastilles de couleur rondes de 44 px avec double anneau et nom de teinte toujours écrit), `WatchStage` (tuile de studio, vues reliées par `VueMontre`, contrôle segmenté face / profil / dos à pastille glissante, zoom en `<dialog class="dialogue-anime">`).

**Panier et compte** — `CartDrawer` (`<dialog>` latéral en `.dialogue-anime`, miniature de la configuration réelle), `PanierComplet`, `BoutonPaiement`, `ViderPanier`, `CompteNav`, `OrderTimeline` (frise d'assemblage verticale), `FormulaireConnexion`, `FormulaireProfil`, `FormulaireAdresse`, `SuppressionCompte`, `FormulaireDemande` (contact et sur-mesure).

**Montre** (`src/watch`) — `WatchSvg` (moteur SVG, vues face / profil / dos, niveaux `full` / `compact`, prop `crop`), `InteractiveWatch` (reflet du saphir piloté par le pointeur ou l'inclinaison).

**Mouvement et ouverture** — `Reveal` (apparition au défilement), `FonduStudio` et `VueMontre` (`motion/vue-montre.tsx`, fondu de studio entre deux vues), `IntroCurtain` (rideau d'ouverture) et son script d'amorçage `INTRO_BOOT`, `src/app/(site)/template.tsx` (transition de page).

**CRM** (`atelier/`) — `CrmShell`, `BasculeTheme` (clair / nuit, deux boutons), `RechercheGlobale` (palette `Cmd/Ctrl + K` en `<dialog>`), gabarit (`TitrePage`, `FilAriane`, `Filtres`, `Filtre`, `Tableau`, `Th`, `Td`, `EtatVide`, constantes `SURFACE`, `BLOC`, `CODE`, `CHIFFRE_FORT`, `LIGNE_LISTE`, `LIGNE_TABLEAU`), formulaire (`Champ`, `Saisie`, `Liste`, `Zone`, `Bouton`, `BoutonLeger`, constantes `SAISIE`, `CASE`), graphiques (`BarresHorizontales`, `HistogrammeMois`, `Synthese`, `Panneau` — une série, une couleur : l'aplat `--accent`), `TableauDefilant`, `EditeurOption` (aperçu de la teinte sur la montre), `BandeauExemple`, `MarquerLu`. Une surface du CRM porte une bordure, jamais une ombre en plus ; les cibles font 44 px.

Champs de saisie (`SAISIE`) : fond `--panel`, contour `--field` de 1 px, rayon 8 px, hauteur 44 px, corps `ui` ; survol en bordure encre, focus en bordure d'accent (`border-accent-ink`), erreur (`aria-invalid`) en bordure d'alerte, désactivé sur fond alterné.

## 7. Moteur de rendu de la montre

Un seul SVG inline, `viewBox="0 0 1000 1000"`, montre centrée en (500, 500), jamais démonté : `WatchSvg` est un composant sans état ni effet, rendu côté serveur (cartes, e-mails, CRM) comme côté client (configurateur). Changer une option ne modifie que des attributs. Tous les identifiants internes sont préfixés par la prop `id`, pour que plusieurs montres cohabitent sur une page. `detail="compact"` allège la trame (moins de secteurs, de crans, de cannelures) pour les cartes et miniatures. L'heure figée est 10 h 10 min 32 s.

**Gros plans.** La prop `crop` (« x y largeur hauteur » dans le repère 1000 × 1000) remplace le `viewBox` et passe en `preserveAspectRatio="xMidYMid slice"` : le rendu étant vectoriel, un index ou la couronne agrandis restent nets. C'est la photographie macro du site (`MacroBand`, fiche modèle).

**Cadrage.** `FRAME_SCALE` (0,9) en face et de dos : la tête de montre n'occupe pas tout le cadre, on voit la pièce de bout et les premiers maillons. `SIZE_SCALE` : un boîtier de 37 à 41 mm est un 40 mis à l'échelle (0,915 à 1,028). `dialScale(bezelStyle)` : une lunette à insert est large, son ouverture se resserre — cadran, index, aiguilles et verre sont réduits d'un bloc autour du centre (0,9 pour `plongee` et `gmt`, 0,93 pour `tachymetre`, 1 sinon) ; le profil en tient compte.

### Matières (`palette.ts`)

Les métaux ne sont pas des couleurs d'interface mais des matières photographiées en studio, à dynamique large. `METALS` définit quatre tons — `acier`, `dore`, `noir`, `bleui` — chacun en cinq paliers : `hi` (éclat spéculaire de la boîte à lumière), `light` (arête la plus éclairée), `mid`, `dark` (creux), `edge` (filet de contour, reflet du fond noir du studio). `rampAt(ramp, t)` renvoie la couleur d'un métal pour une luminance reçue de 0 à 1, en interpolant entre les cinq paliers plutôt qu'en mélangeant deux teintes. `INK` (`#0E1013`) et `PAPER` (`#F6F8FA`) sont l'ombre et la lumière neutres du rendu ; `shade` / `tint` mélangent vers l'un ou l'autre ; `glow` éclaircit sans délaver (canaux multipliés) pour qu'un bleu soleillé reste bleu dans ses rayons clairs. Luminova au repos : `LUME_FILL` `#E4E9D2`, `LUME_EDGE` `#A4AB8C`. `isLight` décide si un cadran reçoit des impressions sombres ou claires ; `contrastRatio` sert aussi aux tests de tokens.

### Reflets angulaires (`parts/conic.tsx`)

Un métal poli renvoie le studio ; autour d'une pièce circulaire, cela se lit comme une suite de secteurs clairs et sombres. SVG n'ayant pas de dégradé conique, il est construit en éventail : `ConicDisk` dessine un disque de secteurs fins (60 à 240, avec un léger recouvrement contre l'anticrénelage), défini une fois dans `<defs>`, puis repris par `<use>` sous un masque annulaire (`Ring`, `clipPath` en `evenodd`) pour chaque bague — carrure, chanfreins, lunette, insert, réhaut. Une pente tournée vers l'intérieur reprend l'éventail tourné de 180° : elle reflète le côté opposé.

`studioLum(angle, sheen)` donne la luminance reçue par une facette dont la normale pointe vers `angle` (0° = midi, sens horaire). Le studio compte quatre boîtes à lumière : boîte principale en haut à gauche (318°), bande de débouchage en bas à droite (138°), liseré en haut à droite (48°), rappel en bas à gauche (226°). Quatre finitions : `poli` (transitions dures, jamais noir), `brosse` (étalé, avec un grain de stries par `jitter`), `mat` (écrasé, pour le microbillé et l'aluminium), `ceramique` (très contrasté). `jitter(i)` est un bruit entier déterministe, identique sur le serveur et dans le navigateur.

`defs.tsx` regroupe les éventails (carrure selon sa finition, poli, insert, demi-insert de jour, soleillage du cadran), les dégradés (cornes, cylindre poli des petites pièces, cadran, vignette et ombre du réhaut, nappe d'émail, reflet et voile antireflet du saphir, point chaud, ombres au sol), les motifs de brossage droit et de microbillage, et les filtres d'ombre.

### Empilement en vue de face

Ordre réel de dessin dans `watch-svg.tsx`, du fond vers l'avant :

```
ombre au sol (nappe + occlusion de contact) · bracelet · couronne(s) ·
poussoirs (VK64) · boîtier (cornes + carrure ronde, ou corps coussin) ·
épaulements de couronne · lunette (+ insert, chanfrein intérieur) ·
cadran (fond, soleillage / soleil profond / émail, vignette, réhaut poli ou
imprimé, minuterie, échelle 24 h / cœur ouvert / compteurs, guichet, signature,
étanchéité) · index (ombre de contact) · aiguilles (GMT, heures, minutes,
trotteuse, canon) · verre (antireflet, chant, point chaud, loupe, reflet mobile)
```

La couronne et les poussoirs sont dessinés avant le boîtier pour que leur pied disparaisse sous le flanc. `flankLayout` (dans `watch-svg.tsx`) décide de ce qui garnit le flanc : position de la couronne, seconde couronne, épaulements. `types.ts` exporte `FACE_LAYERS`, la liste des calques qui sert de clés au registre.

- **Boîtier et cornes** (`case.tsx`). Les cornes prolongent la carrure (flanc extérieur tangent, flancs intérieurs parallèles) et sont placées par symétrie de coordonnées, sans `rotate` ni `scale(-1)`, pour ne pas retourner la lumière. Chaque corne porte un plat (brossé, microbillé ou poli), un chanfrein poli fermé en vraie facette, une arête vive et une ombre de tombée vers le poignet. La lunette porte son ombre sur le plat de carrure. `caseShape: "coussin"` (`cushion.tsx`) remplace cylindre et cornes par un galet large dont les flancs bombés descendent d'un seul geste jusqu'à des cornes très courtes : grand plat supérieur brossé en rayons, ceinturé d'un large chanfrein poli qui dessine la silhouette ; décrit dans un quadrant puis reporté par symétrie, jamais par `scale(-1)` ; les éventails de reflets sont agrandis pour couvrir les cornes, l'ombre au sol s'élargit.
- **Lunette** (`bezel.tsx`). Cinq styles : `lisse` (suit la finition du boîtier, miroir annulaire en poli, galbée), `cannelee` (72 dents — 48 en compact — à deux facettes, chacune colorée selon la direction qu'elle regarde), `plongee` (pourtour de 120 crans, insert gravé 60 minutes avec minuterie détaillée sur le premier quart d'heure, chiffres qui suivent la courbure, triangle de midi et perle luminescente sertie), `gmt` (échelle 24 heures, heures paires chiffrées, et demi-insert de jour bicolore de 6 h à 18 h via `insertColor2`), `tachymetre` (fixe, sans crantage, insert noir gravé d'une échelle de vitesse hyperbolique de 60 à 500, serrée vers 500, large vers 60). Sur une lunette de plongée, `insertColor2` teinte le secteur des vingt premières minutes. Les gravures remplies portent une ombre du côté de la lumière (pas en vignette). Insert en céramique (reflets durs) ou aluminium (mat). Le chanfrein intérieur poli retombe vers le verre.
- **Cadran** (`dial.tsx`). Quatre textures : `soleille` (éventail conique en papillon — deux secteurs clairs dans l'axe de la boîte à lumière, deux sombres en travers — avec grain), `emaille` (nappe de lumière), `mat`, `soleil-profond` (soleillage très contrasté, fumé vers le bord, gaufré en rayons). Réhaut poli en pente, qui reflète le côté opposé et porte son ombre sur le pourtour. Le réhaut peut aussi être imprimé : avec les index `plongee`, la minuterie quitte le cadran pour la bague inclinée ; avec `innerRing: "boussole"`, la bague porte les points cardinaux, la minuterie est repoussée vers le centre et une seconde couronne, plus menue, apparaît (à 4 h, ou à 2 h si la couronne principale est déjà à 4 h ; jamais sur NH34 ni VK64). Guichet encadré : cadre appliqué poli, disque en retrait, ombre du cadre ; `dateWindow` choisit le quantième seul (`date`) ou le jour et le quantième (`jour-date`). Selon le calibre : échelle 24 h (NH34), cœur ouvert (NH38), deux compteurs décoratifs (VK64). Signature « CHRONOVA » en Jost, ligne technique en Hanken Grotesk ; quand `waterResistM` est fourni — l'étanchéité réelle de la fiche, jamais une valeur inventée par le dessin — elle s'imprime sous « AUTOMATIQUE » à la place de la ligne de calibre, et se grave au dos.
- **Index** (`indices.tsx`). `batons` : blocs de métal biseautés sur quatre côtés, chaque biseau coloré selon ce qu'il regarde, luminova dans la cuvette, double bâton à midi. `arabes` : chiffres en Hanken Grotesk 600 avec un plot luminescent serti à chaque heure. `plongee` : trois formes pour s'orienter dans le noir — un trapèze à midi, de longs ovales à 6 h et 9 h (et à 3 h sans guichet), de gros ronds ailleurs, des plots généreux presque jointifs avec la minuterie, sertissage éclairé d'un côté et ombré de l'autre. `montagne` : heures paires en chiffres appliqués, impaires en index en pointe tournés vers le centre, tout en métal poli, la luminescence réduite à un point au pied de chaque heure. `terrain-24h` : douze gros chiffres luminescents doublés, en petit, d'une échelle 13–24 imprimée, et un bâtonnet luminescent à chaque heure. Les index suivent le métal du boîtier, sauf `indexMetal` qui leur en donne un autre ; ils reçoivent une ombre de contact.
- **Aiguilles** (`hands.tsx`). Formes `glaive`, `mercedes` (cercle sur l'aiguille des heures seulement), `crayon`, `fleche` (heure en flèche courte, minute en glaive large : le jeu des plongeuses), `dauphine` (deux facettes polies, large à la base : montre habillée), `cathedrale` (longues, fines, ajourées à segments lumineux : montre de montagne), plus trotteuse à contrepoids et flèche GMT. `accentHandColor` laque l'aiguille de fonction — l'aiguille 24 h d'un GMT, la trotteuse centrale d'un chronographe ; absente, elle suit le métal des autres. Chaque aiguille est pliée en deux facettes le long de son axe : un dégradé à rupture franche dont les deux couleurs dépendent de l'angle réel de l'aiguille dans le studio. Les ombres portées sont appliquées hors rotation, donc toutes du même côté, et s'allongent avec la hauteur sur le canon (heures et GMT en bas, minutes et trotteuse plus haut).
- **Verre** (`crystal.tsx`). Un saphir ne voile pas le cadran : il se trahit par son chant (un arc vif face à la boîte principale, un arc faible à l'opposé), un point chaud fixe et le reflet d'une boîte à lumière — un simple dégradé translaté (±120 px), sans filtre. Saphir bombé : liseré de courbure sur le pourtour. Verre `box` : très saillant, à flancs droits et dessus bombé ; ses flancs font prisme sur tout le pourtour du cadran, et il change franchement la silhouette de profil. `cyclops` : une loupe de quantième collée sur le verre à 3 h — le chiffre est redessiné agrandi dessous, avec un contour, un reflet en croissant du côté de la lumière et une ombre portée sur le cadran. Antireflet : voile bleu-violet au bord, reflets atténués.
- **Couronne et poussoirs** (`crown.tsx`, `pushers.tsx`). Cylindre couché : cannelures serrées vers les bords, larges au sommet ; couronne `signee`, `lisse` ou `oignon` (plus grosse, bombée comme un bulbe, cannelures qui suivent le galbe, cabochon poli : la couronne des habillées). `crownAt` la place à 3 h ou à 4 h : dessinée à 3 h puis tournée de 30° par heure, avec un recul le long du rayon quand le flanc est plus loin du centre (coussin) ; de dos, un miroir horizontal la passe à gauche sans inverser le haut et le bas de son éclairage. Épaulements de couronne, venus de matière avec le flanc : sur toute carrure ronde à lunette de plongée ou à couronne à 4 h, hors chronographe ; un coussin enveloppe déjà sa couronne.
- **Bracelet** (`strap.tsx`). Dessiné en distance au centre et non par rotation, pour que les deux brins gardent la lumière du haut-gauche. Acier trois maillons ou jubilé (pièce de bout qui affleure les cornes), cuir et caoutchouc (brin roulé autour de la barrette), `cuir-glace` (veau glacé des habillées : pas de grain, rembordé net, fine surpiqûre ton sur ton, long reflet de boîte à lumière sur le bombé du brin), NATO (ruban qui passe sous la carrure). Les brins s'affinent puis sortent du cadre.

**Vue de profil** (`profile.tsx`), prise côté couronne : épaisseur de la carrure (cylindre debout, lumière de gauche à droite), galbe du verre — plat ou bombé change réellement la silhouette —, courbe des cornes, couronne vue de bout, bracelet par la tranche. Pas d'ombre au sol : la montre est au poignet.

**Vue de dos** (`back.tsx`) : la montre est retournée — couronne(s) et poussoirs passent à gauche ; fond plein vissé à six encoches, gravure en aperçu direct et mention d'étanchéité tirée de `waterResistM`, ou fond transparent laissant voir le mouvement, dessiné selon le calibre (NH35 / NH34 / NH38 : ponts côtelés, balancier, masse oscillante ; VK64 méca-quartz : pile, bobine, pont de chronographe).

**Frontière code / base** : la *géométrie* vit dans le code (`src/watch/parts/*.tsx`, registre typé `PART_REGISTRY` dans `registry.ts`, que le CRM propose en menu déroulant). L'*apparence* vit dans la base : une option porte `svgPartKey` + `colorHex` + `renderMeta`, résolus en `WatchRender` (`types.ts`). Le registre range aussi sous leur calque les choix qui ne sont pas des formes : carrure `rond` / `coussin` sous `boitier`, réhaut `aucun` / `boussole` sous `minuterie`, `date` / `jour-date` sous `guichet-date`, `loupe` sous `verre`, position `3` / `4` sous `couronne`. Le moteur ne connaît ni Prisma, ni les prix, ni le stock. Ajouter un coloris de cadran, d'insert ou de cuir, en changer le prix, le nom, le stock ou la disponibilité se fait entièrement depuis le CRM ; dessiner une forme d'aiguille inédite demande une nouvelle pièce dans le registre, donc du code.

**Reflet interactif** (`interactive-watch.tsx`) : le décalage du reflet est piloté par `pointermove` (ou `deviceorientation` sur mobile), lissé en `requestAnimationFrame`, non monté sous `prefers-reduced-motion`.

## 8. Mouvement

```
--ease / --ease-atelier: cubic-bezier(0.16, 1, 0.3, 1);   ce qui ENTRE ou se pose
--ease-sortie:           cubic-bezier(0.5, 0, 0.9, 0.4);   ce qui SORT
--ease-passage:          cubic-bezier(0.6, 0, 0.2, 1);     ce qui va d'un point à un autre
--d-press: 120ms;  --d-fast: 240ms;  --d-base: 350ms;  --d-slow: 500ms;
--d-reveal: 700ms; --d-long: 900ms;  --d-decalage: 90ms;
```

Une seule famille de courbes, sans rebond ni élastique. Une sortie dure un cran de moins que l'entrée correspondante. Aucune durée en dur dans les composants (`duration-(--d-base)`), uniquement des propriétés composables (transform, opacity, filter léger) — hauteur d'accordéon exceptée. Tout est transition CSS ou Web Animations reprise depuis l'état courant : un clic en cours de route ne fait jamais sauter quoi que ce soit.

- Vues de la montre (`FonduStudio` / `VueMontre`, configurateur, zoom et galerie de fiche) : fondu enchaîné de studio en `--d-reveal`. La sortante recule (1 → 0,97) et s'éteint, l'entrante se pose (1,03 → 1, flou 4 px → 0) avec 16 % de retard, une bande de lumière (`.passage-lumiere`, `--lueur` à 14 %) traverse le cadre. Deux couches seulement pendant le croisement, empilées dans une cellule de grille : hauteur du cadre constante. Les rendus portent un `id` par vue.
- Contrôle segmenté (`.segmente`) et repère de vignette (`.rail-repere`) : UN élément qui glisse, `--d-base` sur `--ease-passage`, position déduite du rang (`--i`, `--n`), sans mesure.
- Accordéons `<details class="accordeon">` : hauteur interpolée jusqu'à `auto` (`interpolate-size` + `::details-content`), contenu en fondu décalé, chevron `.chevron`. Sans ces fonctions CSS : ouverture sèche, toujours sans JavaScript. Étapes du configurateur : `.repli` (rangée de grille 0fr → 1fr).
- Volets (`.volet` : panneau « Collection », tiroir mobile) et dialogues (`.dialogue-anime` : panier, zoom — `@starting-style` + `allow-discrete`) : entrée `--d-slow`, sortie `--d-base`, fondu + 8 à 16 px, voile de fond en fondu.

- États : couleurs de liens en `--d-fast`, boutons, puces et options en `--d-base`, sur la courbe d'atelier. Bouton : état actif enfoncé (échelle 0,98 en `--d-press`).
- Liens : soulignement tracé de gauche à droite en `--d-base` (`.link-underline`, `background-size`) ; variante `.link-underline-out` qui s'efface au survol. Flèche des boutons et des cartes (`.fleche-glisse`) : avance de 4 px.
- Héros — la seule chorégraphie du site, décrite plus bas (« Ouverture ») : arrivée de la montre, balayage des aiguilles, titre ligne à ligne, cascade des textes, puis défilé des modèles.
- Apparition au défilement (`Reveal`) : opacité + 20 px de montée en `--d-reveal`, **une seule fois** (`IntersectionObserver`, puis désinscription), `delay` entre voisins. Le serveur rend le contenu VISIBLE ; à l'hydratation, seuls les éléments sous la ligne de flottaison sont masqués — jamais d'éclair de contenu invisible, rien à rattraper sans JavaScript.
- Carte de modèle : la montre s'approche de 3,5 %, sans rotation (`--d-long`), le second coloris apparaît en fondu (`--d-reveal`), un reflet traverse le verre (`reflet-balayage`, 1,3 × `--d-long`, au survol et au focus). Gros plans macro et blocs de gamme : zoom de 4 % en `--d-long`.
- Reflet du saphir : suit le pointeur (transition de 120 ms linéaire).
- Vue éclatée : séparation des sept plans pilotée par le défilement ; servie entièrement dépliée sans JavaScript ou sous mouvement réduit.
- Transitions de page (View Transitions) : `src/app/(site)/template.tsx` enveloppe chaque page d'un `ViewTransition` (`enter`/`exit` = `page`) — sans lui, seules les navigations portant un élément partagé s'animaient. Sortie en fondu `--d-fast`, entrée en fondu `--d-base` (retard `--d-decalage`) avec 6 px de montée en `--d-slow`. L'en-tête (`entete-site`) est ancré. Carte → fiche : la montre est un élément partagé (classe `morph`, `--d-reveal` sur `--ease-passage`, flou de 2 px à 40 % du parcours). `<html data-scroll-behavior="smooth">` : le retour en haut d'une navigation est instantané (sinon la page arrivait en train de remonter et le morphing ne s'appariait pas).
- En-tête : passage du transparent au voile en `--d-slow`.
- Défilement doux : Lenis sur le site public uniquement, jamais dans le CRM.
- Curseur natif. Aucun son.
- `prefers-reduced-motion: reduce` coupe tout : animations et transitions à 0,01 ms (pseudo-éléments de transition de vue compris), `scroll-behavior: auto`, reflet de carte désactivé, reflet du saphir figé, `Reveal` affiché d'emblée, ouverture sautée, défilé à l'arrêt (ni lecture automatique ni transition), fondu de studio remplacé par une substitution immédiate, Lenis non monté. Les retards de transition tombent aussi ; `::backdrop` et `::details-content`, que le sélecteur universel n'atteint pas, sont nommés.

### Ouverture (une fois par session)

Une seule chorégraphie, entièrement en CSS (section « Ouverture » de `globals.css`) : elle démarre à la première image, sans attendre l'hydratation, et le rideau comme le héros lisent la même horloge. `INTRO_BOOT` (`intro/intro-boot.ts`), en tête de `<body>`, décide avant le premier affichage : si le rideau a déjà été vu dans la session (`sessionStorage`, `chronova:intro`) ou sous mouvement réduit, il pose `window.__chronovaIntro = "off"` ; sinon il injecte une feuille de style qui affiche `.intro-curtain` (caché par défaut : sans JavaScript, le rideau n'existe pas) et retarde l'entrée du héros (`--entree-retard: 1000ms`). Il n'écrit aucun attribut sur `<html>` ni `<body>`. `IntroCurtain` ne fait que l'intendance : verrou du défilement, clé de session, bouton « Passer », retrait du retard, démontage (secours à 2 s).

| Temps | Étape |
|---|---|
| 0 ms | Le noir (`nuit`) ; « Passer » est déjà là |
| 60 ms | « CHRONOVA » en Jost 300, lettre à lettre (8 × 45 ms ; chaque lettre 420 ms, montée de 0,5 em, flou 6 px → 0) |
| 300 ms | Un filet bleu clair se trace sous le nom (560 ms, `scaleX`) |
| 780–800 ms | Le nom s'efface ; le volet se lève (600 ms, `cubic-bezier(0.76, 0, 0.24, 1)`), bordé en bas d'un filet bleu clair |
| 1000 ms | Le héros entre dessous : la montre tourne de −7°, grandit de 0,9 à 1 et se met au point (`.entree-montre`, 1100 ms) pendant que ses aiguilles balaient jusqu'à leur heure (1250 ms, départs de −48°, −165° et −310°) ; la couronne graduée tourne de −36° (`.entree-graduation`, 1500 ms) ; le titre sort ligne à ligne de son masque (`.ligne-titre`, 850 ms, 85 ms d'écart) ; chapô, boutons et fiche suivent (`.entree-texte`, 700 ms, 80 ms d'écart) |
| 1400 ms | Le rideau a disparu ; le héros finit de se poser (≈ 2 200 ms) |

Sans rideau (déjà vu, ou sans JavaScript), le héros entre tout de suite. Tout est en `backwards` : une fois jouée, l'animation ne laisse ni transformation ni filtre.

Bouton « Passer » en bas à droite, cible de 44 px, focusable au clavier dès la première image. Aucune barre de chargement, aucun son.

### Défilé des modèles du héros (`home/defile-modeles.tsx`)

Le héros reste un composant serveur ; le défilé porte l'état (modèle courant, lecture, freins) dans un contexte lu par `DefileScene`, `LienComposerModele` et `DefileFiche`. Premier départ après l'ouverture ; cinq secondes d'exposition par modèle (barre de progression linéaire de 5 000 ms).

| Temps | Étape |
|---|---|
| −600 ms | En lecture automatique seulement : la montre suivante est montée, invisible, pour que ses ≈ 1 500 nœuds ne tombent pas dans la transition |
| 0 ms | La sortante recule (0,96), glisse de 40 px et s'éteint (`.defile-sort`, 700 ms) ; l'entrante arrive de l'autre côté, 48 px, 0,97 → 1, floue de 6 px au départ seulement (`.defile-entre`, 850 ms) ; `--sens` inverse le trajet quand on recule ; la couronne graduée tourne de 30° ; nom et fiche passent en fondu enchaîné (`.defile-texte`, 800 ms), superposés dans une même case de grille pour que rien ne change de largeur |
| 850 ms | La sortante est démontée ; le minuteur repart |

Jamais plus de deux montres montées. La première est rendue côté serveur et garde l'entrée du héros ; le balayage d'aiguilles ne rejoue pas aux modèles suivants. Sans JavaScript elle reste là, fixe, avec sa fiche. Commandes : précédent / suivant (boutons ronds), une barre par modèle (cible de 44 px de haut), compteur `01 / 05` en `type-mono`, pause ; une région `aria-live` annonce le modèle. Ces durées (700, 800, 850, 5 000 ms) sont écrites en dur dans le CSS et le composant, hors tokens `--d-*`.
