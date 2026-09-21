import { describe, expect, it } from "vitest";
import { C, DEFAULT_TIME, handAngles, polar } from "./geometry";

describe("repère du cadran", () => {
  it("0° pointe vers midi", () => {
    const p = polar(100, 0);
    expect(p.x).toBeCloseTo(C, 5);
    expect(p.y).toBeCloseTo(C - 100, 5);
  });

  it("90° pointe vers 3 heures", () => {
    const p = polar(100, 90);
    expect(p.x).toBeCloseTo(C + 100, 5);
    expect(p.y).toBeCloseTo(C, 5);
  });
});

describe("angles des aiguilles", () => {
  it("place les aiguilles sur 10 h 10, la position des photographies horlogères", () => {
    const { hour, minute } = handAngles({ hours: 10, minutes: 10, seconds: 0 });
    expect(hour).toBeCloseTo(305, 5);
    expect(minute).toBeCloseTo(60, 5);
  });

  it("l'aiguille GMT fait un tour en vingt-quatre heures", () => {
    expect(handAngles({ hours: 0, minutes: 0, seconds: 0 }).gmt).toBe(0);
    expect(handAngles({ hours: 12, minutes: 0, seconds: 0 }).gmt).toBe(180);
    expect(handAngles({ hours: 18, minutes: 0, seconds: 0 }).gmt).toBe(270);
  });

  it("l'heure par défaut du rendu est bien 10 h 10", () => {
    expect(DEFAULT_TIME.hours).toBe(10);
    expect(DEFAULT_TIME.minutes).toBe(10);
  });

  it("la trotteuse de la pose dégage le texte du bas du cadran, le guichet et la lucarne", () => {
    const { second } = handAngles(DEFAULT_TIME);
    // « AUTOMATIQUE » et l'étanchéité occupent 153°–207° ; la lucarne du cœur ouvert commence vers 230°.
    expect(second).toBeGreaterThan(212);
    expect(second).toBeLessThan(228);
    // Entre deux index : jamais à moins de 6° d'un multiple de 30°.
    expect(Math.abs((second % 30) - 15)).toBeLessThan(9);
  });
});
