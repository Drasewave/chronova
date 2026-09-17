import { describe, expect, it } from "vitest";
import {
  ETAPES_CLIENT,
  STATUTS_HORS_PARCOURS,
  formatDate,
  indexEtape,
  libelleStatut,
} from "./etapes";
import type { OrderStatus } from "@/generated/prisma/enums";

/** Tous les statuts que le schéma connaît, dans l'ordre de l'énumération. */
const TOUS: OrderStatus[] = [
  "EN_ATTENTE_PAIEMENT",
  "PAYEE",
  "PIECES_A_COMMANDER",
  "PIECES_RECUES",
  "EN_ASSEMBLAGE",
  "CONTROLE",
  "EXPEDIEE",
  "LIVREE",
  "ANNULEE",
  "REMBOURSEE",
];

describe("étapes d'une commande", () => {
  it("couvre chaque statut, soit par le parcours, soit hors parcours", () => {
    // Le jour où le schéma gagne un statut, l'oubli se voit ici plutôt que
    // sous la forme d'un « EN_LITIGE » brut affiché au client.
    for (const statut of TOUS) {
      const dansLeParcours = ETAPES_CLIENT.some((etape) => etape.statut === statut);
      const horsParcours = statut in STATUTS_HORS_PARCOURS;
      expect(dansLeParcours || horsParcours, `statut sans libellé : ${statut}`).toBe(true);
      expect(libelleStatut(statut)).not.toBe(statut);
    }
  });

  it("ne répète aucun statut dans le parcours", () => {
    const statuts = ETAPES_CLIENT.map((etape) => etape.statut);
    expect(new Set(statuts).size).toBe(statuts.length);
  });

  it("va du paiement à la livraison, sans retour en arrière", () => {
    expect(ETAPES_CLIENT[0]?.statut).toBe("PAYEE");
    expect(ETAPES_CLIENT.at(-1)?.statut).toBe("LIVREE");
    expect(indexEtape("PAYEE")).toBeLessThan(indexEtape("EN_ASSEMBLAGE"));
    expect(indexEtape("EN_ASSEMBLAGE")).toBeLessThan(indexEtape("EXPEDIEE"));
  });

  it("place un statut hors parcours en dehors de la frise", () => {
    expect(indexEtape("ANNULEE")).toBe(-1);
    expect(indexEtape("EN_ATTENTE_PAIEMENT")).toBe(-1);
  });

  it("décrit ce qui se passe à l'atelier, pas un statut administratif", () => {
    for (const etape of ETAPES_CLIENT) {
      expect(etape.description.length).toBeGreaterThan(20);
      expect(etape.label).not.toMatch(/_/);
    }
  });
});

describe("formatDate", () => {
  it("écrit la date en toutes lettres, en français", () => {
    expect(formatDate(new Date("2026-09-12T10:00:00Z"))).toBe("12 septembre 2026");
  });

  it("rend undefined plutôt que « Invalid Date » sur une absence", () => {
    expect(formatDate(null)).toBeUndefined();
    expect(formatDate(undefined)).toBeUndefined();
  });
});
