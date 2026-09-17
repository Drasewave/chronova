# Chronova — Design system « Atelier chaleureux »

## 1. Couleurs

### Palette de marque (telle que définie)

| Token | Hex | Usage |
|---|---|---|
| `--paper` | `#F5F0E8` | Fond principal |
| `--paper-alt` | `#EDE6DA` | Sections alternées, blocs `[PHOTO]` |
| `--surface` | `#FBF8F3` | Cartes, panneaux, champs |
| `--ink` | `#34302A` | Texte principal |
| `--ink-soft` | `#66605A` | Texte secondaire |
| `--brass` | `#7E5F37` | Accent : boutons, liens, sélection |
| `--brass-light` | `#B08D5B` | Décor seul sur fond clair |
| `--sage` | `#56614F` | Statuts positifs |
| `--line` | `#D9D0C2` | Filets 1 px |
| `--night` | `#211E1B` | Sections sombres, mode sombre CRM |
| `--night-ink` | `#E9E2D6` | Texte sur `--night` |
| `--night-soft` | `#B9B0A2` | Texte secondaire sur `--night` |

### Tokens dérivés à ajouter (à valider)

Trois besoins ne sont pas couverts par la liste d'origine : un état de survol pour le laiton, une couleur d'alerte (rupture de stock, seuil franchi, erreur de formulaire), et des équivalents lisibles sur fond sombre.

| Token | Hex | Contraste sur `--paper` | Usage |
|---|---|---|---|
| `--brass-deep` | `#6A4F2E` | 6,75:1 | Survol / actif du bouton plein et des liens |
| `--rust` | `#8A4B2F` | 5,94:1 | Alerte, rupture, erreur — terre cuite, jamais un rouge vif |
| `--sage-light` | `#9FAC94` | — (mode sombre) | Statut positif sur `--night` : 6,95:1 |
| `--rust-light` | `#C98A6A` | — (mode sombre) | Alerte sur `--night` : 5,86:1 |

### Règles de contraste vérifiées

Ratios calculés (WCAG 2.1, texte normal ≥ 4,5:1) :

| Couple | Ratio | Verdict |
|---|---|---|
| `--ink` sur `--paper` | 11,56:1 | ✅ |
| `--ink-soft` sur `--paper` | 5,47:1 | ✅ |
| `--brass` sur `--paper` | 5,17:1 | ✅ |
| `--paper` sur `--brass` (bouton plein) | 5,17:1 | ✅ |
| `--sage` sur `--paper` | 5,84:1 | ✅ |
| `--brass-light` sur `--paper` | **2,72:1** | ❌ décor uniquement, jamais de texte |
| `--night-ink` sur `--night` | 12,88:1 | ✅ |
| `--night-soft` sur `--night` | 7,72:1 | ✅ |
| `--brass` sur `--night` | **2,83:1** | ❌ → en mode sombre l'accent devient `--brass-light` (5,38:1 ✅) |
| `--sage` sur `--night` | **2,50:1** | ❌ → `--sage-light` |

**Conséquence** : `--brass-light` est interdit en texte sur le crème mais **devient l'accent de texte du mode sombre**. Les tokens sémantiques (`--accent`, `--accent-hover`, `--positive`, `--alert`, `--focus`) basculent donc avec le thème ; les composants n'utilisent jamais une couleur brute.

```css
:root {
  --accent: var(--brass);  --accent-hover: var(--brass-deep);
  --positive: var(--sage); --alert: var(--rust);
  --focus: var(--brass);
}
[data-theme="night"] {
  --accent: var(--brass-light); --accent-hover: #C5A373;
  --positive: var(--sage-light); --alert: var(--rust-light);
  --focus: var(--night-ink);
}
```

Jamais de `#FFF` ni de `#000`, y compris dans les SVG et les e-mails.

## 2. Typographie

Chargées via `next/font/google`, `display: swap`, sous-ensemble latin, en variables CSS `--font-title`, `--font-ui`, `--font-mono`.

| Rôle | Police | Taille | Interligne | Interlettrage |
|---|---|---|---|---|
| `display-1` (héros) | Newsreader 400 | `clamp(2.75rem, 6vw, 4.5rem)` | 1,04 | −0,025em |
| `display-2` (titres de section) | Newsreader 400 | `clamp(2rem, 4vw, 3rem)` | 1,10 | −0,02em |
| `title-1` | Newsreader 500 | 1,75rem (28px) | 1,20 | −0,015em |
| `title-2` | Newsreader 500 | 1,375rem (22px) | 1,30 | −0,01em |
| `lead` (chapô) | Hanken Grotesk 400 | 1,25rem (20px) | 1,55 | 0 |
| `body` | Hanken Grotesk 400 | 1,0625rem (17px) | 1,60 | 0 |
| `body-lg` (pages éditoriales) | Hanken Grotesk 400 | 1,125rem (18px) | 1,65 | 0 |
| `ui` (boutons, champs, CRM) | Hanken Grotesk 500 | 0,9375rem (15px) | 1,40 | 0 |
| `caption` | Hanken Grotesk 400 | 0,8125rem (13px) | 1,45 | 0 |
| `mono` (réf. technique) | IBM Plex Mono 400/500 | 0,8125rem (13px) | 1,40 | +0,14em, capitales |

Règles : 13 px plancher absolu, aucune graisse < 400, mesure de lecture 68 caractères (`--measure: 68ch`), chiffres tabulaires (`font-variant-numeric: tabular-nums`) dans tous les tableaux et prix.

Le monospace est **réservé** aux références techniques : calibre, diamètre, étanchéité, référence de pièce, numéro de commande, légendes de la vue éclatée. Il ne sert jamais de style décoratif pour un titre.

## 3. Espacements, grille, formes

```
--space-1: 4px    --space-5: 24px   --space-9:  96px
--space-2: 8px    --space-6: 32px   --space-10: 128px
--space-3: 12px   --space-7: 48px   --space-11: 160px
--space-4: 16px   --space-8: 64px
```

- Gouttière : `clamp(20px, 4vw, 48px)` — jamais moins de 20 px sur les bords.
- Rythme vertical des sections : `clamp(64px, 9vw, 128px)`.
- Conteneurs : `--w-prose: 68ch`, `--w-content: 1280px`, `--w-wide: 1440px`.
- Grille : 12 colonnes en ≥ 1024 px, 6 en 768 px, 4 en 375 px.
- Rayons : `--r-field: 2px`, `--r-card: 4px`, `--r-pill: 999px` (pastilles de couleur uniquement).
- Séparation : filet 1 px `--line`. **Aucune ombre** par défaut.
- Ombre unique, réservée aux éléments flottants (panneau panier, boîte de dialogue, bottom sheet, palette `Cmd+K`) : `--shadow-lift: 0 2px 32px -12px rgba(52, 48, 42, .28)` — teintée brun, jamais grise.
- Grain : `feTurbulence baseFrequency=.85` en overlay fixe, opacité 3,5 %, `pointer-events: none`, une seule instance pour tout le document.
- Focus : `outline: 2px solid var(--focus); outline-offset: 2px` — visible sur tous les fonds, jamais supprimé.

## 4. Points de rupture

`375` (référence mobile) · `640` · `768` (tablette, CRM à l'établi) · `1024` · `1280` (référence bureau) · `1440`.
Conception mobile d'abord ; toute maquette est vérifiée à 375 / 768 / 1280 / 1440.

## 5. Iconographie

Jeu dessiné sur mesure, grille 24 px, trait 1,5 px, extrémités droites, `currentColor`, aucun remplissage. ~26 pictos : loupe, panier, compte, flèches, chevrons, croix, coche, alerte, filtre, vue face/profil/dos, zoom, lien de partage, annuler, réinitialiser, colis, calendrier, tournevis, loupe d'horloger, goutte (étanchéité), ressort (mouvement), maillon, aiguille, gravure, imprimer.

Aucun picto dans un cercle coloré, aucun emoji, aucune icône multicolore.

## 6. Inventaire des composants

**Primitives** — `Button` (plein / contour / discret), `IconButton`, `TextLink`, `Field` (label + aide + erreur), `Input`, `Textarea`, `Select`, `RadioGroup`, `OptionCard`, `ColorSwatch`, `Checkbox`, `Switch`, `Pill`, `Badge` (statuts), `Tooltip`, `Rule`, `Accordion`, `Tabs`, `Dialog`, `Drawer`, `BottomSheet`, `Toast`, `Table`, `Pagination`, `Breadcrumb`, `EmptyState`, `Skeleton`, `CommandPalette`.

**Mise en page** — `Header`, `NavDrawer`, `Footer`, `Section`, `SectionHeader`, `Container`, `Prose`, `Grain`, `CookieBanner`.

**Montre** — `WatchCanvas` (moteur SVG en calques), `WatchViewSwitch` (face / profil / dos), `WatchZoom`, `WatchExploded` (vue éclatée au défilement), `WatchThumb` (miniature de configuration, panier et CRM).

**Commerce** — `ModelCard`, `PriceLine` (total + détail des suppléments), `LeadTime`, `ConfiguratorStep`, `OptionGrid`, `EngravingPreview`, `ConfigSummary`, `CartPanel`, `CartLine`, `OrderTimeline` (frise d'assemblage), `AssemblyPhotos`.

**Éditorial** — `Hero`, `ProcessStep`, `SpecList`, `FaqItem`, `HorlogerBlock`, `PhotoPlaceholder` (bloc `--paper-alt` avec la description attendue en monospace), `FillMe` (rendu visible des `[À REMPLIR : …]`).

**CRM** — `CrmShell` (barre latérale + fil d'Ariane), `KanbanBoard`, `KanbanCard`, `DataTable` (tri, filtres, sélection), `StatBlock`, `BarChart`, `SparkLine`, `StockBar` (disponible / réservé / seuil), `BomTable` (nomenclature), `ChecklistPanel`, `QcForm`, `NoteThread`, `PhotoUploader`, `StatusSelect`, `EmailTemplateEditor`, `AuditTrail`.

## 7. Moteur de rendu de la montre

Un seul SVG inline, `viewBox="0 0 1000 1000"`, jamais démonté : un changement d'option ne modifie que des attributs `fill` / `transform`, donc le rendu est instantané.

Ordre des calques en vue **face** (du fond vers l'avant) :

```
ombre · boitier-flancs · boitier-finition · lunette · lunette-insert ·
cadran-fond · cadran-texture · cadran-ouverture (GMT / cœur ouvert) ·
index · guichet-date · signature · aiguille-heure · aiguille-minute ·
aiguille-gmt · aiguille-seconde · axe · verre (dôme + antireflet) ·
reflet · couronne · attaches-bracelet
```

Vue **profil** : silhouette du boîtier, hauteur du verre (plat vs bombé change réellement le profil), couronne, bracelet.
Vue **dos** : fond plein gravé ou fond transparent laissant voir le mouvement (dessin propre à NH35 / NH34 / NH38), gravure en aperçu direct.

**Frontière code / base** : la *géométrie* vit dans le code (`src/watch/parts/<calque>/<cle>.tsx`, registre typé). L'*apparence* vit dans la base : une option porte `svgPartKey` + `colorHex` + `renderMeta`. Conséquence concrète pour l'horloger : ajouter un nouveau coloris de cadran, d'insert ou de cuir, en changer le prix, le nom, le stock ou la disponibilité se fait **entièrement depuis le CRM**. Dessiner une forme d'aiguille inédite demande une nouvelle pièce dans le registre, donc du code. C'est assumé et documenté dans le README.

Reflet du verre : `gradientTransform` piloté par `pointermove` (ou `deviceorientation` sur mobile), lissé en `requestAnimationFrame`, coupé sous `prefers-reduced-motion`.

## 8. Mouvement

```
--ease: cubic-bezier(.22, 1, .36, 1);
--d-fast: 200ms;  --d-base: 250ms;  --d-slow: 350ms;
--d-reveal: 450ms; --d-long: 600ms;
```

- Transition de page : fondu 250 ms + translation verticale de 8 px (View Transitions quand disponible, sinon Motion).
- Carte produit → fiche : l'image de la montre est un élément partagé (`view-transition-name`).
- Apparition au défilement : opacité + translation de 16 px, décalage 60 ms, **une seule fois** (`IntersectionObserver`, puis désinscription).
- Survol de carte : rotation 3°, reflet traversant, second coloris en fondu.
- Bouton : soulignement laiton tracé de gauche à droite (`background-size`), état actif enfoncé de 1 px.
- Curseur natif. Aucun son.
- `prefers-reduced-motion: reduce` → toutes les transitions à 0,01 ms, l'animation d'entrée est sautée, Lenis n'est pas monté.

### Animation d'entrée (≤ 2,5 s, première visite seulement)

| Temps | Étape |
|---|---|
| 0 → 600 ms | Tracé du cercle du cadran (`stroke-dashoffset`), trait `--ink` sur fond `--paper` |
| 600 → 1000 ms | Les 12 index apparaissent un par un dans le sens horaire (33 ms d'écart) |
| 900 → 1700 ms | Les aiguilles tournent et se posent sur **10 h 10**, léger amorti |
| 1400 → 2000 ms | « CHRONOVA » en Newsreader, interlettrage de 0,4em → 0,08em |
| 2000 → 2500 ms | Le cadran s'agrandit, son cercle devient un `clip-path: circle()` qui s'ouvre sur l'accueil |

Mémorisée en `sessionStorage` (`chronova:intro`). Bouton « Passer » discret en bas à droite, focusable au clavier dès la première image. Le héros est préchargé pendant l'animation. Aucune barre de chargement, aucun son.
