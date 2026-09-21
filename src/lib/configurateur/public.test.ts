import { describe, expect, it } from "vitest";
import { PARTS, SAMPLE_CATALOGUE as catalogue } from "@/lib/data/catalogue";
import { SAMPLE_MODELS } from "@/lib/data/models";
import { buildConfiguration } from "./configuration";
import { versCataloguePublic } from "./public";
import { computeLeadTime, computePrice } from "./price";
import { evaluateRules } from "./rules";
import { resolveStockState } from "./stock";

/**
 * Ce que reçoit le navigateur (audit A-01).
 *
 * Tout ce qui est passé en prop à un composant client est sérialisé dans le HTML.
 * On sérialise donc ici exactement ce que la page `/composer/[modele]` donne au
 * configurateur, et l'on échoue si une donnée interne s'y trouve.
 */

/** Sérialisation proche de celle du flux RSC : les `Map` y passent aussi. */
function serialiser(valeur: unknown): string {
  return JSON.stringify(valeur, (_cle, v) => (v instanceof Map ? [...v.entries()] : v));
}

const CLES_INTERDITES = [
  "purchasePriceCents",
  "purchasePrice",
  "supplier",
  "quantityOnHand",
  "quantityReserved",
  "reorderThreshold",
  "partRef",
  "partIndex",
  "parts",
  "bom",
  "partsCostCents",
  "unitCostCents",
];

const publicCatalogue = versCataloguePublic(catalogue);
const LIBELLES_PUBLICS = new Set([...catalogue.optionIndex.values()].map(({ option }) => option.label));

describe("projection publique du catalogue", () => {
  for (const modele of SAMPLE_MODELS) {
    it(`${modele.slug} : rien d'interne dans ce que reçoit le configurateur`, () => {
      const configuration = buildConfiguration(publicCatalogue, modele, modele.defaultSelections);
      const recu = serialiser({
        catalogue: publicCatalogue,
        model: modele,
        initial: modele.defaultSelections,
        configuration,
      });

      // On collecte les fuites plutôt que d'asserter sur la chaîne entière : en cas
      // d'échec, le message reste lisible (la charge fait plusieurs centaines de Ko).
      const fuites: string[] = [];
      for (const cle of CLES_INTERDITES) {
        if (recu.includes(`"${cle}"`)) fuites.push(`clé ${cle}`);
      }
      for (const fournisseur of new Set(PARTS.map((part) => part.supplier).filter(Boolean))) {
        if (recu.includes(fournisseur)) fuites.push(`fournisseur ${fournisseur}`);
      }
      for (const part of PARTS) {
        if (recu.includes(`"${part.ref}"`)) fuites.push(`référence ${part.ref}`);
        // Quelques pièces portent le nom de l'option publique (« Saphir plat ») :
        // ce libellé-là est affiché au client, ce n'est pas une fuite.
        if (!LIBELLES_PUBLICS.has(part.name) && recu.includes(`"${part.name}"`)) fuites.push(`nom ${part.name}`);
      }
      // Seule marque tierce du catalogue : elle n'a rien à faire côté public.
      if (recu.toLowerCase().includes("seiko")) fuites.push("marque tierce Seiko");
      expect(fuites).toEqual([]);
    });
  }

  it("la configuration publique ne porte ni nomenclature ni coût", () => {
    const modele = SAMPLE_MODELS[0]!;
    const publique = buildConfiguration(publicCatalogue, modele, modele.defaultSelections);
    expect(publique).not.toHaveProperty("bom");
    expect(publique).not.toHaveProperty("partsCostCents");

    const atelier = buildConfiguration(catalogue, modele, modele.defaultSelections);
    expect(atelier.bom.length).toBeGreaterThan(0);
    expect(atelier.partsCostCents).toBeGreaterThan(0);
  });

  it("donne au navigateur exactement les mêmes prix, délais, règles et rendu", () => {
    for (const modele of SAMPLE_MODELS) {
      for (const selections of [modele.defaultSelections, { ...modele.defaultSelections, ...modele.altSelections }]) {
        const atelier = buildConfiguration(catalogue, modele, selections);
        const publique = buildConfiguration(publicCatalogue, modele, selections);
        expect(publique.selections).toEqual(atelier.selections);
        expect(publique.price).toEqual(atelier.price);
        expect(publique.leadTime).toEqual(atelier.leadTime);
        expect(publique.render).toEqual(atelier.render);
        expect(publique.summary).toEqual(atelier.summary);
        expect(publique.shareParam).toBe(atelier.shareParam);

        expect(computePrice(publicCatalogue, modele.basePriceCents, selections)).toEqual(
          computePrice(catalogue, modele.basePriceCents, selections),
        );
        expect(computeLeadTime(publicCatalogue, modele.assemblyDays, selections)).toEqual(
          computeLeadTime(catalogue, modele.assemblyDays, selections),
        );
        expect([...evaluateRules(publicCatalogue, selections)]).toEqual([...evaluateRules(catalogue, selections)]);
      }
    }
  });

  it("traduit le stock en état public, sans quantité", () => {
    let ruptures = 0;
    for (const [ref, { option }] of catalogue.optionIndex) {
      const publique = publicCatalogue.optionIndex.get(ref)!.option;
      const etat = resolveStockState(catalogue, option.partRef);
      expect(publique.stock?.state).toBe(etat);
      expect(Object.keys(publique.stock ?? {}).sort()).toEqual(etat === "bientot" ? ["restockDays", "state"] : ["state"]);
      if (etat === "bientot") {
        ruptures += 1;
        expect(publique.stock?.restockDays).toBe(catalogue.partIndex.get(option.partRef!)!.restockDays);
      }
    }
    expect(ruptures).toBeGreaterThan(0);
  });
});
