import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Titre de section et cartes de modèles, quel que soit leur nombre.
 *
 * À partir de trois cartes : le titre, puis une grille de trois colonnes. Avec
 * une ou deux cartes, une grille de trois ou quatre colonnes restait à moitié
 * vide ; le titre passe alors dans la colonne de gauche et les cartes occupent
 * la droite, comme la fiche technique d'un modèle. La rangée est pleine dans
 * les deux cas, et le titre reste aligné sur le bord gauche des contenus.
 */
export function GrilleModeles({
  entete,
  nombre,
  children,
}: {
  /** Un `SectionHeader` ; en colonne, passez-lui `className="md:flex-col md:items-start"`. */
  entete: ReactNode;
  nombre: number;
  children: ReactNode;
}) {
  if (nombre >= 3) {
    return (
      <>
        {entete}
        <div className="mt-10 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
      </>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-x-14 gap-y-10",
        nombre === 1 ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : "lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]",
      )}
    >
      {entete}
      <div
        className={cn(
          "grid gap-x-5 gap-y-12",
          nombre === 1 ? "w-full max-w-[30rem] lg:justify-self-end" : "sm:grid-cols-2",
        )}
      >
        {children}
      </div>
    </div>
  );
}
