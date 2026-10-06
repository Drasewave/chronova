import { beforeEach, describe, expect, it } from "vitest";
import { ipDepuisEnTetes, messageLimite, reinitialiserLimites, verifierLimite } from "./limite-debit";

const REGLE = { max: 3, fenetreMs: 60_000 };

describe("limitation de débit (audit A-12)", () => {
  beforeEach(() => reinitialiserLimites());

  it("laisse passer jusqu'au maximum, puis refuse", () => {
    for (let i = 0; i < 3; i += 1) expect(verifierLimite("lien|ip:1.2.3.4", REGLE, 1000 + i).ok).toBe(true);
    const refus = verifierLimite("lien|ip:1.2.3.4", REGLE, 2000);
    expect(refus.ok).toBe(false);
    expect(refus.attendreMs).toBeGreaterThan(0);
    expect(refus.attendreMs).toBeLessThanOrEqual(60_000);
  });

  it("un refus ne prolonge pas la pénitence", () => {
    for (let i = 0; i < 3; i += 1) verifierLimite("k", REGLE, 0);
    for (let i = 0; i < 50; i += 1) expect(verifierLimite("k", REGLE, 30_000).ok).toBe(false);
    expect(verifierLimite("k", REGLE, 60_001).ok).toBe(true);
  });

  it("compte séparément chaque clé et chaque action", () => {
    for (let i = 0; i < 3; i += 1) verifierLimite("lien|ip:1.1.1.1", REGLE, 0);
    expect(verifierLimite("lien|ip:1.1.1.1", REGLE, 1).ok).toBe(false);
    expect(verifierLimite("lien|ip:2.2.2.2", REGLE, 1).ok).toBe(true);
    expect(verifierLimite("demande|ip:1.1.1.1", REGLE, 1).ok).toBe(true);
  });

  it("lit l'adresse du visiteur dans les en-têtes du proxy", () => {
    const enTetes = (valeurs: Record<string, string>) => ({ get: (nom: string) => valeurs[nom] ?? null });
    // La dernière valeur est celle du proxy de confiance ; la première est forgeable.
    expect(ipDepuisEnTetes(enTetes({ "x-forwarded-for": "6.6.6.6, 203.0.113.7" }))).toBe("203.0.113.7");
    // X-Real-IP vient du client (le panneau ne le pose pas) : ignoré.
    expect(ipDepuisEnTetes(enTetes({ "x-forwarded-for": "6.6.6.6, 203.0.113.7", "x-real-ip": "1.2.3.4" }))).toBe("203.0.113.7");
    expect(ipDepuisEnTetes(enTetes({ "x-real-ip": "203.0.113.9" }))).toBe("inconnue");
    expect(ipDepuisEnTetes(enTetes({}))).toBe("inconnue");
    expect(ipDepuisEnTetes(enTetes({ "x-forwarded-for": "x".repeat(5000) }))).toHaveLength(64);
  });

  it("dit combien de temps attendre", () => {
    expect(messageLimite(30_000)).toContain("1 minute.");
    expect(messageLimite(9 * 60_000 + 1)).toContain("10 minutes");
  });
});
