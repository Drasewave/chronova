import { excludedOptionsFor, type WatchModelView } from "@/lib/data/models";
import type { WatchRender } from "@/watch/types";
import type { Catalogue, CataloguePublic } from "./catalogue";
import { buildBom, partsCost, type BomLine } from "./bom";
import { computeLeadTime, computePrice, type LeadTime, type PriceBreakdown } from "./price";
import { evaluateOption, normalizeSelections } from "./rules";
import { describeSelection, resolveRender } from "./resolve";
import { encodeConfig } from "./url";
import type { Selections } from "./types";

export interface SummaryLine {
  stepLabel: string;
  groupKey: string;
  groupLabel: string;
  value: string;
}

export interface Configuration {
  modelSlug: string;
  /** Sélections remises d'aplomb : c'est la version qui fait foi partout. */
  selections: Selections;
  render: WatchRender;
  price: PriceBreakdown;
  leadTime: LeadTime;
  /** Valeur du paramètre `?c=` : le lien de partage. */
  shareParam: string;
  summary: SummaryLine[];
}

/**
 * La même configuration, vue de l'atelier : avec sa nomenclature et son coût.
 * N'existe que côté serveur (CRM, création de commande) — le navigateur n'a que
 * le catalogue public, qui ne connaît ni les pièces ni leur prix d'achat.
 */
export interface ConfigurationAtelier extends Configuration {
  bom: BomLine[];
  partsCostCents: number;
}

/**
 * Assemble tout ce qu'une configuration doit savoir dire d'elle-même.
 *
 * Cette fonction est le point d'entrée unique : configurateur, panier, e-mails
 * et CRM en dépendent tous, ce qui garantit qu'un même choix donne partout le
 * même prix, le même délai et la même nomenclature.
 *
 * Avec le catalogue complet (serveur) elle renvoie aussi nomenclature et coût ;
 * avec le catalogue public (navigateur) elle ne les calcule pas — elle n'en a
 * d'ailleurs pas les moyens.
 */
export function buildConfiguration(catalogue: Catalogue, model: WatchModelView, brutes: Selections): ConfigurationAtelier;
export function buildConfiguration(catalogue: CataloguePublic, model: WatchModelView, brutes: Selections): Configuration;
export function buildConfiguration(
  catalogue: Catalogue | CataloguePublic,
  model: WatchModelView,
  brutes: Selections,
): Configuration | ConfigurationAtelier {
  const selections = normalizeSelections(catalogue, brutes, excludedOptionsFor(model));

  const summary: SummaryLine[] = [];
  for (const step of catalogue.steps) {
    for (const group of step.groups) {
      const valeur = selections[group.key];
      if (!valeur) continue;
      const libelle = describeSelection(catalogue, group.key, valeur);
      if (!libelle) continue;
      summary.push({
        stepLabel: step.label,
        groupKey: group.key,
        groupLabel: group.label,
        value: group.selection === "mesure" ? `${libelle}` : libelle,
      });
    }
  }

  const publique: Configuration = {
    modelSlug: model.slug,
    selections,
    // L'étanchéité imprimée sur le cadran est celle du boîtier : une donnée du
    // modèle, pas une option.
    render: { ...resolveRender(catalogue, selections), waterResistM: model.waterResistM },
    price: computePrice(catalogue, model.basePriceCents, selections),
    leadTime: computeLeadTime(catalogue, model.assemblyDays, selections),
    shareParam: encodeConfig(selections),
    summary,
  };

  if (catalogue.portee !== "atelier") return publique;
  const bom = buildBom(catalogue, selections);
  return { ...publique, bom, partsCostCents: partsCost(bom) };
}

/**
 * Regroupe le récapitulatif par étape, dans l'ordre du configurateur.
 *
 * Sans cela, la liste enchaîne « Forme », « Traitement », « Teinte », « Forme »
 * — et rien ne dit si l'on parle des aiguilles, du verre ou du bracelet.
 */
export function grouperParEtape(lignes: SummaryLine[]): [string, SummaryLine[]][] {
  const groupes = new Map<string, SummaryLine[]>();
  for (const ligne of lignes) {
    const liste = groupes.get(ligne.stepLabel);
    if (liste) liste.push(ligne);
    else groupes.set(ligne.stepLabel, [ligne]);
  }
  return [...groupes];
}

/** Configuration de départ d'un modèle, et sa variante de survol. */
export function defaultConfiguration(catalogue: Catalogue, model: WatchModelView): ConfigurationAtelier;
export function defaultConfiguration(catalogue: CataloguePublic, model: WatchModelView): Configuration;
export function defaultConfiguration(catalogue: Catalogue | CataloguePublic, model: WatchModelView) {
  return catalogue.portee === "atelier"
    ? buildConfiguration(catalogue, model, model.defaultSelections)
    : buildConfiguration(catalogue, model, model.defaultSelections);
}

export function altConfiguration(catalogue: Catalogue, model: WatchModelView): ConfigurationAtelier;
export function altConfiguration(catalogue: CataloguePublic, model: WatchModelView): Configuration;
export function altConfiguration(catalogue: Catalogue | CataloguePublic, model: WatchModelView) {
  const selections = { ...model.defaultSelections, ...model.altSelections };
  return catalogue.portee === "atelier"
    ? buildConfiguration(catalogue, model, selections)
    : buildConfiguration(catalogue, model, selections);
}

/**
 * RÈGLE DU PRIX « À PARTIR DE » (audit A-08) — une seule définition pour tout le site.
 *
 * « À partir de » = le prix de base du modèle (`basePriceCents`) : c'est le prix
 * de la configuration la moins chère que l'on peut réellement commander sur ce
 * modèle (toutes les options à supplément nul). Le test `prix « à partir de »`
 * vérifie, modèle par modèle, que ce plancher est bien atteignable : le libellé
 * dit donc vrai.
 *
 * S'applique partout : cartes, héros, fiches, gammes, liste `/composer`, JSON-LD
 * (`AggregateOffer.lowPrice`) et `llms.txt`. Quand on cite le prix de la
 * configuration présentée en photo, on l'appelle par son nom — « configuration de
 * départ à … » — jamais « à partir de ».
 */
export function prixAPartirDeCents(model: WatchModelView): number {
  return model.basePriceCents;
}

/**
 * Prix de la configuration la moins chère commandable : sert à vérifier que le
 * « à partir de » n'est pas une promesse en l'air (tests, contrôle CRM).
 * Glouton : dans chaque groupe, l'option sélectionnable la moins chère ; les
 * groupes facultatifs payants sont vidés. Quelques passes, car un choix peut en
 * libérer un autre.
 */
export function prixPlancherCents(catalogue: Catalogue | CataloguePublic, model: WatchModelView): number {
  const exclus = excludedOptionsFor(model);
  let selections: Selections = normalizeSelections(catalogue, model.defaultSelections, exclus);

  for (let passe = 0; passe < 4; passe += 1) {
    for (const step of catalogue.steps) {
      for (const group of step.groups) {
        if (group.selection === "texte") {
          delete selections[group.key];
          continue;
        }
        const possibles = group.options
          .filter((option) => evaluateOption(catalogue, `${group.key}:${option.key}`, selections, exclus).selectable)
          .sort((a, b) => a.priceDeltaCents - b.priceDeltaCents);
        const moinsChere = possibles[0];
        if (group.optional && (!moinsChere || moinsChere.priceDeltaCents > 0)) {
          delete selections[group.key];
          continue;
        }
        const actuelle = group.options.find((option) => option.key === selections[group.key]);
        if (moinsChere && (!actuelle || moinsChere.priceDeltaCents < actuelle.priceDeltaCents)) {
          selections[group.key] = moinsChere.key;
        }
      }
    }
    selections = normalizeSelections(catalogue, selections, exclus);
  }

  return computePrice(catalogue, model.basePriceCents, selections).totalCents;
}
