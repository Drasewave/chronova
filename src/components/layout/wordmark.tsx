import Link from "next/link";
import { cn } from "@/lib/utils";

/** Le nom, dessiné en typographie : aucun fichier logo, aucune image à charger. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex min-h-11 items-center text-[1.25rem] leading-none text-fg transition-colors duration-200 hover:text-accent",
        className,
      )}
      style={{ fontFamily: "var(--font-title)", letterSpacing: "0.22em", textIndent: "0.22em" }}
      aria-label="Chronova, retour à l'accueil"
    >
      CHRONOVA
    </Link>
  );
}
