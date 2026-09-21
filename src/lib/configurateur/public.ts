import { indexer, type Catalogue, type CataloguePublic } from "./catalogue";
import { resolveStockState } from "./stock";
import type {
  CatalogueOption,
  CatalogueOptionPublic,
  CompatibilityRule,
  OptionGroupPublic,
  OptionStock,
  StepPublic,
} from "./types";

/**
 * Projection publique du catalogue : la SEULE forme autorisée à traverser la
 * frontière serveur → client (props d'un composant `"use client"`).
 *
 * Tout ce qui est passé en prop à un composant client est sérialisé dans le
 * HTML de la page : le catalogue complet y exposait prix d'achat, fournisseurs,
 * quantités en stock et noms internes des pièces (audit A-01).
 *
 * La projection est une LISTE BLANCHE, champ par champ : un champ ajouté demain
 * au catalogue complet (ou une colonne ajoutée en base) ne fuit pas tant qu'il
 * n'est pas recopié ici explicitement. Ne jamais remplacer ces copies par un
 * `...option` ou un `...group`.
 *
 * Le stock devient un état (« disponible », « dernière pièce », « de retour
 * bientôt » + délai de réapprovisionnement) : ni quantité, ni référence de
 * pièce. La nomenclature et le coût restent côté serveur (`bom.ts`, CRM,
 * création de commande).
 */
export function versCataloguePublic(catalogue: Catalogue): CataloguePublic {
  const steps: StepPublic[] = catalogue.steps.map((step) => ({
    key: step.key,
    label: step.label,
    intro: step.intro,
    groups: step.groups.map(
      (group): OptionGroupPublic => ({
        key: group.key,
        label: group.label,
        help: group.help,
        selection: group.selection,
        optional: group.optional,
        maxLength: group.maxLength,
        filledPriceCents: group.filledPriceCents,
        filledLeadDays: group.filledLeadDays,
        options: group.options.map((option) => optionPublique(catalogue, option)),
      }),
    ),
  }));

  const rules: CompatibilityRule[] = catalogue.rules
    .filter((rule) => rule.isActive !== false)
    .map((rule) => ({
      subject: rule.subject,
      kind: rule.kind,
      targets: [...rule.targets],
      message: rule.message,
    }));

  return { portee: "public", steps, rules, ...indexer(steps, rules) };
}

function optionPublique(catalogue: Catalogue, option: CatalogueOption): CatalogueOptionPublic {
  return {
    key: option.key,
    label: option.label,
    colorName: option.colorName,
    colorHex: option.colorHex,
    description: option.description,
    priceDeltaCents: option.priceDeltaCents,
    leadDaysDelta: option.leadDaysDelta,
    render: option.render,
    stock: stockPublic(catalogue, option.partRef),
  };
}

function stockPublic(catalogue: Catalogue, partRef: string | undefined): OptionStock {
  const state = resolveStockState(catalogue, partRef);
  if (state !== "bientot" || !partRef) return { state };
  return { state, restockDays: catalogue.partIndex.get(partRef)?.restockDays };
}
