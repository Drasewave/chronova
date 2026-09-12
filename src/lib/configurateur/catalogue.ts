import type { CatalogueOption, CompatibilityRule, OptionGroup, OptionRef, Part, Step } from "./types";

/**
 * Le catalogue tel que le configurateur le consomme.
 *
 * Il est passé en paramètre à toutes les fonctions métier plutôt qu'importé :
 * c'est ce qui permet de le charger depuis la base (donc de le rendre
 * modifiable depuis le CRM) sans réécrire une ligne de logique, et de le
 * remplacer par une fixture dans les tests.
 */
export interface CatalogueData {
  steps: Step[];
  rules: CompatibilityRule[];
  parts: Part[];
}

export interface Catalogue extends CatalogueData {
  /** `groupe:option` → l'option et son contexte. */
  optionIndex: Map<OptionRef, { step: Step; group: OptionGroup; option: CatalogueOption }>;
  groupIndex: Map<string, { step: Step; group: OptionGroup }>;
  partIndex: Map<string, Part>;
  /** Règles regroupées par option contrainte : une seule passe par évaluation. */
  rulesBySubject: Map<OptionRef, CompatibilityRule[]>;
}

export function createCatalogue(data: CatalogueData): Catalogue {
  const optionIndex = new Map<OptionRef, { step: Step; group: OptionGroup; option: CatalogueOption }>();
  const groupIndex = new Map<string, { step: Step; group: OptionGroup }>();

  for (const step of data.steps) {
    for (const group of step.groups) {
      groupIndex.set(group.key, { step, group });
      for (const option of group.options) {
        optionIndex.set(`${group.key}:${option.key}`, { step, group, option });
      }
    }
  }

  const rulesBySubject = new Map<OptionRef, CompatibilityRule[]>();
  for (const rule of data.rules) {
    if (rule.isActive === false) continue;
    const liste = rulesBySubject.get(rule.subject) ?? [];
    liste.push(rule);
    rulesBySubject.set(rule.subject, liste);
  }

  return {
    ...data,
    optionIndex,
    groupIndex,
    partIndex: new Map(data.parts.map((part) => [part.ref, part])),
    rulesBySubject,
  };
}

/** Découpe une référence `groupe:option`. */
export function splitRef(ref: OptionRef): { groupKey: string; optionKey: string } {
  const coupure = ref.indexOf(":");
  return { groupKey: ref.slice(0, coupure), optionKey: ref.slice(coupure + 1) };
}
