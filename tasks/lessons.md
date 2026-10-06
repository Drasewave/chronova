# Leçons

## 2026-10-06 — montre 3D, audit

- **Remplacement scripté entre deux ancres : vérifier chaque ancre.** Un `s.index("// ── Aiguilles")`
  a trouvé une occurrence antérieure à l'ancre de début : tranche vide, puis `str.replace("", bloc)`
  a inséré le bloc entre chaque caractère d'un fichier non commité. Règle : `assert s.count(ancre) == 1`
  et `debut < fin` avant de couper ; commiter tôt les fichiers neufs.
- **three.js : pas de matrice miroir dans une `InstancedMesh`.** three corrige l'enroulement des
  faces pour un objet de déterminant négatif, pas instance par instance : les instances miroir
  s'affichent à l'envers. Dupliquer par rotation (ici un demi-tour autour de l'axe du cadran).
- **Deux faces à la même hauteur = moirage.** Le cadran posé exactement sur le plat de la carrure
  extrudée pleine scintillait en stries. Toujours un écart physique (0,2 mm) entre surfaces coplanaires.
- **`loading.tsx` n'est pas gratuit.** Sur une page dynamique déjà rapide, le squelette est streamé
  avant le contenu : CLS 0,12 et LCP doublé au chargement initial. Mesurer avant/après
  (mobile, CPU ×4) ; ne garder un squelette que s'il reproduit la mise en page finale.
- **Mesurer la 3D contre la référence au même cadrage.** La métrique de silhouette du skill échoue sur
  fond clair quand l'objet est clair (acier) : compléter par des mesures directes (largeurs en px).
