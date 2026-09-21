# Chronova — Design system « Vitrine »

Référence interne du système visuel tel qu'il est dans le code. Source unique des valeurs : `src/app/globals.css`. Le format portable pour les outils (tokens en frontmatter, règles nommées) est `DESIGN.md` à la racine, avec son annexe `.impeccable/design.json`.

Parti pris : le standard du secteur horloger, sans détour. La montre est photographiée, la page s'efface. Deux familles de couleur seulement, partout : l'encre — du papier clair à la nuit bleu-noir, une même teinte (~212°) — et l'or. L'or est l'unique accent du site, sur papier comme sur la nuit ; seule sa clarté change selon le fond pour garder le contraste.

## 1. Couleurs

### Palette de marque

Valeurs brutes, déclarées dans `@theme`. Les composants ne les utilisent pas directement : ils passent par les tokens sémantiques plus bas.

| Token | Hex | Usage |
|---|---|---|
| `--color-papier` | `#f5f5f3` | Fond principal du site clair |
| `--color-papier-alt` | `#ebebe8` | Sections alternées, petits blocs teintés du CRM |
| `--color-panneau` | `#fdfdfc` | Champs, puces, panneaux ; centre du fond de studio clair |
| `--color-encre` | `#111417` | Texte principal |
| `--color-encre-douce` | `#555b63` | Texte secondaire |
| `--color-filet` | `#dadad6` | Filets décoratifs de 1 px |
| `--color-or-profond` | `#7d5e27` | L'or qui s'écrit sur papier : liens, survols, prix, repères, filet d'or, bordure de sélection |
| `--color-or` | `#a47f32` | Aplat d'accent sur papier : bouton plein, puce active, barres de graphique (texte nuit dessus) |
| `--color-or-vif` | `#9a762c` | Survol de l'aplat sur papier |
| `--color-or-clair` | `#d9bc7a` | Accent de la nuit, aplat comme texte ; décor seul sur papier |
| `--color-or-pale` | `#ead7a6` | Survol de l'accent sur la nuit |
| `--color-sapin` | `#1e6b4c` | Statuts positifs |
| `--color-sapin-clair` | `#7fd0a8` | Statut positif sur la nuit |
| `--color-grenat` | `#a12a3c` | Alerte, erreur, `À remplir`, pastille « Exemple » |
| `--color-grenat-clair` | `#f09aaa` | Alerte sur la nuit |
| `--color-nuit` | `#0b1118` | Scènes nuit, pied de page, thème nuit du CRM ; texte posé sur tout aplat d'or |
| `--color-nuit-profonde` | `#070b10` | Fond des gros plans macro, haut du cyclorama |
| `--color-nuit-scene` | `#223246` | Halo des scènes nuit, centre du fond de studio nuit |
| `--color-nuit-alt` | `#111923` | Fond alterné sur la nuit |
| `--color-nuit-panneau` | `#16202c` | Panneaux sur la nuit |
| `--color-nuit-encre` | `#eef0f2` | Texte sur la nuit |
| `--color-nuit-douce` | `#a3abb5` | Texte secondaire sur la nuit |
| `--color-nuit-filet` | `#263241` | Filets sur la nuit |

Valeurs déclarées hors `@theme`, directement dans les tokens sémantiques : contour de champ `--field` (`#767c84` clair, `#78828e` nuit) et bord du fond de studio clair `--stage-out` (`#e2e3e5`). Les autres arrêts du fond de studio sont des tokens : `panneau` au centre en clair, `nuit-scene` → `nuit` sur la nuit.

### Tokens sémantiques

Le thème nuit s'active par `data-theme="night"` sur n'importe quel conteneur : sections nuit du site (héros, bande macro, clôture, pied de page, en-tête posé sur le héros) et thème nuit du CRM. Une variante Tailwind `night:` existe côté markup. Les utilitaires (`bg-bg`, `text-fg-soft`, `border-rule`, `bg-accent`, `text-gold`…) sont générés par `@theme inline` et pointent sur la variable : ils suivent le thème sans recompilation.

| Token | Clair | Nuit |
|---|---|---|
| `--bg` | papier | nuit |
| `--bg-alt` | papier-alt | nuit-alt |
| `--panel` | panneau | nuit-panneau |
| `--fg` | encre | nuit-encre |
| `--fg-soft` | encre-douce | nuit-douce |
| `--rule` | filet | nuit-filet |
| `--field` | `#767c84` | `#78828e` |
| `--accent` (aplat) | or | or-clair |
| `--accent-hover` | or-vif | or-pale |
| `--accent-decor` | or-clair | or |
| `--on-accent` | nuit | nuit |
| `--gold` (l'or qui s'écrit) | or-profond | or-clair |
| `--positive` | sapin | sapin-clair |
| `--alert` | grenat | grenat-clair |
| `--focus` | encre | or-clair |
| `--stage-in` → `--stage-out` | panneau → `#e2e3e5` | nuit-scene → nuit |

Principes :

- Deux familles seulement : l'encre (papier → nuit) et l'or. Le sapin et le grenat ne sont que des statuts.
- L'or est l'unique accent et le seul ornement, sur papier comme sur la nuit ; seule sa clarté change selon le fond.
- `--accent` est un **aplat** : bouton plein, puce de filtre active, vue active, pastille de quantité, barres de graphique — toujours avec un texte `--on-accent` (la nuit) dessus. Dans les composants : `bg-accent` + `text-on-accent`.
- `--gold` est **l'or qui s'écrit** : liens et survols, prix, repères numérotés, filet d'or (`.filet-or`), lien de navigation actif, soulignement du bouton discret, bordure de l'option choisie et du champ en focus, puces de liste, curseur de saisie. Dans les composants : `text-gold`, `border-gold`. Sur papier c'est l'or profond, plus sombre pour tenir 4,5:1 ; sur la nuit, l'or clair sert aux deux rôles. La sélection de texte est or clair sur nuit.
- `--rule` est réservé aux séparateurs décoratifs. Un champ de saisie se délimite avec `--field`, qui tient 3:1 sur tous les fonds (WCAG 1.4.11).

### Règles de contraste vérifiées

Ratios calculés (WCAG 2.1) à partir des hex de `globals.css`. Les couples marqués « testé » sont garantis par `src/design/tokens.test.ts`, qui lit les valeurs dans la feuille de style : un changement de teinte qui descend sous le seuil fait échouer `npm run test`. Seuil texte : 4,5:1 (11:1 exigé pour l'encre sur son fond principal).

| Couple | Ratio | Verdict |
|---|---|---|
| `encre` sur `papier` / `papier-alt` | 16,93:1 / 15,47:1 | ✅ testé |
| `encre-douce` sur `papier` / `papier-alt` | 6,28:1 / 5,74:1 | ✅ testé |
| `or-profond` sur `papier` / `papier-alt` | 5,49:1 / 5,02:1 | ✅ testé |
| `sapin` sur `papier` / `papier-alt` | 5,90:1 / 5,39:1 | ✅ testé |
| `grenat` sur `papier` / `papier-alt` | 6,61:1 / 6,04:1 | ✅ testé |
| `nuit` sur `or` / `or-vif` (bouton plein, repos / survol) | 5,11:1 / 4,52:1 | ✅ testé |
| `or` sur `papier` | **3,40:1** | ❌ testé < 4,5 : aplat uniquement, le texte d'or prend `or-profond` |
| `or-clair` sur `papier` | **1,68:1** | ❌ testé < 3 : décor uniquement, jamais de texte |
| `nuit-encre` sur `nuit` / `nuit-panneau` | 16,60:1 / 14,39:1 | ✅ testé |
| `nuit-douce` sur `nuit` / `nuit-panneau` | 8,17:1 / 7,09:1 | ✅ testé |
| `or-clair` sur `nuit` / `nuit-panneau` | 10,31:1 / 8,95:1 | ✅ testé |
| `or-pale` sur `nuit` / `nuit-panneau` | 13,33:1 / 11,56:1 | ✅ testé |
| `sapin-clair` sur `nuit` / `nuit-panneau` | 10,37:1 / 9,00:1 | ✅ testé |
| `grenat-clair` sur `nuit` / `nuit-panneau` | 8,95:1 / 7,76:1 | ✅ testé |
| `nuit` sur `or-clair` (bouton plein nuit) | 10,31:1 | ✅ testé |
| `or-profond` sur `nuit` | **3,16:1** | ❌ testé < 4,5 → sur la nuit le texte d'accent passe à `or-clair` |
| `sapin` sur `nuit` | **2,95:1** | ❌ testé < 3 → `sapin-clair` |

Couples calculés mais non couverts par la suite de tests :

| Couple | Ratio | Remarque |
|---|---|---|
| `encre` / `encre-douce` sur `panneau` | 18,16:1 / 6,74:1 | ✅ |
| `or-profond` sur `panneau` | 5,89:1 | ✅ |
| `or-profond` sur `--stage-out` clair (`#e2e3e5`) | 4,67:1 | ✅ |
| `or` sur `panneau` / `papier-alt` ; `or-vif` sur `papier` | 3,65:1 / 3,11:1 ; 3,85:1 | aplats : jamais de texte dans ces teintes |
| `encre` / `encre-douce` sur `--stage-out` clair (`#e2e3e5`) | 14,39:1 / 5,34:1 | ✅ bord le plus dense d'une tuile de montre |
| `nuit-encre` / `nuit-douce` sur `nuit-alt` | 15,48:1 / 7,62:1 | ✅ |
| `nuit-encre` / `nuit-douce` sur `nuit-scene` (`--stage-in` nuit) | 11,40:1 / 5,61:1 | ✅ |
| `nuit-encre` / `nuit-douce` / `or-clair` sur `nuit-profonde` | 17,27:1 / 8,50:1 / 10,73:1 | ✅ fond des gros plans |
| `--field` clair sur `papier` / `papier-alt` / `panneau` | 3,86:1 / 3,53:1 / 4,14:1 | ✅ contour de champ ≥ 3:1 |
| `--field` nuit sur `nuit` / `nuit-panneau` | 4,86:1 / 4,21:1 | ✅ contour de champ ≥ 3:1 |
| `filet` sur `papier` | 1,28:1 | décor : séparateur, jamais un contour porteur de sens |
| `nuit-filet` sur `nuit` | 1,46:1 | décor |
| `or` sur `nuit` (`--accent-decor` nuit) | 5,11:1 | employé en décor |

**Conséquence** : sur papier, l'or se dédouble — `or` pour les aplats (texte nuit dessus), `or-profond` pour tout ce qui s'écrit ; `or-clair` y est interdit en texte mais **devient l'accent du thème nuit**, aplat comme texte. Les tokens sémantiques (`--accent`, `--accent-hover`, `--on-accent`, `--gold`, `--positive`, `--alert`, `--focus`) basculent avec le thème ; les composants n'utilisent pas de couleur brute.

```css
:root {
  --accent: var(--color-or);       --accent-hover: var(--color-or-vif);
  --on-accent: var(--color-nuit);  --gold: var(--color-or-profond);
  --positive: var(--color-sapin);  --alert: var(--color-grenat);
  --focus: var(--color-encre);
}
[data-theme="night"] {
  --accent: var(--color-or-clair); --accent-hover: var(--color-or-pale);
  --on-accent: var(--color-nuit);  --gold: var(--color-or-clair);
  --positive: var(--color-sapin-clair); --alert: var(--color-grenat-clair);
  --focus: var(--color-or-clair);
}
```

## 2. Typographie

Trois familles chargées via `next/font/google` (`display: swap`, sous-ensemble latin) dans `src/app/layout.tsx`, exposées en `--font-title`, `--font-ui`, `--font-mono` :

- **Jost** (variable) — titrage. Le géométrique des cadrans : léger et grand en vitrine, plus ferme dans les intertitres. Replis : Futura, Century Gothic, Helvetica Neue, Arial.
- **Hanken Grotesk** — tout ce qui se lit et se manipule, étiquettes comprises. Replis : Helvetica Neue, Helvetica, Arial.
- **Geist Mono** — réservée aux vraies chaînes machine du CRM (identifiants, clés, journaux), via la constante `CODE` de `src/components/atelier/gabarit.tsx`. Elle n'a aucun rôle décoratif.

| Rôle (classe `type-*`) | Police | Taille | Interligne | Interlettrage |
|---|---|---|---|---|
| `display-1` (héros, clôture) | Jost 300 | `clamp(2.6rem, 6.4vw, 5.5rem)` | 1,02 | −0,025em |
| `display-2` (titres de section et de page) | Jost 300 | `clamp(2rem, 4.2vw, 3.5rem)` | 1,08 | −0,02em |
| `title-1` | Jost 400 | 1,875rem (30 px) | 1,18 | −0,012em |
| `title-2` | Jost 500 | 1,375rem (22 px) | 1,28 | −0,005em |
| `lead` (chapô) | Hanken Grotesk 400 | `clamp(1.0625rem, 0.95rem + 0.55vw, 1.25rem)` | 1,55 | 0 |
| `body` | Hanken Grotesk 400 | 1,0625rem (17 px) | 1,60 | 0 |
| `body-lg` (éditorial) | Hanken Grotesk 400 | 1,125rem (18 px) | 1,65 | 0 |
| `ui` (boutons, champs, navigation) | Hanken Grotesk 500 | 0,9375rem (15 px) | 1,40 | 0 |
| `caption` | Hanken Grotesk 400 | 0,8125rem (13 px) | 1,45 | 0 |
| `mono` (étiquette technique) | Hanken Grotesk 500 | 0,8125rem (13 px) | 1,40 | +0,14em, capitales, chiffres tabulaires |

Règles :

- 13 px est le plancher absolu. Quand la place manque, le conteneur grandit (la pastille de quantité du panier, par exemple), le texte ne rétrécit pas.
- `.type-mono` n'est plus une police à chasse fixe : ce sont des petites capitales espacées en Hanken Grotesk, comme une gravure de fond de boîte. Elle sert aux références techniques — calibre, diamètre, étanchéité, référence, numéro de commande, légendes de la vue éclatée — aux pastilles et aux intertitres du pied de page.
- Pas de surtitre (kicker) au-dessus des titres sur le site public : le titre ouvre la section, le chapô suit. `SectionHeader` ne propose que `titre`, `intro` et `action`.
- Titres `h1`–`h4` en Jost 400 par défaut, `text-wrap: balance`.
- Mesure de lecture : 68 caractères (`--measure`, classe `.measure`). Contenu long (pages légales, garantie) : `.prose-atelier`, interligne 1,7, liens soulignés d'or, puces en or.
- Chiffres tabulaires et alignés (`tabular-nums lining-nums`) dans les tableaux et sur tout élément `[data-numeric]` : prix, quantités, mesures.
- Corps de page : 17 px, interligne 1,6, `font-synthesis-weight: none`.

## 3. Espacements, grille, formes

Pas d'échelle d'espacement propre : les espacements courants sont ceux de Tailwind (pas de 4 px). Les tokens du projet portent sur le cadre.

- Gouttière : `--gutter: clamp(20px, 4vw, 56px)` — jamais moins de 20 px sur les bords. Elle est posée une seule fois, par `Section` (ou par la bande elle-même) ; aucun composant enfant ne gère ses marges de bord d'écran.
- Rythme vertical des sections : `--section-y: clamp(72px, 9vw, 136px)` ; variante `compact` : `clamp(40px, 5vw, 72px)`.
- Conteneurs : `--container-prose: 68ch`, `--container-wide: 90rem` (1440 px). Tout le site public — en-tête, héros, `Section`, vue éclatée, bande macro, clôture, pied de page — s'aligne sur `max-w-wide`. `--container-content: 80rem` (1280 px) reste déclaré mais n'est plus utilisé sur le site public.
- Grilles : définies section par section en utilitaires Tailwind. Modèles : 1 → 2 colonnes (640 px) → 3 (1024 px). Frise du parcours : 1 → 2 (768 px) → 4 (1280 px). Gros plans macro : 3 colonnes dès 768 px. Héros : deux colonnes dès 1024 px, la montre sur deux rangées à droite, sans `order` (l'ordre du DOM reste l'ordre de lecture).
- Rayons : `--radius-field: 8px` (champs, petits blocs), `--radius-card: 14px` (tuiles de montre, cartes d'option, panneaux, boîte de zoom), `--radius-pill: 999px` (boutons, puces, pastilles, sélecteur de vue, boutons d'icône, repères). Anneau de focus : 4 px.
- Séparation : filet de 1 px `--rule` (`Rule`, `hr`). **Une bordure ou une ombre, jamais les deux.**
- Ombres : deux seulement, teintées nuit, réservées aux éléments flottants. `--shadow-lift: 0 18px 48px -20px rgb(11 17 24 / 0.38)` (tiroir du panier, palette de recherche du CRM en thème clair — en thème nuit elle échange son ombre contre un filet) ; `--shadow-sheet: 0 -12px 40px -18px rgb(11 17 24 / 0.36)` (barre de total collée en bas du configurateur mobile).
- Aucune texture de surface, aucun grain.
- Mise en scène des montres : `.cadre-montre` est un fond de studio — dégradé radial `--stage-in` → `--stage-out` (ellipse 78 % × 70 % centrée à 50 % / 42 %), rayon 14 px, **sans bordure ni ombre**. `.scene-nuit` est le cyclorama du héros et de la clôture, entièrement en tokens : fond `nuit`, halo froid elliptique en `nuit-scene` derrière la montre, lueur d'`or-clair` très faible au sol, dégradé vertical de `nuit-profonde` à `nuit-alt` ; sous 1024 px le halo se recentre. Les gros plans macro sont posés sur `nuit-profonde`. Derrière la montre du héros, une couronne graduée de soixante traits en or.
- `.filet-or` : trait de 1 px en `--gold`, fondu aux deux extrémités, opacité 0,55. Le seul ornement du site.
- Pointillés : réservés à ce qui manque (emplacement photo, avis à venir, `À remplir`).
- En-tête collant : transparent sur le héros de l'accueil ; il prend le thème nuit chaque fois qu'une section nuit passe sous lui (pour ne pas couper la page en deux palettes) ; une fois la page défilée (12 px), voile translucide flouté (`.entete-voile` : fond à 82 %, `saturate(1.6) blur(18px)`) et filet bas.
- Focus : `outline: 2px solid var(--focus); outline-offset: 3px; border-radius: 4px` — encre sur papier, or clair sur la nuit, jamais supprimé. Lien d'évitement `.skip-link` en premier élément focusable.
- Cibles : 44 px au moins pour les commandes isolées (`.lien-atelier`, boutons d'icône, puces, boutons du CRM). Bouton `md` : 48 px ; `sm` : 40 px.
- Ancres : `scroll-margin-top: 6rem` pour ne pas passer sous l'en-tête.
- Zones à défilement horizontal du CRM (`.defilement-atelier`) : barre fine toujours visible, pouce en or sur piste filet.

## 4. Points de rupture

Points de rupture Tailwind par défaut — `640` (`sm`) · `768` (`md`, tablette, CRM à l'établi) · `1024` (`lg`, navigation principale visible, héros en deux colonnes) · `1280` (`xl`) · `1536` (`2xl`) — plus un point propre au projet : `--breakpoint-3xl: 90rem` (1440 px), la référence large.

Conception mobile d'abord. En dessous de 1024 px, la navigation passe dans un tiroir plein écran à un seul niveau. Sur téléphone, la montre du configurateur est bornée en hauteur (27 vh) pour laisser la place aux options.

## 5. Iconographie

Jeu dessiné sur mesure dans `src/components/ui/icons.tsx` : grille 24 px, affichage 20 px par défaut, trait 1,5 px, extrémités droites (`square` / `miter`), `currentColor`, aucun remplissage, `aria-hidden`. Onze pictos existent : `IconFleche`, `IconChevron`, `IconCroix`, `IconMenu`, `IconZoom`, `IconPanier`, `IconCompte`, `IconEtancheite`, `IconMouvement`, `IconTournevis`, `IconColis`.

Aucun picto dans un cercle coloré, aucun emoji, aucune icône multicolore. La frise du parcours n'emploie aucun pictogramme : seul le numéro d'ordre la ponctue.

## 6. Inventaire des composants

Seuls les composants présents dans `src/components` et `src/watch` sont listés.

**Primitives** (`ui/`) — `Button` et `ButtonLink` (variantes `primaire` / `contour` / `discret`, tailles `md` / `sm`, toujours en pilule, appui enfoncé de 1 px), `Pill` (tons `neutre` / `accent` / `positif` / `alerte`, en `type-mono`), `SamplePill` (pastille « Exemple », ton alerte, sur toute donnée fictive), `Section` (fonds `papier` / `alterne` / `nuit`, option `compact`), `SectionHeader` (titre, chapô, action — pas de surtitre), `Rule`, `PhotoPlaceholder` (fond de studio en pointillés qui décrit la photo attendue), `FillMe` (bloc grenat en pointillés « À remplir · … »), `LegalPage` (gabarit des pages longues, date de mise à jour obligatoire), icônes.

**Mise en page** (`layout/`) — `Header` (collant, suit le thème de la section qui passe dessous, tiroir mobile, exclu des transitions de page), `Footer` (toujours en thème nuit, identité légale commune aux mentions), `Wordmark` (« CHRONOVA » en Jost interlettré à 0,22em, aucun fichier logo), `SmoothScroll` (Lenis, site public seulement).

**Accueil** (`home/`) — `Hero` (scène nuit, fiche de la pièce et prix en pied de scène), `ExplodedView` (vue éclatée en sept plans au défilement, servie dépliée sans JavaScript), `MacroBand` (trois gros plans recadrés du même SVG), `ModelsSection` et `ModelCard` (tuile de studio, second coloris au survol, élément partagé vers la fiche), `Process` (frise en quatre temps, repères bordés d'or), `Watchmaker` (emplacements photo et blocs `À remplir`), `Testimonials` (emplacement « Avis à venir » tant qu'aucun avis réel n'existe), `FaqSection` (accordéon `<details>`), `ClosingCta` (seconde scène nuit, montre à demi hors champ).

**Collection et configurateur** — `CollectionBrowser` (puces de filtre en pilule, `aria-pressed`, filtres recopiés dans l'adresse), `Configurator`, `StepSection` (étape repliable), `OptionGrid` (radios natifs : cartes d'option de 14 px bordées, pastilles de couleur rondes de 44 px avec double anneau et nom de teinte toujours écrit), `WatchStage` (tuile de studio, sélecteur face / profil / dos, zoom en `<dialog>`).

**Panier et compte** — `CartDrawer` (panneau latéral, miniature de la configuration réelle), `PanierComplet`, `BoutonPaiement`, `ViderPanier`, `CompteNav`, `OrderTimeline` (frise d'assemblage verticale), `FormulaireConnexion`, `FormulaireProfil`, `FormulaireAdresse`, `SuppressionCompte`, `FormulaireDemande` (contact et sur-mesure).

**Montre** (`src/watch`) — `WatchSvg` (moteur SVG, vues face / profil / dos, niveaux `full` / `compact`, prop `crop`), `InteractiveWatch` (reflet du saphir piloté par le pointeur ou l'inclinaison).

**Mouvement et entrée** — `Reveal` (apparition au défilement), `IntroCurtain` (rideau d'entrée) et son script d'amorçage `INTRO_BOOT`.

**CRM** (`atelier/`) — `CrmShell`, `BasculeTheme` (clair / nuit, deux boutons), `RechercheGlobale` (palette `Cmd/Ctrl + K` en `<dialog>`), gabarit (`TitrePage`, `FilAriane`, `Filtres`, `Filtre`, `Tableau`, `Th`, `Td`, `EtatVide`, constantes `SURFACE`, `BLOC`, `CODE`, `CHIFFRE_FORT`, `LIGNE_LISTE`, `LIGNE_TABLEAU`), formulaire (`Champ`, `Saisie`, `Liste`, `Zone`, `Bouton`, `BoutonLeger`, constantes `SAISIE`, `CASE`), graphiques (`BarresHorizontales`, `HistogrammeMois`, `Synthese`, `Panneau` — une série, une couleur : l'aplat `--accent`), `TableauDefilant`, `EditeurOption` (aperçu de la teinte sur la montre), `BandeauExemple`, `MarquerLu`. Une surface du CRM porte une bordure, jamais une ombre en plus ; les cibles font 44 px.

Champs de saisie (`SAISIE`) : fond `--panel`, contour `--field` de 1 px, rayon 8 px, hauteur 44 px, corps `ui` ; survol en bordure encre, focus en bordure d'or (`border-gold`), erreur (`aria-invalid`) en bordure d'alerte, désactivé sur fond alterné.

## 7. Moteur de rendu de la montre

Un seul SVG inline, `viewBox="0 0 1000 1000"`, montre centrée en (500, 500), jamais démonté : `WatchSvg` est un composant sans état ni effet, rendu côté serveur (cartes, e-mails, CRM) comme côté client (configurateur). Changer une option ne modifie que des attributs. Tous les identifiants internes sont préfixés par la prop `id`, pour que plusieurs montres cohabitent sur une page. `detail="compact"` allège la trame (moins de secteurs, de crans, de cannelures) pour les cartes et miniatures. L'heure figée est 10 h 10 min 32 s.

**Gros plans.** La prop `crop` (« x y largeur hauteur » dans le repère 1000 × 1000) remplace le `viewBox` et passe en `preserveAspectRatio="xMidYMid slice"` : le rendu étant vectoriel, un index ou la couronne agrandis restent nets. C'est la photographie macro du site (`MacroBand`, fiche modèle).

**Cadrage.** `FRAME_SCALE` (0,9) en face et de dos : la tête de montre n'occupe pas tout le cadre, on voit la pièce de bout et les premiers maillons. `SIZE_SCALE` : un boîtier de 37 à 41 mm est un 40 mis à l'échelle (0,915 à 1,028).

### Matières (`palette.ts`)

Les métaux ne sont pas des couleurs d'interface mais des matières photographiées en studio, à dynamique large. `METALS` définit quatre tons — `acier`, `dore`, `noir`, `bleui` — chacun en cinq paliers : `hi` (éclat spéculaire de la boîte à lumière), `light` (arête la plus éclairée), `mid`, `dark` (creux), `edge` (filet de contour, reflet du fond noir du studio). `rampAt(ramp, t)` renvoie la couleur d'un métal pour une luminance reçue de 0 à 1, en interpolant entre les cinq paliers plutôt qu'en mélangeant deux teintes. `INK` (`#0E1013`) et `PAPER` (`#F6F8FA`) sont l'ombre et la lumière neutres du rendu ; `shade` / `tint` mélangent vers l'un ou l'autre ; `glow` éclaircit sans délaver (canaux multipliés) pour qu'un bleu soleillé reste bleu dans ses rayons clairs. Luminova au repos : `LUME_FILL` `#E4E9D2`, `LUME_EDGE` `#A4AB8C`. `isLight` décide si un cadran reçoit des impressions sombres ou claires ; `contrastRatio` sert aussi aux tests de tokens.

### Reflets angulaires (`parts/conic.tsx`)

Un métal poli renvoie le studio ; autour d'une pièce circulaire, cela se lit comme une suite de secteurs clairs et sombres. SVG n'ayant pas de dégradé conique, il est construit en éventail : `ConicDisk` dessine un disque de secteurs fins (60 à 240, avec un léger recouvrement contre l'anticrénelage), défini une fois dans `<defs>`, puis repris par `<use>` sous un masque annulaire (`Ring`, `clipPath` en `evenodd`) pour chaque bague — carrure, chanfreins, lunette, insert, réhaut. Une pente tournée vers l'intérieur reprend l'éventail tourné de 180° : elle reflète le côté opposé.

`studioLum(angle, sheen)` donne la luminance reçue par une facette dont la normale pointe vers `angle` (0° = midi, sens horaire). Le studio compte quatre boîtes à lumière : boîte principale en haut à gauche (318°), bande de débouchage en bas à droite (138°), liseré en haut à droite (48°), rappel en bas à gauche (226°). Quatre finitions : `poli` (transitions dures, jamais noir), `brosse` (étalé, avec un grain de stries par `jitter`), `mat` (écrasé, pour le microbillé et l'aluminium), `ceramique` (très contrasté). `jitter(i)` est un bruit entier déterministe, identique sur le serveur et dans le navigateur.

`defs.tsx` regroupe les éventails (carrure selon sa finition, poli, insert, demi-insert de jour, soleillage du cadran), les dégradés (cornes, cylindre poli des petites pièces, cadran, vignette et ombre du réhaut, nappe d'émail, reflet et voile antireflet du saphir, point chaud, ombres au sol), les motifs de brossage droit et de microbillage, et les filtres d'ombre.

### Empilement en vue de face

Ordre réel de dessin dans `watch-svg.tsx`, du fond vers l'avant :

```
ombre au sol (nappe + occlusion de contact) · bracelet · couronne ·
poussoirs (VK64) · boîtier (cornes, plat de carrure, chanfrein poli) ·
protège-couronne (lunette de plongée) · lunette (+ insert, chanfrein intérieur) ·
cadran (fond, soleillage ou émail, vignette, réhaut, minuterie, échelle 24 h /
cœur ouvert / compteurs, guichet de date, signature) · index (ombre de contact) ·
aiguilles (GMT, heures, minutes, trotteuse, canon) · verre (antireflet, chant,
point chaud, reflet mobile)
```

La couronne et les poussoirs sont dessinés avant le boîtier pour que leur pied disparaisse sous le flanc. `types.ts` exporte `FACE_LAYERS`, la liste des calques qui sert de clés au registre.

- **Boîtier et cornes** (`case.tsx`). Les cornes prolongent la carrure (flanc extérieur tangent, flancs intérieurs parallèles) et sont placées par symétrie de coordonnées, sans `rotate` ni `scale(-1)`, pour ne pas retourner la lumière. Chaque corne porte un plat (brossé, microbillé ou poli), un chanfrein poli fermé en vraie facette, une arête vive et une ombre de tombée vers le poignet. La lunette porte son ombre sur le plat de carrure.
- **Lunette** (`bezel.tsx`). Quatre styles : `lisse` (suit la finition du boîtier, miroir annulaire en poli, galbée), `cannelee` (72 dents — 48 en compact — à deux facettes, chacune colorée selon la direction qu'elle regarde), `plongee` (pourtour de 120 crans, insert gravé 60 minutes avec minuterie détaillée sur le premier quart d'heure, chiffres qui suivent la courbure, triangle de midi et perle luminescente sertie), `gmt` (échelle 24 heures, heures paires chiffrées, et demi-insert de jour bicolore de 6 h à 18 h via `insertColor2`). Insert en céramique (reflets durs) ou aluminium (mat). Le chanfrein intérieur poli retombe vers le verre.
- **Cadran** (`dial.tsx`). Trois textures : `soleille` (éventail conique en papillon — deux secteurs clairs dans l'axe de la boîte à lumière, deux sombres en travers — avec grain), `emaille` (nappe de lumière), `mat`. Réhaut poli en pente, qui reflète le côté opposé et porte son ombre sur le pourtour. Guichet de date encadré : cadre appliqué poli, disque de quantième en retrait, ombre du cadre. Selon le calibre : échelle 24 h (NH34), cœur ouvert (NH38), deux compteurs décoratifs (VK64). Signature « CHRONOVA » en Jost, ligne technique en Hanken Grotesk.
- **Index** (`indices.tsx`). `batons` : blocs de métal biseautés sur quatre côtés, chaque biseau coloré selon ce qu'il regarde, luminova dans la cuvette, double bâton à midi. `arabes` : chiffres en Hanken Grotesk 600 avec un plot luminescent serti à chaque heure. `plongee` : triangle à midi, bâtons aux quarts, ronds ailleurs, sertissage éclairé d'un côté et ombré de l'autre. Les index suivent le métal du boîtier ; ils reçoivent une ombre de contact.
- **Aiguilles** (`hands.tsx`). Formes `glaive`, `mercedes` (cercle sur l'aiguille des heures seulement), `crayon`, plus trotteuse à contrepoids et flèche GMT. Chaque aiguille est pliée en deux facettes le long de son axe : un dégradé à rupture franche dont les deux couleurs dépendent de l'angle réel de l'aiguille dans le studio. Les ombres portées sont appliquées hors rotation, donc toutes du même côté, et s'allongent avec la hauteur sur le canon (heures et GMT en bas, minutes et trotteuse plus haut).
- **Verre** (`crystal.tsx`). Un saphir ne voile pas le cadran : il se trahit par son chant (un arc vif face à la boîte principale, un arc faible à l'opposé), un point chaud fixe et le reflet d'une boîte à lumière — un simple dégradé translaté (±120 px), sans filtre. Saphir bombé : liseré de courbure sur le pourtour. Antireflet : voile bleu-violet au bord, reflets atténués.
- **Couronne et poussoirs** (`crown.tsx`, `pushers.tsx`). Cylindre couché : cannelures serrées vers les bords, larges au sommet ; couronne signée ou lisse ; protège-couronne sur les plongeuses.
- **Bracelet** (`strap.tsx`). Dessiné en distance au centre et non par rotation, pour que les deux brins gardent la lumière du haut-gauche. Acier trois maillons ou jubilé (pièce de bout qui affleure les cornes), cuir et caoutchouc (brin roulé autour de la barrette), NATO (ruban qui passe sous la carrure). Les brins s'affinent puis sortent du cadre.

**Vue de profil** (`profile.tsx`), prise côté couronne : épaisseur de la carrure (cylindre debout, lumière de gauche à droite), galbe du verre — plat ou bombé change réellement la silhouette —, courbe des cornes, couronne vue de bout, bracelet par la tranche. Pas d'ombre au sol : la montre est au poignet.

**Vue de dos** (`back.tsx`) : fond plein vissé à six encoches, gravure en aperçu direct, ou fond transparent laissant voir le mouvement, dessiné selon le calibre (NH35 / NH34 / NH38 : ponts côtelés, balancier, masse oscillante ; VK64 méca-quartz : pile, bobine, pont de chronographe).

**Frontière code / base** : la *géométrie* vit dans le code (`src/watch/parts/*.tsx`, registre typé `PART_REGISTRY` dans `registry.ts`, que le CRM propose en menu déroulant). L'*apparence* vit dans la base : une option porte `svgPartKey` + `colorHex` + `renderMeta`, résolus en `WatchRender` (`types.ts`). Le moteur ne connaît ni Prisma, ni les prix, ni le stock. Ajouter un coloris de cadran, d'insert ou de cuir, en changer le prix, le nom, le stock ou la disponibilité se fait entièrement depuis le CRM ; dessiner une forme d'aiguille inédite demande une nouvelle pièce dans le registre, donc du code.

**Reflet interactif** (`interactive-watch.tsx`) : le décalage du reflet est piloté par `pointermove` (ou `deviceorientation` sur mobile), lissé en `requestAnimationFrame`, non monté sous `prefers-reduced-motion`.

## 8. Mouvement

```
--ease / --ease-atelier: cubic-bezier(0.16, 1, 0.3, 1);
--d-fast: 200ms;  --d-base: 280ms;  --d-slow: 400ms;
--d-reveal: 700ms; --d-long: 900ms;
```

- États (boutons, liens, puces, champs) : 200 ms sur la courbe d'atelier. Bouton : état actif enfoncé de 1 px.
- Liens : soulignement tracé de gauche à droite en 280 ms (`.link-underline`, `background-size`) ; variante `.link-underline-out` qui s'efface au survol. Flèche des boutons et des cartes (`.fleche-glisse`) : avance de 4 px.
- Héros — le seul moment chorégraphié du site : la montre se pose depuis un léger flou (`.entree-montre`, 1400 ms, délai 120 ms : opacité, 28 px de montée, échelle 0,965, flou 14 px), pendant que titre, chapô, boutons et fiche montent par paliers (`.entree-texte`, 900 ms, délai `rang × 110 ms + 250 ms`, 18 px).
- Apparition au défilement (`Reveal`) : opacité + 16 px de montée en 450 ms, **une seule fois** (`IntersectionObserver`, puis désinscription). L'état masqué est rendu dès le serveur ; une règle `<noscript>` du gabarit du site le neutralise sans JavaScript.
- Carte de modèle : la montre grossit de 4,5 % et pivote de 2° (900 ms), le second coloris apparaît en fondu (600 ms), un reflet traverse le verre (`reflet-balayage`, 1100 ms, au survol et au focus). Gros plans macro : zoom de 6 % en 1200 ms.
- Reflet du saphir : suit le pointeur (transition de 120 ms linéaire).
- Vue éclatée : séparation des sept plans pilotée par le défilement ; servie entièrement dépliée sans JavaScript ou sous mouvement réduit.
- Transitions de page (View Transitions) : sortie en fondu 160 ms, entrée en fondu 250 ms (délai 80 ms) avec une montée de 10 px en 300 ms. L'en-tête (`entete-site`) est ancré : ni fondu ni déplacement. Carte → fiche : la montre est un élément partagé (`ViewTransition`, classe `morph`, 420 ms, flou de 3 px à 30 % du parcours).
- En-tête : passage du transparent au voile en 500 ms.
- Défilement doux : Lenis sur le site public uniquement, jamais dans le CRM.
- Curseur natif. Aucun son.
- `prefers-reduced-motion: reduce` coupe tout : animations et transitions à 0,01 ms (pseudo-éléments de transition de vue compris), `scroll-behavior: auto`, reflet de carte désactivé, reflet du saphir figé, `Reveal` affiché d'emblée, rideau d'entrée sauté, Lenis non monté.

### Rideau d'entrée (2,4 s, une fois par session)

Sur fond nuit, tracé en or clair. Mémorisé en `sessionStorage` (`chronova:intro`) ; le script `INTRO_BOOT`, en tête de `<body>`, décide avant le premier affichage si le rideau est sauté.

| Temps | Étape |
|---|---|
| 0 → 600 ms | Tracé du cercle du cadran (`stroke-dashoffset`) |
| 550 → ~1150 ms | Les 12 index apparaissent un par un dans le sens horaire (32 ms d'écart) |
| 820 → ~1800 ms | Les aiguilles tournent et se posent sur **10 h 10**, léger amorti ; la trotteuse suit |
| 1340 → 1960 ms | « CHRONOVA » en Jost, interlettrage de 0,4em → 0,08em |
| 1900 → 2440 ms | Le cadran s'agrandit et s'efface ; un masque circulaire s'ouvre sur l'accueil, déjà monté derrière |

Bouton « Passer » en bas à droite, cible de 44 px, focusable au clavier dès la première image. Aucune barre de chargement, aucun son.
