import type {
  CatalogueOption,
  CatalogueOptionPublic,
  CompatibilityRule,
  OptionGroup,
  OptionGroupPublic,
  OptionRef,
  Part,
  Step,
  StepPublic,
} from "./types";

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

/**
 * Ce dont la logique de configuration a besoin, et rien d'autre : étapes,
 * options, règles et leurs index. Prix, délais, règles, rendu et lien partagé
 * se calculent sur cette base, que le catalogue soit complet (serveur) ou public
 * (navigateur).
 */
export interface CatalogueLecture {
  steps: StepPublic[];
  rules: CompatibilityRule[];
  /** `groupe:option` → l'option et son contexte. */
  optionIndex: Map<OptionRef, { step: StepPublic; group: OptionGroupPublic; option: CatalogueOptionPublic }>;
  groupIndex: Map<string, { step: StepPublic; group: OptionGroupPublic }>;
  /** Règles regroupées par option contrainte : une seule passe par évaluation. */
  rulesBySubject: Map<OptionRef, CompatibilityRule[]>;
}

/**
 * Le catalogue complet : nomenclature, prix d'achat, fournisseurs, quantités.
 *
 * NE DOIT JAMAIS être passé en prop à un composant client : tout ce qui traverse
 * la frontière serveur → client est sérialisé dans le HTML de la page. Pour le
 * navigateur, passer par `versCataloguePublic` (`./public.ts`). Le champ
 * `portee` rend l'erreur visible à la compilation : un `Catalogue` n'est pas
 * assignable à un `CataloguePublic`.
 */
export interface Catalogue extends CatalogueLecture, CatalogueData {
  readonly portee: "atelier";
  steps: Step[];
  optionIndex: Map<OptionRef, { step: Step; group: OptionGroup; option: CatalogueOption }>;
  groupIndex: Map<string, { step: Step; group: OptionGroup }>;
  partIndex: Map<string, Part>;
}

/** Le catalogue tel qu'il peut partir dans le navigateur. Voir `./public.ts`. */
export interface CataloguePublic extends CatalogueLecture {
  readonly portee: "public";
}

/** Index communs aux deux portées, construits de la même façon. */
export function indexer<S extends StepPublic>(steps: S[], rules: CompatibilityRule[]) {
  type G = S["groups"][number];
  type O = G["options"][number];
  const optionIndex = new Map<OptionRef, { step: S; group: G; option: O }>();
  const groupIndex = new Map<string, { step: S; group: G }>();

  for (const step of steps) {
    for (const group of step.groups) {
      groupIndex.set(group.key, { step, group });
      for (const option of group.options) {
        optionIndex.set(`${group.key}:${option.key}`, { step, group, option });
      }
    }
  }

  const rulesBySubject = new Map<OptionRef, CompatibilityRule[]>();
  for (const rule of rules) {
    if (rule.isActive === false) continue;
    const liste = rulesBySubject.get(rule.subject) ?? [];
    liste.push(rule);
    rulesBySubject.set(rule.subject, liste);
  }

  return { optionIndex, groupIndex, rulesBySubject };
}

export function createCatalogue(data: CatalogueData): Catalogue {
  return {
    ...data,
    portee: "atelier",
    ...indexer(data.steps, data.rules),
    partIndex: new Map(data.parts.map((part) => [part.ref, part])),
  };
}

/** Découpe une référence `groupe:option`. */
export function splitRef(ref: OptionRef): { groupKey: string; optionKey: string } {
  const coupure = ref.indexOf(":");
  return { groupKey: ref.slice(0, coupure), optionKey: ref.slice(coupure + 1) };
}
