# Chronova — Design system « Atelier nocturne »

## 1. Couleurs

### Palette de marque

| Token | Hex | Usage |
|---|---|---|
| `--marble` | `#EDEFF1` | Fond principal |
| `--marble-alt` | `#E3E6EA` | Sections alternées, blocs `[PHOTO]` |
| `--cloud` | `#F6F7F9` | Cartes, panneaux, champs |
| `--graphite` | `#1E2226` | Texte principal |
| `--graphite-soft` | `#565D65` | Texte secondaire |
| `--chrome` | `#2E5570` | Accent : boutons, liens, sélection |
| `--chrome-deep` | `#1F3D52` | Survol / actif du bouton plein et des liens |
| `--chrome-light` | `#8FADC2` | Décor seul sur fond clair |
| `--jade` | `#2C6B54` | Statuts positifs |
| `--ember` | `#8C3346` | Alerte, rupture, erreur |
| `--line` | `#D5D9DE` | Filets 1 px |
| `--onyx` | `#15181B` | Sections sombres, mode sombre CRM |
| `--onyx-ink` | `#E7EAED` | Texte sur `--onyx` |
| `--onyx-soft` | `#A9AFB6` | Texte secondaire sur `--onyx` |
| `--jade-light` | `#7FCBAA` | Statut positif sur `--onyx` |
| `--ember-light` | `#E195A8` | Alerte sur `--onyx` |

### Règles de contraste vérifiées

Ratios calculés (WCAG 2.1, texte normal ≥ 4,5:1), garantis par `src/design/tokens.test.ts` — un changement de teinte qui descend sous le seuil fait échouer `npm run test` :

| Couple | Ratio | Verdict |
|---|---|---|
| `--graphite` sur `--marble` | 13,89:1 | ✅ |
| `--graphite-soft` sur `--marble` | 5,78:1 | ✅ |
| `--chrome` sur `--marble` | 6,88:1 | ✅ |
| `--chrome-deep` sur `--marble` | 9,86:1 | ✅ |
| `--jade` sur `--marble` | 5,46:1 | ✅ |
| `--ember` sur `--marble` | 6,81:1 | ✅ |
| `--chrome-light` sur `--marble` | **2,04:1** | ❌ décor uniquement, jamais de texte |
| `--onyx-ink` sur `--onyx` | 14,76:1 | ✅ |
| `--onyx-soft` sur `--onyx` | 8,06:1 | ✅ |
| `--chrome` sur `--onyx` | **2,25:1** | ❌ → en mode sombre l'accent devient `--chrome-light` (7,57:1 ✅) |
| `--jade` sur `--onyx` | **2,83:1** | ❌ → `--jade-light` |

**Conséquence** : `--chrome-light` est interdit en texte sur le fond clair mais **devient l'accent de texte du mode sombre**. Les tokens sémantiques (`--accent`, `--accent-hover`, `--positive`, `--alert`, `--focus`) basculent donc avec le thème ; les composants n'utilisent jamais une couleur brute.

```css
:root {
  --accent: var(--chrome);  --accent-hover: var(--chrome-deep);
  --positive: var(--jade); --alert: var(--ember);
  --focus: var(--chrome);
}
[data-theme="night"] {
  --accent: var(--chrome-light); --accent-hover: #A9C4D6;
  --positive: var(--jade-light); --alert: var(--ember-light);
  --focus: var(--onyx-ink);
}
```

Jamais de `#FFF` ni de `#000`, y compris dans les SVG et les e-mails.

## 2. Typographie

Chargées via `next/font/google`, `display: swap`, sous-ensemble latin, en variables CSS `--font-title`, `--font-ui`, `--font-mono`.

| Rôle | Police | Taille | Interligne | Interlettrage |
|---|---|---|---|---|
| `display-1` (héros) | Space Grotesk 500 | `clamp(2.75rem, 6vw, 4.5rem)` | 1,04 | −0,025em |
| `display-2` (titres de section) | Space Grotesk 500 | `clamp(2rem, 4vw, 3rem)` | 1,10 | −0,02em |
| `title-1` | Space Grotesk 700 | 1,75rem (28px) | 1,20 | −0,015em |
| `title-2` | Space Grotesk 700 | 1,375rem (22px) | 1,30 | −0,01em |
| `lead` (chapô) | Inter 400 | 1,25rem (20px) | 1,55 | 0 |
| `body` | Inter 400 | 1,0625rem (17px) | 1,60 | 0 |
| `body-lg` (pages éditoriales) | Inter 400 | 1,125rem (18px) | 1,65 | 0 |
| `ui` (boutons, champs, CRM) | Inter 500 | 0,9375rem (15px) | 1,40 | 0 |
| `caption` | Inter 400 | 0,8125rem (13px) | 1,45 | 0 |
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
- Rayons : `--r-field: 2px`, `--r-card: 3px`, `--r-pill: 999px` (pastilles de couleur uniquement).
- Séparation : filet 1 px `--line`. **Aucune ombre** par défaut.
- Ombre unique, réservée aux éléments flottants (panneau panier, boîte de dialogue, bottom sheet, palette `Cmd+K`) : `--shadow-lift: 0 2px 32px -12px rgba(21, 24, 27, .32)` — teintée graphite, jamais grise.
- Pas de grain ni d'autre texture de surface : l'« atelier nocturne » est net, sans filtre décoratif posé sur les fonds.
- Mise en scène des montres : un dégradé radial `--panel` → `--bg-alt` derrière la pièce (`.cadre-montre` pour les vignettes, `.scene-montre` + couronne graduée pour le héros). C'est une lumière, pas une texture.
- Surtitres (`.surtitre`) : filet d'accent de 28 px avant le texte monospace.
- En-tête collant : voile translucide flouté (`.entete-voile`) une fois la page défilée.
- Focus : `outline: 2px solid var(--focus); outline-offset: 2px` — visible sur tous les fonds, jamais supprimé.

## 4. Points de rupture

`375` (référence mobile) · `640` · `768` (tablette, CRM à l'établi) · `1024` · `1280` (référence bureau) · `1440`.
Conception mobile d'abord ; toute maquette est vérifiée à 375 / 768 / 1280 / 1440.

## 5. Iconographie

Jeu dessiné sur mesure, grille 24 px, trait 1,5 px, extrémités droites, `currentColor`, aucun remplissage. ~26 pictos : loupe, panier, compte, flèches, chevrons, croix, coche, alerte, filtre, vue face/profil/dos, zoom, lien de partage, annuler, réinitialiser, colis, calendrier, tournevis, loupe d'horloger, goutte (étanchéité), ressort (mouvement), maillon, aiguille, gravure, imprimer.

Aucun picto dans un cercle coloré, aucun emoji, aucune icône multicolore.

## 6. Inventaire des composants

**Primitives** — `Button` (plein / contour / discret), `IconButton`, `TextLink`, `Field` (label + aide + erreur), `Input`, `Textarea`, `Select`, `RadioGroup`, `OptionCard`, `ColorSwatch`, `Checkbox`, `Switch`, `Pill`, `Badge` (statuts), `Tooltip`, `Rule`, `Accordion`, `Tabs`, `Dialog`, `Drawer`, `BottomSheet`, `Toast`, `Table`, `Pagination`, `Breadcrumb`, `EmptyState`, `Skeleton`, `CommandPalette`.

**Mise en page** — `Header`, `NavDrawer`, `Footer`, `Section`, `SectionHeader`, `Container`, `Prose`, `CookieBanner`.

**Montre** — `WatchCanvas` (moteur SVG en calques), `WatchViewSwitch` (face / profil / dos), `WatchZoom`, `WatchExploded` (vue éclatée au défilement), `WatchThumb` (miniature de configuration, panier et CRM).

**Commerce** — `ModelCard`, `PriceLine` (total + détail des suppléments), `LeadTime`, `ConfiguratorStep`, `OptionGrid`, `EngravingPreview`, `ConfigSummary`, `CartPanel`, `CartLine`, `OrderTimeline` (frise d'assemblage), `AssemblyPhotos`.

**Éditorial** — `Hero`, `ProcessStep`, `SpecList`, `FaqItem`, `HorlogerBlock`, `PhotoPlaceholder` (bloc `--marble-alt` avec la description attendue en monospace), `FillMe` (rendu visible des `[À REMPLIR : …]`).

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

**Cornes et bracelet.** Les cornes prolongent la carrure (flanc extérieur tangent
au boîtier, flancs intérieurs parallèles) ; elles ne rayonnent pas du centre. Le
bracelet se dessine en distance au centre (`d`) et non par rotation, pour que
les deux brins gardent la lumière du haut-gauche. Acier : pièce de bout pleine
qui comble l'entrecorne, maillons bombés en quinconce. Cuir et caoutchouc : brin
roulé autour de la barrette, croissant d'ombre contre la carrure. NATO : ruban
continu qui franchit la barrette et plonge sous le boîtier. Les brins s'éteignent
en fondu au bord du cadre ; `FRAME_SCALE` (0,9) laisse voir la pièce de bout et
les premiers maillons.

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
| 0 → 600 ms | Tracé du cercle du cadran (`stroke-dashoffset`), trait `--graphite` sur fond `--marble` |
| 600 → 1000 ms | Les 12 index apparaissent un par un dans le sens horaire (33 ms d'écart) |
| 900 → 1700 ms | Les aiguilles tournent et se posent sur **10 h 10**, léger amorti |
| 1400 → 2000 ms | « CHRONOVA » en Newsreader, interlettrage de 0,4em → 0,08em |
| 2000 → 2500 ms | Le cadran s'agrandit, son cercle devient un `clip-path: circle()` qui s'ouvre sur l'accueil |

Mémorisée en `sessionStorage` (`chronova:intro`). Bouton « Passer » discret en bas à droite, focusable au clavier dès la première image. Le héros est préchargé pendant l'animation. Aucune barre de chargement, aucun son.
