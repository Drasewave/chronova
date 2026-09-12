"use client";

import { useId, useState, type ReactNode } from "react";
import { IconChevron } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Une étape repliable. Bouton + région, avec `aria-expanded` et `aria-controls` :
 * le repli est annoncé, et la région reste dans l'ordre de tabulation naturel.
 */
export function StepSection({
  index,
  label,
  intro,
  resume,
  defaultOpen = false,
  children,
}: {
  index: number;
  label: string;
  intro: string;
  /** Résumé des choix en cours, visible quand l'étape est repliée. */
  resume: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [ouvert, setOuvert] = useState(defaultOpen);
  const id = useId();

  return (
    <section className="border-b border-rule">
      <h2>
        <button
          type="button"
          onClick={() => setOuvert((v) => !v)}
          aria-expanded={ouvert}
          aria-controls={id}
          className="flex w-full items-center gap-4 py-5 text-left"
        >
          <span className="type-mono shrink-0 text-accent">{String(index).padStart(2, "0")}</span>
          <span className="min-w-0 flex-1">
            <span className="type-title-2 block text-fg">{label}</span>
            {!ouvert && resume && (
              <span className="type-caption mt-1 block truncate text-fg-soft">{resume}</span>
            )}
          </span>
          <IconChevron
            className={cn(
              "shrink-0 text-accent transition-transform duration-300 ease-atelier",
              ouvert && "rotate-180",
            )}
            width={22}
            height={22}
          />
        </button>
      </h2>

      <div id={id} hidden={!ouvert} className="pb-8">
        <p className="type-body measure mb-7 text-fg-soft">{intro}</p>
        <div className="flex flex-col gap-8">{children}</div>
      </div>
    </section>
  );
}
