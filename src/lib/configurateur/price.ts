import { GROUP_INDEX, OPTION_INDEX, STEPS } from "@/lib/data/catalogue";
import type { Selections } from "./types";

export interface PriceLine {
  groupKey: string;
  groupLabel: string;
  label: string;
  amountCents: number;
}

export interface PriceBreakdown {
  baseCents: number;
  /** Uniquement les choix qui coûtent quelque chose : le détail reste lisible. */
  lines: PriceLine[];
  totalCents: number;
}

/**
 * Prix de base du modèle + suppléments des options choisies.
 *
 * Tous les montants sont en centimes entiers, jamais en flottants : c'est
 * l'unité de Stripe et la seule qui ne dérive pas à l'addition.
 */
export function computePrice(baseCents: number, selections: Selections): PriceBreakdown {
  const lines: PriceLine[] = [];

  for (const step of STEPS) {
    for (const group of step.groups) {
      const valeur = selections[group.key];
      if (!valeur) continue;

      if (group.selection === "texte") {
        const montant = group.filledPriceCents ?? 0;
        if (valeur.trim() && montant > 0) {
          lines.push({
            groupKey: group.key,
            groupLabel: group.label,
            label: `« ${valeur.trim()} »`,
            amountCents: montant,
          });
        }
        continue;
      }

      const option = OPTION_INDEX.get(`${group.key}:${valeur}`)?.option;
      if (option && option.priceDeltaCents !== 0) {
        lines.push({
          groupKey: group.key,
          groupLabel: group.label,
          label: option.label,
          amountCents: option.priceDeltaCents,
        });
      }
    }
  }

  const supplements = lines.reduce((somme, ligne) => somme + ligne.amountCents, 0);
  return { baseCents, lines, totalCents: baseCents + supplements };
}

export interface LeadTime {
  days: number;
  /** Ce qui rallonge le délai, nommé : on n'annonce jamais une attente sans motif. */
  reasons: { label: string; days: number }[];
}

/**
 * Délai d'assemblage annoncé : la base du modèle, plus ce que certaines options
 * ajoutent réellement (cuisson d'un émail, réglage d'un second fuseau, gravure
 * sous-traitée). Le chiffre affiché au client est celui-ci, et c'est le même qui
 * part dans l'e-mail de confirmation.
 */
export function computeLeadTime(assemblyDays: number, selections: Selections): LeadTime {
  const reasons: { label: string; days: number }[] = [];

  for (const [groupKey, valeur] of Object.entries(selections)) {
    const entree = GROUP_INDEX.get(groupKey);
    if (!entree) continue;

    if (entree.group.selection === "texte") {
      const jours = entree.group.filledLeadDays ?? 0;
      if (valeur.trim() && jours > 0) reasons.push({ label: entree.group.label, days: jours });
      continue;
    }

    const option = OPTION_INDEX.get(`${groupKey}:${valeur}`)?.option;
    if (option?.leadDaysDelta) reasons.push({ label: option.label, days: option.leadDaysDelta });
  }

  const total = reasons.reduce((somme, raison) => somme + raison.days, assemblyDays);
  return { days: total, reasons };
}
