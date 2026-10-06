import { describe, expect, it } from "vitest";
import { EMPREINTE_FACTICE, erreurMotDePasse, hacherMotDePasse, verifierMotDePasse } from "./mot-de-passe";

describe("mots de passe", () => {
  it("vérifie le bon mot de passe et refuse les autres", async () => {
    const empreinte = await hacherMotDePasse("correct horse battery");
    expect(empreinte).toMatch(/^scrypt\$[\w-]+\$[\w-]+$/);
    expect(empreinte).not.toContain("correct");
    expect(await verifierMotDePasse("correct horse battery", empreinte)).toBe(true);
    expect(await verifierMotDePasse("correct horse batterY", empreinte)).toBe(false);
  });

  it("sale chaque empreinte : le même mot de passe ne donne jamais la même", async () => {
    expect(await hacherMotDePasse("même mot de passe")).not.toBe(await hacherMotDePasse("même mot de passe"));
  });

  it("ne reconnaît rien contre une valeur absente, illisible ou factice", async () => {
    for (const stocke of [null, undefined, "", "bcrypt$x$y", "scrypt$$", EMPREINTE_FACTICE])
      expect(await verifierMotDePasse("n'importe quoi", stocke)).toBe(false);
  });

  it("normalise l'Unicode : é composé ou décomposé, c'est le même mot de passe", async () => {
    const empreinte = await hacherMotDePasse("café-et-croissant");
    expect(await verifierMotDePasse("café-et-croissant", empreinte)).toBe(true);
  });

  it("borne la longueur", () => {
    expect(erreurMotDePasse("court")).toMatch(/Au moins 10/);
    expect(erreurMotDePasse("x".repeat(201))).toMatch(/Au plus 200/);
    expect(erreurMotDePasse("assez-long-ici")).toBeNull();
  });
});
