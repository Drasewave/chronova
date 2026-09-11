import { cn } from "@/lib/utils";

/**
 * Emplacement d'une photo qui n'existe pas encore. On décrit la prise de vue
 * attendue plutôt que d'afficher une image générique : l'horloger sait quoi
 * photographier, et personne ne prend le bloc pour du contenu définitif.
 */
export function PhotoPlaceholder({
  description,
  className,
  ratio = "4 / 3",
}: {
  description: string;
  className?: string;
  ratio?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center border border-rule bg-bg-alt p-6 text-center",
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
        "type-mono border border-dashed border-alert px-2 py-1 text-alert",
        inline ? "inline-block" : "block",
      )}
    >
      À remplir · {children}
    </span>
  );
}
