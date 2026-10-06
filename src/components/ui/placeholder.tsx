import { cn } from "@/lib/utils";

/**
 * Emplacement d'une photo qui n'existe pas encore. Tant qu'aucune photo n'est
 * fournie, il ne s'affiche pas : un cadre en pointillés sur un site en ligne
 * passerait pour un oubli. Les appelants décrivent la prise de vue attendue (la
 * description reste dans le code, pour l'horloger) ; pour réafficher les cadres
 * pendant la préparation du site, passer `AFFICHER_CADRES_PHOTO` à `true`.
 */
const AFFICHER_CADRES_PHOTO = false;

export function PhotoPlaceholder({
  description,
  className,
  ratio = "4 / 3",
}: {
  description: string;
  className?: string;
  ratio?: string;
}) {
  if (!AFFICHER_CADRES_PHOTO) return null;
  return (
    <div
      className={cn(
        "cadre-montre flex items-center justify-center border border-dashed border-field/60 p-6 text-center",
        className,
      )}
      style={{ aspectRatio: ratio }}
    >
      <span className="type-mono max-w-[34ch] text-fg-soft">Photo · {description}</span>
    </div>
  );
}

/**
 * Information réelle manquante (prix, adresse, SIRET, biographie). Volontairement
 * visible : elle doit sauter aux yeux avant la mise en ligne.
 */
export function FillMe({ children, inline = false }: { children: string; inline?: boolean }) {
  return (
    <span
      className={cn(
        "type-mono rounded-field border border-dashed border-alert px-3 py-2 text-alert",
        inline ? "inline-block" : "block",
      )}
    >
      À remplir · {children}
    </span>
  );
}
