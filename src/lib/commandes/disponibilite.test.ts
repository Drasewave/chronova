import { describe, expect, it } from "vitest";
import { SAMPLE_CATALOGUE as catalogue } from "@/lib/data/catalogue";
import { getSampleModel } from "@/lib/data/models";
import { buildConfiguration } from "@/lib/configurateur/configuration";
import { messageIndisponibilite, piecesManquantes, type CompteursStock } from "./disponibilite";

const abysse = getSampleModel("abysse-40")!;
const config = buildConfiguration(catalogue, abysse, abysse.defaultSelections);

function stock(surcharge: Record<string, CompteursStock> = {}): Map<string, CompteursStock> {
  const base = new Map<string, CompteursStock>(
    catalogue.parts.map((part) => [part.ref, { quantityOnHand: 50, quantityReserved: 0 }]),
  );
  for (const [ref, compteurs] of Object.entries(surcharge)) base.set(ref, compteurs);
  return base;
}

describe("revalidation du stock à la commande (audit A-13)", () => {
  it("laisse passer un panier que le stock couvre", () => {
    expect(piecesManquantes([{ modelName: "Abysse 40", quantite: 2, bom: config.bom }], stock())).toEqual([]);
  });

  it("refuse une pièce en rupture, même si le lien a été forgé", () => {
    const ref = config.bom[0]!.part.ref;
    const manquantes = piecesManquantes(
      [{ modelName: "Abysse 40", quantite: 1, bom: config.bom }],
      stock({ [ref]: { quantityOnHand: 3, quantityReserved: 3 } }),
    );
    expect(manquantes).toHaveLength(1);
    expect(manquantes[0]).toMatchObject({ ref, demandee: 1, libre: 0 });
  });

  it("tient compte de la quantité et additionne les lignes du panier", () => {
    const ref = config.bom[0]!.part.ref;
    const deuxRestantes = stock({ [ref]: { quantityOnHand: 5, quantityReserved: 3 } });
    const ligne = { modelName: "Abysse 40", quantite: 1, bom: config.bom };
    expect(piecesManquantes([ligne, ligne], deuxRestantes)).toEqual([]);
    expect(piecesManquantes([ligne, ligne, ligne], deuxRestantes)).toHaveLength(1);
    expect(piecesManquantes([{ ...ligne, quantite: 9 }], deuxRestantes)[0]).toMatchObject({ demandee: 9, libre: 2 });
  });

  it("un stock réservé au-delà du rayon ne donne pas un disponible négatif", () => {
    const ref = config.bom[0]!.part.ref;
    const [piece] = piecesManquantes(
      [{ modelName: "Abysse 40", quantite: 1, bom: config.bom }],
      stock({ [ref]: { quantityOnHand: 1, quantityReserved: 4 } }),
    );
    expect(piece?.libre).toBe(0);
  });

  it("parle au client de SES choix, sans référence, nom de pièce, fournisseur ni quantité", () => {
    const entree = config.bom[0]!;
    const message = messageIndisponibilite(
      piecesManquantes(
        [{ modelName: "Abysse 40", quantite: 9, bom: config.bom }],
        stock({ [entree.part.ref]: { quantityOnHand: 4, quantityReserved: 1 } }),
      ),
    );
    expect(message).toContain("Abysse 40");
    expect(message).toContain(entree.becauseOf);
    expect(message).not.toContain(entree.part.ref);
    expect(message).not.toContain(entree.part.supplier);
    expect(message).not.toMatch(/\b3\b/);
  });
});
