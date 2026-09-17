import type { Catalogue } from "./catalogue";
import { splitRef } from "./catalogue";
import type { OptionRef, Selections } from "./types";

export interface RuleVerdict {
  selectable: boolean;
  /** Phrase exacte à afficher sous l'option grisée. */
  reason?: string;
}

/**
 * Une option est-elle choisissable compte tenu des choix en cours ?
 *
 * `exige-une-de` : au moins une des cibles doit être sélectionnée.
 * `exclut` : aucune des cibles ne doit l'être.
 */
export function evaluateOption(
  catalogue: Catalogue,
  ref: OptionRef,
  selections: Selections,
  /** Options que le modèle de base ne propose pas (diamètres d'une autre ligne). */
  exclus?: ReadonlySet<OptionRef>,
): RuleVerdict {
  if (exclus?.has(ref)) {
    return { selectable: false, reason: "Ce choix n'existe pas sur ce modèle." };
  }

  const regles = catalogue.rulesBySubject.get(ref);
  if (!regles) return { selectable: true };

  for (const regle of regles) {
    const cibleSelectionnee = regle.targets.some((cible) => estSelectionnee(cible, selections));
    const echec = regle.kind === "exige-une-de" ? !cibleSelectionnee : cibleSelectionnee;
    if (echec) return { selectable: false, reason: regle.message };
  }

  return { selectable: true };
}

/** Verdict pour toutes les options du catalogue, en une passe. */
export function evaluateRules(
  catalogue: Catalogue,
  selections: Selections,
  exclus?: ReadonlySet<OptionRef>,
): Map<OptionRef, RuleVerdict> {
  const resultat = new Map<OptionRef, RuleVerdict>();
  for (const ref of catalogue.optionIndex.keys()) {
    resultat.set(ref, evaluateOption(catalogue, ref, selections, exclus));
  }
  return resultat;
}

function estSelectionnee(ref: OptionRef, selections: Selections): boolean {
  const { groupKey, optionKey } = splitRef(ref);
  return selections[groupKey] === optionKey;
}

/**
 * Remet la configuration d'aplomb après un changement.
 *
 * Choisir le NH38 invalide le guichet de date ; repasser la lunette en lisse
 * invalide l'insert. Plutôt que d'interdire ces changements, on les accepte et
 * on réajuste : un groupe obligatoire retombe sur sa première option valide, un
 * groupe facultatif est simplement vidé. On itère car un réajustement peut en
 * provoquer un autre.
 */
export function normalizeSelections(
  catalogue: Catalogue,
  selections: Selections,
  exclus?: ReadonlySet<OptionRef>,
): Selections {
  let courant: Selections = { ...selections };

  for (let passe = 0; passe < 6; passe += 1) {
    let stable = true;

    for (const step of catalogue.steps) {
      for (const group of step.groups) {
        if (group.selection === "texte") continue;

        const valeur = courant[group.key];
        const valide =
          valeur !== undefined &&
          catalogue.optionIndex.has(`${group.key}:${valeur}`) &&
          evaluateOption(catalogue, `${group.key}:${valeur}`, courant, exclus).selectable;

        if (valide) continue;

        const repli = group.options.find(
          (option) => evaluateOption(catalogue, `${group.key}:${option.key}`, courant, exclus).selectable,
        );

        const suivant = { ...courant };
        if (group.optional || !repli) delete suivant[group.key];
        else suivant[group.key] = repli.key;

        if (suivant[group.key] !== courant[group.key]) {
          courant = suivant;
          stable = false;
        }
      }
    }

    if (stable) break;
  }

  return courant;
}

/** Un groupe facultatif dont aucune option n'est choisissable est masqué. */
export function isGroupVisible(
  catalogue: Catalogue,
  groupKey: string,
  selections: Selections,
  exclus?: ReadonlySet<OptionRef>,
): boolean {
  const entree = catalogue.groupIndex.get(groupKey);
  if (!entree) return false;
  const { group } = entree;
  if (!group.optional) return true;
  if (group.selection === "texte") return true;
  return group.options.some(
    (option) => evaluateOption(catalogue, `${group.key}:${option.key}`, selections, exclus).selectable,
  );
}
