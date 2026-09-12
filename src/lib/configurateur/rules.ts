import { GROUP_INDEX, OPTION_INDEX, RULES, STEPS } from "@/lib/data/catalogue";
import type { OptionRef, Selections } from "./types";

/** Règles regroupées par option contrainte : évite de balayer la liste à chaque appel. */
const PAR_SUJET = new Map<OptionRef, typeof RULES>();
for (const rule of RULES) {
  const liste = PAR_SUJET.get(rule.subject) ?? [];
  liste.push(rule);
  PAR_SUJET.set(rule.subject, liste);
}

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
  ref: OptionRef,
  selections: Selections,
  /** Options que le modèle de base ne propose pas (diamètres d'une autre ligne). */
  exclus?: ReadonlySet<OptionRef>,
): RuleVerdict {
  if (exclus?.has(ref)) {
    return { selectable: false, reason: "Ce choix n'existe pas sur ce modèle." };
  }

  const regles = PAR_SUJET.get(ref);
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
  selections: Selections,
  exclus?: ReadonlySet<OptionRef>,
): Map<OptionRef, RuleVerdict> {
  const resultat = new Map<OptionRef, RuleVerdict>();
  for (const ref of OPTION_INDEX.keys()) resultat.set(ref, evaluateOption(ref, selections, exclus));
  return resultat;
}

function estSelectionnee(ref: OptionRef, selections: Selections): boolean {
  const separation = ref.indexOf(":");
  const groupe = ref.slice(0, separation);
  const option = ref.slice(separation + 1);
  return selections[groupe] === option;
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
  selections: Selections,
  exclus?: ReadonlySet<OptionRef>,
): Selections {
  let courant: Selections = { ...selections };

  for (let passe = 0; passe < 6; passe += 1) {
    let stable = true;

    for (const step of STEPS) {
      for (const group of step.groups) {
        if (group.selection === "texte") continue;

        const valeur = courant[group.key];
        const valide =
          valeur !== undefined &&
          OPTION_INDEX.has(`${group.key}:${valeur}`) &&
          evaluateOption(`${group.key}:${valeur}`, courant, exclus).selectable;

        if (valide) continue;

        const repli = group.options.find(
          (option) => evaluateOption(`${group.key}:${option.key}`, courant, exclus).selectable,
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
  groupKey: string,
  selections: Selections,
  exclus?: ReadonlySet<OptionRef>,
): boolean {
  const entree = GROUP_INDEX.get(groupKey);
  if (!entree) return false;
  const { group } = entree;
  if (!group.optional) return true;
  if (group.selection === "texte") return true;
  return group.options.some(
    (option) => evaluateOption(`${group.key}:${option.key}`, selections, exclus).selectable,
  );
}
