"use client";

import { useId } from "react";
import type { Catalogue } from "@/lib/configurateur/catalogue";
import type { CatalogueOption, OptionGroup } from "@/lib/configurateur/types";
import type { RuleVerdict } from "@/lib/configurateur/rules";
import { resolveStockState, restockMessage, stockLabel } from "@/lib/configurateur/stock";
import { cn, formatPrice } from "@/lib/utils";

/**
 * Un groupe d'options = un groupe de boutons radio natifs.
 *
 * Les vrais `<input type="radio">` sont conservés (masqués visuellement) : les
 * flèches du clavier naviguent dans le groupe, le lecteur d'écran annonce
 * « 3 sur 6 », et l'état désactivé est compris sans un seul attribut ARIA
 * supplémentaire. La raison d'une option grisée est rattachée par
 * `aria-describedby`, donc lue elle aussi.
 */
export function OptionGrid({
  catalogue,
  group,
  value,
  verdicts,
  onChange,
  footnote,
}: {
  catalogue: Catalogue;
  group: OptionGroup;
  value: string | undefined;
  verdicts: Map<string, RuleVerdict>;
  onChange: (groupKey: string, optionKey: string) => void;
  /** Précision affichée sous le groupe, quand des options ont été retirées. */
  footnote?: string;
}) {
  const nom = useId();
  const pastilles = group.options.some((option) => option.colorHex);

  return (
    <fieldset className="border-0 p-0">
      <legend className="type-ui mb-1 text-fg">{group.label}</legend>
      {group.help && <p className="type-caption measure mb-4 text-fg-soft">{group.help}</p>}

      <div
        className={cn(
          "mt-3 gap-3",
          pastilles ? "flex flex-wrap gap-4" : "grid sm:grid-cols-2",
          group.selection === "mesure" && "flex flex-wrap",
        )}
      >
        {group.options.map((option) => (
          <OptionChoice
            key={option.key}
            catalogue={catalogue}
            nom={nom}
            group={group}
            option={option}
            checked={value === option.key}
            verdict={verdicts.get(`${group.key}:${option.key}`)}
            pastille={pastilles}
            onChange={onChange}
          />
        ))}
      </div>

      {footnote && <p className="type-caption mt-4 text-fg-soft">{footnote}</p>}
    </fieldset>
  );
}

function OptionChoice({
  catalogue,
  nom,
  group,
  option,
  checked,
  verdict,
  pastille,
  onChange,
}: {
  catalogue: Catalogue;
  nom: string;
  group: OptionGroup;
  option: CatalogueOption;
  checked: boolean;
  verdict: RuleVerdict | undefined;
  pastille: boolean;
  onChange: (groupKey: string, optionKey: string) => void;
}) {
  const stock = resolveStockState(catalogue, option.partRef);
  const rupture = stock === "bientot";
  const bloque = verdict?.selectable === false || rupture;
  const motif = rupture ? restockMessage(catalogue, option.partRef) : verdict?.reason;
  const motifId = `${nom}-${option.key}-motif`;

  const champ = (
    <input
      type="radio"
      name={nom}
      value={option.key}
      checked={checked}
      disabled={bloque}
      onChange={() => onChange(group.key, option.key)}
      aria-describedby={motif ? motifId : undefined}
      className="peer sr-only"
    />
  );

  if (pastille) {
    return (
      <label className={cn("flex w-[5.5rem] cursor-pointer flex-col items-center gap-2", bloque && "cursor-not-allowed")}>
        {champ}
        <span
          aria-hidden="true"
          title={option.colorName ?? option.label}
          className={cn(
            "relative block size-11 rounded-pill border transition-[box-shadow,border-color] duration-200 ease-atelier",
            "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-[var(--focus)]",
            checked ? "border-accent shadow-[0_0_0_3px_var(--bg),0_0_0_4px_var(--accent)]" : "border-rule",
            bloque && "opacity-40",
          )}
          style={{ backgroundColor: option.colorHex }}
        />
        {/* Le nom de la teinte est toujours écrit : la couleur seule ne suffit jamais. */}
        <span className={cn("type-caption text-center leading-tight", checked ? "text-fg" : "text-fg-soft", bloque && "opacity-50")}>
          {option.colorName ?? option.label}
        </span>
        {option.priceDeltaCents > 0 && (
          <span className="type-mono text-fg-soft">+{formatPrice(option.priceDeltaCents)}</span>
        )}
        {motif && (
          <span id={motifId} className="type-caption text-center leading-tight text-alert">
            {motif}
          </span>
        )}
      </label>
    );
  }

  const compact = group.selection === "mesure";

  return (
    <label
      className={cn(
        "group/opt relative flex cursor-pointer flex-col rounded-card border p-4 transition-colors duration-200 ease-atelier",
        compact && "min-w-[6rem] items-center p-3",
        checked ? "border-accent bg-panel" : "border-rule bg-bg hover:border-accent-decor",
        bloque && "cursor-not-allowed border-rule bg-bg opacity-55 hover:border-rule",
        "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]",
      )}
    >
      {champ}
      <span className="flex items-baseline justify-between gap-3">
        <span className={cn("type-ui", checked ? "text-fg" : "text-fg")}>{option.label}</span>
        {option.priceDeltaCents !== 0 && (
          <span className="type-mono shrink-0 text-fg-soft" data-numeric>
            {option.priceDeltaCents > 0 ? "+" : "−"}
            {formatPrice(Math.abs(option.priceDeltaCents))}
          </span>
        )}
      </span>

      {option.description && !compact && (
        <span className="type-caption mt-2 text-fg-soft">{option.description}</span>
      )}

      {!bloque && stock === "derniere-piece" && (
        <span className="type-mono mt-3 text-positive">{stockLabel(stock)}</span>
      )}
      {motif && (
        <span id={motifId} className="type-caption mt-3 text-alert">
          {rupture ? `${stockLabel(stock)} · ${motif}` : motif}
        </span>
      )}
    </label>
  );
}
