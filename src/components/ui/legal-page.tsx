import type { ReactNode } from "react";
import { Section } from "@/components/ui/section";

/**
 * Gabarit des pages légales et éditoriales longues.
 *
 * La date de mise à jour est obligatoire : un document légal sans date ne
 * permet pas de savoir quelle version s'applique à une commande donnée.
 */
export function LegalPage({
  surtitre,
  titre,
  chapo,
  miseAJour,
  niveau = 1,
  children,
}: {
  surtitre: string;
  titre: string;
  chapo?: string;
  miseAJour: string;
  /** 2 quand le gabarit sert de section à l'intérieur d'une page plus large. */
  niveau?: 1 | 2;
  children: ReactNode;
}) {
  return (
    <Section fond="papier">
      <header className="measure">
        <p className="type-mono text-fg-soft">{surtitre}</p>
        {niveau === 1 ? (
          <h1 className="type-display-2 mt-4">{titre}</h1>
        ) : (
          <h2 className="type-display-2 mt-4">{titre}</h2>
        )}
        {chapo && <p className="type-lead mt-6 text-fg-soft">{chapo}</p>}
        <p className="type-mono mt-8 text-fg-soft">Mise à jour · {miseAJour}</p>
      </header>

      <hr className="my-12 border-rule" />

      <div className="prose-atelier">{children}</div>
    </Section>
  );
}
